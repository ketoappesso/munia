import 'server-only';
import crypto from 'crypto';
import https from 'https';

interface TosCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  endpoint: string;
  bucket: string;
}

interface UploadResult {
  statusCode: number;
  requestId?: string;
}

class CustomTosClient {
  private credentials: TosCredentials;

  constructor(credentials: TosCredentials) {
    this.credentials = credentials;
  }

  private getSignature(method: string, path: string, headers: Record<string, string>, body?: Buffer): string {
    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
      .filter(key => key.toLowerCase().startsWith('x-tos-') || ['host', 'content-type'].includes(key.toLowerCase()))
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n');

    const signedHeaders = Object.keys(headers)
      .filter(key => key.toLowerCase().startsWith('x-tos-') || ['host', 'content-type'].includes(key.toLowerCase()))
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const hashedPayload = body ? crypto.createHash('sha256').update(body).digest('hex') : crypto.createHash('sha256').update('').digest('hex');

    const canonicalRequest = [
      method,
      path,
      '', // query string (empty for simple uploads)
      canonicalHeaders,
      '', // empty line
      signedHeaders,
      hashedPayload
    ].join('\n');

    // Create string to sign
    const date = headers['x-tos-date'];
    const credentialScope = `${date.split('T')[0]}/${this.credentials.region}/tos/request`;
    const algorithm = 'TOS4-HMAC-SHA256';
    
    const stringToSign = [
      algorithm,
      date,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    // Calculate signature
    const kDate = crypto.createHmac('sha256', `TOS4${this.credentials.accessKeySecret}`).update(date.split('T')[0]).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.credentials.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('tos').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `${algorithm} Credential=${this.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private makeRequest(method: string, path: string, body?: Buffer, contentType?: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const isoString = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
      
      const headers: Record<string, string> = {
        'Host': `${this.credentials.bucket}.${this.credentials.endpoint}`,
        'x-tos-date': isoString,
        'x-tos-content-sha256': body ? crypto.createHash('sha256').update(body).digest('hex') : crypto.createHash('sha256').update('').digest('hex')
      };

      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      if (body) {
        headers['Content-Length'] = body.length.toString();
      }

      // Add authorization header
      headers['Authorization'] = this.getSignature(method, path, headers, body);

      console.log('Custom TOS Request:', {
        method,
        path,
        host: headers['Host'],
        contentType,
        bodySize: body?.length
      });

      const options = {
        hostname: `${this.credentials.bucket}.${this.credentials.endpoint}`,
        port: 443,
        path,
        method,
        headers,
        protocol: 'https:'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log('Custom TOS Response:', {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data.substring(0, 500) // Log first 500 chars of response
          });

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: res.statusCode,
              requestId: res.headers['x-tos-request-id'] as string
            });
          } else {
            reject(new Error(`TOS request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Custom TOS Request Error:', error);
        reject(error);
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  async putObject(params: { key: string; body: Buffer; contentType: string }): Promise<UploadResult> {
    const path = `/${params.key}`;
    return this.makeRequest('PUT', path, params.body, params.contentType);
  }
}

// Validate and clean endpoint
function cleanEndpoint(endpoint: string): string {
  if (!endpoint) {
    throw new Error('TOS_ENDPOINT is not defined');
  }
  // Remove any protocol prefix
  let cleaned = endpoint.replace(/^https?:\/\//i, '');
  // Remove any trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Remove any path components (should be domain only)
  cleaned = cleaned.split('/')[0];
  return cleaned;
}

// Create and export custom TOS client
const customTosClient = new CustomTosClient({
  accessKeyId: process.env.TOS_ACCESS_KEY as string,
  accessKeySecret: process.env.TOS_SECRET_KEY as string,
  region: process.env.TOS_REGION as string,
  endpoint: cleanEndpoint(process.env.TOS_ENDPOINT as string),
  bucket: process.env.TOS_BUCKET_NAME as string
});

export { customTosClient };