-- =============================================================================
-- LAYER 1: Geography & Facility Foundation
-- Datasets 1-6
-- Matches: Final Architecture §4.1 (Core Transactional Schema)
-- Run FIRST — all other schemas depend on this.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Dataset 1: states
-- Country → State level of the geography hierarchy.
-- RLS: phc_facilities.state_id FK; JWT claim app.current_state_id
-- ---------------------------------------------------------------------------
CREATE TABLE states (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    country    VARCHAR(50)  NOT NULL DEFAULT 'India',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Dataset 2: districts
-- State → District level.
-- RLS: phc_facilities.district_id FK; JWT claim app.current_district_id
-- ---------------------------------------------------------------------------
CREATE TABLE districts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    state_id   UUID         NOT NULL REFERENCES states(id),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (name, state_id)
);
CREATE INDEX idx_districts_state ON districts (state_id);

-- ---------------------------------------------------------------------------
-- Dataset 3: phc_facilities
-- Primary Health Centre profile. Beds and oxygen are operational columns here
-- (not separate time-series). GIS point for PostGIS spatial queries.
-- RLS uses district_id + state_id columns directly (no ltree).
-- Arch ref: Final Architecture §4.1, §7.2
-- ---------------------------------------------------------------------------
CREATE TABLE phc_facilities (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(255) NOT NULL,
    district_id          UUID         NOT NULL REFERENCES districts(id),
    state_id             UUID         NOT NULL REFERENCES states(id),
    location             GEOGRAPHY(POINT, 4326) NOT NULL,
    -- Bed capacity (operational snapshot, updated by PHC)
    total_beds           INT          NOT NULL DEFAULT 0,
    emergency_beds       INT          NOT NULL DEFAULT 0,
    isolation_beds       INT          NOT NULL DEFAULT 0,
    occupied_beds        INT          NOT NULL DEFAULT 0,
    -- Oxygen (operational snapshot)
    oxygen_cylinders     INT          NOT NULL DEFAULT 0,
    oxygen_concentrators INT          NOT NULL DEFAULT 0,
    -- Status
    status               VARCHAR(20)  NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','inactive','closed')),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_phc_location    ON phc_facilities USING GIST (location);
CREATE INDEX idx_phc_district    ON phc_facilities (district_id);
CREATE INDEX idx_phc_state       ON phc_facilities (state_id);

-- RLS (Final Architecture §7)
ALTER TABLE phc_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE phc_facilities FORCE ROW LEVEL SECURITY;

-- Helper functions (set once per request via SET LOCAL from JWT claims)
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

CREATE POLICY phc_facilities_select ON phc_facilities FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR (app_current_role() = 'state_admin'    AND state_id    = app_current_state_id())
        OR (app_current_role() = 'district_admin' AND district_id = app_current_district_id())
        OR (app_current_role() = 'phc_user'       AND id          = app_current_phc_id())
    );

CREATE POLICY phc_facilities_update_self ON phc_facilities FOR UPDATE
    USING (
        app_current_role() IN ('national_admin','state_admin','district_admin')
        OR (app_current_role() = 'phc_user' AND id = app_current_phc_id())
    )
    WITH CHECK (
        app_current_role() IN ('national_admin','state_admin','district_admin')
        OR (app_current_role() = 'phc_user' AND id = app_current_phc_id())
    );

CREATE POLICY phc_facilities_insert ON phc_facilities FOR INSERT
    WITH CHECK (app_current_role() IN ('national_admin','state_admin','district_admin'));

-- ---------------------------------------------------------------------------
-- Dataset 4: equipment
-- Equipment per PHC (type, quantity, working qty, maintenance status).
-- Arch ref: Final Architecture §4.1
-- ---------------------------------------------------------------------------
CREATE TABLE equipment (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id             UUID         NOT NULL REFERENCES phc_facilities(id),
    equipment_type     VARCHAR(100) NOT NULL,
    quantity           INT          NOT NULL DEFAULT 1,
    working_qty        INT          NOT NULL DEFAULT 1,
    maintenance_status VARCHAR(20)  NOT NULL DEFAULT 'operational'
                           CHECK (maintenance_status IN ('operational','maintenance','decommissioned')),
    last_serviced_at   DATE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_equipment_phc ON equipment (phc_id);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment FORCE ROW LEVEL SECURITY;

CREATE POLICY equipment_select ON equipment FOR SELECT
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

CREATE POLICY equipment_write ON equipment FOR INSERT
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());

-- ---------------------------------------------------------------------------
-- Dataset 5: medicines
-- Medicine master — shared reference across all PHCs.
-- Arch ref: Final Architecture §4.1
-- ---------------------------------------------------------------------------
CREATE TABLE medicines (
    id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name     VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    unit     VARCHAR(20)  NOT NULL DEFAULT 'unit'
);

-- ---------------------------------------------------------------------------
-- Dataset 6: inventory_batches
-- Medicine batches per PHC — the FEFO unit of inventory.
-- remaining_qty is authoritative server-side only; PHC client is optimistic UI.
-- Arch ref: Final Architecture §4.1, §5.1 (FEFO), §3.3.1
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_batches (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id            UUID         NOT NULL REFERENCES phc_facilities(id),
    medicine_id       UUID         NOT NULL REFERENCES medicines(id),
    batch_no          VARCHAR(100) NOT NULL,
    received_qty      INT          NOT NULL,
    remaining_qty     INT          NOT NULL CHECK (remaining_qty >= 0),
    minimum_threshold INT          NOT NULL DEFAULT 0,
    expiry_date       DATE         NOT NULL,
    received_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (phc_id, medicine_id, batch_no)
);

-- FEFO index: "earliest expiry batch with stock available at this PHC for this medicine"
CREATE INDEX idx_batches_fefo ON inventory_batches (phc_id, medicine_id, expiry_date)
    WHERE remaining_qty > 0;

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches FORCE ROW LEVEL SECURITY;

CREATE POLICY inventory_batches_select ON inventory_batches FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f
            WHERE f.id = inventory_batches.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

-- Stock mutation (dispensing, replenishment) is PHC-local only
CREATE POLICY inventory_batches_write ON inventory_batches FOR UPDATE
    USING (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id())
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());

CREATE POLICY inventory_batches_insert ON inventory_batches FOR INSERT
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());
