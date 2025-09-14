const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import Facegate modules
const { FacegateGateway } = require('./lib/ws-gateway');
const { FacegateScheduler } = require('./lib/scheduler');

// Configuration
const PORT = process.env.WS_PORT || 3003;
const HOST = process.env.WS_HOST || 'localhost';
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// Create Express app for health checks and static files
const app = express();
const server = http.createServer(app);

// Enable CORS for REST endpoints
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wss ? wss.clients.size : 0
  });
});

// Serve static files for Facegate images
const facegateImagesPath = path.join(__dirname, '../../facegate-data/images');
const facegateUploadsPath = path.join(__dirname, '../../facegate-data/uploads');

app.use('/facegate/images', express.static(facegateImagesPath));
app.use('/uploads', express.static(facegateUploadsPath));

// Initialize Facegate components
let gateway;
let scheduler;
let wss;

async function initializeFacegate() {
  try {
    gateway = new FacegateGateway();
    scheduler = new FacegateScheduler(gateway);

    console.log('[WS-Server] Facegate modules initialized');
    return { gateway, scheduler };
  } catch (err) {
    console.error('[WS-Server] Failed to initialize Facegate modules:', err);
    return { gateway: null, scheduler: null };
  }
}

async function startServer() {
  // Initialize Facegate
  const facegate = await initializeFacegate();

  if (!facegate.gateway) {
    console.error('[WS-Server] Cannot start without Facegate gateway');
    process.exit(1);
  }

  // Create WebSocket server
  wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 32 * 1024 * 1024, // 32MB max payload
    perMessageDeflate: false,
    clientTracking: true,
    verifyClient: (info) => {
      // Add authentication/security checks here if needed
      const origin = info.origin || info.req.headers.origin;

      // In development, allow all connections
      if (process.env.NODE_ENV === 'development') {
        return true;
      }

      // In production, check origin
      if (origin && origin.startsWith(CORS_ORIGIN)) {
        return true;
      }

      console.log(`[WS-Server] Rejected connection from origin: ${origin}`);
      return false;
    }
  });

  // WebSocket connection handler
  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    console.log(`[WS-Server] New connection from ${clientIp} (ID: ${clientId})`);

    // Store client ID for tracking
    ws.clientId = clientId;

    // Handle messages
    ws.on('message', async (data) => {
      try {
        await facegate.gateway.handleMessage(ws, data.toString());
      } catch (err) {
        console.error(`[WS-Server] Error handling message from ${clientId}:`, err);

        // Send error response
        try {
          ws.send(JSON.stringify({
            error: 'Failed to process message',
            timestamp: new Date().toISOString()
          }));
        } catch (sendErr) {
          console.error(`[WS-Server] Failed to send error to ${clientId}:`, sendErr);
        }
      }
    });

    // Handle close
    ws.on('close', (code, reason) => {
      console.log(`[WS-Server] Connection closed ${clientId}: code=${code}, reason=${reason}`);

      if (ws.deviceId) {
        facegate.gateway.removeConnection(ws.deviceId);
      }
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error(`[WS-Server] Connection error ${clientId}:`, err);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: new Date().toISOString()
    }));
  });

  // Start scheduler
  if (facegate.scheduler) {
    facegate.scheduler.start();
    console.log('[WS-Server] Scheduler started');
  }

  // Start HTTP server
  server.listen(PORT, HOST, () => {
    console.log(`[WS-Server] Server running at http://${HOST}:${PORT}`);
    console.log(`[WS-Server] WebSocket endpoint: ws://${HOST}:${PORT}/ws`);
    console.log(`[WS-Server] Health check: http://${HOST}:${PORT}/health`);
    console.log(`[WS-Server] Static files: http://${HOST}:${PORT}/facegate/images`);
  });

  // Graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function shutdown() {
  console.log('[WS-Server] Shutting down...');

  // Stop scheduler
  if (scheduler) {
    scheduler.stop();
  }

  // Close all WebSocket connections
  if (wss) {
    wss.clients.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });
  }

  // Close HTTP server
  server.close(() => {
    console.log('[WS-Server] Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[WS-Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start the server
startServer().catch(err => {
  console.error('[WS-Server] Failed to start:', err);
  process.exit(1);
});