const express = require('express');
const cors = require('cors');
const path = require('path');
const pino = require('pino');
const { initDBFromEnv } = require('./lib/db');
const { createUpload } = require('./uploads');
const { createGateway } = require('./ws/gateway');
const { startSchedulers } = require('./scheduler');
const { createApiRouter } = require('./api/router');

const log = pino({ level: 'info' });

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 7001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

(async function main() {
  const db = await initDBFromEnv(process.env);
  const app = express();
  const corsOptions = {
    origin: function (origin, callback) { if (!origin) return callback(null, true); const allowed = CORS_ORIGIN.split(',').map(s=>s.trim()); return callback(null, true); },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  const upload = createUpload();
  const gateway = createGateway({ db, log });

  // Mount API
  app.use('/api', createApiRouter({ db, upload, conns: gateway.conns, gateway, env: { JWT_SECRET: process.env.JWT_SECRET || 'change_me_secret', ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123' }, log }));

  // Start REST server
  app.listen(PORT, () => log.info(`REST API listening on :${PORT}`));

  // Start WS on dedicated port (backward compatible)
  gateway.attachToPort({ port: WS_PORT });
  log.info(`WS gateway listening on :${WS_PORT}`);

  // Start schedulers
  const sched = startSchedulers({ db, conns: gateway.conns, send: gateway.send, log });
  sched.start();
})();
