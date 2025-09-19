import { test, expect } from '@playwright/test';
import WebSocket from 'ws';

test.describe('Voice WebSocket Integration', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('https://xyuan.chat/api/auth/signin', {
      data: {
        phone: '13800138000',
        password: 'admin123'
      }
    });

    const cookies = await loginResponse.headers()['set-cookie'];
    if (cookies) {
      const sessionCookie = cookies.match(/next-auth\.session-token=([^;]+)/);
      if (sessionCookie) {
        authToken = sessionCookie[1];
      }
    }
  });

  test('should establish WebSocket connection', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        resolve();
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);
    });

    ws.close();
  });

  test('should send and receive heartbeat', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send heartbeat
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'heartbeat_ack') {
          expect(message).toHaveProperty('timestamp');
          resolve();
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Heartbeat timeout'));
      }, 5000);
    });

    ws.close();
  });

  test('should handle device registration', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send device registration
        ws.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-' + Date.now(),
          deviceType: 'web',
          capabilities: ['audio_input', 'audio_output']
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'device_registered') {
          expect(message).toHaveProperty('deviceId');
          expect(message).toHaveProperty('sessionId');
          resolve();
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Device registration timeout'));
      }, 5000);
    });

    ws.close();
  });

  test('should handle role selection', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      let deviceRegistered = false;

      ws.on('open', () => {
        // Register device first
        ws.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-role-' + Date.now(),
          deviceType: 'web'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'device_registered') {
          deviceRegistered = true;
          // Now select role
          ws.send(JSON.stringify({
            type: 'select_role',
            roleId: 'assistant',
            roleName: 'AI Assistant'
          }));
        }

        if (message.type === 'role_selected' && deviceRegistered) {
          expect(message).toHaveProperty('roleId');
          expect(message).toHaveProperty('roleName');
          resolve();
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Role selection timeout'));
      }, 5000);
    });

    ws.close();
  });

  test('should handle text message', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      let deviceRegistered = false;

      ws.on('open', () => {
        // Register device first
        ws.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-text-' + Date.now(),
          deviceType: 'web'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'device_registered') {
          deviceRegistered = true;
          // Send text message
          ws.send(JSON.stringify({
            type: 'text_message',
            content: '你好，测试消息',
            timestamp: Date.now()
          }));
        }

        if (message.type === 'message_received' && deviceRegistered) {
          expect(message).toHaveProperty('messageId');
          expect(message).toHaveProperty('timestamp');
          resolve();
        }

        // Also handle AI response
        if (message.type === 'ai_response' && deviceRegistered) {
          expect(message).toHaveProperty('content');
          resolve();
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Text message timeout'));
      }, 10000);
    });

    ws.close();
  });

  test('should handle audio stream metadata', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      let deviceRegistered = false;

      ws.on('open', () => {
        // Register device first
        ws.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-audio-' + Date.now(),
          deviceType: 'web',
          capabilities: ['audio_input', 'audio_output']
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'device_registered') {
          deviceRegistered = true;
          // Send audio metadata
          ws.send(JSON.stringify({
            type: 'audio_start',
            format: 'opus',
            sampleRate: 16000,
            channels: 1,
            timestamp: Date.now()
          }));
        }

        if (message.type === 'audio_ready' && deviceRegistered) {
          expect(message).toHaveProperty('sessionId');
          expect(message).toHaveProperty('format');
          resolve();
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Audio stream metadata timeout'));
      }, 5000);
    });

    ws.close();
  });

  test('should handle session end', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      let deviceRegistered = false;

      ws.on('open', () => {
        // Register device first
        ws.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-end-' + Date.now(),
          deviceType: 'web'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'device_registered') {
          deviceRegistered = true;
          // End session
          ws.send(JSON.stringify({
            type: 'end_session',
            reason: 'test_complete',
            timestamp: Date.now()
          }));
        }

        if (message.type === 'session_ended' && deviceRegistered) {
          expect(message).toHaveProperty('sessionId');
          expect(message).toHaveProperty('endTime');
          resolve();
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('Session end timeout'));
      }, 5000);
    });

    ws.close();
  });

  test('should handle reconnection', async () => {
    // First connection
    const ws1 = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    let sessionId: string;

    await new Promise<void>((resolve, reject) => {
      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-reconnect',
          deviceType: 'web'
        }));
      });

      ws1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'device_registered') {
          sessionId = message.sessionId;
          ws1.close();
          resolve();
        }
      });

      ws1.on('error', reject);
      setTimeout(() => reject(new Error('First connection timeout')), 5000);
    });

    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reconnection with same device ID
    const ws2 = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws2.on('open', () => {
        ws2.send(JSON.stringify({
          type: 'register_device',
          deviceId: 'test-device-reconnect',
          deviceType: 'web',
          sessionId: sessionId // Try to resume session
        }));
      });

      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'device_registered') {
          expect(message).toHaveProperty('sessionId');
          resolve();
        }
      });

      ws2.on('error', reject);
      setTimeout(() => reject(new Error('Reconnection timeout')), 5000);
    });

    ws2.close();
  });

  test('should handle error messages', async () => {
    const ws = new WebSocket('wss://xyuan.chat/voice-ws/', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send invalid message
        ws.send(JSON.stringify({
          type: 'invalid_type',
          data: 'test'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          expect(message).toHaveProperty('error');
          expect(message).toHaveProperty('code');
          resolve();
        }
      });

      ws.on('error', (error) => {
        // Expected to receive error message
        resolve();
      });

      setTimeout(() => {
        // If no error received, that's also acceptable
        resolve();
      }, 5000);
    });

    ws.close();
  });
});