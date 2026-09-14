-- =============================================================================
-- LAYER 6: Supplemental Row-Level Security Policies
-- Completes RLS coverage for tables not fully covered in Layers 1–5:
--   dispensed_items (new), mutation_queue (new), audit_log (new)
-- Also re-confirms FORCE RLS on all tenant-scoped tables.
-- Matches: Final Architecture §7, Abdul_Backend.md Prompt 2
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ensure helper functions exist (idempotent — already created in Layer 1,
-- but redeclared here so this file is self-contained for re-runs).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_role() RETURNS text AS $$
    SELECT current_setting('app.current_role', true)
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_phc_id() RETURNS uuid AS $$
    SELECT NULLIF(current_setting('app.current_phc_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_district_id() RETURNS uuid AS $$
    SELECT NULLIF(current_setting('app.current_district_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_state_id() RETURNS uuid AS $$
    SELECT NULLIF(current_setting('app.current_state_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------------
-- Operational Application Role: app_user (non-superuser)
-- In Postgres, superusers bypass RLS. app_user is the operational role
-- subject to FORCE ROW LEVEL SECURITY.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE meddb TO app_user;
GRANT USAGE, CREATE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;

-- ---------------------------------------------------------------------------
-- dispensed_items: scoped through billing_transactions -> phc_facilities
-- ---------------------------------------------------------------------------
ALTER TABLE dispensed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensed_items FORCE ROW LEVEL SECURITY;

CREATE POLICY dispensed_items_select ON dispensed_items FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1
            FROM billing_transactions bt
            JOIN phc_facilities f ON f.id = bt.phc_id
            WHERE bt.id = dispensed_items.billing_transaction_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

-- Insert restricted to phc_user only, ensuring the referenced billing_txn belongs to their PHC
CREATE POLICY dispensed_items_insert ON dispensed_items FOR INSERT
    WITH CHECK (
        app_current_role() = 'phc_user'
        AND EXISTS (
            SELECT 1 FROM billing_transactions bt
            WHERE bt.id = billing_transaction_id
              AND bt.phc_id = app_current_phc_id()
        )
    );

-- ---------------------------------------------------------------------------
-- mutation_queue: phc_user sees only own PHC; district_admin+ sees jurisdiction
-- ---------------------------------------------------------------------------
ALTER TABLE mutation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutation_queue FORCE ROW LEVEL SECURITY;

CREATE POLICY mutation_queue_select ON mutation_queue FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id())
        OR EXISTS (
            SELECT 1 FROM phc_facilities f WHERE f.id = mutation_queue.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
              )
        )
    );

-- PHC devices push their own mutations only
CREATE POLICY mutation_queue_insert ON mutation_queue FOR INSERT
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());

-- ---------------------------------------------------------------------------
-- audit_log: append-only per architecture.
-- national_admin sees all; state/district/phc scoped by their jurisdiction columns.
-- No UPDATE/DELETE granted to any application role (enforced by DB RULEs in Layer 4).
-- ---------------------------------------------------------------------------
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select ON audit_log FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR (app_current_role() = 'state_admin'    AND state_id    = app_current_state_id())
        OR (app_current_role() = 'district_admin' AND district_id = app_current_district_id())
        OR (app_current_role() = 'phc_user'       AND phc_id      = app_current_phc_id())
    );

-- Allow application services to INSERT audit records (no UPDATE/DELETE possible via RULEs)
CREATE POLICY audit_log_insert ON audit_log FOR INSERT
    WITH CHECK (true);  -- all authenticated roles may write audit records

-- ---------------------------------------------------------------------------
-- Confirm FORCE ROW LEVEL SECURITY on all other tenant-scoped tables
-- (already set in earlier migrations; idempotent re-application is safe)
-- ---------------------------------------------------------------------------
ALTER TABLE phc_facilities          FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches       FORCE ROW LEVEL SECURITY;
ALTER TABLE equipment               FORCE ROW LEVEL SECURITY;
ALTER TABLE staff_registry          FORCE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance        FORCE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions    FORCE ROW LEVEL SECURITY;
ALTER TABLE resource_requests       FORCE ROW LEVEL SECURITY;
ALTER TABLE alerts                  FORCE ROW LEVEL SECURITY;
ALTER TABLE redistribution_transfers FORCE ROW LEVEL SECURITY;
