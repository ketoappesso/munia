const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const path = require('path');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const envPort = Number(process.env.PORT);
const defaultPort = 3002;
const port = Number.isFinite(envPort) ? envPort : defaultPort;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Facegate modules (will be created)
let gateway;
let scheduler;

async function initializeFacegate() {
  // These modules will be created in subsequent steps
  try {
    const { FacegateGateway } = require('./src/lib/facegate/ws-gateway');
    const { FacegateScheduler } = require('./src/lib/facegate/scheduler');

    gateway = new FacegateGateway();
    scheduler = new FacegateScheduler(gateway);

    return { gateway, scheduler };
  } catch (err) {
    console.log('Facegate modules not yet created, running in basic mode');
    return { gateway: null, scheduler: null };
  }
}

app.prepare().then(async () => {
  const expressApp = express();
  const server = createServer(expressApp);

  // Parse JSON bodies (exclude Next.js API routes)
  expressApp.use((req, res, next) => {
    // Skip JSON parsing for Next.js API routes
    if (req.url.startsWith('/api/')) {
      return next();
    }
    express.json({ limit: '10mb' })(req, res, next);
  });

  // Serve static files for Facegate images
  const facegateImagesPath = path.join(__dirname, 'facegate-data', 'images');
  expressApp.use('/facegate/images', express.static(facegateImagesPath));

  // Serve static files for Facegate uploads (legacy compatibility)
  const facegateUploadsPath = path.join(__dirname, 'facegate-data', 'uploads');
  expressApp.use('/uploads', express.static(facegateUploadsPath));

  // Initialize Facegate components
  const facegate = await initializeFacegate();

  // Setup WebSocket server for Facegate devices
  if (facegate.gateway) {
    const wss = new WebSocketServer({
      server,
      path: '/ws',
      maxPayload: 32 * 1024 * 1024 // 32MB max payload as per device spec
    });

    wss.on('connection', (ws) => {
      console.log('New WebSocket connection');

      ws.on('message', async (data) => {
        try {
          await facegate.gateway.handleMessage(ws, data.toString());
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        if (ws.deviceId) {
          facegate.gateway.removeConnection(ws.deviceId);
        }
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    });

    // Start scheduler for Facegate jobs
    if (facegate.scheduler) {
      facegate.scheduler.start();
      console.log('Facegate scheduler started');
    }

    console.log('Facegate WebSocket gateway initialized on /ws');
  }

  // Handle all other routes with Next.js
  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  // Helper to start the server with fallback if port is busy
  const tryListen = (p, attemptsLeft) => {
    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        if (Number.isFinite(envPort)) {
          console.error(`Port ${p} is in use and PORT is set. Please free the port or change PORT.`);
          process.exit(1);
        }
        if (attemptsLeft > 0) {
          const nextPort = p + 1;
          console.warn(`Port ${p} in use, trying ${nextPort}...`);
          // Need to remove the error listener before retrying
          setImmediate(() => tryListen(nextPort, attemptsLeft - 1));
        } else {
          console.error('No available ports found after multiple attempts.');
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    server.listen(p, () => {
      console.log(`> Ready on http://${hostname}:${p}`);
      if (facegate.gateway) {
        console.log(`> WebSocket ready on ws://${hostname}:${p}/ws`);
      }
    });
  };

  // Try up to 20 incremental ports if not explicitly set via PORT
  tryListen(port, 20);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      if (facegate.scheduler) {
        facegate.scheduler.stop();
      }
      process.exit(0);
    });
  });
});
