# Database Setup

This project supports multiple database engines via `DB_DIALECT`:
- mysql (default for existing deployments)
- sqlite (recommended for local development)
- postgres (recommended for production)

## Configure
Edit `server/.env` (see `.env.example`):

- `DB_DIALECT`: `mysql` | `sqlite` | `postgres`
- MySQL: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- SQLite: `SQLITE_PATH` (e.g., `./server/data/dev.db`)
- Postgres: `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`

## Schema
- MySQL: `db/schema.sql` (and feature migrations like `db/migrate_schedules.sql`).
- PostgreSQL: `db/schema.pg.sql`.
- SQLite: `db/schema.sqlite.sql`.

Apply appropriately for your dialect, e.g.:

- MySQL: `mysql -u root -p < db/schema.sql && mysql -u root -p < db/migrate_schedules.sql`
- PostgreSQL: `psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -f db/schema.pg.sql`
- SQLite: `sqlite3 server/data/dev.db < db/schema.sqlite.sql`

## Notes
- Upsert/ignore semantics are implemented per-dialect (`ON DUPLICATE KEY UPDATE` / `ON CONFLICT ... DO UPDATE/NOTHING` / `INSERT OR IGNORE`).
- Timestamps: SQLite/Postgres set `updated_at` defaults; updates are handled in app code.
- If DB init fails, the server falls back to an in-memory mock DB for development.

