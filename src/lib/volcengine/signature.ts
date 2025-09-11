import crypto from 'crypto';

/**
 * Volcengine API V4 Signature Generator
 * Based on the official Volcengine signature algorithm
 */

interface SignatureParams {
  accessKeyId: string;
  secretKey: string;
  region: string;
  service: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  timestamp?: Date;
}

/**
 * Generate HMAC-SHA256 hash
 */
function hmacSHA256(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

/**
 * Generate SHA256 hash
 */
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Format date for AWS/Volcengine signature
 */
function formatDate(date: Date): { dateStamp: string; amzDate: string } {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return {
    dateStamp: `${year}${month}${day}`,
    amzDate: `${year}${month}${day}T${hours}${minutes}${seconds}Z`
  };
}

/**
 * Create canonical query string
 */
function createCanonicalQueryString(query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) {
    return '';
  }
  
  return Object.keys(query)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&');
}

/**
 * Create canonical headers
 */
function createCanonicalHeaders(headers: Record<string, string>): { 
  canonicalHeaders: string; 
  signedHeaders: string;
} {
  const sortedHeaders = Object.keys(headers)
    .map(key => key.toLowerCase())
    .sort();
  
  const canonicalHeaders = sortedHeaders
    .map(key => `${key}:${headers[key] || headers[key.toUpperCase()] || ''}`)
    .join('\n') + '\n';
  
  const signedHeaders = sortedHeaders.join(';');
  
  return { canonicalHeaders, signedHeaders };
}

/**
 * Create canonical request
 */
function createCanonicalRequest(
  method: string,
  path: string,
  queryString: string,
  canonicalHeaders: string,
  signedHeaders: string,
  hashedPayload: string
): string {
  return [
    method.toUpperCase(),
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join('\n');
}

/**
 * Generate Volcengine V4 signature
 */
export function generateVolcengineSignature(params: SignatureParams): {
  authorization: string;
  headers: Record<string, string>;
} {
  const {
    accessKeyId,
    secretKey,
    region,
    service,
    method,
    path,
    query,
    headers = {},
    body = '',
    timestamp = new Date()
  } = params;

  // Format dates
  const { dateStamp, amzDate } = formatDate(timestamp);
  
  // Hash the payload
  const hashedPayload = sha256(body);
  
  // Add required headers
  const allHeaders: Record<string, string> = {
    ...headers,
    'x-date': amzDate,
    'host': 'open.volcengineapi.com',
    'x-content-sha256': hashedPayload
  };
  
  // Create canonical query string
  const canonicalQueryString = createCanonicalQueryString(query);
  
  // Create canonical headers
  const { canonicalHeaders, signedHeaders } = createCanonicalHeaders(allHeaders);
  
  // Create canonical request
  const canonicalRequest = createCanonicalRequest(
    method,
    path,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  );
  
  // Create string to sign
  const algorithm = 'HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n');
  
  // Calculate signing key
  const kDate = hmacSHA256(`VOLC${secretKey}`, dateStamp);
  const kRegion = hmacSHA256(kDate, region);
  const kService = hmacSHA256(kRegion, service);
  const signingKey = hmacSHA256(kService, 'request');
  
  // Calculate signature
  const signature = hmacSHA256(signingKey, stringToSign).toString('hex');
  
  // Create authorization header
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    authorization,
    headers: {
      ...allHeaders,
      'Authorization': authorization
    }
  };
}

/**
 * Helper function to make signed Volcengine API request
 */
export async function makeVolcengineRequest(
  action: string,
  body: any,
  config?: {
    accessKeyId?: string;
    secretKey?: string;
    region?: string;
    service?: string;
    version?: string;
  }
): Promise<any> {
  const accessKeyId = config?.accessKeyId || process.env.TOS_ACCESS_KEY || '';
  const secretKey = config?.secretKey || process.env.TOS_SECRET_KEY || '';
  const region = config?.region || 'cn-north-1';
  const service = config?.service || 'speech_saas_prod';
  const version = config?.version || '2023-11-07';
  
  const query = {
    Action: action,
    Version: version
  };
  
  const bodyStr = JSON.stringify(body);
  
  const { headers } = generateVolcengineSignature({
    accessKeyId,
    secretKey,
    region,
    service,
    method: 'POST',
    path: '/',
    query,
    body: bodyStr
  });
  
  // Add content type
  headers['Content-Type'] = 'application/json; charset=utf-8';
  
  const url = new URL('https://open.volcengineapi.com/');
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: bodyStr
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    const error = result.ResponseMetadata?.Error;
    throw new Error(error?.Message || `API request failed: ${response.status}`);
  }
  
  return result;
}