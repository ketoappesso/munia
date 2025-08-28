#!/usr/bin/env node
/**
 * Test data runner for Playwright tests
 */
import { setupTestUsers, setupTestConversations } from '../tests/setup-test-data.ts';

async function run() {
  console.log('🚀 Starting test data setup...');
  
  try {
    await setupTestUsers();
    await setupTestConversations();
    console.log('✅ All test data initialized successfully');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

run();