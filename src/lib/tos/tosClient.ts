import 'server-only';
import TOS from '@volcengine/tos-sdk';

// Initialize TOS client with Volcengine configuration from env
export const tosClient = new TOS({
  accessKeyId: process.env.TOS_ACCESS_KEY as string,
  accessKeySecret: process.env.TOS_SECRET_KEY as string,
  endpoint: process.env.TOS_ENDPOINT as string,
  region: process.env.TOS_REGION as string,
});

// Export bucket name for convenience
export const TOS_BUCKET = process.env.TOS_BUCKET_NAME as string;

