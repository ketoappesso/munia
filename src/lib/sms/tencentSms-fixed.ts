import crypto from 'crypto';

interface TencentSmsConfig {
  secretId: string;
  secretKey: string;
  smsSdkAppId: string;
  signName: string;
  templateId: string;
  region?: string;
}

interface SendSmsResponse {
  SendStatusSet?: Array<{
    SerialNo: string;
    PhoneNumber: string;
    Fee: number;
    SessionContext: string;
    Code: string;
    Message: string;
    IsoCode: string;
  }>;
  Error?: {
    Code: string;
    Message: string;
  };
  RequestId: string;
}

class TencentSmsClient {
  private config: TencentSmsConfig;
  private endpoint = 'sms.tencentcloudapi.com';
  private service = 'sms';
  private action = 'SendSms';
  private version = '2021-01-11';

  constructor(config: TencentSmsConfig) {
    this.config = {
      region: 'ap-guangzhou',
      ...config,
    };
  }

  private sha256(message: string, secret = '', encoding: BufferEncoding = 'hex'): string {
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(message).digest(encoding);
  }

  private getHash(message: string, encoding: BufferEncoding = 'hex'): string {
    const hash = crypto.createHash('sha256');
    return hash.update(message).digest(encoding);
  }

  private getDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  private buildAuthorizationHeader(payload: string, timestamp: number): string {
    const date = this.getDate(timestamp);

    // Step 1: Build canonical request
    const signedHeaders = 'content-type;host';
    const hashedRequestPayload = this.getHash(payload);
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${this.endpoint}\n`;

    const canonicalRequest = [
      httpRequestMethod,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      hashedRequestPayload
    ].join('\n');

    // Step 2: Build string to sign
    const algorithm = 'TC3-HMAC-SHA256';
    const hashedCanonicalRequest = this.getHash(canonicalRequest);
    const credentialScope = `${date}/${this.service}/tc3_request`;
    const stringToSign = [
      algorithm,
      timestamp.toString(),
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');

    // Step 3: Calculate signature
    const kDate = this.sha256(date, 'TC3' + this.config.secretKey);
    const kService = this.sha256(this.service, kDate);
    const kSigning = this.sha256('tc3_request', kService);
    const signature = this.sha256(stringToSign, kSigning, 'hex');

    // Step 4: Build authorization header
    return `${algorithm} Credential=${this.config.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  async sendSms(phoneNumber: string, templateParams: string[], sessionContext?: string): Promise<SendSmsResponse> {
    const timestamp = Math.round(Date.now() / 1000);

    // Format phone number to E.164 standard
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+86${phoneNumber}`;

    const payload = JSON.stringify({
      SmsSdkAppId: this.config.smsSdkAppId,
      SignName: this.config.signName,
      TemplateId: this.config.templateId,
      TemplateParamSet: templateParams,
      PhoneNumberSet: [formattedPhone],
      SessionContext: sessionContext || `session_${timestamp}`,
    });

    const authorization = this.buildAuthorizationHeader(payload, timestamp);

    const headers = {
      'Authorization': authorization,
      'Content-Type': 'application/json; charset=utf-8',
      'Host': this.endpoint,
      'X-TC-Action': this.action,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Version': this.version,
      'X-TC-Region': this.config.region!,
    };

    try {
      const response = await fetch(`https://${this.endpoint}`, {
        method: 'POST',
        headers,
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.Response?.Error?.Message || 'Unknown error';
        throw new Error(`Tencent SMS API error: ${errorMsg}`);
      }

      // Handle the correct response structure
      const result = data.Response || data;

      if (result.Error) {
        throw new Error(`Tencent SMS API error: ${result.Error.Message}`);
      }

      return result;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  // 发送验证码短信
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const response = await this.sendSms(phoneNumber, [code], `verify_${Date.now()}`);

      // 检查发送状态
      if (response.SendStatusSet && response.SendStatusSet.length > 0) {
        const sendStatus = response.SendStatusSet[0];
        return sendStatus?.Code === 'Ok';
      }

      // If no SendStatusSet, check if there was no error (meaning success)
      return !response.Error;
    } catch (error) {
      console.error('Failed to send verification code:', error);
      return false;
    }
  }
}

export { TencentSmsClient, type TencentSmsConfig, type SendSmsResponse };