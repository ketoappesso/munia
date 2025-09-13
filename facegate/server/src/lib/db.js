const pino = require('pino');
const log = pino({ level: 'info' });

function mapPgPlaceholders(sql) {
  // Replace each '?' with $1, $2, ... conservatively (not in quotes)
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

async function createMySQL(config) {
  const mysql = require('mysql2/promise');
  const pool = await mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });
  await pool.query('SELECT 1');
  return {
    flavor: 'mysql',
    async query(sql, params = []) { return pool.query(sql, params); },
    async execute(sql, params = []) { const [ret] = await pool.execute(sql, params); return ret; },
    async close() { return pool.end(); },
  };
}

async function createPostgres(config) {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port || 5432,
    max: 10,
  });
  await pool.query('SELECT 1');
  return {
    flavor: 'postgres',
    async query(sql, params = []) {
      const res = await pool.query(mapPgPlaceholders(sql), params);
      return [res.rows];
    },
    async execute(sql, params = []) {
      const res = await pool.query(mapPgPlaceholders(sql), params);
      return { rowCount: res.rowCount, rows: res.rows };
    },
    async close() { return pool.end(); },
  };
}

async function createSQLite(config) {
  const Database = require('better-sqlite3');
  const db = new Database(config.filename || ':memory:');
  // PRAGMA for reasonable defaults
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  return {
    flavor: 'sqlite',
    async query(sql, params = []) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      return [rows];
    },
    async execute(sql, params = []) {
      const stmt = db.prepare(sql);
      const info = stmt.run(...params);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    },
    async close() { db.close(); },
  };
}

async function initDBFromEnv(env) {
  const flavor = (env.DB_DIALECT || 'mysql').toLowerCase();
  try {
    if (flavor === 'postgres' || flavor === 'postgresql' || flavor === 'pg') {
      const client = await createPostgres({
        host: env.PG_HOST || env.DB_HOST || '127.0.0.1',
        user: env.PG_USER || env.DB_USER || 'postgres',
        password: env.PG_PASSWORD || env.DB_PASSWORD || '',
        database: env.PG_DATABASE || env.DB_NAME || 'facegate',
        port: env.PG_PORT ? Number(env.PG_PORT) : undefined,
      });
      log.info('PostgreSQL pool ready');
      return client;
    }
    if (flavor === 'sqlite' || flavor === 'sqlite3') {
      const client = await createSQLite({ filename: env.SQLITE_PATH || './server/data/dev.db' });
      log.info('SQLite ready');
      return client;
    }
    // default mysql
    const client = await createMySQL({
      host: env.DB_HOST || '127.0.0.1',
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database: env.DB_NAME || 'facegate',
    });
    log.info('MySQL pool ready');
    return client;
  } catch (e) {
    log.warn('DB init failed, falling back to mock:', e.message);
    const mock = require('../db-mock');
    mock.flavor = 'mock';
    return mock;
  }
}

module.exports = { initDBFromEnv };

