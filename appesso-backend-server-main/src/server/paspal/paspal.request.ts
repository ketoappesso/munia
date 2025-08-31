import * as superagent from 'superagent';
import * as md5 from 'js-md5';
import { ApiNames, ApiReq, ApiResp, RespType } from './paspal.interface';
import { AppConfig } from './appInfo';
import { CustomerError, logs, parse, stringify } from 'src/utils';
import { StatusCode } from 'src/types/responce';

const getDataSignature = (payload: any, appkey: string) => {
  const content = appkey + stringify(payload);
  const dataSignature = md5(content).toUpperCase();
  return dataSignature;
};

export const request = async <T extends ApiNames>(
  apiName: T,
  payload: ApiReq<T>,
  appConfig: AppConfig,
): Promise<ApiResp<T>> => {
  try {
    const resolvedPayload = {
      ...payload,
      appId: appConfig.appId,
    };
    const payloadText = stringify(resolvedPayload);
    const resp = await superagent
      .post(`https://area20-win.pospal.cn/pospal-api2/openapi/v1/${apiName}`)
      .set('time-stamp', Number(new Date()).toString())
      .set(
        'data-signature',
        getDataSignature(resolvedPayload, appConfig.appKey),
      )
      .set('User-Agent', 'openApi')
      .set('Content-Type', 'application/json; charset=utf-8')
      .set('accept-encoding', 'gzip,deflate')
      .send(payloadText);
    const text = resp.text;
    const body = parse(text) as unknown as RespType<ApiResp<T>>;
    if (body.status !== 'success') {
      logs('------request_error, body is', body);
      throw new CustomerError(
        body.messages ? body.messages[0] : '',
        StatusCode.OTHER,
      );
    }
    if (!body.data) {
      logs(`---request: ${apiName}, data undefined---`);
      logs(`---body is ${text}---`);
    }
    return body.data;
  } catch (e) {
    if (e instanceof CustomerError) {
      throw e;
    } else {
      logs('---request_error---', apiName, payload, e);
      throw new CustomerError('发生未知错误，请联系后台。', StatusCode.OTHER);
    }
  }
};
