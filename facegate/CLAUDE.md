# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Facegate** is a face recognition access control cloud platform with admin frontend, REST API, and WebSocket gateway for IoT devices. The system manages devices, persons, access records, and supports scheduled content display on connected devices.

## Core Commands

### Development (Docker)
```bash
# Start all services (recommended)
docker compose up -d --build

# Access points:
# - Admin UI: http://localhost:5173
# - REST API: http://localhost:3001
# - WebSocket: ws://localhost:7001

# Stop services
docker compose down
docker compose down -v  # Also removes data volumes
```

### Development (Local)
```bash
# Database setup (choose one)
mysql -u root -p < db/schema.sql          # MySQL
mysql -u root -p < db/migrate_schedules.sql  # Additional migrations
sqlite3 dev.db < db/schema.sqlite.sql     # SQLite
psql -U postgres -f db/schema.pg.sql      # PostgreSQL

# Backend server
cd server
npm install
npm run dev  # Starts API on :3001 and WebSocket on :7001

# Admin frontend
cd admin
npm install
npm run dev  # Starts on :5173

# Build production
cd admin && npm run build
```

### Testing
```bash
# Run Playwright tests (if configured)
npx playwright test
```

## Architecture

### Tech Stack
- **Admin Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js Express (CommonJS) + WebSocket server
- **Database**: MySQL/PostgreSQL/SQLite with multi-dialect support
- **Authentication**: JWT with single password admin login
- **File Storage**: Local uploads directory with Express static serving

### Database Schema
Core tables:
- **devices**: IoT device registry with online status tracking
- **persons**: Person profiles with face data and member info (Pospal integration)
- **records**: Access logs from devices
- **schedules**: Time-based content scheduling with cron support
- **schedule_targets**: Device targeting for schedules
- **jobs**: Job queue for scheduled content delivery
- **images**: Uploaded content for display on devices

### API Structure (`server/src/`)
- **index.js**: Main server entry, Express setup, middleware
- **api/router.js**: REST API endpoints
  - Auth: `/login` (password-only)
  - CRUD: `/devices`, `/persons`, `/records`
  - Scheduling: `/images`, `/schedules`, `/jobs`
  - Device control: `/devices/:id/open`, `/devices/:id/relay`
  - Pospal integration: `/persons/fetch-member`
- **ws/gateway.js**: WebSocket server for device communication
  - Device registration and heartbeat
  - Record uploads from devices
  - Remote commands (door open, relay control)
  - Content push for scheduled displays
- **scheduler.js**: Background job processing
  - Creates jobs from schedules within time windows
  - Dispatches pending jobs to online devices
  - Requeues failed jobs with retry logic
  - Cron expression support
- **lib/db.js**: Multi-dialect database abstraction (MySQL/PostgreSQL/SQLite)
- **lib/pospal.js**: Member system integration

### WebSocket Protocol
JSON-RPC style messaging:
```json
// Request
{
  "method": "registerDevice",
  "params": { "DeviceId": "DEV001", "ProdType": "FR01" },
  "req_id": 1
}

// Response
{
  "method": "registerDevice",
  "result": 0,
  "errMsg": "Success",
  "req_id": 1
}
```

Key methods:
- `registerDevice`: Device initialization
- `heartBeat`: Keep-alive mechanism
- `uploadRecords`: Access log submission
- `pushDisplayImage`: Content display command
- `pushRemoteOpenDoor`: Remote door control
- `pushRelayOut`: Relay control with delay

### Admin Frontend (`admin/src/`)
- **App.tsx**: Main app with router setup
- **pages/**: Login, Devices, Persons, Records, MySpace, Backoffice
- **lib/api.ts**: Axios-based API client with auth handling
- **components/Navbar.tsx**: Navigation with role-based visibility

## Configuration

### Environment Variables
Backend (`.env` or Docker environment):
```bash
# Database (auto-detects dialect)
DB_DIALECT=mysql|postgres|sqlite  # Default: mysql
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=yourpass
DB_NAME=facegate
SQLITE_PATH=./data/dev.db  # For SQLite

# Auth & Security
JWT_SECRET=change_me_secret
ADMIN_PASSWORD=admin123  # Single admin password

# Server
PORT=3001
WS_PORT=7001
CORS_ORIGIN=http://localhost:5173

# Pospal Integration (optional)
POSPAL_API_URL=https://api.pospal.cn
POSPAL_APP_ID=your_app_id
POSPAL_APP_KEY=your_app_key
```

Frontend:
- `VITE_API_BASE_URL`: Backend API URL

## Integration with Munia/Appesso

This project is designed to integrate with the main Munia/Appesso platform:
- Add "我的后台" menu for super admin (phone: 18874748888)
- Add "我的空间" for all authenticated users
- Mount under `/api` path in Next.js custom server
- Share authentication via phone-based user identity

See `docs/munia-integration.md` for detailed integration steps.

## Development Patterns

- **Database Abstraction**: All queries use dialect-agnostic wrapper
- **Error Handling**: Try-catch with logging, graceful fallbacks
- **WebSocket State**: Device connections tracked in memory Map
- **Job Processing**: Interval-based polling with state transitions
- **File Uploads**: Multer middleware with local storage
- **Auth Flow**: JWT in Authorization header, optional x-user-phone override