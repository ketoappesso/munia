const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Point to the main project's database
const databaseUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../../prisma/dev.db')}`;

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

module.exports = prismaClient;