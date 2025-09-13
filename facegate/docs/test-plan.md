# Test Plan: Backoffice and My Space Integration

Scope
- Verify new scheduling, image upload, jobs dispatch, and visibility rules.
- Ensure no regressions for existing devices/records/persons APIs and Admin UI.

Environments
- With Docker: `docker compose up -d --build`.
- Local: start MySQL, then `mysql < db/schema.sql && mysql < db/migrate_schedules.sql`; run `server` and `admin` dev servers.

Smoke Checklist
- Server boots, exposes `:3001`; WS gateway on `:7001`.
- Admin boots on `:5173`; login works with `ADMIN_PASSWORD`.
- Sidebar shows "我的后台" only for phone `18874748888`.

Functional Tests
- Image upload
  - POST `/api/images` with multipart field `file`, header `x-user-phone: 13800138000` → returns `{id,url}`.
- Create schedule
  - POST `/api/schedules` with `{ image_id, start_at, end_at?, targets: ["device1"], user_phone }` → returns `{id}`.
  - GET `/api/schedules` with same header → includes created item; `?all=1` shows all.
- Jobs lifecycle (with a connected device)
  - Device connects via WS and registers `registerDevice`.
  - Within time window, a `job` is created (GET `/api/jobs?device_id=device1`).
  - Dispatcher sends `pushDisplayImage` to device; job transitions `pending → sent`.
  - On device offline, job remains pending and retries later; failures re-queued (max 3).
- Cron schedules
  - Create schedule with `cron: "*/1 * * * *"` and a short window; confirm a new job appears roughly each minute.

Regression Tests
- Devices: `GET /api/devices` list, open/relay endpoints still work.
- Persons: list/add/update/delete unchanged; file uploads still saved under `/uploads`.
- Records: `GET /api/records` filters and pagination still return without error.

Manual UI Paths
- 我的空间：上传图片 → 选择时间段/设备 → 创建计划 → 验证 schedule 列表与 jobs API。
- 我的后台：查看/删除计划，验证权限（非超级账号不可见）。

Notes
- In dev, Admin auto-sends `x-user-phone` from localStorage. Replace with real auth in /munia.

