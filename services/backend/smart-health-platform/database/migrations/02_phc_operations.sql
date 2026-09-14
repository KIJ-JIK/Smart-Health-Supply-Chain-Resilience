-- =============================================================================
-- LAYER 2: PHC Transactional Operations
-- Datasets 7-12
-- Matches: Final Architecture §4.1, §3.3, §8
-- Requires: 01_geography_foundation.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Dataset 7: staff_registry
-- Staff master per PHC. Roles: doctor, nurse, pharmacist, technician, other.
-- Arch ref: Final Architecture §4.1
-- ---------------------------------------------------------------------------
CREATE TABLE staff_registry (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id     UUID         NOT NULL REFERENCES phc_facilities(id),
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL
                   CHECK (role IN ('doctor','nurse','pharmacist','technician','other')),
    active     BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_registry_phc ON staff_registry (phc_id);

ALTER TABLE staff_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_registry FORCE ROW LEVEL SECURITY;

CREATE POLICY staff_registry_select ON staff_registry FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f WHERE f.id = staff_registry.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

CREATE POLICY staff_registry_write ON staff_registry FOR INSERT
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());

-- ---------------------------------------------------------------------------
-- Dataset 8: staff_attendance
-- Daily attendance per staff member.
-- UNIQUE(staff_id, attendance_date) — one record per person per day.
-- Arch ref: Final Architecture §4.1
-- ---------------------------------------------------------------------------
CREATE TABLE staff_attendance (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        UUID        NOT NULL REFERENCES staff_registry(id),
    attendance_date DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('present','absent','leave')),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (staff_id, attendance_date)
);
CREATE INDEX idx_staff_attendance_staff ON staff_attendance (staff_id, attendance_date DESC);

ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance FORCE ROW LEVEL SECURITY;

CREATE POLICY staff_attendance_select ON staff_attendance FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM staff_registry sr
            JOIN phc_facilities f ON f.id = sr.phc_id
            WHERE sr.id = staff_attendance.staff_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

CREATE POLICY staff_attendance_write ON staff_attendance FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff_registry sr WHERE sr.id = staff_id
              AND app_current_role() = 'phc_user' AND sr.phc_id = app_current_phc_id()
        )
    );

-- ---------------------------------------------------------------------------
-- Dataset 9: billing_transactions
-- FEFO billing header. client_txn_id is the idempotency key.
-- patient_ref: facility-local pseudonymous identifier (not full patient record).
-- Arch ref: Final Architecture §4.1, §3.3.1
-- ---------------------------------------------------------------------------
CREATE TABLE billing_transactions (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id               UUID          NOT NULL REFERENCES phc_facilities(id),
    client_txn_id        UUID          NOT NULL UNIQUE,  -- idempotency key from PHC
    patient_ref          VARCHAR(100),                   -- pseudonymous; nullable for walk-in
    dispensed_by_staff_id UUID         REFERENCES staff_registry(id),
    total_amount         NUMERIC(12,2),
    client_timestamp     TIMESTAMPTZ   NOT NULL,
    server_timestamp     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    status               VARCHAR(20)   NOT NULL DEFAULT 'completed'
                             CHECK (status IN ('completed','partial','cancelled'))
);
CREATE INDEX idx_billing_phc_time ON billing_transactions (phc_id, server_timestamp DESC);

ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY billing_transactions_select ON billing_transactions FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f WHERE f.id = billing_transactions.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

CREATE POLICY billing_transactions_insert ON billing_transactions FOR INSERT
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());

-- ---------------------------------------------------------------------------
-- Dataset 10: dispensed_items
-- One row per batch consumed per billing transaction (FEFO line items).
-- Together with billing_transactions, this is the authoritative dispensing record.
-- Arch ref: Final Architecture §4.1, §3.3.1, §5.1
-- ---------------------------------------------------------------------------
CREATE TABLE dispensed_items (
    id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_transaction_id UUID         NOT NULL REFERENCES billing_transactions(id),
    batch_id               UUID         NOT NULL REFERENCES inventory_batches(id),
    medicine_id            UUID         NOT NULL REFERENCES medicines(id),
    quantity               INT          NOT NULL CHECK (quantity > 0),
    unit_price             NUMERIC(10,2)
);
CREATE INDEX idx_dispensed_txn      ON dispensed_items (billing_transaction_id);
CREATE INDEX idx_dispensed_medicine ON dispensed_items (medicine_id) INCLUDE (quantity);

