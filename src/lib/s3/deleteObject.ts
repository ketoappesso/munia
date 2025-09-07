import 'server-only';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3Client';
import { unlink } from 'fs/promises';
import path from 'path';

const isS3Configured = () => {
  return process.env.S3_BUCKET_NAME && 
         process.env.AWS_REGION && 
         process.env.AWS_ACCESS_KEY_ID && 
         process.env.AWS_SECRET_ACCESS_KEY;
};

export async function deleteObject(fileName: string) {
  if (isS3Configured()) {
    // Use S3 for production
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
    });
    await s3Client.send(command);
  } else {
    // Use local storage for development
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    
    try {
      await unlink(filePath);
      console.log(`[Local Storage] File deleted: ${filePath}`);
    } catch (error) {
      // File might not exist, log but don't throw
      console.warn(`[Local Storage] Could not delete file: ${filePath}`, error);
    }
  }
}
