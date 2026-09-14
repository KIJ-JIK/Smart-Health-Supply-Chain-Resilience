# Disaster Recovery, Automated Backups & PITR Foundations

**Project:** Smart Health & Supply Chain Resilience Platform  
**Component:** PostgreSQL & TimescaleDB Database Infrastructure  
**Reference:** `Abdul_Backend.md` (Prompt 21), Masterplan §75, Final Architecture §6.2  

---

## 1. Point-In-Time Recovery (PITR) Strategy

The Smart Health Platform utilizes a dual-tier persistence strategy:
1. **Periodic Base Backups:** Full file-system snapshot or `pg_basebackup` taken nightly at 02:00 UTC.
2. **Continuous WAL (Write-Ahead Log) Archiving:** PostgreSQL continuously ships completed 16MB WAL segments to an encrypted remote object store (MinIO / S3).

### PostgreSQL Configuration (`postgresql.conf`)
```ini
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300 # Forces a WAL switch at least every 5 minutes (enforces 5-min RPO)
max_wal_size = 4GB
min_wal_size = 512MB
```

### Recovery Procedure
To recover to a specific point in time (e.g. immediately prior to a catastrophic failure or accidental drop):
1. Stop the PostgreSQL instance.
2. Restore the latest clean nightly base backup.
3. Place `recovery.signal` in the data directory.
4. Add recovery parameters in `postgresql.auto.conf`:
   ```ini
   restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
   recovery_target_time = '2026-09-13 14:15:00 UTC'
   recovery_target_action = 'promote'
   ```
5. Start PostgreSQL. WAL replay proceeds sequentially up to the target timestamp and automatically promotes the instance to primary.

---

## 2. Target Service Level Objectives (RPO & RTO)

| Metric | Target Specification | Architectural Mechanism |
|--------|----------------------|-------------------------|
| **RPO (Recovery Point Objective)** | **< 5 minutes** | `archive_timeout = 300s` ensures no more than 5 minutes of unarchived WAL transactions can be lost in the event of total storage destruction. |
| **RTO (Recovery Time Objective)** | **< 30 minutes** | Containerized redeployment of database + snapshot restore (15 min) + WAL replay duration (< 15 min for 24h delta). |

---

## 3. Explicit Open Questions for Team & Ministry Sign-off (Masterplan §75)

> [!IMPORTANT]
> The following architectural decisions must be formally ratified by the cross-team technical working group and national health ministry stakeholders prior to production deployment:

### Open Question 1: Cross-Region Georeplication & Data Sovereignty
- **Context:** Does the national health ministry mandate that WAL archives remain within designated state data boundaries (e.g., state-specific sovereign S3 buckets), or is a federated central national data lake permitted for disaster archives?
- **Options:**
  - **Option A:** Single centralized encrypted object repository (lower complexity, lower cost).
  - **Option B:** Distributed multi-region active-passive replica with state-isolated cold buckets (higher resilience, higher compliance cost).

### Open Question 2: Long-Term Edge Disconnect Recovery Window
- **Context:** Remote Primary Health Centers (PHCs) in rural regions may experience connectivity blackouts lasting up to 14 days. 
- **Decision:** If an edge PHC syncs after an outage exceeding the server-side watermark retention period (default 7 days), should the backend:
  - Trigger HTTP `410 Gone` and enforce a complete baseline sync reload (`GET /sync/pull?reset=true`), or
  - Extend server-side watermark retention to 30 days, trading off PostgreSQL table bloat?

### Open Question 3: Failover Automation vs. Human Incident Commander
- **Context:** High availability can be automated via Patroni/etcd raft consensus or orchestrated manually.
- **Decision:** Should failover promote the secondary replica automatically upon 3 consecutive health probe failures (risk of split-brain during transient network partition), or require multi-factor manual authorization from a designated State/National Incident Commander?

### Open Question 4: Clinical Zero-Data-Loss Requirement for Emergency Triage
- **Context:** Normal billing checkouts and stock movements have a 5-minute RPO. However, emergency incident reports (`emergency_report` alerts) carry clinical life-safety implications.
- **Decision:** Should emergency writes use synchronous replication (`synchronous_commit = on`), incurring higher network latency, or accept asynchronous commit with edge-cached local survivability?
