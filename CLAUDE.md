# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Munia** is a responsive and accessible full-stack social media web app built with **Next.js 14**, **TypeScript**, and **PostgreSQL**. This is a production-ready social platform featuring posts, comments, likes, follows, and media uploads with drag-and-drop functionality.

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
```

### Utilities
```bash
# Generate SVG icons as React components
npm run svgr

# Production deployment with PM2
npm run pm2  # runs on port 3002

# E2E Testing with Playwright
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:debug    # Run in debug mode
npm run test:e2e:headed   # Run in headed mode

# Playwright MCP Server
npx @playwright/mcp --port 3003  # Start MCP server for Claude integration
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, framer-motion for animations
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with OAuth providers
- **State Management**: @tanstack/react-query for client-side state
- **File Storage**: AWS S3 for media uploads
- **Forms**: React Hook Form + Zod validation
- **Accessibility**: React Aria for accessible components
- **Drag & Drop**: @dnd-kit for media sorting

### Key Directories

**App Structure (App Router):**
- `/src/app/` - Main application with route grouping
  - `/(auth)/` - Login/register pages
  - `/(protected)/` - Protected routes requiring auth
  - `/(unprotected)/` - Public routes
  - `/(setup)/` - Profile setup flows
  - `/api/` - API routes for all CRUD operations

**Business Logic:**
- `/src/components/` - Reusable React components
- `/src/hooks/` - Custom React hooks (mutations/queries)
- `/src/lib/` - Business logic, utilities, external integrations
- `/src/contexts/` - React context providers
- `/src/types/` - TypeScript type definitions

**External Integrations:**
- `/lib/s3/` - AWS S3 file operations (upload/delete)
- `/lib/ses/` - AWS SES email configuration
- `/lib/prisma/` - Database queries and validation

### Core Data Model

**Entities:**
- **User**: Profile, photos, relationships
- **Post**: Content with media attachments
- **Comment**: Nested comments/replies with self-referential relationship
- **VisualMedia**: S3-managed photos/videos with drag-drop ordering
- **Follow**: Bidirectional follow relationships
- **Activity**: Notifications and activity feed

**Key Relationships:**
- Posts ↔ Users (one-to-many)
- Comments ↔ Posts (hierarchical with parent/child)
- Follows Users ↔ Users (many-to-many)
- Likes for posts/comments (many-to-many)
- Media ↔ Posts (many-to-one)

### API Routes

**RESTful endpoints organized by resource:**
- `/api/posts/` - Post CRUD with pagination
- `/api/users/` - User profiles and relationships
- `/api/comments/` - Comment tree with replies
- `/api/notifications/` - Activity feed with read states
- `/api/auth/` - NextAuth.js session management

## Development Environment

### Required Setup
1. **Environment variables** (copy from `.env.local.example`):
   - `DATABASE_URL`: PostgreSQL connection string
   - AWS S3 bucket credentials
   - OAuth provider secrets (GitHub, Google, Facebook)
   - `NEXTAUTH_SECRET` for session encryption

2. **Database**: PostgreSQL instance with Prisma generated client
3. **File storage**: AWS S3 configured with CORS for uploads

### Configuration Files
- **Database schema**: `/prisma/schema.prisma` (comprehensive social model)
- **Next.js config**: `/next.config.js` (image domains, experimental features)
- **Tailwind config**: `/tailwind.config.js` (custom color palette)
- **Prisma client**: `/lib/prisma/prisma.ts` (single reusable instance)

### Development Patterns

**Data Fetching:**
- **Client-side**: @tanstack/react-query for optimistic updates
- **Server-side**: Prisma queries with TypeScript validation
- **Real-time**: Zod validation for all API inputs

**Authentication:**
- NextAuth.js adapters for OAuth providers
- Session-based authentication with server-side verification
- Protected API routes with role-based access

**Media Handling:**
- AWS S3 resumable uploads with drag-drop reordering
- Image optimization via Next.js Image component
- Responsive media galleries with swiper.js

**Performance:**
- Infinite scroll with bidirectional pagination
- Optimistic mutations for immediate UI feedback
- File size validation before upload
- Image compression via AWS S3

### Testing & Deployment
**E2E Testing:**
- Playwright for end-to-end testing
- Tests located in `/tests/` directory
- Supports UI mode for test development

**Production deployment (EC2/PM2):**
1. `npm run prisma:deploy` - Apply migrations
2. `npm run prisma:seed` - Create sample data
3. `npm run pm2` - Production server (port 3002)

**Monitoring:**
- All API routes include validation schemas
- Server-side error handling with user-friendly messages
- Client-side error boundaries and error states