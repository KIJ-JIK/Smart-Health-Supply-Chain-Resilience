-- =============================================================================
-- Migration 09: Facility, Equipment & Inventory Adjustments Schema
-- Prompts 7 & 8 (Facility, Resource, and Inventory Modules)
-- =============================================================================

-- 1. Equipment Update & Delete RLS Policies
-- Allow phc_user to update and delete equipment belonging to their own facility;
-- Allow district_admin+ to update and delete equipment within their jurisdiction.
CREATE POLICY equipment_update ON equipment FOR UPDATE
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id = equipment.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    )
    WITH CHECK (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id = equipment.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

CREATE POLICY equipment_delete ON equipment FOR DELETE
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id = equipment.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

-- 2. Stock Adjustments Audit Table (Prompt 8 & Masterplan §9)
-- Records every inventory adjustment with mandatory reason, user, device, and quantity deltas
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id         UUID         NOT NULL REFERENCES phc_facilities(id),
    batch_id       UUID         NOT NULL REFERENCES inventory_batches(id),
    medicine_id    UUID         NOT NULL REFERENCES medicines(id),
    previous_qty   INT          NOT NULL,
    new_qty        INT          NOT NULL,
    adjustment_qty INT          NOT NULL,
    reason         TEXT         NOT NULL,
    user_id        UUID,
    device_id      UUID,
    recorded_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_phc ON stock_adjustments (phc_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_batch ON stock_adjustments (batch_id);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_adjustments_select ON stock_adjustments FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id = stock_adjustments.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

CREATE POLICY stock_adjustments_insert ON stock_adjustments FOR INSERT
    WITH CHECK (
        app_current_role() IN ('phc_user', 'district_admin', 'state_admin', 'national_admin')
        AND (
            app_current_role() != 'phc_user'
            OR phc_id = app_current_phc_id()
        )
    );

-- 3. Grants for operational role app_user
GRANT ALL ON TABLE stock_adjustments TO app_user;
