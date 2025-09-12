# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This is a Face Gate Admin Platform - a minimal face recognition access control system with admin frontend, REST API, and WebSocket gateway for IoT devices.

**Components:**
- **Admin Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend Server**: Node.js Express REST API + WebSocket server (CommonJS)
- **Database**: MySQL for device, person, and record management
- **Docker**: Full development environment orchestration

## Commands

### Quick Start (Docker - Recommended)
```bash
# Start all services (DB, API, WebSocket, Admin UI)
docker compose up -d --build

# Access points:
# - Admin UI: http://localhost:5173
# - REST API: http://localhost:3001
# - WebSocket: ws://localhost:7001
# - MySQL: localhost:3306

# Stop all services
docker compose down
docker compose down -v  # Also removes data volumes
```

### Local Development (Without Docker)
```bash
# Database setup
mysql -u root -p < db/schema.sql

# Backend server
cd server
npm install
npm run dev  # Starts API on :3001 and WebSocket on :7001

# Admin frontend
cd admin
npm install
npm run dev  # Starts on :5173
```

### Build Commands
```bash
# Admin production build
cd admin && npm run build

# Preview production build
cd admin && npm run preview
```

## Architecture

### Database Schema
- **devices**: Device registry with ID, type, status, firmware version
- **persons**: Person registry with ID, name, IC card, access plans
- **records**: Access records with device, person, time, pass/fail status

### Backend Server (`server/`)
- **Entry**: `src/index.js`
- **REST API**: Express server on port 3001
  - `/login` - Admin authentication (password-only)
  - `/devices`, `/persons`, `/records` - CRUD operations
  - JWT-based auth middleware
- **WebSocket**: Device gateway on port 7001
  - Protocol: JSON-RPC style messages
  - Device registration, heartbeat, record uploads
  - Real-time person sync to devices
- **Database**: MySQL connection pool using mysql2

### Admin Frontend (`admin/`)
- **Entry**: `src/main.tsx`
- **Router**: React Router v6 with protected routes
- **Pages**: `src/pages/` - Login, Devices, Persons, Records
- **API Client**: `src/lib/api.ts` - Axios-based API wrapper
- **Auth**: JWT token in localStorage
- **Styling**: TailwindCSS + PostCSS

## Configuration

### Environment Variables
Backend configuration via `.env` file (copy from `server/.env.example`):
```
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=yourpass
DB_NAME=facegate
JWT_SECRET=change_me_secret
ADMIN_PASSWORD=admin123  # Single password for admin login
CORS_ORIGIN=http://localhost:5173
PORT=3001
WS_PORT=7001
```

Admin frontend uses `VITE_API_BASE_URL` (set in docker-compose.yml or .env).

### Production Deployment
- Use Nginx for TLS termination (see `docs/nginx.sample.conf`)
- Secure WebSocket with `wss://` protocol
- Set strong `ADMIN_PASSWORD` and `JWT_SECRET`
- Configure proper CORS origins
- Consider PM2 for process management or deploy to Kubernetes

## Development Patterns

### Code Style
- **Indentation**: 2 spaces
- **JavaScript/TypeScript**: Single quotes, semicolons
- **Server**: CommonJS (`require`/`module.exports`)
- **Admin**: TypeScript with functional React components and hooks
- **Components**: PascalCase filenames in `admin/src/components/`
- **Helpers**: camelCase filenames

### WebSocket Protocol
Messages follow JSON-RPC style:
```json
{
  "method": "register",
  "params": { "deviceId": "DEV001", "prodType": "FR01" },
  "req_id": 1
}
```

Response format:
```json
{
  "method": "register",
  "result": 0,
  "errMsg": "Success",
  "req_id": 1
}
```

### API Authentication
- Login with password only (no username)
- Returns JWT token valid for 7 days
- Include token in Authorization header: `Bearer <token>`

## Testing

No test framework configured yet. When adding tests:
- **Admin**: Use Vitest + React Testing Library
- **Server**: Use Jest for API and WebSocket testing
- Focus on critical paths: authentication, CRUD operations, device communication