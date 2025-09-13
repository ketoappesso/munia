# Appesso (/munia) Integration Plan (Draft)

This repo provides API and pages to be merged into `/munia` (appesso). Below is a minimal integration guide with code snippets.

## Routes & Navigation
- Add a sidebar item "我的后台" shown only if `user.phone === '18874748888'`.
- Add a sidebar item "我的空间" for all authenticated users.

Example (React Router style):

```tsx
// Pseudocode
const isSuper = user?.phone === '18874748888'
<Sidebar>
  {isSuper && <Nav to="/backoffice">我的后台</Nav>}
  <Nav to="/my/space">我的空间</Nav>
</Sidebar>
<Route path="/backoffice" element={<BackofficePage />} />
<Route path="/my/space" element={<MySpacePage />} />
```

## API Base
- Use `VITE_API_BASE_URL` (or equivalent) pointing to this server (default `http://localhost:3001`).
- Send `Authorization: Bearer <token>` and `x-user-phone: <phone>` with requests.

## Pages
- 我的空间：
  - Upload image: `POST /api/images` (multipart, field `file`).
  - Create schedule: `POST /api/schedules` with `{ image_id, start_at, end_at?, targets[], user_phone }`.
  - Load devices: `GET /api/devices`.
- 我的后台（仅超级账号）：
  - List schedules: `GET /api/schedules?all=1`.
  - Delete schedule: `DELETE /api/schedules/:id`.

## Server-side Scheduling
- Background worker scans `schedules` and creates `jobs` for targets within the time window.
- Dispatcher sends WS messages (method `pushDisplayImage`) to online devices and marks jobs as `sent` or `failed`.

## Database
Run migrations in this repo:

```
mysql -u root -p < db/schema.sql
mysql -u root -p < db/migrate_schedules.sql
```

## Next.js Custom Server (Single Process)
- Use `docs/next-custom-server.example.js` as a template for `/munia/server.js`.
- It mounts Facegate API under `/api`, serves uploads, and attaches WS at `/ws` on the same HTTP server.
- Update import paths after merging this repo into `/munia`.

## Notes
- Real auth should provide `user.phone` from your `/munia` login session; remove the temporary `x-user-phone` override once integrated.
- Device-side handler for `pushDisplayImage` should display the provided URL.
