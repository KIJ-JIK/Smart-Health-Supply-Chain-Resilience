-- =============================================================================
-- LAYER 7: PHC Device Registry & Device Binding Security
-- Tracks registered edge devices for PHC offline-first operations.
-- Mandatory device binding on /phc/{phcId}/* transactional writes.
-- Matches: Final Architecture §6.1, §8.2, Abdul_Backend.md Prompt 4
-- =============================================================================

CREATE TABLE IF NOT EXISTS phc_device_registry (
    device_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id                  UUID NOT NULL REFERENCES phc_facilities(id) ON DELETE CASCADE,
    device_name             VARCHAR(100) NOT NULL,
    device_fingerprint      VARCHAR(128) NOT NULL UNIQUE,
    public_key              TEXT NOT NULL,
    certificate_pem         TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'revoked', 'pending')),
    registered_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at            TIMESTAMPTZ,
    metadata                JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_device_registry_phc_id ON phc_device_registry(phc_id);
CREATE INDEX IF NOT EXISTS idx_device_registry_status ON phc_device_registry(status);

-- ---------------------------------------------------------------------------
-- Row-Level Security for Device Registry
-- ---------------------------------------------------------------------------
ALTER TABLE phc_device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE phc_device_registry FORCE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY device_registry_select ON phc_device_registry FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id())
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id = phc_device_registry.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
              )
        )
    );

-- INSERT policy (allow registration by authorized admins or phc_user for their own PHC)
CREATE POLICY device_registry_insert ON phc_device_registry FOR INSERT
    WITH CHECK (
        app_current_role() IN ('national_admin', 'district_admin', 'state_admin')
        OR (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id())
    );

-- UPDATE policy (status update / revoke)
CREATE POLICY device_registry_update ON phc_device_registry FOR UPDATE
    USING (
        app_current_role() IN ('national_admin', 'district_admin', 'state_admin')
        OR (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id())
    );

-- Grant privileges to operational role
GRANT ALL PRIVILEGES ON TABLE phc_device_registry TO app_user;
