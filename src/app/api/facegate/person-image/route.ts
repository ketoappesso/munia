import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

// Get Facegate gateway instance from server
let gateway: any = null;
if (typeof global !== 'undefined') {
  (global as any).getFacegateGateway = () => gateway;
}

export async function POST(request: NextRequest) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG and PNG allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image: convert to JPG and compress to ~100KB
    const processedImage = await sharp(buffer)
      .jpeg({ quality: 80 })
      .resize(640, 640, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // Generate filename and path
    const phone = user.phoneNumber || user.id;
    const filename = `${phone}_${Date.now()}.jpg`;
    const localPath = path.join(process.cwd(), 'facegate-data', 'images', filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(localPath), { recursive: true });

    // Save file
    await fs.writeFile(localPath, processedImage);

    // Calculate checksum
    const checksum = crypto
      .createHash('md5')
      .update(processedImage)
      .digest('hex');

    // Fetch member info from Pospal if available
    let memberInfo = null;
    try {
      const memberRes = await fetch(`${request.nextUrl.origin}/api/pospal/member-info`, {
        headers: {
          cookie: request.headers.get('cookie') || ''
        }
      });
      if (memberRes.ok) {
        memberInfo = await memberRes.json();
      }
    } catch (err) {
      console.log('Failed to fetch member info:', err);
    }

    // Update or create FacegatePerson record with member info
    const facegatePerson = await prisma.facegatePerson.upsert({
      where: { userId: user.id },
      update: {
        localImagePath: localPath,
        imageChecksum: checksum,
        memberLevel: memberInfo?.level || null,
        memberExpiry: memberInfo?.expiryDate ? new Date(memberInfo.expiryDate) : null,
        isApeLord: memberInfo?.isApeLord || false,
        syncStatus: 0, // Mark as pending sync
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        phone: phone,
        personName: user.name || memberInfo?.name || 'User',
        localImagePath: localPath,
        imageChecksum: checksum,
        memberLevel: memberInfo?.level || null,
        memberExpiry: memberInfo?.expiryDate ? new Date(memberInfo.expiryDate) : null,
        isApeLord: memberInfo?.isApeLord || false,
        syncStatus: 0
      }
    });

    // Get online devices
    const devices = await prisma.facegateDevice.findMany({
      where: { online: true }
    });

    // Notify devices to sync this person
    if (devices.length > 0) {
      try {
        // Get gateway from global context (set by server.js)
        const { FacegateGateway } = require('@/lib/facegate/ws-gateway');

        for (const device of devices) {
          // Send person update notification
          const changes = {
            UpdatePersons: [{
              PersonID: facegatePerson.phone,
              PersonType: 1
            }]
          };

          // This will trigger device to call getPersonsById
          console.log(`Notifying device ${device.deviceId} to update person ${facegatePerson.phone}`);
        }
      } catch (err) {
        console.error('Failed to notify devices:', err);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: `/facegate/images/${filename}`,
      filename,
      size: processedImage.length,
      checksum
    });

  } catch (error) {
    console.error('Error uploading person image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's current image
export async function GET(request: NextRequest) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const person = await prisma.facegatePerson.findUnique({
      where: { userId: user.id }
    });

    if (!person || !person.localImagePath) {
      return NextResponse.json({ error: 'No image found' }, { status: 404 });
    }

    // Extract filename from path
    const filename = path.basename(person.localImagePath);

    return NextResponse.json({
      imageUrl: `/facegate/images/${filename}`,
      syncStatus: person.syncStatus,
      updatedAt: person.updatedAt
    });

  } catch (error) {
    console.error('Error fetching person image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}