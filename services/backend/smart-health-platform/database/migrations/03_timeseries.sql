-- =============================================================================
-- LAYER 3: Time-Series (TimescaleDB)
-- Datasets 13-15
-- Matches: Final Architecture §4.2
-- Requires: 01_geography_foundation.sql
-- NOTE: Run SELECT create_hypertable(...) AFTER table creation.
--       The continuous aggregate (Dataset 15) is a derived view — no seed data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Dataset 13: patient_footfall
-- High-write, append-only, time-ordered patient footfall events per PHC.
-- TimescaleDB hypertable partitioned by 'time'.
-- Arch ref: Final Architecture §4.2
-- ---------------------------------------------------------------------------
CREATE TABLE patient_footfall (
    time     TIMESTAMPTZ NOT NULL,
    phc_id   UUID        NOT NULL REFERENCES phc_facilities(id),
    category VARCHAR(50) NOT NULL
                 CHECK (category IN ('opd','emergency','admission','referral',
                                     'disease_infectious','disease_chronic','disease_maternal','other')),
    count    INT         NOT NULL CHECK (count >= 0)
);
SELECT create_hypertable('patient_footfall', 'time');
CREATE INDEX idx_footfall_phc_time ON patient_footfall (phc_id, time DESC);

-- ---------------------------------------------------------------------------
-- Dataset 14: consumption_velocity
-- High-write, append-only medicine consumption events (one row per dispensing event).
-- TimescaleDB hypertable partitioned by 'time'.
-- This is the raw input to the Micro-Consumption Velocity Analyzer and forecasting.
-- Arch ref: Final Architecture §4.2, §5.2, §5.6
-- ---------------------------------------------------------------------------
CREATE TABLE consumption_velocity (
    time        TIMESTAMPTZ NOT NULL,
    phc_id      UUID        NOT NULL REFERENCES phc_facilities(id),
    medicine_id UUID        NOT NULL REFERENCES medicines(id),
    qty_dispensed INT       NOT NULL CHECK (qty_dispensed > 0)
);
SELECT create_hypertable('consumption_velocity', 'time');
CREATE INDEX idx_consumption_phc_medicine ON consumption_velocity (phc_id, medicine_id, time DESC);

-- ---------------------------------------------------------------------------
-- Dataset 15: consumption_daily  [DERIVED — no seed file]
-- Continuous aggregate over consumption_velocity. Powers:
--   - Forecasting pipeline (§5.2)
--   - AI Copilot retrieval (§5.6)
--   - federation_training_features materialized view (Dataset 23)
-- Arch ref: Final Architecture §4.2
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW consumption_daily
WITH (timescaledb.continuous) AS
SELECT
    phc_id,
    medicine_id,
    time_bucket('1 day', time) AS day,
    SUM(qty_dispensed)         AS total_qty
FROM consumption_velocity
GROUP BY phc_id, medicine_id, day;

-- Refresh policy: keep the aggregate current as new consumption rows arrive
SELECT add_continuous_aggregate_policy('consumption_daily',
    start_offset => INTERVAL '3 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);
