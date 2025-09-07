import 'server-only';
import { tosClient, TOS_BUCKET } from './tosClient';

/**
 * Delete an object from Volcengine TOS
 * @param fileName The key/name of the file to delete
 */
export async function deleteObject(fileName: string) {
  try {
    const result = await tosClient.deleteObject({
      bucket: TOS_BUCKET,
      key: fileName,
    });

    // TOS may return 204 No Content on successful delete
    if (result.statusCode !== 204 && result.statusCode !== 200) {
      throw new Error(`Failed to delete file: ${result.statusCode}`);
    }
  } catch (error) {
    // Re-throw with context so callers can handle/log
    throw error;
  }
}

