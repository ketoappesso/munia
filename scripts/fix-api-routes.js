#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files to fix
const filesToFix = [
  '/src/app/api/facegate/schedules/route.ts',
  '/src/app/api/facegate/devices/route.ts',
  '/src/app/api/facegate/devices/[id]/route.ts',
  '/src/app/api/facegate/person-image/route.ts',
  '/src/app/api/wallet/route.ts',
  '/src/app/api/pospal/member-info/route.ts',
  '/src/app/api/pospal/member/route.ts',
  '/src/app/api/ai/memory/route.ts',
  '/src/app/api/ai/prompt-settings/route.ts',
  '/src/app/api/ai/prompt-test/route.ts',
  '/src/app/api/conversations/route.ts',
  '/src/app/api/ai/voice-training/status/route.ts',
  '/src/app/api/ai/voice-training/upload-audio/route.ts',
  '/src/app/api/ai/voice-training/route.ts',
  '/src/app/api/ai/profile/route.ts',
  '/src/app/api/conversations/[conversationId]/messages/route.ts',
  '/src/app/api/punk-ai/route.ts',
  '/src/app/api/user/[userId]/route.ts',
  '/src/app/api/messages/upload-image/route.ts',
  '/src/app/api/conversations/task-group/route.ts',
  '/src/app/api/wallet/transfer/route.ts',
  '/src/app/api/wallet/appesso-balance/route.ts',
  '/src/app/api/user/voice/route.ts',
  '/src/app/api/users/balance/route.ts',
  '/src/app/api/auth/send-sms/route.ts',
  '/src/app/api/posts/tasks/route.ts',
  '/src/app/api/posts/GET.ts',
  '/src/app/api/messages/search/route.ts',
  '/src/app/api/users/sync-balance/route.ts',
  '/src/app/api/users/me/route.ts',
  '/src/app/api/test/conversation-info/route.ts',
  '/src/app/api/red-packets/test-send/route.ts',
  '/src/app/api/red-packets/send-simple/route.ts',
  '/src/app/api/red-packets/send-commission-simple/route.ts',
  '/src/app/api/posts/tasks/GET.ts',
  '/src/app/api/ai/chat/route.ts',
  '/src/app/api/cron/expire-unclaimed-tasks/route.ts',
  '/src/app/api/posts/[postId]/handle-completion/route.ts',
  '/src/app/api/posts/[postId]/accept-task/route.ts',
  '/src/app/api/posts/[postId]/handle-task-outcome/route.ts',
  '/src/app/api/posts/[postId]/request-completion/route.ts',
  '/src/app/api/red-packets/send/route.ts',
  '/src/app/api/red-packets/send-commission/route.ts',
  '/src/app/api/cron/auto-release-commission/route.ts',
  '/src/app/api/posts/[postId]/confirm-completion/route.ts',
  '/src/app/api/wallet/transactions/route.ts',
  '/src/app/api/conversations/[conversationId]/messages/read/route.ts',
  '/src/app/api/ws.disabled/chat/route.ts',
  '/src/app/api/ws/chat/route.ts'
];

const projectRoot = path.join(__dirname, '..');

function fixFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Fix import statements
  if (content.includes("import { NextRequest, NextResponse }")) {
    content = content.replace(
      "import { NextRequest, NextResponse }",
      "import { NextResponse }"
    );
    modified = true;
  } else if (content.includes("import { NextRequest,NextResponse }")) {
    content = content.replace(
      "import { NextRequest,NextResponse }",
      "import { NextResponse }"
    );
    modified = true;
  } else if (content.includes("'next/server';") && content.includes("NextRequest")) {
    // Handle various import formats
    content = content.replace(
      /import\s*{\s*([^}]*)\s*}\s*from\s*['"]next\/server['"]/g,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        const filteredImports = importList.filter(i => !i.includes('NextRequest'));
        if (filteredImports.length === 0) {
          return "import { NextResponse } from 'next/server'";
        }
        return `import { ${filteredImports.join(', ')} } from 'next/server'`;
      }
    );
    modified = true;
  }

  // Fix function signatures
  // Handle GET functions
  content = content.replace(
    /export\s+async\s+function\s+GET\s*\(\s*request\s*:\s*NextRequest[^)]*\)/g,
    'export async function GET()'
  );
  content = content.replace(
    /export\s+async\s+function\s+GET\s*\(\s*req\s*:\s*NextRequest[^)]*\)/g,
    'export async function GET()'
  );

  // Handle POST, PUT, DELETE, PATCH functions
  ['POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
    content = content.replace(
      new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*request\\s*:\\s*NextRequest`, 'g'),
      `export async function ${method}(request: Request`
    );
    content = content.replace(
      new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req\\s*:\\s*NextRequest`, 'g'),
      `export async function ${method}(req: Request`
    );
  });

  // Also fix arrow function exports
  content = content.replace(
    /export\s+const\s+GET\s*=\s*async\s*\(\s*request\s*:\s*NextRequest[^)]*\)/g,
    'export const GET = async ()'
  );

  ['POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
    content = content.replace(
      new RegExp(`export\\s+const\\s+${method}\\s*=\\s*async\\s*\\(\\s*request\\s*:\\s*NextRequest`, 'g'),
      `export const ${method} = async (request: Request`
    );
  });

  if (content !== fs.readFileSync(fullPath, 'utf8')) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  console.log(`⏭️  Skipped (no changes): ${filePath}`);
  return false;
}

console.log('Starting to fix API routes...\n');

let fixedCount = 0;
let skippedCount = 0;

filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  } else {
    skippedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log(`⏭️  Skipped ${skippedCount} files`);
console.log('\nDone! Remember to restart the dev server.');