-- =============================================================================
-- LAYER 5: BRICS Federated Learning
-- Datasets 23-26
-- Matches: Final Architecture §5.7, Masterplan §65
-- Requires: 01_geography_foundation.sql + 03_timeseries.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Dataset 23: federation_training_features  [DERIVED — no seed file]
-- Read-only materialized view consumed by the Federated Learning Coordinator.
-- This is the ONLY data the federated client process reads from the national DB.
-- Source: consumption_daily continuous aggregate (Dataset 15).
-- NEVER transmitted cross-border — only masked weight deltas cross the border.
-- Arch ref: Final Architecture §5.7, Masterplan §65
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW federation_training_features AS
SELECT
    p.state_id                                    AS state_id,
    cd.phc_id,
    cd.medicine_id,
    date_trunc('week', cd.day)                    AS week_start,
    SUM(cd.total_qty)                             AS week_consumption,
    LAG(SUM(cd.total_qty), 1) OVER w              AS lag_1w_consumption,
    LAG(SUM(cd.total_qty), 2) OVER w              AS lag_2w_consumption,
    LAG(SUM(cd.total_qty), 3) OVER w              AS lag_3w_consumption,
    LAG(SUM(cd.total_qty), 4) OVER w              AS lag_4w_consumption,
    EXTRACT(MONTH FROM date_trunc('week', cd.day)) AS month_num,
    EXTRACT(DOW   FROM date_trunc('week', cd.day)) AS dow
FROM consumption_daily cd
JOIN phc_facilities p ON p.id = cd.phc_id
GROUP BY p.state_id, cd.phc_id, cd.medicine_id, date_trunc('week', cd.day)
WINDOW w AS (PARTITION BY cd.phc_id, cd.medicine_id ORDER BY date_trunc('week', cd.day));

-- Only the federated learning service role may read this view
-- GRANT SELECT ON federation_training_features TO federated_learning_role;
CREATE UNIQUE INDEX idx_fed_features_pk
    ON federation_training_features (phc_id, medicine_id, week_start);

-- ---------------------------------------------------------------------------
-- Dataset 24: federation_rounds
-- Immutable ledger of every federated learning round (completed or voided).
-- Hash-chained for tamper evidence (same pattern as audit_log).
-- Arch ref: Final Architecture §5.7, Masterplan §65
-- ---------------------------------------------------------------------------
CREATE TABLE federation_rounds (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id             VARCHAR(50) NOT NULL UNIQUE,  -- e.g. "round-2026-09-12-001"
    model_version        VARCHAR(50) NOT NULL,
    status               VARCHAR(20) NOT NULL
                             CHECK (status IN ('announced','in_progress','completed','voided')),
    participating_countries TEXT[],    -- e.g. ARRAY['IN','BR','RU','CN','ZA']
    submitted_countries  TEXT[],
    quorum_required      INT         NOT NULL DEFAULT 4,
    round_deadline       TIMESTAMPTZ,
    aggregation_signature TEXT,
    previous_entry_hash  TEXT        NOT NULL DEFAULT REPEAT('0',64),  -- genesis
    this_hash            TEXT,        -- SHA256(id||round_id||status||prev_hash)
    started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at         TIMESTAMPTZ
);
CREATE INDEX idx_federation_rounds_status ON federation_rounds (status, started_at DESC);

-- ---------------------------------------------------------------------------
-- Dataset 25: privacy_budget_ledger
-- Cumulative differential privacy budget tracking per country per round.
-- CHECK constraint structurally prevents exceeding the agreed epsilon limit.
-- Arch ref: Final Architecture §5.7 (DP-SGD), Masterplan §65
-- ---------------------------------------------------------------------------
CREATE TABLE privacy_budget_ledger (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id          VARCHAR(10)   NOT NULL,  -- ISO country code: IN, BR, RU, CN, ZA
    federation_round_id UUID          NOT NULL REFERENCES federation_rounds(id),
    epsilon_this_round  NUMERIC(10,6) NOT NULL CHECK (epsilon_this_round >= 0),
    delta_this_round    NUMERIC(15,12) NOT NULL CHECK (delta_this_round >= 0),
    cumulative_epsilon  NUMERIC(10,6) NOT NULL,
    budget_limit        NUMERIC(10,6) NOT NULL DEFAULT 10.0,
    clip_norm           NUMERIC(8,4),
    noise_multiplier    NUMERIC(8,4),
    local_sample_count  INT,
    submitted           BOOLEAN       NOT NULL DEFAULT false,
    recorded_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CHECK (cumulative_epsilon <= budget_limit),  -- structural privacy floor
    UNIQUE (country_id, federation_round_id)
);
CREATE INDEX idx_privacy_budget_country ON privacy_budget_ledger (country_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- Dataset 26: federation_model_versions
-- Registry of global model artifacts produced by the federated coordinator.
-- s3_uri: location of model weights in object storage.
-- activated_at NULL = received but not yet deployed.
-- Arch ref: Final Architecture §5.7, Masterplan §64 (model monitoring)
-- ---------------------------------------------------------------------------
CREATE TABLE federation_model_versions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version        VARCHAR(50) NOT NULL UNIQUE,
    base_model_version   VARCHAR(50),             -- the version this round trained from
    federation_round_id  UUID        REFERENCES federation_rounds(id),
    s3_uri               TEXT        NOT NULL,
    aggregation_signature TEXT,
    participating_countries TEXT[],
    metrics              JSONB,                   -- backtest performance, drift indicators
    status               VARCHAR(20) NOT NULL DEFAULT 'received'
                             CHECK (status IN ('received','validated','active','deprecated')),
    received_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at         TIMESTAMPTZ,             -- null = not yet deployed
    deprecated_at        TIMESTAMPTZ
);
CREATE INDEX idx_fed_models_status ON federation_model_versions (status, received_at DESC);
