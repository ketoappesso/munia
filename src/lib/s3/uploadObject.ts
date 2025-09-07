import 'server-only';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3Client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const isS3Configured = () => {
  return process.env.S3_BUCKET_NAME && 
         process.env.AWS_REGION && 
         process.env.AWS_ACCESS_KEY_ID && 
         process.env.AWS_SECRET_ACCESS_KEY;
};

export async function uploadObject(file: Buffer, fileName: string, type: string) {
  if (isS3Configured()) {
    // Use S3 for production
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: type,
    });
    await s3Client.send(command);
  } else {
    // Use local storage for development
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the uploads directory exists
    await mkdir(uploadsDir, { recursive: true });
    
    // Write the file to local storage
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, file);
    
    console.log(`[Local Storage] File saved to: ${filePath}`);
  }
}
