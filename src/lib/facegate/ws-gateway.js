const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

class FacegateGateway {
  constructor() {
    this.connections = new Map(); // deviceId -> ws
    this.reqIdCounter = 1;
  }

  generateReqId() {
    return (this.reqIdCounter++ & 0xffffffff);
  }

  send(ws, msg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
    }
  }

  ok(method, req_id, params = {}) {
    return {
      method,
      params,
      result: 0,
      errMsg: 'Success',
      req_id
    };
  }

  err(method, req_id, code, msg) {
    return {
      method,
      result: code,
      errMsg: msg || 'Error',
      req_id
    };
  }

  removeConnection(deviceId) {
    this.connections.delete(deviceId);
    // Update device online status in database
    this.updateDeviceOnlineStatus(deviceId, false);
  }

  async updateDeviceOnlineStatus(deviceId, online) {
    try {
      // Import prisma here to avoid circular dependency
      const prisma = require('@/lib/prisma/prisma').default;
      await prisma.facegateDevice.update({
        where: { deviceId },
        data: { online }
      });
    } catch (err) {
      console.error(`Failed to update device ${deviceId} online status:`, err);
    }
  }

  async handleMessage(ws, data) {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (err) {
      return this.send(ws, this.err('invalid', 0, 100, 'Bad JSON'));
    }

    const { method, params = {}, req_id } = msg;

    try {
      switch (method) {
        case 'registerDevice':
          await this.handleRegisterDevice(ws, params, req_id);
          break;
        case 'heartBeat':
          await this.handleHeartBeat(ws, params, req_id);
          break;
        case 'uploadRecords':
          await this.handleUploadRecords(ws, params, req_id);
          break;
        case 'getPersonCount':
          await this.handleGetPersonCount(ws, params, req_id);
          break;
        case 'getPersonsByPage':
          await this.handleGetPersonsByPage(ws, params, req_id);
          break;
        case 'getPersonsById':
          await this.handleGetPersonsById(ws, params, req_id);
          break;
        case 'insertPerson':
        case 'updatePerson':
        case 'removePerson':
          // These are notifications from device, just acknowledge
          await this.handlePersonChange(ws, method, params, req_id);
          break;
        default:
          this.send(ws, this.err(method || 'unknown', req_id || 0, 105, 'Not supported'));
      }
    } catch (err) {
      console.error(`Error handling ${method}:`, err);
      this.send(ws, this.err(method || 'unknown', req_id || 0, 900, 'Internal error'));
    }
  }

  async handleRegisterDevice(ws, params, req_id) {
    const { DeviceId, ProdType, ProdName, RelayOutSlots } = params;

    if (!DeviceId) {
      return this.send(ws, this.err('registerDevice', req_id, 100, 'DeviceId required'));
    }

    // Store connection
    ws.deviceId = DeviceId;
    this.connections.set(DeviceId, ws);

    // Update database
    const prisma = require('@/lib/prisma/prisma').default;
    const nowTs = Math.floor(Date.now() / 1000);

    await prisma.facegateDevice.upsert({
      where: { deviceId: DeviceId },
      update: {
        prodType: ProdType,
        prodName: ProdName,
        relaySlots: RelayOutSlots || 0,
        lastSeenTs: BigInt(nowTs),
        online: true
      },
      create: {
        deviceId: DeviceId,
        prodType: ProdType,
        prodName: ProdName,
        relaySlots: RelayOutSlots || 0,
        lastSeenTs: BigInt(nowTs),
        online: true
      }
    });

    this.send(ws, {
      method: 'registerDevice',
      params: { Timestamp: nowTs },
      result: 0,
      errMsg: 'Success',
      req_id
    });
  }

  async handleHeartBeat(ws, params, req_id) {
    const { DeviceId } = params;

    if (DeviceId) {
      const prisma = require('@/lib/prisma/prisma').default;
      const nowTs = Math.floor(Date.now() / 1000);

      await prisma.facegateDevice.update({
        where: { deviceId: DeviceId },
        data: { lastSeenTs: BigInt(nowTs), online: true }
      });
    }

    // Only sync time occasionally (every 30 minutes)
    const shouldSyncTime = Math.random() < 0.01; // ~1% chance
    const response = {
      method: 'heartBeat',
      params: shouldSyncTime ? { Timestamp: Math.floor(Date.now() / 1000) } : {},
      result: 0,
      req_id
    };

    this.send(ws, response);
  }

  async handleUploadRecords(ws, params, req_id) {
    const { DeviceId, RecordCount, Records } = params;

    if (!DeviceId || !Array.isArray(Records)) {
      return this.send(ws, this.err('uploadRecords', req_id, 100, 'Bad params'));
    }

    const prisma = require('@/lib/prisma/prisma').default;

    for (const record of Records) {
      try {
        await prisma.facegateRecord.upsert({
          where: {
            deviceId_recordId: {
              deviceId: DeviceId,
              recordId: BigInt(record.RecordID || 0)
            }
          },
          update: {},
          create: {
            deviceId: DeviceId,
            recordId: BigInt(record.RecordID || 0),
            personPhone: record.PersonID || null,
            recordTime: BigInt(record.RecordTime || 0),
            recordType: record.RecordType || 0,
            recordPass: record.RecordPass || 0,
            similarity: record.Similarity || null,
            temperature: record.Temperature || null,
            qrcode: record.QRCode || null,
            healthCodeColor: record.HealthCodeColor || null,
            raw: record
          }
        });
      } catch (err) {
        console.error(`Failed to save record from ${DeviceId}:`, err);
      }
    }

    this.send(ws, this.ok('uploadRecords', req_id));
  }

  async handleGetPersonCount(ws, params, req_id) {
    const prisma = require('@/lib/prisma/prisma').default;
    const count = await prisma.facegatePerson.count();

    this.send(ws, {
      method: 'getPersonCount',
      params: {
        Timestamp: Math.floor(Date.now() / 1000),
        PersonCount: count
      },
      result: 0,
      errMsg: 'Success',
      req_id
    });
  }

  async handleGetPersonsByPage(ws, params, req_id) {
    const { PersonCount, Offset } = params;
    const prisma = require('@/lib/prisma/prisma').default;

    const persons = await prisma.facegatePerson.findMany({
      skip: Offset || 0,
      take: PersonCount || 100
    });

    const responsePersons = await Promise.all(
      persons.map(async (person) => {
        const personData = {
          PersonID: person.phone,
          PersonName: person.personName,
          ICCardID: person.icCardId || '',
          IDCardNo: person.idCardNo || '',
          PassPlanIDs: person.passPlans ? JSON.parse(person.passPlans) : []
        };

        // Read and convert image to Base64
        if (person.localImagePath) {
          try {
            const imageBuffer = await fs.readFile(person.localImagePath);
            personData.PersonPicture = imageBuffer.toString('base64');
          } catch (err) {
            console.error(`Failed to read image for ${person.phone}:`, err);
          }
        }

        return personData;
      })
    );

    this.send(ws, {
      method: 'getPersonsByPage',
      params: {
        Timestamp: Math.floor(Date.now() / 1000),
        PersonCount: responsePersons.length,
        Persons: responsePersons
      },
      result: 0,
      errMsg: 'Success',
      req_id
    });
  }

  async handleGetPersonsById(ws, params, req_id) {
    const { PersonCount, Persons } = params;
    const personIds = Persons.map(p => p.PersonID);

    const prisma = require('@/lib/prisma/prisma').default;
    const dbPersons = await prisma.facegatePerson.findMany({
      where: { phone: { in: personIds } }
    });

    const responsePersons = await Promise.all(
      dbPersons.map(async (person) => {
        const personData = {
          PersonID: person.phone,
          PersonName: person.personName,
          ICCardID: person.icCardId || '',
          IDCardNo: person.idCardNo || '',
          PassPlanIDs: person.passPlans ? JSON.parse(person.passPlans) : []
        };

        // Read and convert image to Base64 (JPG format required)
        if (person.localImagePath) {
          try {
            const imageBuffer = await fs.readFile(person.localImagePath);
            personData.PersonPicture = imageBuffer.toString('base64');
          } catch (err) {
            console.error(`Failed to read image for ${person.phone}:`, err);
          }
        }

        // Add member info if available
        if (person.memberLevel) {
          personData.ExtInfo = {
            MemberLevel: person.memberLevel,
            MemberExpiry: person.memberExpiry ? person.memberExpiry.toISOString() : null,
            IsApeLord: person.isApeLord
          };
        }

        return personData;
      })
    );

    this.send(ws, {
      method: 'getPersonsById',
      params: {
        PersonCount: responsePersons.length,
        Persons: responsePersons
      },
      result: 0,
      errMsg: 'Success',
      req_id
    });
  }

  async handlePersonChange(ws, method, params, req_id) {
    // Just acknowledge the change from device
    // We don't need to do anything as these are device-initiated changes
    this.send(ws, this.ok(method, req_id));
  }

  // Push methods for server-initiated commands

  async pushChangePersons(deviceId, changes) {
    const ws = this.connections.get(deviceId);
    if (!ws) return false;

    const req_id = this.generateReqId();
    this.send(ws, {
      method: 'pushChangePersons',
      params: {
        Timestamp: Math.floor(Date.now() / 1000),
        SyncMode: 2, // Incremental sync
        ...changes
      },
      req_id
    });

    return true;
  }

  async pushRemoteOpenDoor(deviceId, devIdx = 0) {
    const ws = this.connections.get(deviceId);
    if (!ws) throw new Error('Device offline');

    const req_id = this.generateReqId();
    this.send(ws, {
      method: 'pushRemoteOpenDoor',
      params: { DevIdx: devIdx },
      req_id
    });
  }

  async pushRelayOut(deviceId, relayIdx = 0, delay = 5) {
    const ws = this.connections.get(deviceId);
    if (!ws) throw new Error('Device offline');

    const req_id = this.generateReqId();
    this.send(ws, {
      method: 'pushRelayOut',
      params: { RelayIdx: relayIdx, Delay: delay },
      req_id
    });
  }

  async pushDisplayImage(deviceId, imageUrl) {
    const ws = this.connections.get(deviceId);
    if (!ws) return false;

    const req_id = this.generateReqId();
    this.send(ws, {
      method: 'pushDisplayImage',
      params: { Url: imageUrl },
      req_id
    });

    return true;
  }

  // Helper method to process and save person image
  async savePersonImage(phone, imageBuffer) {
    try {
      // Convert to JPG and compress to ~100KB
      const processedImage = await sharp(imageBuffer)
        .jpeg({ quality: 80 })
        .resize(640, 640, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();

      // Generate filename and path
      const filename = `${phone}_${Date.now()}.jpg`;
      const localPath = path.join(process.cwd(), 'facegate-data', 'images', filename);

      // Save file
      await fs.writeFile(localPath, processedImage);

      // Calculate checksum
      const checksum = crypto
        .createHash('md5')
        .update(processedImage)
        .digest('hex');

      return {
        localPath,
        filename,
        checksum,
        size: processedImage.length
      };
    } catch (err) {
      console.error('Failed to process person image:', err);
      throw err;
    }
  }
}

module.exports = { FacegateGateway };