-- ---------------------------------------------------------------------------
-- Dataset 11: resource_requests
-- PHC supply/resource requests — all request types in one table.
-- State machine: pending → approved → dispatched → delivered → rejected
-- Arch ref: Final Architecture §4.1, §3.3.2
-- ---------------------------------------------------------------------------
CREATE TABLE resource_requests (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id       UUID        NOT NULL REFERENCES phc_facilities(id),
    request_type VARCHAR(20) NOT NULL
                     CHECK (request_type IN ('medicine','oxygen','bed','staff','equipment')),
    item_ref     UUID,       -- medicine_id or equipment_id; nullable for staff/bed/oxygen
    quantity     INT,
    priority     VARCHAR(20) NOT NULL DEFAULT 'routine'
                     CHECK (priority IN ('routine','urgent','critical')),
    reason       VARCHAR(30) CHECK (reason IN ('auto_velocity','manual','threshold_breach')),
    source       VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual','auto_draft')),
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','dispatched','delivered','rejected')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at   TIMESTAMPTZ,
    decided_by   UUID
);
CREATE INDEX idx_requests_status_priority ON resource_requests (status, priority);
CREATE INDEX idx_requests_phc             ON resource_requests (phc_id, created_at DESC);

ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY resource_requests_select ON resource_requests FOR SELECT
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f WHERE f.id = resource_requests.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
                OR (app_current_role() = 'phc_user'       AND f.id          = app_current_phc_id())
              )
        )
    );

CREATE POLICY resource_requests_insert ON resource_requests FOR INSERT
    WITH CHECK (app_current_role() = 'phc_user' AND phc_id = app_current_phc_id());

-- Decisioning: district admin and above, within own jurisdiction only
CREATE POLICY resource_requests_decide ON resource_requests FOR UPDATE
    USING (
        app_current_role() = 'national_admin'
        OR EXISTS (
            SELECT 1 FROM phc_facilities f WHERE f.id = resource_requests.phc_id
              AND (
                (app_current_role() = 'state_admin'    AND f.state_id    = app_current_state_id())
                OR (app_current_role() = 'district_admin' AND f.district_id = app_current_district_id())
              )
        )
    )
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Dataset 12: mutation_queue
-- Server-side mirror of the PHC offline sync queue.
-- Stores every pushed mutation with its sync outcome.
-- Idempotency key: (device_id, local_seq) per PHC.
-- Arch ref: Final Architecture §2.2, §8 (Sync API)
-- ---------------------------------------------------------------------------
CREATE TABLE mutation_queue (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id           UUID        NOT NULL REFERENCES phc_facilities(id),
    device_id        UUID        NOT NULL,
    local_seq        BIGINT      NOT NULL,
    entity_type      VARCHAR(50) NOT NULL
                         CHECK (entity_type IN (
                             'billing_transaction','inventory_batch_update',
                             'resource_request','footfall_entry',
                             'facility_update','staff_attendance','alert_report'
                         )),
    operation        VARCHAR(10) NOT NULL CHECK (operation IN ('create','update')),
    payload          JSONB       NOT NULL,
    sync_status      VARCHAR(20) NOT NULL DEFAULT 'accepted'
                         CHECK (sync_status IN ('accepted','duplicate','rejected','conflict')),
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_code       TEXT,
    UNIQUE (phc_id, device_id, local_seq)
);
CREATE INDEX idx_mutation_queue_phc    ON mutation_queue (phc_id, server_timestamp DESC);
CREATE INDEX idx_mutation_queue_status ON mutation_queue (sync_status) WHERE sync_status IN ('conflict','rejected');
