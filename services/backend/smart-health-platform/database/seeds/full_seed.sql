-- =============================================================================
-- SMART HEALTH PLATFORM — Complete Schema + Seed Data
-- Plain PostgreSQL (no PostGIS, no TimescaleDB required)
-- Replaces all 10 migration files + 23 seed JSON files
-- Run once: psql -U postgres -d smarthealth -f full_seed.sql
-- =============================================================================

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SCHEMA
-- =============================================================================

-- states
CREATE TABLE IF NOT EXISTS states (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    code       VARCHAR(10)  NOT NULL UNIQUE,
    country    VARCHAR(50)  NOT NULL DEFAULT 'India',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- districts
CREATE TABLE IF NOT EXISTS districts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    state_id   UUID         NOT NULL REFERENCES states(id),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (name, state_id)
);
CREATE INDEX IF NOT EXISTS idx_districts_state ON districts (state_id);

-- phc_facilities (location as lat/lng TEXT instead of PostGIS)
CREATE TABLE IF NOT EXISTS phc_facilities (
    id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                      VARCHAR(255) NOT NULL,
    district_id               UUID         NOT NULL REFERENCES districts(id),
    state_id                  UUID         NOT NULL REFERENCES states(id),
    latitude                  NUMERIC(10,6),
    longitude                 NUMERIC(10,6),
    total_beds                INT          NOT NULL DEFAULT 0,
    emergency_beds            INT          NOT NULL DEFAULT 0,
    isolation_beds            INT          NOT NULL DEFAULT 0,
    occupied_beds             INT          NOT NULL DEFAULT 0,
    oxygen_cylinders_available INT         NOT NULL DEFAULT 0,
    operational_status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                              CHECK (operational_status IN ('active','inactive','under_maintenance')),
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_phc_district ON phc_facilities (district_id);
CREATE INDEX IF NOT EXISTS idx_phc_state    ON phc_facilities (state_id);

-- medicines
CREATE TABLE IF NOT EXISTS medicines (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL UNIQUE,
    category   VARCHAR(100) NOT NULL,
    unit       VARCHAR(50)  NOT NULL DEFAULT 'tablet',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- inventory_batches
CREATE TABLE IF NOT EXISTS inventory_batches (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id            UUID         NOT NULL REFERENCES phc_facilities(id),
    medicine_id       UUID         NOT NULL REFERENCES medicines(id),
    batch_no          VARCHAR(100) NOT NULL,
    remaining_qty     INT          NOT NULL DEFAULT 0,
    minimum_threshold INT          NOT NULL DEFAULT 10,
    expiry_date       DATE         NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_phc ON inventory_batches (phc_id);

-- stock_movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id      UUID        NOT NULL REFERENCES phc_facilities(id),
    medicine_id UUID        NOT NULL REFERENCES medicines(id),
    batch_id    UUID        REFERENCES inventory_batches(id),
    type        VARCHAR(30) NOT NULL CHECK (type IN ('dispensed','received','expired','adjusted','transferred')),
    quantity    INT         NOT NULL,
    notes       TEXT,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- staff_registry
CREATE TABLE IF NOT EXISTS staff_registry (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id     UUID        NOT NULL REFERENCES phc_facilities(id),
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(100) NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- staff_attendance
CREATE TABLE IF NOT EXISTS staff_attendance (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        UUID        NOT NULL REFERENCES staff_registry(id),
    phc_id          UUID        NOT NULL REFERENCES phc_facilities(id),
    attendance_date DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('present','absent','on_leave')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (staff_id, attendance_date)
);

-- patient_footfall
CREATE TABLE IF NOT EXISTS patient_footfall (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id     UUID        NOT NULL REFERENCES phc_facilities(id),
    date       DATE        NOT NULL,
    category   VARCHAR(100) NOT NULL,
    count      INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (phc_id, date, category)
);

-- resource_requests
CREATE TABLE IF NOT EXISTS resource_requests (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id       UUID        NOT NULL REFERENCES phc_facilities(id),
    district_id  UUID        REFERENCES districts(id),
    state_id     UUID        REFERENCES states(id),
    request_type VARCHAR(100) NOT NULL,
    priority     VARCHAR(20)  NOT NULL CHECK (priority IN ('low','medium','high','critical')),
    status       VARCHAR(30)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','fulfilled')),
    payload      JSONB,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    decided_at   TIMESTAMPTZ
);

-- alerts
CREATE TABLE IF NOT EXISTS alerts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id      UUID        REFERENCES phc_facilities(id),
    district_id UUID        REFERENCES districts(id),
    state_id    UUID        REFERENCES states(id),
    alert_type  VARCHAR(100) NOT NULL,
    severity    VARCHAR(20)  NOT NULL CHECK (severity IN ('info','warning','critical')),
    status      VARCHAR(20)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
    payload     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_status   ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_phc      ON alerts (phc_id);
CREATE INDEX IF NOT EXISTS idx_alerts_district ON alerts (district_id);

-- redistribution_transfers
CREATE TABLE IF NOT EXISTS redistribution_transfers (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    source_phc_id     UUID         NOT NULL REFERENCES phc_facilities(id),
    dest_phc_id       UUID         NOT NULL REFERENCES phc_facilities(id),
    medicine_id       UUID         NOT NULL REFERENCES medicines(id),
    quantity          INT          NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'recommended'
                      CHECK (status IN ('recommended','approved','dispatched','delivered','rejected')),
    ai_explanation    TEXT,
    urgency_level     VARCHAR(20)  NOT NULL DEFAULT 'HIGH',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    decided_at        TIMESTAMPTZ
);

-- forecast_predictions
CREATE TABLE IF NOT EXISTS forecast_predictions (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id           UUID         NOT NULL REFERENCES phc_facilities(id),
    medicine_id      UUID         NOT NULL REFERENCES medicines(id),
    forecast_type    VARCHAR(50)  NOT NULL DEFAULT 'demand',
    predicted_value  NUMERIC(12,2) NOT NULL,
    confidence_lower NUMERIC(12,2),
    confidence_upper NUMERIC(12,2),
    model_used       VARCHAR(100)  NOT NULL DEFAULT 'prophet',
    model_version    VARCHAR(50)   NOT NULL DEFAULT 'v2.1',
    generated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- billing_transactions
CREATE TABLE IF NOT EXISTS billing_transactions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id               UUID        NOT NULL REFERENCES phc_facilities(id),
    client_txn_id        VARCHAR(100),
    dispensed_by_staff_id UUID       REFERENCES staff_registry(id),
    client_timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
    sync_status          VARCHAR(20)  NOT NULL DEFAULT 'synced',
    status               VARCHAR(20)  NOT NULL DEFAULT 'completed',
    total_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- dispensed_items
CREATE TABLE IF NOT EXISTS dispensed_items (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_transaction_id UUID       NOT NULL REFERENCES billing_transactions(id),
    batch_id              UUID        NOT NULL REFERENCES inventory_batches(id),
    medicine_id           UUID        NOT NULL REFERENCES medicines(id),
    quantity              INT         NOT NULL,
    unit_price            NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id      VARCHAR(255) NOT NULL,
    actor_role    VARCHAR(100) NOT NULL,
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(100) NOT NULL,
    entity_id     VARCHAR(255) NOT NULL,
    before_state  JSONB,
    after_state   JSONB,
    phc_id        UUID,
    district_id   UUID,
    state_id      UUID,
    source_ip     VARCHAR(50),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- system_config
CREATE TABLE IF NOT EXISTS system_config (
    key         VARCHAR(255) PRIMARY KEY,
    value       JSONB        NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- federation_rounds
CREATE TABLE IF NOT EXISTS federation_rounds (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    round_number           INT         NOT NULL,
    model_id               VARCHAR(255) NOT NULL,
    status                 VARCHAR(30)  NOT NULL DEFAULT 'pending',
    participating_countries TEXT[]      NOT NULL DEFAULT '{}',
    global_loss            NUMERIC(10,6),
    previous_entry_hash    VARCHAR(64),
    this_hash              VARCHAR(64),
    started_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at           TIMESTAMPTZ
);

-- privacy_budget_ledger
CREATE TABLE IF NOT EXISTS privacy_budget_ledger (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id          VARCHAR(10)  NOT NULL,
    round_number        INT          NOT NULL,
    epsilon_consumed    NUMERIC(6,4) NOT NULL,
    cumulative_epsilon  NUMERIC(6,4) NOT NULL,
    budget_limit        NUMERIC(6,4) NOT NULL DEFAULT 5.0,
    within_budget       BOOLEAN      NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- federation_model_versions
CREATE TABLE IF NOT EXISTS federation_model_versions (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version     VARCHAR(100) NOT NULL,
    accuracy_score    NUMERIC(6,4) NOT NULL,
    test_accuracy_delta NUMERIC(6,4),
    status            VARCHAR(30)  NOT NULL DEFAULT 'pending',
    released_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- consumption_velocity (simplified, no timescaledb)
CREATE TABLE IF NOT EXISTS consumption_velocity (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phc_id      UUID         NOT NULL REFERENCES phc_facilities(id),
    medicine_id UUID         NOT NULL REFERENCES medicines(id),
    date        DATE         NOT NULL,
    daily_qty   INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (phc_id, medicine_id, date)
);

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- ── States ────────────────────────────────────────────────────────────────────
INSERT INTO states (id, name, code) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Maharashtra',    'MH'),
  ('a0000001-0000-0000-0000-000000000002', 'Karnataka',      'KA'),
  ('a0000001-0000-0000-0000-000000000003', 'Tamil Nadu',     'TN'),
  ('a0000001-0000-0000-0000-000000000004', 'Uttar Pradesh',  'UP'),
  ('a0000001-0000-0000-0000-000000000005', 'Rajasthan',      'RJ')
ON CONFLICT DO NOTHING;

-- ── Districts ─────────────────────────────────────────────────────────────────
INSERT INTO districts (id, name, state_id) VALUES
  ('b0000002-0000-0000-0000-000000000001', 'Pune',           'a0000001-0000-0000-0000-000000000001'),
  ('b0000002-0000-0000-0000-000000000002', 'Nashik',         'a0000001-0000-0000-0000-000000000001'),
  ('b0000002-0000-0000-0000-000000000003', 'Aurangabad',     'a0000001-0000-0000-0000-000000000001'),
  ('b0000002-0000-0000-0000-000000000004', 'Bengaluru Urban','a0000001-0000-0000-0000-000000000002'),
  ('b0000002-0000-0000-0000-000000000005', 'Mysuru',         'a0000001-0000-0000-0000-000000000002'),
  ('b0000002-0000-0000-0000-000000000006', 'Chennai',        'a0000001-0000-0000-0000-000000000003'),
  ('b0000002-0000-0000-0000-000000000007', 'Lucknow',        'a0000001-0000-0000-0000-000000000004'),
  ('b0000002-0000-0000-0000-000000000008', 'Jaipur',         'a0000001-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ── PHC Facilities ────────────────────────────────────────────────────────────
INSERT INTO phc_facilities (id, name, district_id, state_id, latitude, longitude, total_beds, emergency_beds, isolation_beds, occupied_beds, oxygen_cylinders_available, operational_status) VALUES
  ('c0000003-0000-0000-0000-000000000001', 'Kothrud PHC',         'b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 18.5074, 73.8077, 30, 5, 3, 27, 12, 'active'),
  ('c0000003-0000-0000-0000-000000000002', 'Hadapsar PHC',        'b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 18.5089, 73.9259, 40, 8, 4, 38, 3,  'active'),
  ('c0000003-0000-0000-0000-000000000003', 'Baramati PHC',        'b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 18.1517, 74.5769, 50, 10, 5, 47, 8,  'active'),
  ('c0000003-0000-0000-0000-000000000004', 'Chakan PHC',          'b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 18.7601, 73.8614, 25, 4, 2, 20, 15, 'active'),
  ('c0000003-0000-0000-0000-000000000005', 'Shirur PHC',          'b0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 18.8264, 74.3677, 20, 3, 2, 11, 20, 'active'),
  ('c0000003-0000-0000-0000-000000000006', 'Malegaon PHC',        'b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 20.5579, 74.5089, 35, 6, 3, 34, 4,  'active'),
  ('c0000003-0000-0000-0000-000000000007', 'Nashik Rural PHC',    'b0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 19.9975, 73.7898, 30, 5, 3, 26, 18, 'active'),
  ('c0000003-0000-0000-0000-000000000008', 'Aurangabad Central',  'b0000002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 19.8762, 75.3433, 60, 12, 6, 55, 6,  'active'),
  ('c0000003-0000-0000-0000-000000000009', 'Koramangala PHC',     'b0000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 12.9279, 77.6271, 45, 8, 4, 40, 22, 'active'),
  ('c0000003-0000-0000-0000-000000000010', 'Whitefield PHC',      'b0000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 12.9698, 77.7500, 30, 5, 2, 18, 30, 'active'),
  ('c0000003-0000-0000-0000-000000000011', 'Mysuru North PHC',    'b0000002-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 12.3051, 76.6551, 25, 4, 2, 22, 7,  'active'),
  ('c0000003-0000-0000-0000-000000000012', 'T. Nagar PHC',        'b0000002-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 13.0418, 80.2341, 50, 10, 5, 44, 14, 'active'),
  ('c0000003-0000-0000-0000-000000000013', 'Aminabad PHC',        'b0000002-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 26.8467, 80.9462, 40, 8, 4, 39, 2,  'active'),
  ('c0000003-0000-0000-0000-000000000014', 'Jaipur Central PHC',  'b0000002-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 26.9124, 75.7873, 35, 6, 3, 28, 16, 'active'),
  ('c0000003-0000-0000-0000-000000000015', 'Alwar PHC',           'b0000002-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 27.5530, 76.6346, 20, 3, 2, 8,  25, 'active')
ON CONFLICT DO NOTHING;

-- ── Medicines ─────────────────────────────────────────────────────────────────
INSERT INTO medicines (id, name, category, unit) VALUES
  ('d0000004-0000-0000-0000-000000000001', 'Paracetamol 500mg',        'Analgesic',      'tablet'),
  ('d0000004-0000-0000-0000-000000000002', 'Amoxicillin 500mg',        'Antibiotic',     'capsule'),
  ('d0000004-0000-0000-0000-000000000003', 'ORS Sachet',               'Rehydration',    'sachet'),
  ('d0000004-0000-0000-0000-000000000004', 'Metronidazole 400mg',      'Antibiotic',     'tablet'),
  ('d0000004-0000-0000-0000-000000000005', 'Cotrimoxazole 480mg',      'Antibiotic',     'tablet'),
  ('d0000004-0000-0000-0000-000000000006', 'Vitamin B-Complex',        'Supplement',     'tablet'),
  ('d0000004-0000-0000-0000-000000000007', 'Iron + Folic Acid',        'Supplement',     'tablet'),
  ('d0000004-0000-0000-0000-000000000008', 'Chloroquine Phosphate',    'Antimalarial',   'tablet'),
  ('d0000004-0000-0000-0000-000000000009', 'Insulin Glargine 100U/mL', 'Antidiabetic',   'vial'),
  ('d0000004-0000-0000-0000-000000000010', 'Amlodipine 5mg',           'Antihypertensive','tablet'),
  ('d0000004-0000-0000-0000-000000000011', 'Salbutamol Inhaler',       'Bronchodilator', 'inhaler'),
  ('d0000004-0000-0000-0000-000000000012', 'Zinc Sulphate 20mg',       'Supplement',     'tablet'),
  ('d0000004-0000-0000-0000-000000000013', 'Gentamicin Eye Drops',     'Antibiotic',     'bottle'),
  ('d0000004-0000-0000-0000-000000000014', 'Morphine Sulphate 10mg',   'Opioid Analgesic','tablet'),
  ('d0000004-0000-0000-0000-000000000015', 'Albendazole 400mg',        'Anthelmintic',   'tablet')
ON CONFLICT DO NOTHING;

-- ── Inventory Batches ─────────────────────────────────────────────────────────
-- Critical stockout: Hadapsar PHC - Amoxicillin = 0
-- Critical stockout: Hadapsar PHC - Insulin = 0  
-- Low stock: Kothrud PHC - Vitamin B-Complex = 30 (threshold 100)
-- Critical: Aminabad PHC - multiple medicines low
INSERT INTO inventory_batches (id, phc_id, medicine_id, batch_no, remaining_qty, minimum_threshold, expiry_date) VALUES
  -- Kothrud PHC
  ('e0000005-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000001', 'd0000004-0000-0000-0000-000000000001', 'B-PCT-2024-001', 2400,  500,  '2027-06-30'),
  ('e0000005-0000-0000-0000-000000000002', 'c0000003-0000-0000-0000-000000000001', 'd0000004-0000-0000-0000-000000000002', 'B-AMX-2024-001', 8400,  200,  '2026-12-31'),
  ('e0000005-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000001', 'd0000004-0000-0000-0000-000000000003', 'B-ORS-2024-001', 1200,  300,  '2027-03-31'),
  ('e0000005-0000-0000-0000-000000000004', 'c0000003-0000-0000-0000-000000000001', 'd0000004-0000-0000-0000-000000000006', 'B-VBC-2024-001', 30,    100,  '2026-10-15'),  -- LOW STOCK
  -- Hadapsar PHC - CRITICAL STOCKOUTS
  ('e0000005-0000-0000-0000-000000000005', 'c0000003-0000-0000-0000-000000000002', 'd0000004-0000-0000-0000-000000000002', 'B-AMX-2024-002', 0,     150,  '2026-12-31'),  -- STOCKOUT
  ('e0000005-0000-0000-0000-000000000006', 'c0000003-0000-0000-0000-000000000002', 'd0000004-0000-0000-0000-000000000009', 'B-INS-2024-001', 0,     20,   '2026-09-30'),  -- STOCKOUT
  ('e0000005-0000-0000-0000-000000000007', 'c0000003-0000-0000-0000-000000000002', 'd0000004-0000-0000-0000-000000000001', 'B-PCT-2024-002', 800,   500,  '2027-06-30'),
  ('e0000005-0000-0000-0000-000000000008', 'c0000003-0000-0000-0000-000000000002', 'd0000004-0000-0000-0000-000000000003', 'B-ORS-2024-002', 45,    200,  '2027-03-31'),  -- LOW
  -- Baramati PHC
  ('e0000005-0000-0000-0000-000000000009', 'c0000003-0000-0000-0000-000000000003', 'd0000004-0000-0000-0000-000000000001', 'B-PCT-2024-003', 3500,  500,  '2027-06-30'),
  ('e0000005-0000-0000-0000-000000000010', 'c0000003-0000-0000-0000-000000000003', 'd0000004-0000-0000-0000-000000000007', 'B-IFA-2024-001', 4000,  500,  '2027-01-31'),
  -- Chakan PHC
  ('e0000005-0000-0000-0000-000000000011', 'c0000003-0000-0000-0000-000000000004', 'd0000004-0000-0000-0000-000000000001', 'B-PCT-2024-004', 1800,  300,  '2027-06-30'),
  ('e0000005-0000-0000-0000-000000000012', 'c0000003-0000-0000-0000-000000000004', 'd0000004-0000-0000-0000-000000000004', 'B-MTZ-2024-001', 600,   200,  '2026-11-30'),
  -- Aminabad PHC - CRITICAL
  ('e0000005-0000-0000-0000-000000000013', 'c0000003-0000-0000-0000-000000000013', 'd0000004-0000-0000-0000-000000000001', 'B-PCT-2024-013', 80,    500,  '2027-06-30'),  -- CRITICAL LOW
  ('e0000005-0000-0000-0000-000000000014', 'c0000003-0000-0000-0000-000000000013', 'd0000004-0000-0000-0000-000000000009', 'B-INS-2024-013', 5,     30,   '2026-10-31'),  -- CRITICAL LOW
  ('e0000005-0000-0000-0000-000000000015', 'c0000003-0000-0000-0000-000000000013', 'd0000004-0000-0000-0000-000000000008', 'B-CHL-2024-013', 0,     100,  '2026-12-31'),  -- STOCKOUT
  -- Malegaon PHC - expiring soon
  ('e0000005-0000-0000-0000-000000000016', 'c0000003-0000-0000-0000-000000000006', 'd0000004-0000-0000-0000-000000000002', 'B-AMX-2024-006', 22,    50,   '2026-10-05'),  -- EXPIRING SOON
  ('e0000005-0000-0000-0000-000000000017', 'c0000003-0000-0000-0000-000000000006', 'd0000004-0000-0000-0000-000000000005', 'B-CTX-2024-006', 8,     30,   '2026-10-08')   -- EXPIRING SOON
ON CONFLICT DO NOTHING;

-- ── Alerts ────────────────────────────────────────────────────────────────────
INSERT INTO alerts (id, phc_id, district_id, state_id, alert_type, severity, status, payload) VALUES
  ('f0000006-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000002',
    'b0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'medicine_stockout', 'critical', 'open',
    '{"medicine":"Amoxicillin 500mg","batch":"B-AMX-2024-002","stockout_days":0,"daily_consumption":340,"recommendation":"Immediate redistribution from Kothrud PHC required"}'
  ),
  ('f0000006-0000-0000-0000-000000000002',
    'c0000003-0000-0000-0000-000000000002',
    'b0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'medicine_stockout', 'critical', 'open',
    '{"medicine":"Insulin Glargine 100U/mL","batch":"B-INS-2024-001","stockout_days":0,"daily_consumption":12,"affected_patients":"Diabetic patients at immediate risk"}'
  ),
  ('f0000006-0000-0000-0000-000000000003',
    'c0000003-0000-0000-0000-000000000003',
    'b0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'bed_occupancy_critical', 'critical', 'open',
    '{"occupied":47,"total":50,"occupancy_rate":94.0,"category":"dengue_admissions","trend":"increasing"}'
  ),
  ('f0000006-0000-0000-0000-000000000004',
    'c0000003-0000-0000-0000-000000000001',
    'b0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'low_stock_warning', 'warning', 'open',
    '{"medicine":"Vitamin B-Complex","remaining_qty":30,"threshold":100,"days_to_stockout":3}'
  ),
  ('f0000006-0000-0000-0000-000000000005',
    'c0000003-0000-0000-0000-000000000013',
    'b0000002-0000-0000-0000-000000000007',
    'a0000001-0000-0000-0000-000000000004',
    'medicine_stockout', 'critical', 'open',
    '{"medicine":"Chloroquine Phosphate","batch":"B-CHL-2024-013","stockout_days":0,"outbreak_risk":"malaria_season"}'
  ),
  ('f0000006-0000-0000-0000-000000000006',
    'c0000003-0000-0000-0000-000000000013',
    'b0000002-0000-0000-0000-000000000007',
    'a0000001-0000-0000-0000-000000000004',
    'low_stock_warning', 'critical', 'open',
    '{"medicine":"Insulin Glargine","remaining_qty":5,"threshold":30,"days_to_stockout":1,"affected_patients":"17 registered diabetics"}'
  ),
  ('f0000006-0000-0000-0000-000000000007',
    'c0000003-0000-0000-0000-000000000006',
    'b0000002-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000001',
    'expiry_warning', 'warning', 'open',
    '{"medicine":"Amoxicillin 500mg","batch":"B-AMX-2024-006","qty":22,"expiry_date":"2026-10-05","days_to_expiry":13}'
  ),
  ('f0000006-0000-0000-0000-000000000008',
    'c0000003-0000-0000-0000-000000000008',
    'b0000002-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000001',
    'bed_occupancy_critical', 'warning', 'open',
    '{"occupied":55,"total":60,"occupancy_rate":91.7,"surge_expected":true}'
  ),
  ('f0000006-0000-0000-0000-000000000009',
    'c0000003-0000-0000-0000-000000000002',
    'b0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'oxygen_low', 'critical', 'open',
    '{"cylinders_available":3,"minimum_required":10,"estimated_hours_remaining":6}'
  ),
  ('f0000006-0000-0000-0000-000000000010',
    NULL, NULL,
    'a0000001-0000-0000-0000-000000000001',
    'outbreak_risk', 'critical', 'open',
    '{"disease":"dengue","affected_districts":["Pune","Aurangabad"],"case_count":89,"week_over_week_increase":"47%"}'
  )
ON CONFLICT DO NOTHING;

-- ── Redistribution Transfers ──────────────────────────────────────────────────
INSERT INTO redistribution_transfers (id, source_phc_id, dest_phc_id, medicine_id, quantity, status, ai_explanation, urgency_level) VALUES
  ('g0000007-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000001',  -- Kothrud (donor: 8400 strips)
    'c0000003-0000-0000-0000-000000000002',  -- Hadapsar (stockout)
    'd0000004-0000-0000-0000-000000000002',  -- Amoxicillin
    2500, 'recommended',
    'Kothrud PHC has 8,400 surplus strips (48 days coverage). Transfer of 2,500 restores 16.5-day safety stock at Hadapsar (current: 0 strips, 340 patients/day). Kothrud retains 32-day reserve post-transfer.',
    'CRITICAL'
  ),
  ('g0000007-0000-0000-0000-000000000002',
    'c0000003-0000-0000-0000-000000000005',  -- Shirur (oxygen: 20)
    'c0000003-0000-0000-0000-000000000002',  -- Hadapsar (oxygen: 3)
    'd0000004-0000-0000-0000-000000000011',  -- Salbutamol (proxy for oxygen transfer recommendation)
    8, 'recommended',
    'Shirur PHC has 20 oxygen cylinders with low demand. Hadapsar has 3 cylinders with estimated 6 hours holdover. Emergency transfer recommended before cold chain breach.',
    'CRITICAL'
  ),
  ('g0000007-0000-0000-0000-000000000003',
    'c0000003-0000-0000-0000-000000000004',  -- Chakan PHC
    'c0000003-0000-0000-0000-000000000013',  -- Aminabad PHC
    'd0000004-0000-0000-0000-000000000001',  -- Paracetamol
    1000, 'approved',
    'Approved redistribution: Chakan PHC (1800 units, 18 days supply) transfers to Aminabad (80 units, < 1 day supply). 17 km transit via NH-19.',
    'HIGH'
  )
ON CONFLICT DO NOTHING;

-- ── Staff Registry ────────────────────────────────────────────────────────────
INSERT INTO staff_registry (id, phc_id, name, role, active) VALUES
  ('h0000008-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000001', 'Dr. Anjali Sharma',    'Medical Officer',     true),
  ('h0000008-0000-0000-0000-000000000002', 'c0000003-0000-0000-0000-000000000001', 'Priya Patel',          'ANM',                 true),
  ('h0000008-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000001', 'Ramesh Kulkarni',      'Lab Technician',      false),
  ('h0000008-0000-0000-0000-000000000004', 'c0000003-0000-0000-0000-000000000002', 'Dr. Suresh Patil',     'Medical Officer',     true),
  ('h0000008-0000-0000-0000-000000000005', 'c0000003-0000-0000-0000-000000000002', 'Meena Joshi',          'Pharmacist',          true),
  ('h0000008-0000-0000-0000-000000000006', 'c0000003-0000-0000-0000-000000000003', 'Dr. Kavitha Rao',      'Medical Officer',     true),
  ('h0000008-0000-0000-0000-000000000007', 'c0000003-0000-0000-0000-000000000013', 'Dr. Mohammed Akhtar',  'Medical Officer',     true),
  ('h0000008-0000-0000-0000-000000000008', 'c0000003-0000-0000-0000-000000000013', 'Sunita Verma',         'ANM',                 true)
ON CONFLICT DO NOTHING;

-- ── Patient Footfall ──────────────────────────────────────────────────────────
INSERT INTO patient_footfall (phc_id, date, category, count) VALUES
  ('c0000003-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'OPD',          128),
  ('c0000003-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'ANC',          14),
  ('c0000003-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'immunisation', 32),
  ('c0000003-0000-0000-0000-000000000002', CURRENT_DATE - 1, 'OPD',          340),
  ('c0000003-0000-0000-0000-000000000002', CURRENT_DATE - 1, 'ANC',          28),
  ('c0000003-0000-0000-0000-000000000003', CURRENT_DATE - 1, 'OPD',          210),
  ('c0000003-0000-0000-0000-000000000003', CURRENT_DATE - 1, 'dengue_fever', 47),
  ('c0000003-0000-0000-0000-000000000004', CURRENT_DATE - 1, 'OPD',          95),
  ('c0000003-0000-0000-0000-000000000013','c0000003-0000-0000-0000-000000000013', CURRENT_DATE - 1, 'OPD', 174),
  ('c0000003-0000-0000-0000-000000000013', CURRENT_DATE - 1, 'malaria_fever',62)
ON CONFLICT DO NOTHING;

-- ── Forecast Predictions ──────────────────────────────────────────────────────
INSERT INTO forecast_predictions (phc_id, medicine_id, forecast_type, predicted_value, confidence_lower, confidence_upper, model_used, model_version) VALUES
  ('c0000003-0000-0000-0000-000000000002', 'd0000004-0000-0000-0000-000000000002', 'demand', 4760, 4200, 5320, 'xgboost',  'v1.0'),
  ('c0000003-0000-0000-0000-000000000001', 'd0000004-0000-0000-0000-000000000001', 'demand', 2800, 2500, 3100, 'prophet',  'v2.1'),
  ('c0000003-0000-0000-0000-000000000003', 'd0000004-0000-0000-0000-000000000001', 'demand', 3000, 2700, 3300, 'prophet',  'v2.1'),
  ('c0000003-0000-0000-0000-000000000013','d0000004-0000-0000-0000-000000000008', 'demand', 1400, 1200, 1600, 'xgboost',  'v1.0')
ON CONFLICT DO NOTHING;

-- ── Federation Rounds ─────────────────────────────────────────────────────────
INSERT INTO federation_rounds (id, round_number, model_id, status, participating_countries, global_loss, previous_entry_hash, this_hash, started_at, completed_at) VALUES
  ('i0000009-0000-0000-0000-000000000001', 18, 'demand-forecaster-v2', 'completed', ARRAY['IN','BR','RU','CN','ZA'], 0.0312, '0000000000000000000000000000000000000000000000000000000000000000', 'a3f9c2d18e7b45f601234abcdef567890fedcba987654321fedcba9876543210', now() - interval '7 days', now() - interval '6 days'),
  ('i0000009-0000-0000-0000-000000000002', 19, 'demand-forecaster-v2', 'completed', ARRAY['IN','BR','RU','CN','ZA'], 0.0287, 'a3f9c2d18e7b45f601234abcdef567890fedcba987654321fedcba9876543210', 'b4f0d3e29f8c56a712345bcdef678901fedcba098765432fedcba0987654321', now() - interval '1 day', now() - interval '23 hours')
ON CONFLICT DO NOTHING;

-- ── Privacy Budget Ledger ──────────────────────────────────────────────────────
INSERT INTO privacy_budget_ledger (country_id, round_number, epsilon_consumed, cumulative_epsilon, budget_limit, within_budget) VALUES
  ('IN', 18, 0.25, 4.50, 5.0, true),
  ('BR', 18, 0.25, 4.25, 5.0, true),
  ('RU', 18, 0.25, 4.10, 5.0, true),
  ('CN', 18, 0.25, 4.00, 5.0, true),
  ('ZA', 18, 0.25, 3.75, 5.0, true),
  ('IN', 19, 0.25, 4.75, 5.0, true),
  ('BR', 19, 0.25, 4.50, 5.0, true),
  ('RU', 19, 0.25, 4.35, 5.0, true),
  ('CN', 19, 0.25, 4.25, 5.0, true),
  ('ZA', 19, 0.25, 4.00, 5.0, true)
ON CONFLICT DO NOTHING;

-- ── Federation Model Versions ──────────────────────────────────────────────────
INSERT INTO federation_model_versions (model_version, accuracy_score, test_accuracy_delta, status) VALUES
  ('demand-forecaster-v1.19', 0.8714, 0.0182, 'active'),
  ('demand-forecaster-v1.18', 0.8532, 0.0241, 'superseded')
ON CONFLICT DO NOTHING;

-- ── System Config ─────────────────────────────────────────────────────────────
INSERT INTO system_config (key, value, description) VALUES
  ('risk_weights',         '{"stockout_score":30,"bed_occupancy":25,"alert_count":20,"oxygen_level":15,"workforce_gap":10}', 'Risk scoring weights per masterplan §27'),
  ('stockout_threshold_days', '14', 'Minimum safety buffer in days'),
  ('bed_occupancy_critical',  '92', 'Bed occupancy % threshold for critical alert')
ON CONFLICT (key) DO NOTHING;

-- ── Audit Log ─────────────────────────────────────────────────────────────────
INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_state, phc_id, district_id) VALUES
  ('dev-nat-001', 'national_admin', 'APPROVE_REDISTRIBUTION', 'redistribution_transfer', 'g0000007-0000-0000-0000-000000000003', '{"status":"approved","quantity":1000}', 'c0000003-0000-0000-0000-000000000013', 'b0000002-0000-0000-0000-000000000007'),
  ('dev-dist-001', 'district_admin', 'ACKNOWLEDGE_ALERT', 'alert', 'f0000006-0000-0000-0000-000000000007', '{"status":"acknowledged"}', 'c0000003-0000-0000-0000-000000000006', 'b0000002-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- ── Verification counts ───────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  cnt INT;
BEGIN
  FOREACH t IN ARRAY ARRAY['states','districts','phc_facilities','medicines','inventory_batches','alerts','redistribution_transfers','staff_registry','patient_footfall','forecast_predictions','federation_rounds','privacy_budget_ledger','system_config','audit_log']
  LOOP
    EXECUTE format('SELECT count(*) FROM %I', t) INTO cnt;
    RAISE NOTICE '  %-35s : % rows', t, cnt;
  END LOOP;
END;
$$;

SELECT 'SEED COMPLETE — All tables loaded successfully' AS status;
