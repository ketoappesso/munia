# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS backend server for the Appesso application, featuring authentication, chat functionality, messaging, timeline features, and integration with Tencent Cloud services.

## Architecture

**Framework**: NestJS with TypeScript
**Database**: MongoDB with Mongoose ODM
**Authentication**: JWT with Passport.js
**File Storage**: Tencent Cloud COS (via STS temporary credentials)
**Scheduling**: NestJS Schedule module for cron jobs

### Core Modules
- **AppModule**: Root module with MongoDB connection and global configuration
- **ServerModule**: Main feature module containing all business logic
- **Authentication**: JWT-based auth with passport strategies
- **Chat/Message**: Real-time communication features
- **Timeline**: Social media-style timeline functionality
- **Red Envelope**: Digital red envelope (hongbao) feature
- **STS**: Tencent Cloud COS temporary credential service

## Commands

### Installation & Setup
```bash
# Install dependencies
npm install
# or with yarn
yarn install
```

### Development
```bash
# Start development server with hot reload
npm run start:dev

# Start production server
npm run start:prod

# Build the application
npm run build
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Debug tests
npm run test:debug
```

### Code Quality
```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint
```

## Configuration

The application uses a custom configuration system imported from `../../config` (external to this repository). Key configuration values include:
- `JWT_SECRET`: Secret for JWT token signing
- `COS_SECRET_ID`: Tencent Cloud COS secret ID
- `COS_SECRET_KEY`: Tencent Cloud COS secret key
- MongoDB connection strings

## Database Schema

Key MongoDB collections:
- **User**: User accounts and profiles
- **Chat**: Chat sessions and metadata
- **Message**: Individual chat messages
- **RedEnvelope**: Digital red envelope transactions
- **SmsCode**: SMS verification codes
- **TimelineTweet**: Timeline posts and content

## Key Dependencies

- **@nestjs/common**: Core NestJS framework
- **@nestjs/mongoose**: MongoDB integration
- **@nestjs/jwt**: JWT authentication
- **@nestjs/passport**: Authentication strategies
- **@nestjs/schedule**: Task scheduling
- **mongoose**: MongoDB ODM
- **qcloud-cos-sts**: Tencent Cloud COS STS SDK
- **passport-jwt**: JWT strategy for Passport

## Development Patterns

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Schemas**: Define MongoDB document structures
- **Interfaces**: TypeScript type definitions
- **Strategies**: Authentication strategies (JWT)

## File Structure

```
src/
├── app.module.ts          # Root application module
├── app.controller.ts      # Root controller
├── app.service.ts         # Root service
├── sts/                   # Tencent Cloud STS service
│   ├── sts.controller.ts
│   ├── sts.service.ts
│   └── sts.interface.ts
└── server/                # Main feature module
    ├── server.module.ts   # Server feature module
    ├── auth/              # Authentication
    ├── user/              # User management
    ├── chat/              # Chat functionality
    ├── message/           # Message handling
    ├── timeline/          # Timeline features
    ├── red-envelope/      # Red envelope feature
    ├── paspal/            # Payment integration
    ├── wxsdk/             # WeChat SDK integration
    └── task/              # Scheduled tasks
```

## Testing Structure

- **Unit Tests**: `*.spec.ts` files alongside source files
- **E2E Tests**: `test/` directory with `*.e2e-spec.ts` files
- **Test Configuration**: Jest configuration in `package.json`

## Deployment

The application includes a `start.sh` script for production deployment. Ensure environment variables are properly configured for production use.