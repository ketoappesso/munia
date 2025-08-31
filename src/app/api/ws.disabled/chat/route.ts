import { NextRequest, NextResponse } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';

// In-memory store for WebSocket connections
const connections = new Map<string, WebSocket>();

// Handle WebSocket upgrade request
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (request.headers.get('upgrade') !== 'websocket') {
    return NextResponse.json({ error: 'Expected WebSocket upgrade' }, { status: 400 });
  }

  // Create WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url!, 'http://localhost');
    const conversationId = url.searchParams.get('conversationId');

    // Store connection
    const connectionId = `${conversationId || 'global'}-${Date.now()}`;
    connections.set(connectionId, ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      connections.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(connectionId);
    });
  });

  // Handle the upgrade
  const response = NextResponse.next();
  // @ts-ignore - This is how we handle WebSocket upgrades in Next.js
  response.socket.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  return response;
}

function handleWebSocketMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case 'SEND_MESSAGE':
      // Broadcast message to all connections in the same conversation
      broadcastToConversation(message.conversationId, {
        type: 'NEW_MESSAGE',
        message: {
          id: `temp-${Date.now()}`,
          content: message.content,
          createdAt: new Date().toISOString(),
          senderId: message.senderId,
          conversationId: message.conversationId,
          isRead: false,
        },
      });
      break;

    case 'MARK_AS_READ':
      // Handle read receipts
      broadcastToConversation(message.conversationId, {
        type: 'MESSAGE_READ',
        messageId: message.messageId,
        conversationId: message.conversationId,
      });
      break;

    default:
      console.warn('Unknown WebSocket message type:', message.type);
  }
}

function broadcastToConversation(conversationId: string, data: any) {
  connections.forEach((ws, connectionId) => {
    if (connectionId.startsWith(conversationId)) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  });
}
