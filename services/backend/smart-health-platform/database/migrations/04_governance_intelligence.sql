-- =============================================================================
-- LAYER 4: Governance & Intelligence
-- Datasets 16-22
-- Matches: Final Architecture §4.1, §5, §6.3
-- Requires: 01_geography_foundation.sql + 02_phc_operations.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Dataset 16: alerts
-- Unified alert store: stockout, bed_shortage, staff_shortage, oxygen, outbreak,
-- anomaly, redistribution_conflict, crisis_mode.
-- Includes emergency reports (no separate table per final architecture).
-- Arch ref: Final Architecture §4.1, §5.3
-- ---------------------------------------------------------------------------
CREATE TABLE alerts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id      UUID        REFERENCES phc_facilities(id),   -- nullable for district/state/national alerts
    district_id UUID        REFERENCES districts(id),
    state_id    UUID        REFERENCES states(id),
    alert_type  VARCHAR(50) NOT NULL
                    CHECK (alert_type IN (
                        'stockout','near_stockout','bed_shortage','staff_shortage',
                        'oxygen_critical','outbreak_suspected','abnormal_consumption',
                        'redistribution_conflict','crisis_mode','emergency_report',
                        'forecast_risk'
                    )),
    severity    VARCHAR(20) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    payload     JSONB,
    status      VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','acknowledged','resolved','false_positive')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_alerts_open     ON alerts (status, severity) WHERE status = 'open';
CREATE INDEX idx_alerts_phc      ON alerts (phc_id, created_at DESC) WHERE phc_id IS NOT NULL;
CREATE INDEX idx_alerts_district ON alerts (district_id) WHERE district_id IS NOT NULL;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts FORCE ROW LEVEL SECURITY;

CREATE POLICY alerts_select ON alerts FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR (app_current_role() = 'state_admin'    AND state_id    = app_current_state_id())
        OR (app_current_role() = 'district_admin' AND district_id = app_current_district_id())
        OR (app_current_role() = 'phc_user'       AND phc_id      = app_current_phc_id())
    );

-- ---------------------------------------------------------------------------
-- Dataset 17: redistribution_transfers
-- AI-recommended + human-approved redistribution transfers.
-- recommended_by: 'ai' (OR-Tools MILP optimizer) | 'manual'
-- status state machine: recommended → approved → in_transit → delivered → rejected | cancelled
-- Arch ref: Final Architecture §4.1, §5.4, §3.3.3
-- ---------------------------------------------------------------------------
CREATE TABLE redistribution_transfers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_phc_id   UUID        NOT NULL REFERENCES phc_facilities(id),
    dest_phc_id     UUID        NOT NULL REFERENCES phc_facilities(id),
    item_ref        UUID        NOT NULL,  -- medicine_id or equipment_id
    item_type       VARCHAR(20) NOT NULL DEFAULT 'medicine'
                        CHECK (item_type IN ('medicine','equipment','oxygen','other')),
    quantity        INT         NOT NULL CHECK (quantity > 0),
    recommended_by  VARCHAR(20) NOT NULL DEFAULT 'ai'
                        CHECK (recommended_by IN ('ai','manual')),
    status          VARCHAR(20) NOT NULL DEFAULT 'recommended'
                        CHECK (status IN ('recommended','approved','in_transit','delivered','rejected','cancelled')),
    decided_by      UUID,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at      TIMESTAMPTZ,
    CHECK (source_phc_id != dest_phc_id)
);
CREATE INDEX idx_redistribution_status ON redistribution_transfers (status);
CREATE INDEX idx_redistribution_source ON redistribution_transfers (source_phc_id);
CREATE INDEX idx_redistribution_dest   ON redistribution_transfers (dest_phc_id);

-- RLS: a district admin can see a transfer if EITHER endpoint is in their district
ALTER TABLE redistribution_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE redistribution_transfers FORCE ROW LEVEL SECURITY;

CREATE POLICY redistribution_transfers_select ON redistribution_transfers FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id IN (redistribution_transfers.source_phc_id, redistribution_transfers.dest_phc_id)
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
              )
            LIMIT 1
        )
    );

