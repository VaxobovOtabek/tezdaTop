# Database and backend hardening — 2026-11-03

The existing React applications and REST paths are retained. Apply the SQL migrations before releasing the corresponding API revision. The migrations were tested inside rolled-back PostgreSQL transactions before being applied to the existing Supabase project.

## Persistence and concurrency

`read_database_snapshot` reads a consistent, complete snapshot without the per-table REST row limit. `commit_database_snapshot` writes changed records and deletions in one transaction, rejecting stale versions. These functions are executable only by the backend service role. Statement triggers also invalidate snapshots after legacy or administrative writes.

The HTTP persistence middleware isolates the mutable domain model, waits for durable storage before sending success, and restores the previous state after rejected operations or failed commits. It returns 409 for conflicting writes and 503 for storage failures. Per-process request serialization favors correctness for the current workload; a future high-volume implementation should move individual domain operations directly into SQL rather than repeatedly loading the whole dataset.

Domain fields not represented by historical relational columns are preserved in `app_data`. Dealer records, sale cost snapshots, idempotency records, hashed revocations, and search events are stored in the backend-only `application_records` table. Money and quantities use numeric database columns; decimal values are returned as strings where required for precision.

## Security and data cleanup

- No fixed public session-signing fallback remains. A deployment uses its session secret or a separately derived key from its existing backend service secret.
- Tokens have nonces, expiry checks, persisted revocations, and user token versions. Logout and credential changes remain effective across workers.
- Production never seeds demo accounts, including after initialization errors. The standalone sync script downloads the authoritative cloud state instead of seeding or uploading stale local data.
- User responses omit password hashes, plaintext passwords, verification codes, and requested passwords. New passwords use scrypt; the known legacy plaintext records were migrated.
- Direct client access to private tables and user role updates is revoked. Public catalog policies require active parent records. RLS remains enabled on backend-only tables with no client policies by design.
- A unique index and database trigger preserve the sole active administrator. Lower staff cannot impersonate or reset the superadministrator through the user endpoints.
- Inventory checks reject invalid numbers, negative quantities, overselling, invalid payments, repeated lines, excessive returns, and partial failed orders. Returns are tied to actual delivered quantities.
- Duplicate inventory snapshots are removed without summing their quantities. Store/variant and membership uniqueness, tenant foreign keys, numeric checks, and supporting indexes are enforced.
- Only exact, unchanged demo signatures and unused duplicate demo organizations were removed. Customized seed records and real accounts were retained. Retired IDs cannot be reintroduced by an old backend cache.
- Fabricated audit records, review/report fallbacks, analytics fixtures, and published demo login hints are removed. Missing view/route telemetry is reported as zero rather than generated figures.
- Markdown no longer publishes account passwords. Operational credentials and encrypted backups are excluded from both Git and Vercel uploads.

## Verification and operations

The backend regression suite has 87 passing tests. The monorepo build passed; the final changed API and dealer packages were also built. Production-configured local smoke checks against the live database covered public catalog, admin overview, merchant context/dashboard, administrator login, logout, and rejected token replay. `scripts/verify-database.sql` exercises real RPC upserts, conflict detection, atomic rollback, and privilege restrictions inside a transaction that is rolled back.

After cleanup: 6 users, 8 organizations, 8 stores, 27 offers and 27 balances; zero duplicate balance or membership groups and zero unhashed passwords. The cleanup retired 137 exact demo rows in addition to removing 88 duplicate balances and 18 duplicate memberships. Historical synthetic documents and expenses were removed by exact source signatures; retained product quantities were not subtracted or combined.

`scripts/database-maintenance.cjs backup` creates an encrypted data/schema backup and verifies decryption. Keys and operational credentials remain in ignored local storage. This does not enable paid PITR or provide an off-site backup schedule; configure those separately in the hosting environment. Never commit backup files or their keys.

Supabase security advisors reported no ERROR or WARN findings after the changes. INFO findings for private RLS tables and newly unused indexes are expected. Advisor results and actual query plans should guide further performance work; indexes alone do not make the snapshot architecture suitable for unlimited scale.
