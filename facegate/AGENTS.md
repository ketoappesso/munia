# Repository Guidelines

## Project Structure & Module Organization
- `admin/` — React + Vite (TypeScript). Pages in `admin/src/pages`, shared UI in `admin/src/components`, entry at `admin/src/main.tsx`.
- `server/` — Node.js Express REST API + WebSocket gateway (CommonJS). Entry `server/src/index.js`; sample env at `server/.env.example`.
- `db/` — MySQL schema in `db/schema.sql`.
- `docs/` — Nginx reverse proxy/TLS sample at `docs/nginx.sample.conf`.
- `docker-compose.yml` — Orchestrates MySQL, API, WS, and Admin for local dev.

## Build, Test, and Development Commands
- Docker (recommended): `docker compose up -d --build` — builds and starts DB `:3306`, API `:3001`, WS `:7001`, Admin `:5173`.
- Stop stack: `docker compose down -v` — stops and removes volumes.
- Local (no Docker):
  - DB: `mysql -u root -p < db/schema.sql`.
  - API: `cd server && npm i && npm run dev`.
  - Admin: `cd admin && npm i && npm run dev`.
- Tests: Not configured yet. If added, run `npm test` within `admin/` or `server/`.

## Coding Style & Naming Conventions
- Indentation 2 spaces; use semicolons; single quotes in JS/TS.
- Server: CommonJS (`require`), code under `server/src`; helper files `lowerCamelCase.js`.
- Admin: TypeScript + React; components `PascalCase.tsx` in `admin/src/components`; route pages in `admin/src/pages`; prefer functional components and hooks.
- Lint/format: not configured. Keep diffs minimal and consistent. Adding Prettier/ESLint in a focused PR is welcome.

## Testing Guidelines
- Frameworks (when added):
  - Admin: Vitest + React Testing Library; name tests `*.test.tsx`.
  - Server: Jest; name tests `*.test.js`.
- Scope: cover API routes, WS handlers, and critical UI flows. Keep tests fast and isolated.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat|fix|chore|docs|refactor(scope): message`.
  - Example: `feat(server): add relay control endpoint`.
- PRs should include:
  - Clear summary and scope (`admin`/`server`/`db`).
  - Screenshots/GIFs for UI changes.
  - Call out schema/API changes and migration steps.
  - Update `README.md`/docs when behavior or setup changes.

## Security & Configuration Tips
- Do not commit secrets. Copy `server/.env.example` to `.env` and set `JWT_SECRET`, `ADMIN_PASSWORD`, `DB_*`, and `CORS_ORIGIN`.
- Admin uses `VITE_API_BASE_URL` (see `docker-compose.yml`).
- For production, terminate TLS at Nginx and serve devices via `wss://` (see `docs/nginx.sample.conf`).