CREATE POLICY redistribution_transfers_decide ON redistribution_transfers FOR UPDATE
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id IN (redistribution_transfers.source_phc_id, redistribution_transfers.dest_phc_id)
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
              )
            LIMIT 1
        )
    )
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Dataset 18: reconciliation_events
-- Saga state for redistribution conflicts (billing consumption vs. commitments).
-- Triggered when a billing delta arrives at a PHC with an active transfer commitment.
-- Arch ref: Final Architecture §5.4, §3.3.3
-- ---------------------------------------------------------------------------
CREATE TABLE reconciliation_events (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    redistribution_transfer_id UUID       NOT NULL REFERENCES redistribution_transfers(id),
    saga_state                VARCHAR(30) NOT NULL
                                  CHECK (saga_state IN (
                                      'pending','applied','conflict_detected','paused','resolved'
                                  )),
    projected_remaining_qty   INT,
    committed_qty_at_event    INT,
    triggered_by_txn_id       UUID        REFERENCES billing_transactions(id),
    resolution_notes          TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reconciliation_transfer ON reconciliation_events (redistribution_transfer_id);

-- ---------------------------------------------------------------------------
-- Dataset 19: audit_log
-- Append-only record of every governance/security-sensitive action.
-- Write-only role for application services; no UPDATE/DELETE granted.
-- Records: billing, stock adjustment, request approval, redistribution approval,
--          crisis activation, cross-tenant reads, config changes.
-- Arch ref: Final Architecture §6.3, Masterplan §56
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id      UUID,       -- user UUID; null for system-generated events
    actor_role    VARCHAR(30),
    action        VARCHAR(50) NOT NULL,
    entity_type   VARCHAR(50),
    entity_id     UUID,
    before_state  JSONB,
    after_state   JSONB,
    phc_id        UUID        REFERENCES phc_facilities(id),
    district_id   UUID        REFERENCES districts(id),
    state_id      UUID        REFERENCES states(id),
    source_ip     INET,
    device_id     UUID,
    correlation_id UUID,
    ai_rec_payload JSONB,     -- AI recommendation attached to redistribution/crisis decisions
    previous_hash  TEXT,
    this_hash      TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No UPDATE/DELETE privileges granted to any application role
CREATE INDEX idx_audit_log_actor      ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_log_entity     ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_phc        ON audit_log (phc_id, created_at DESC) WHERE phc_id IS NOT NULL;

-- Prevent mutation of historical records at DB level
CREATE RULE audit_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- ---------------------------------------------------------------------------
-- Dataset 20: forecast_predictions
-- Output of the AI forecasting pipeline (Prophet/XGBoost/LSTM per series).
-- Includes model metadata for monitoring/drift detection.
-- Arch ref: Final Architecture §5.2, Masterplan §64
-- ---------------------------------------------------------------------------
CREATE TABLE forecast_predictions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id            UUID        REFERENCES phc_facilities(id),
    district_id       UUID        REFERENCES districts(id),
    medicine_id       UUID        REFERENCES medicines(id),
    forecast_type     VARCHAR(30) NOT NULL
                          CHECK (forecast_type IN (
                              'medicine_demand','stockout_risk','bed_demand',
                              'oxygen_demand','footfall','staff_demand'
                          )),
    forecast_date     DATE        NOT NULL,
    horizon_days      INT         NOT NULL DEFAULT 7,
    predicted_value   NUMERIC(12,2) NOT NULL,
    confidence_lower  NUMERIC(12,2),
    confidence_upper  NUMERIC(12,2),
    model_used        VARCHAR(30) NOT NULL DEFAULT 'prophet'
                          CHECK (model_used IN ('prophet','xgboost','lstm','ensemble')),
    model_version     VARCHAR(50),
    generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (phc_id, medicine_id, forecast_date, forecast_type, model_used)
);
CREATE INDEX idx_forecast_phc_date ON forecast_predictions (phc_id, forecast_date);
CREATE INDEX idx_forecast_type     ON forecast_predictions (forecast_type, forecast_date);

-- ---------------------------------------------------------------------------
-- Dataset 21: system_config
-- Configurable thresholds — not hardcoded in application logic.
-- PHC devices receive config via the sync pull mechanism.
-- Arch ref: Masterplan §69, Final Architecture §5.1, §5.3
-- ---------------------------------------------------------------------------
CREATE TABLE system_config (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key  VARCHAR(100) NOT NULL,
    config_value TEXT        NOT NULL,
    scope       VARCHAR(20)  NOT NULL DEFAULT 'global'
                    CHECK (scope IN ('global','state','district','phc')),
    scope_id    UUID,       -- state_id / district_id / phc_id when scope != 'global'
    description TEXT,
    updated_by  UUID,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (config_key, scope, scope_id)
);
-- Example config keys: min_stock_threshold, critical_stock_threshold,
--   near_expiry_days, bed_occupancy_alert_pct, oxygen_critical_threshold,
--   footfall_anomaly_sigma, forecast_horizon_days, safety_buffer_pct,
--   redistribution_max_distance_km

-- ---------------------------------------------------------------------------
-- Dataset 22: gis_facility_risk  [DERIVED — no seed file]
-- Materialized view combining facility geo-location + latest alert risk score.
-- Refreshed when alerts update for a region.
-- Arch ref: Final Architecture §1.2 (GIS Engine, Deck.gl), §2.3
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW gis_facility_risk AS
SELECT
    f.id                  AS facility_id,
    f.name                AS facility_name,
    f.district_id,
    f.state_id,
    f.location,
    f.total_beds,
    f.occupied_beds,
    f.oxygen_cylinders,
    COALESCE(a.open_critical, 0) AS open_critical_alerts,
    COALESCE(a.open_high,     0) AS open_high_alerts,
    COALESCE(a.max_severity, 'none') AS worst_severity,
    now()                 AS computed_at
FROM phc_facilities f
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open') AS open_critical,
        COUNT(*) FILTER (WHERE severity = 'high'     AND status = 'open') AS open_high,
        MAX(severity)                                                      AS max_severity
    FROM alerts a2
    WHERE a2.phc_id = f.id
) a ON true;

CREATE UNIQUE INDEX idx_gis_facility_risk_pk ON gis_facility_risk (facility_id);
CREATE INDEX idx_gis_facility_risk_location  ON gis_facility_risk USING GIST (location);
