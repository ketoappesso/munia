import 'server-only';
import { tosClient, TOS_BUCKET } from './tosClient';

/**
 * Upload a file to Volcengine TOS
 * @param file Buffer containing the file data
 * @param fileName The key/name to store the file as
 * @param type The MIME type of the file
 */
export async function uploadObject(file: Buffer, fileName: string, type: string) {
  const result = await tosClient.putObject({
    bucket: TOS_BUCKET,
    key: fileName,
    body: file,
    contentType: type,
  });

  if (result.statusCode !== 200) {
    throw new Error(`Failed to upload file: ${result.statusCode}`);
  }

  return result;
}

