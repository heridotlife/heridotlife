# Archived ad-hoc migrations

These SQL files predate the adoption of `wrangler d1 migrations` and were
applied to the production database manually. They are kept for historical
reference only — **do not run them**; their changes are already part of the
`0001_baseline_schema.sql` baseline (and `schema.sql`, the canonical snapshot).

They live in a subdirectory so `wrangler d1 migrations` (which scans
`migrations/*.sql`) ignores them.
