const tencentcloud = require("tencentcloud-sdk-nodejs-sms");

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
  private client: any;

  constructor(config: TencentSmsConfig) {
    this.config = {
      region: 'ap-guangzhou',
      ...config,
    };

    // Initialize official Tencent Cloud SDK client
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const clientConfig = {
      credential: {
        secretId: this.config.secretId,
        secretKey: this.config.secretKey,
      },
      region: this.config.region,
      profile: {
        httpProfile: {
          endpoint: "sms.tencentcloudapi.com",
        },
      },
    };

    this.client = new SmsClient(clientConfig);
  }

  async sendSms(phoneNumber: string, templateParams: string[], sessionContext?: string): Promise<SendSmsResponse> {
    // Format phone number to E.164 standard
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+86${phoneNumber}`;

    const params = {
      SmsSdkAppId: this.config.smsSdkAppId,
      SignName: this.config.signName,
      TemplateId: this.config.templateId,
      TemplateParamSet: templateParams,
      PhoneNumberSet: [formattedPhone],
      SessionContext: sessionContext || `session_${Date.now()}`,
    };

    try {
      console.log('DEBUG: SMS Params:', JSON.stringify(params, null, 2));

      const response = await this.client.SendSms(params);

      console.log('DEBUG: SMS Response:', JSON.stringify(response, null, 2));

      return response;
    } catch (error: any) {
      console.error('Failed to send SMS:', error);

      // Transform SDK error to our interface format
      const errorResponse: SendSmsResponse = {
        Error: {
          Code: error.code || 'UnknownError',
          Message: error.message || 'Unknown error occurred'
        },
        RequestId: error.requestId || 'unknown'
      };

      return errorResponse;
    }
  }

  // 发送验证码短信
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const response = await this.sendSms(phoneNumber, [code], `verify_${Date.now()}`);

      // 检查发送状态
      if (response.SendStatusSet && response.SendStatusSet.length > 0) {
        const sendStatus = response.SendStatusSet[0];
        // Check for success codes
        return sendStatus?.Code === 'Ok' || sendStatus?.Code === 'Success';
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