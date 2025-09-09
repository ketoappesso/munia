import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export async function GET() {
  // Mask secrets in output; only report presence
  const tosEnv = {
    endpoint: !!process.env.TOS_ENDPOINT,
    bucket: !!process.env.TOS_BUCKET_NAME,
    region: !!process.env.TOS_REGION,
    accessKey: !!process.env.TOS_ACCESS_KEY,
    secretKey: !!process.env.TOS_SECRET_KEY,
  };

  // Basic DB check: count users (works on sqlite/postgres)
  let dbOk = true;
  try {
    await prisma.user.count();
  } catch (e) {
    dbOk = false;
  }

  const status = {
    ok: dbOk && tosEnv.endpoint && tosEnv.bucket && tosEnv.region && tosEnv.accessKey && tosEnv.secretKey,
    dbOk,
    tosEnv,
    time: new Date().toISOString(),
  };

  return NextResponse.json(status);
}

