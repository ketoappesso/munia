import { NextRequest, NextResponse } from 'next/server';

// GET /api/voice/gateway/status - Get voice service status
export async function GET(request: NextRequest) {
  try {
    // Check xiaozhijava backend service
    const serviceUrl = process.env.XIAOZHI_SERVICE_URL || 'http://localhost:8091';
    const websocketUrl = process.env.NEXT_PUBLIC_VOICE_WS_URL || 'ws://localhost:8091';

    let backendStatus = 'unknown';
    try {
      const response = await fetch(`${serviceUrl}/actuator/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        backendStatus = data.status || 'unknown';
      } else {
        backendStatus = 'error';
      }
    } catch (error) {
      backendStatus = 'offline';
    }

    return NextResponse.json({
      status: backendStatus,
      serviceUrl,
      websocketUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking voice gateway status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to check voice service status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}