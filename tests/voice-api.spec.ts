import { test, expect } from '@playwright/test';

test.describe('Voice Assistant API Routes', () => {
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

  test('GET /api/voice/devices - should return device list', async ({ request }) => {
    const response = await request.get('https://xyuan.chat/api/voice/devices', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('devices');
    expect(Array.isArray(data.devices)).toBeTruthy();
    expect(data).toHaveProperty('total');
  });

  test('POST /api/voice/devices - should create new device', async ({ request }) => {
    const deviceData = {
      name: 'Test Device ' + Date.now(),
      type: 'esp32',
      model: 'voice-assistant-v1'
    };

    const response = await request.post('https://xyuan.chat/api/voice/devices', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      },
      data: deviceData
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('device');
    expect(data.device).toHaveProperty('id');
    expect(data.device.name).toBe(deviceData.name);
  });

  test('GET /api/voice/roles - should return role list', async ({ request }) => {
    const response = await request.get('https://xyuan.chat/api/voice/roles', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('roles');
    expect(Array.isArray(data.roles)).toBeTruthy();

    // Check role structure
    if (data.roles.length > 0) {
      const role = data.roles[0];
      expect(role).toHaveProperty('id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('description');
    }
  });

  test('POST /api/voice/sessions - should create voice session', async ({ request }) => {
    // First get a device
    const devicesResponse = await request.get('https://xyuan.chat/api/voice/devices', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    const devicesData = await devicesResponse.json();
    let deviceId: string;

    if (devicesData.devices.length === 0) {
      // Create a device first
      const createResponse = await request.post('https://xyuan.chat/api/voice/devices', {
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`
        },
        data: {
          name: 'Test Device for Session',
          type: 'esp32',
          model: 'voice-assistant-v1'
        }
      });
      const createData = await createResponse.json();
      deviceId = createData.device.id;
    } else {
      deviceId = devicesData.devices[0].id;
    }

    // Create session
    const response = await request.post('https://xyuan.chat/api/voice/sessions', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      },
      data: {
        deviceId: deviceId
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('session');
    expect(data.session).toHaveProperty('id');
    expect(data.session.deviceId).toBe(deviceId);
    expect(data.session).toHaveProperty('startTime');
  });

  test('GET /api/voice/sessions - should return session list', async ({ request }) => {
    const response = await request.get('https://xyuan.chat/api/voice/sessions', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('sessions');
    expect(Array.isArray(data.sessions)).toBeTruthy();
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('offset');
  });

  test('PUT /api/voice/sessions/[id] - should end session', async ({ request }) => {
    // Create a session first
    const devicesResponse = await request.get('https://xyuan.chat/api/voice/devices', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    const devicesData = await devicesResponse.json();
    if (devicesData.devices.length === 0) {
      // Create a device
      const createResponse = await request.post('https://xyuan.chat/api/voice/devices', {
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`
        },
        data: {
          name: 'Test Device for End Session',
          type: 'esp32',
          model: 'voice-assistant-v1'
        }
      });
      const createData = await createResponse.json();
      devicesData.devices.push(createData.device);
    }

    // Create session
    const createSessionResponse = await request.post('https://xyuan.chat/api/voice/sessions', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      },
      data: {
        deviceId: devicesData.devices[0].id
      }
    });

    const sessionData = await createSessionResponse.json();
    const sessionId = sessionData.session.id;

    // End session
    const response = await request.put(`https://xyuan.chat/api/voice/sessions/${sessionId}`, {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('session');
    expect(data.session).toHaveProperty('endTime');
  });

  test('DELETE /api/voice/devices/[id] - should delete device', async ({ request }) => {
    // Create a device to delete
    const createResponse = await request.post('https://xyuan.chat/api/voice/devices', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      },
      data: {
        name: 'Device to Delete',
        type: 'esp32',
        model: 'voice-assistant-v1'
      }
    });

    const createData = await createResponse.json();
    const deviceId = createData.device.id;

    // Delete device
    const response = await request.delete(`https://xyuan.chat/api/voice/devices/${deviceId}`, {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);

    // Verify device is deleted
    const verifyResponse = await request.get(`https://xyuan.chat/api/voice/devices/${deviceId}`, {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });
    expect(verifyResponse.status()).toBe(404);
  });

  test('GET /api/voice/gateway/status - should return service status', async ({ request }) => {
    const response = await request.get('https://xyuan.chat/api/voice/gateway/status', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('serviceUrl');
    expect(data).toHaveProperty('websocketUrl');
  });

  test('POST /api/voice/messages - should create voice message', async ({ request }) => {
    // Get or create session
    const sessionsResponse = await request.get('https://xyuan.chat/api/voice/sessions?limit=1', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      }
    });

    const sessionsData = await sessionsResponse.json();
    let sessionId: string;

    if (sessionsData.sessions.length === 0) {
      // Create device and session
      const deviceResponse = await request.post('https://xyuan.chat/api/voice/devices', {
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`
        },
        data: {
          name: 'Test Device for Message',
          type: 'esp32',
          model: 'voice-assistant-v1'
        }
      });
      const deviceData = await deviceResponse.json();

      const sessionResponse = await request.post('https://xyuan.chat/api/voice/sessions', {
        headers: {
          'Cookie': `next-auth.session-token=${authToken}`
        },
        data: {
          deviceId: deviceData.device.id
        }
      });
      const sessionData = await sessionResponse.json();
      sessionId = sessionData.session.id;
    } else {
      sessionId = sessionsData.sessions[0].id;
    }

    // Create message
    const response = await request.post('https://xyuan.chat/api/voice/messages', {
      headers: {
        'Cookie': `next-auth.session-token=${authToken}`
      },
      data: {
        sessionId: sessionId,
        content: 'Test voice message',
        role: 'user',
        type: 'text'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toHaveProperty('id');
    expect(data.message.content).toBe('Test voice message');
    expect(data.message.sessionId).toBe(sessionId);
  });
});