import crypto from 'crypto';

/**
 * Generate MD5 signature for Pospal API
 * @param appKey - Application key
 * @param timestamp - Timestamp in milliseconds
 * @param appId - Application ID
 * @returns MD5 signature in uppercase
 */
export function generatePospalSignature(
  appKey: string,
  timestamp: number | string,
  appId: string
): string {
  // Signature format: MD5(appKey + timestamp + appId) - uppercase
  const signContent = appKey + timestamp + appId;
  const signature = crypto
    .createHash('md5')
    .update(signContent)
    .digest('hex')
    .toUpperCase();
  
  return signature;
}

/**
 * Generate headers for Pospal API request
 * @param appId - Application ID
 * @param appKey - Application key
 * @returns Headers object for API request
 */
export function generatePospalHeaders(appId: string, appKey: string) {
  const timestamp = Date.now();
  const signature = generatePospalSignature(appKey, timestamp, appId);
  
  return {
    'User-Agent': 'openApi',
    'Content-Type': 'application/json; charset=utf-8',
    'accept-encoding': 'gzip,deflate',
    'time-stamp': timestamp.toString(),
    'data-signature': signature,
  };
}

/**
 * Format date to Pospal API format
 * @param date - Date object or string
 * @returns Formatted date string (yyyy-MM-dd HH:mm:ss)
 */
export function formatPospalDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}