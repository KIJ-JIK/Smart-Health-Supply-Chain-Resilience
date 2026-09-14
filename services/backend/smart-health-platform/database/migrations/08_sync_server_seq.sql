-- =============================================================================
-- LAYER 8: Sync Server Sequence & Watermark Tracking
-- Tracks monotonic server_seq watermarks for offline-first delta sync.
-- Matches: Final Architecture §8.2, Abdul_Backend.md Prompt 6
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS sync_server_seq START WITH 1;

ALTER TABLE mutation_queue ADD COLUMN IF NOT EXISTS server_seq BIGINT DEFAULT nextval('sync_server_seq');
CREATE INDEX IF NOT EXISTS idx_mutation_queue_server_seq ON mutation_queue(server_seq);

-- Also add optional mutation_id column if distinct from PK id to guarantee client UUID lookup
ALTER TABLE mutation_queue ADD COLUMN IF NOT EXISTS mutation_id UUID;
CREATE INDEX IF NOT EXISTS idx_mutation_queue_mutation_id ON mutation_queue(mutation_id);

GRANT ALL ON SEQUENCE sync_server_seq TO app_user;
GRANT ALL ON TABLE mutation_queue TO app_user;
