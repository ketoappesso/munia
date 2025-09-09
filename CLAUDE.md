# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Appesso** (formerly Munia) is a responsive full-stack social media web app built with **Next.js 14**, **TypeScript**, and **SQLite** (development) / **PostgreSQL** (production). Features include posts, comments, likes, follows, media uploads with drag-and-drop, and integrated Text-to-Speech functionality with Volcengine TTS API.

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
npx playwright test tests/voice-synthesis.spec.ts

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
- **Styling**: Tailwind CSS, framer-motion
- **Database**: SQLite (dev) / PostgreSQL (prod) with Prisma ORM
- **Authentication**: NextAuth.js v5 with phone/password authentication (OAuth removed from UI)
- **State Management**: @tanstack/react-query for client-side state
- **File Storage**: AWS S3 for media uploads
- **TTS**: Volcengine TTS API with browser fallback
- **Forms**: React Hook Form + Zod validation
- **Accessibility**: React Aria for accessible components
- **Drag & Drop**: @dnd-kit for media sorting
- **Testing**: Playwright for E2E tests

### Key Directories

**App Structure (App Router):**
- `/src/app/` - Main application with route grouping
  - `/(auth)/` - Login/register pages (phone/password only)
  - `/(protected)/` - Protected routes requiring authentication
  - `/(unprotected)/` - Public routes (home, terms, privacy)
  - `/(setup)/` - Profile setup and edit flows
  - `/api/` - API routes organized by resource type
  - `/api/tts/` - Text-to-Speech API endpoints

**Business Logic:**
- `/src/components/` - React components including PunkButton, AudioPlayer
- `/src/hooks/` - Custom hooks including useVolcengineTTS, useTTS
- `/src/lib/` - Business logic, utilities, external integrations
- `/src/lib/volcengine/` - TTS client and voice mapping
- `/src/contexts/` - React contexts including PunkContext, TTSContext
- `/src/types/` - TypeScript type definitions

**External Integrations:**
- `/lib/s3/` - AWS S3 file operations (upload/delete, presigned URLs)
- `/lib/ses/` - AWS SES email configuration
- `/lib/prisma/` - Database queries, validation, and search utilities

### Core Data Model

**Entities:**
- **User**: Profile with `punked` boolean field, `ttsVoiceId` for custom voices
- **Post**: Content with media attachments, TTS support
- **Comment**: Nested comments with self-referential relationship
- **VisualMedia**: S3-managed photos/videos
- **Follow**: Bidirectional follow relationships
- **Activity**: Unified notifications and activity feed

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

**Current Method:**
- Phone number/password authentication only
- OAuth providers (GitHub, Google, Facebook) removed from UI
- Session-based authentication with JWT

**Security Features:**
- Protected API routes with server-side verification
- Role-based access control
- Input validation with Zod schemas
- CSRF protection via NextAuth.js

## Development Environment

### Required Setup
1. **Environment variables**:
   - `DATABASE_URL`: SQLite/PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Session encryption secret
   - `NEXTAUTH_URL`: Base URL for authentication callbacks
   - `AWS_ACCESS_KEY_ID`: S3 access key
   - `AWS_SECRET_ACCESS_KEY`: S3 secret key
   - `AWS_BUCKET_NAME`: S3 bucket name
   - `AWS_REGION`: AWS region

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

## TTS (Text-to-Speech) System

### Architecture
- Volcengine TTS API integration with custom and standard voices
- Browser Speech Synthesis API as fallback
- Audio cleanup and error handling for smooth playback

### Key Components
- `/src/app/api/tts/synthesize/route.ts` - TTS synthesis endpoint
- `/src/hooks/useVolcengineTTS.ts` - Main TTS hook with fallback logic
- `/src/hooks/useTTS.ts` - Browser TTS fallback
- `/src/lib/volcengine/tts-client.ts` - Volcengine API client

### Voice System
- Standard voices: BV001-BV005 (Chinese voices)
- Custom voices: S_xxxx format (user-specific trained voices)
- Automatic fallback: Custom → Standard → Browser TTS

## Punked Member Feature

Special status for members with custom voices:
- Visual "PUNK" badge on profiles
- PunkButton component for voice override
- Global punk state via PunkContext
- Database field: `User.punked` boolean

## Known Issues & Solutions

### TTS Playback Issues
- Audio interruption errors handled with automatic cleanup
- Custom voice failures fallback to standard voices then browser TTS
- Multiple play requests are queued properly

### Development Server
- Runs on port 3002 to avoid conflicts
- Multiple dev server instances may accumulate (check with `lsof -i :3002`)