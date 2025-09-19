# Voice Assistant Integration Guide

## Overview

This document describes the integration of the xiaozhijava voice assistant service into the Appesso social media platform. The integration provides real-time voice interaction capabilities with support for multiple voice roles, device management, and voice cloning.

## Architecture

### Components

1. **Backend Service (xiaozhijava)**
   - Java Spring Boot 3.3 application running on port 8091
   - MySQL database for data persistence
   - Redis for caching and session management
   - WebSocket for real-time audio streaming

2. **Frontend Integration**
   - React components with TypeScript
   - WebSocket client for audio streaming
   - API gateway for device and role management
   - Voice assistant UI with animations

3. **Infrastructure**
   - Nginx reverse proxy for secure WebSocket connections
   - systemd service management
   - Prisma ORM for database integration

## Service Endpoints

### API Endpoints

- `GET /api/voice/devices` - List user devices
- `POST /api/voice/devices` - Create new device
- `DELETE /api/voice/devices/:id` - Delete device
- `GET /api/voice/roles` - List available voice roles
- `POST /api/voice/roles` - Create custom role
- `GET /api/voice/sessions` - List voice sessions
- `POST /api/voice/sessions` - Start new session
- `PUT /api/voice/sessions/:id` - End session
- `POST /api/voice/messages` - Create voice message

### WebSocket Endpoint

- `wss://xyuan.chat/voice-ws/` - Real-time voice communication

## Database Schema

```prisma
model VoiceDevice {
  id          String   @id
  name        String
  userId      String
  type        String   // 'esp32', 'web', 'mobile'
  model       String?
  status      String   @default("offline")
  lastLogin   DateTime?
}

model VoiceRole {
  id          String   @id
  name        String
  description String?
  userId      String?
  isSystem    Boolean  @default(false)
  config      Json?
}

model VoiceSession {
  id          String   @id
  deviceId    String
  userId      String
  roleId      String?
  startTime   DateTime @default(now())
  endTime     DateTime?
}

model VoiceMessage {
  id          String   @id
  sessionId   String
  content     String
  role        String   // 'user', 'assistant', 'system'
  type        String   // 'text', 'audio'
  audioUrl    String?
  createdAt   DateTime @default(now())
}
```

## Configuration

### Environment Variables

```bash
# Voice Assistant Service
XIAOZHI_SERVICE_URL=http://localhost:8091
NEXT_PUBLIC_VOICE_WS_URL=ws://localhost:8091

# Production
XIAOZHI_SERVICE_URL=https://xyuan.chat/voice-api
NEXT_PUBLIC_VOICE_WS_URL=wss://xyuan.chat/voice-ws
```

### Nginx Configuration

```nginx
# Voice API proxy
location /voice-api/ {
    proxy_pass http://localhost:8091/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# WebSocket proxy
location /voice-ws/ {
    proxy_pass http://localhost:8091/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Usage

### Starting Voice Assistant

1. Navigate to `/voice-assistant` page
2. Click "开始体验" (Start Experience) button
3. Grant microphone permissions when prompted
4. Select voice role (optional)
5. Click microphone button to start recording
6. Speak your message
7. Click microphone again to stop and send

### WebSocket Protocol

#### Connection Flow
1. Establish WebSocket connection
2. Send device registration
3. Receive session ID
4. Select voice role (optional)
5. Start audio streaming

#### Message Types

**Client to Server:**
```javascript
// Device registration
{
  type: 'register_device',
  deviceId: 'unique-device-id',
  deviceType: 'web',
  capabilities: ['audio_input', 'audio_output']
}

// Voice role selection
{
  type: 'select_role',
  roleId: 'assistant',
  roleName: 'AI Assistant'
}

// Audio metadata
{
  type: 'audio_start',
  format: 'opus',
  sampleRate: 16000,
  channels: 1
}

// Audio data (binary)
// Send as ArrayBuffer

// Text message
{
  type: 'text_message',
  content: 'Hello, how are you?'
}

// End session
{
  type: 'end_session',
  reason: 'user_initiated'
}
```

**Server to Client:**
```javascript
// Registration confirmation
{
  type: 'device_registered',
  deviceId: 'unique-device-id',
  sessionId: 'session-uuid'
}

// Role confirmation
{
  type: 'role_selected',
  roleId: 'assistant',
  roleName: 'AI Assistant'
}

// AI response
{
  type: 'ai_response',
  content: 'Hello! I am doing well.',
  audioUrl: 'https://...',
  messageId: 'msg-uuid'
}

// Audio data (binary)
// Received as ArrayBuffer

// Error
{
  type: 'error',
  error: 'Error message',
  code: 'ERROR_CODE'
}
```

## Testing

### Run E2E Tests

```bash
# All voice assistant tests
npm run test:e2e tests/voice-assistant.spec.ts

# API tests only
npm run test:e2e tests/voice-api.spec.ts

# WebSocket tests
npm run test:e2e tests/voice-websocket.spec.ts

# Run with UI
npm run test:e2e:ui tests/voice-assistant.spec.ts
```

### Verification Script

```bash
# Run verification
./scripts/verify-voice-integration.sh
```

## Troubleshooting

### Service Issues

```bash
# Check xiaozhi service status
sudo systemctl status xiaozhi

# View service logs
sudo journalctl -u xiaozhi -f

# Restart service
sudo systemctl restart xiaozhi
```

### Database Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Access database
mysql -u xiaozhi -p xiaozhi

# View tables
SHOW TABLES;
```

### WebSocket Connection Issues

1. Check browser console for errors
2. Verify WebSocket URL in environment variables
3. Check Nginx proxy configuration
4. Ensure SSL certificates are valid
5. Check firewall rules for WebSocket ports

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Backend service not running | Restart xiaozhi service |
| WebSocket connection failed | Wrong URL or proxy issue | Check Nginx config and URLs |
| Device registration failed | Database connection issue | Check MySQL status |
| Audio not working | Microphone permissions | Grant browser permissions |
| Role selection not working | Redis not running | Start Redis service |

## Deployment

### Production Deployment Steps

1. **Backend Service**
   ```bash
   # Build Java application
   cd /var/www/xiaozhijava
   mvn clean package

   # Restart service
   sudo systemctl restart xiaozhi
   ```

2. **Frontend Updates**
   ```bash
   # Build Next.js application
   npm run build

   # Restart PM2
   npm run pm2
   ```

3. **Database Migrations**
   ```bash
   # Run Prisma migrations
   npx prisma migrate deploy
   ```

### Monitoring

- Service health: `https://xyuan.chat/api/voice/gateway/status`
- WebSocket status: Check browser DevTools Network tab
- Backend logs: `sudo journalctl -u xiaozhi -f`
- Frontend logs: `pm2 logs`

## Security Considerations

1. **Authentication**: All API endpoints require valid session
2. **WebSocket**: Secured with WSS protocol in production
3. **Device Management**: Users can only access their own devices
4. **Rate Limiting**: Implemented on API endpoints
5. **Audio Privacy**: Audio streams are not stored by default
6. **CORS**: Configured for production domain only

## Future Enhancements

- [ ] Voice cloning with custom training
- [ ] Multi-language support
- [ ] Offline mode with local processing
- [ ] Voice commands for app navigation
- [ ] Integration with smart home devices
- [ ] Voice-to-voice conversations
- [ ] Custom wake words
- [ ] Voice analytics dashboard