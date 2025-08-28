# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Munia** is a responsive and accessible full-stack social media web app built with **Next.js 14**, **TypeScript**, and **SQLite** (development) / **PostgreSQL** (production). This is a production-ready social platform featuring posts, comments, likes, follows, and media uploads with drag-and-drop functionality.

## Core Commands

### Development
```bash
# Start development server (runs on port 3002)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Database
```bash
# Run all migrations (development)
npx prisma migrate dev

# Deploy migrations (production)
npm run prisma:deploy

# Reset database with seed data
npm run prisma:seed

# View database UI
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Testing
```bash
# E2E Testing with Playwright
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:debug    # Run in debug mode
npm run test:e2e:headed   # Run in headed mode

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run tests with specific browser
npx playwright test --project=chromium

# Run tests matching pattern
npx playwright test --grep "login"
```

### Utilities
```bash
# Generate SVG icons as React components
npm run svgr

# Production deployment with PM2
npm run pm2  # runs on port 3002

# Playwright MCP Server
npx @playwright/mcp --port 3003  # Start MCP server for Claude integration

# Create test users
node ./scripts/setup-test-users.mjs

# Run headless tests
./scripts/run-headless-tests.sh
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, framer-motion for animations
- **Database**: SQLite (dev) / PostgreSQL (prod) with Prisma ORM
- **Authentication**: NextAuth.js v5 with OAuth providers + phone/password
- **State Management**: @tanstack/react-query for client-side state
- **File Storage**: AWS S3 for media uploads
- **Forms**: React Hook Form + Zod validation
- **Accessibility**: React Aria for accessible components
- **Drag & Drop**: @dnd-kit for media sorting
- **Testing**: Playwright for E2E tests

### Key Directories

**App Structure (App Router):**
- `/src/app/` - Main application with route grouping
  - `/(auth)/` - Login/register pages (email, OAuth, phone)
  - `/(protected)/` - Protected routes requiring authentication
  - `/(unprotected)/` - Public routes (home, terms, privacy)
  - `/(setup)/` - Profile setup and edit flows
  - `/api/` - API routes organized by resource type

**Business Logic:**
- `/src/components/` - Reusable React components (UI, post, comment, etc.)
- `/src/hooks/` - Custom React hooks (mutations/queries, form handling)
- `/src/lib/` - Business logic, utilities, external integrations
- `/src/contexts/` - React context providers (theme, modals, toasts)
- `/src/types/` - TypeScript type definitions

**External Integrations:**
- `/lib/s3/` - AWS S3 file operations (upload/delete, presigned URLs)
- `/lib/ses/` - AWS SES email configuration
- `/lib/prisma/` - Database queries, validation, and search utilities

### Core Data Model

**Entities:**
- **User**: Profile with photos, relationships, authentication methods
- **Post**: Content with media attachments, hashtags, mentions
- **Comment**: Nested comments/replies with self-referential relationship
- **VisualMedia**: S3-managed photos/videos with drag-drop ordering
- **Follow**: Bidirectional follow relationships with unique constraints
- **Activity**: Unified notifications and activity feed system

**Key Relationships:**
- Posts ↔ Users (one-to-many with cascade delete)
- Comments ↔ Posts (hierarchical with parent/child replies)
- Follows Users ↔ Users (many-to-many with unique constraints)
- Likes for posts/comments (many-to-many with unique constraints)
- Media ↔ Posts (many-to-one with cascade delete)

### API Routes Structure

**RESTful endpoints organized by resource:**
- `/api/posts/` - Post CRUD with pagination, hashtag filtering
- `/api/users/` - User profiles, relationships, activity feeds
- `/api/comments/` - Comment tree with replies, nested structures
- `/api/notifications/` - Activity feed with read/unread states
- `/api/auth/` - NextAuth.js session management with custom providers
- `/api/conversations/` - Real-time messaging functionality

### Authentication System

**Supported Methods:**
- OAuth 2.0 (GitHub, Google, Facebook)
- Email/password with verification
- Phone number/password authentication
- Session-based authentication with JWT

**Security Features:**
- Protected API routes with server-side verification
- Role-based access control
- Input validation with Zod schemas
- CSRF protection via NextAuth.js

## Development Environment

### Required Setup
1. **Environment variables** (copy from `.env.local.example`):
   - `DATABASE_URL`: SQLite/PostgreSQL connection string
   - AWS S3 bucket credentials (access key, secret, bucket name)
   - OAuth provider secrets (GitHub, Google, Facebook client IDs/secrets)
   - `NEXTAUTH_SECRET`: Session encryption secret
   - `NEXTAUTH_URL`: Base URL for authentication callbacks

2. **Database**: SQLite for development, PostgreSQL for production
3. **File storage**: AWS S3 configured with CORS for direct uploads

### Configuration Files
- **Database schema**: `/prisma/schema.prisma` - Comprehensive social model with relationships
- **Next.js config**: `/next.config.js` - Image domains, experimental features, redirects
- **Tailwind config**: `/tailwind.config.js` - Custom color palette, design system
- **Prisma client**: `/lib/prisma/prisma.ts` - Single reusable instance with error handling
- **Playwright config**: `/playwright.config.ts` - E2E test configuration with multiple browsers

### Development Patterns

**Data Fetching Strategy:**
- **Client-side**: @tanstack/react-query for optimistic updates, caching, and real-time UI
- **Server-side**: Prisma queries with TypeScript validation and error handling
- **Real-time**: WebSocket connections for messaging features
- **Validation**: Zod schemas for all API inputs with detailed error messages

**Authentication Flow:**
- NextAuth.js adapters for multiple OAuth providers
- Custom phone/password authentication implementation
- Session management with secure cookies
- Protected route middleware with redirect handling

**Media Handling:**
- AWS S3 multipart uploads with progress tracking
- Drag-drop reordering with @dnd-kit library
- Image optimization via Next.js Image component with responsive sizes
- File type validation and size limits before upload

**Performance Optimizations:**
- Infinite scroll with bidirectional pagination (forward/backward)
- Optimistic mutations for immediate UI feedback
- Component lazy loading and code splitting
- Image compression and responsive formats via AWS S3

### Testing Infrastructure

**E2E Testing with Playwright:**
- Comprehensive test suite covering authentication, posts, comments, follows
- Multi-browser testing (Chromium, Firefox, WebKit)
- Test data setup scripts with mock user creation
- Visual regression testing capabilities
- MCP server integration for Claude testing support

**Test Categories:**
- Authentication flows (login, registration, OAuth)
- Post creation and interaction (likes, comments)
- User relationships (following, followers)
- Messaging and real-time features
- Accessibility and responsive design

### Production Deployment

**EC2/PM2 Deployment:**
1. `npm run prisma:deploy` - Apply production migrations
2. `npm run prisma:seed` - Create initial sample data (optional)
3. `npm run build` - Build optimized production bundle
4. `npm run pm2` - Start production server with process management

**Environment Requirements:**
- Node.js 18+ runtime environment
- PostgreSQL database instance
- AWS S3 bucket with proper CORS configuration
- SSL certificate for HTTPS in production
- Environment variables for all secrets and configuration

### Monitoring and Error Handling

**Server-side:**
- All API routes include comprehensive validation schemas
- Structured error responses with user-friendly messages
- Prisma query optimization and connection pooling
- AWS S3 upload error handling and retry logic

**Client-side:**
- React Error Boundaries for graceful error handling
- Loading states and skeleton screens for better UX
- Toast notifications for user actions and errors
- Offline detection and recovery mechanisms