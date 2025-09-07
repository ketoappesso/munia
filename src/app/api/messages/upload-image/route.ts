import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadObject } from '@/lib/s3/uploadObject';
import { fileNameToUrl } from '@/lib/s3/fileNameToUrl';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    
    if (!file || !conversationId) {
      return NextResponse.json({ error: 'Missing file or conversation ID' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename - simpler structure to avoid nested folder issues
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueId = nanoid();
    const timestamp = Date.now();
    const filename = `${timestamp}-${uniqueId}.${fileExtension}`;

    // Upload to S3 or local storage
    await uploadObject(buffer, filename, file.type);
    
    // Get the URL for the uploaded file
    const imageUrl = fileNameToUrl(filename);

    return NextResponse.json({ 
      success: true,
      imageUrl 
    });
  } catch (error) {
    console.error('Error uploading message image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}