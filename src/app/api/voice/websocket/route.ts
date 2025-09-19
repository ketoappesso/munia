import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// WebSocket upgrade is handled by a separate server
// This endpoint returns the WebSocket URL for the client
export async function GET(request: NextRequest) {
  // Get the host from the request
  const host = request.headers.get('host') || 'xyuan.chat';
  const protocol = host.includes('localhost') ? 'ws' : 'wss';

  // Return WebSocket endpoint information
  return Response.json({
    url: `${protocol}://${host}/voice-ws`,
    status: 'ready',
    config: {
      language: 'zh-CN',
      enableVAD: true,
      vadSilenceThreshold: 1000,
      sampleRate: 16000,
    }
  });
}