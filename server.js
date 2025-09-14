const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const envPort = Number(process.env.PORT);
const defaultPort = 3002;
const port = Number.isFinite(envPort) ? envPort : defaultPort;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);

  // Parse JSON bodies only for specific non-API routes that need it
  // This prevents conflicts with Next.js API route handling
  expressApp.use((req, res, next) => {
    // Skip JSON parsing for all Next.js routes (API and pages)
    if (req.url.startsWith('/api/') ||
        req.url.startsWith('/_next/') ||
        req.url.startsWith('/facegate/') ||
        req.url.startsWith('/uploads/') ||
        req.method === 'GET') {
      return next();
    }

    // Only parse JSON for specific POST/PUT requests if needed
    // Currently no Express-handled routes need JSON parsing
    // If needed in future, add specific route checks here
    next();
  });

  // Note: Facegate WebSocket service has been moved to a separate microservice
  // Run the WebSocket server separately on port 3003:
  // cd ws-server && npm start

  // Serve static files for Facegate images (still served by main app for now)
  const facegateImagesPath = path.join(__dirname, 'facegate-data', 'images');
  expressApp.use('/facegate/images', express.static(facegateImagesPath));

  // Serve static files for Facegate uploads (legacy compatibility)
  const facegateUploadsPath = path.join(__dirname, 'facegate-data', 'uploads');
  expressApp.use('/uploads', express.static(facegateUploadsPath));

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
      console.log(`> Note: WebSocket service runs separately on port 3003`);
    });
  };

  // Try up to 20 incremental ports if not explicitly set via PORT
  tryListen(port, 20);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
