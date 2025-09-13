// Example Next.js custom server integrating Facegate API + WS
// Place this file at /munia/server.js and run with `node server.js`

const next = require('next');
const express = require('express');
const http = require('http');
const path = require('path');

// Import Facegate modules (adjust path after merging repos)
const { initDBFromEnv } = require('../facegate/server/src/lib/db');
const { createUpload } = require('../facegate/server/src/uploads');
const { createGateway } = require('../facegate/server/src/ws/gateway');
const { startSchedulers } = require('../facegate/server/src/scheduler');
const { createApiRouter } = require('../facegate/server/src/api/router');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

(async () => {
  await app.prepare();
  const db = await initDBFromEnv(process.env);

  const expressApp = express();
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const upload = createUpload();
  const gateway = createGateway({ db, log: console });

  // Mount Facegate API under /api
  expressApp.use('/api', createApiRouter({
    db,
    upload,
    conns: gateway.conns,
    gateway,
    env: { JWT_SECRET: process.env.JWT_SECRET || 'change_me_secret', ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123' },
    log: console,
  }));

  // Let Next handle the rest
  expressApp.all('*', (req, res) => handle(req, res));

  // Create single HTTP server for both Next and WS
  const server = http.createServer(expressApp);
  gateway.attachToServer(server, { path: '/ws' });

  // Start schedulers
  const sched = startSchedulers({ db, conns: gateway.conns, send: gateway.send, log: console });
  sched.start();

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Next+Facegate listening on :${PORT} (WS /ws)`));
})();

