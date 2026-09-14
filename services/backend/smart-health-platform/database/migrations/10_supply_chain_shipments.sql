-- =============================================================================
-- Migration 10: Supply Chain Shipments & Audit Integrity
-- Supports: Prompt 19 (Supply Chain Module) & Prompt 20 (Audit System)
-- =============================================================================

CREATE TABLE IF NOT EXISTS supply_chain_shipments (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id           UUID        REFERENCES redistribution_transfers(id),
    source_phc_id         UUID        NOT NULL REFERENCES phc_facilities(id),
    dest_phc_id           UUID        NOT NULL REFERENCES phc_facilities(id),
    medicine_id           UUID        REFERENCES medicines(id),
    item_type             VARCHAR(30) NOT NULL DEFAULT 'medicine',
    quantity              INT         NOT NULL CHECK (quantity > 0),
    carrier               VARCHAR(100),
    tracking_number       VARCHAR(100) UNIQUE,
    status                VARCHAR(30) NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                  'pending','approved','dispatched','in_transit',
                                  'delivered','delayed','cancelled'
                              )),
    dispatched_at         TIMESTAMPTZ,
    estimated_delivery_at TIMESTAMPTZ,
    delivered_at          TIMESTAMPTZ,
    is_delayed            BOOLEAN     NOT NULL DEFAULT false,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON supply_chain_shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_source ON supply_chain_shipments (source_phc_id);
CREATE INDEX IF NOT EXISTS idx_shipments_dest   ON supply_chain_shipments (dest_phc_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON supply_chain_shipments (tracking_number);

-- Enable & Force RLS on supply_chain_shipments
ALTER TABLE supply_chain_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_shipments FORCE ROW LEVEL SECURITY;

-- Jurisdiction policy:
-- national_admin: full access
-- state_admin: either source or destination PHC is in their state
-- district_admin: either source or destination PHC is in their district
-- phc_user: either source or destination is their PHC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supply_chain_shipments' AND policyname = 'shipments_select'
  ) THEN
    CREATE POLICY shipments_select ON supply_chain_shipments FOR SELECT
      USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
          SELECT 1 FROM phc_facilities f
          WHERE f.id IN (supply_chain_shipments.source_phc_id, supply_chain_shipments.dest_phc_id)
            AND (
              (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
              OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
              OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
            )
          LIMIT 1
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supply_chain_shipments' AND policyname = 'shipments_modify'
  ) THEN
    CREATE POLICY shipments_modify ON supply_chain_shipments FOR ALL
      USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
          SELECT 1 FROM phc_facilities f
          WHERE f.id IN (supply_chain_shipments.source_phc_id, supply_chain_shipments.dest_phc_id)
            AND (
              (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
              OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
            )
          LIMIT 1
        )
      )
      WITH CHECK (true);
  END IF;
END $$;
