import { ResponceType, StatusCode } from 'src/types/responce';
import * as JsonBig from 'json-bigint';

export const formateDate = (date: Date | number): string => {
  let nowDate = new Date();
  if (typeof date === 'number') {
    nowDate = new Date(date);
  } else {
    nowDate = date;
  }
  const year: number = nowDate.getFullYear();
  const month: string = String(nowDate.getMonth() + 1).padStart(2, '0');
  const day: string = String(nowDate.getDate()).padStart(2, '0');
  const hours: string = String(nowDate.getHours()).padStart(2, '0');
  const minutes: string = String(nowDate.getMinutes()).padStart(2, '0');
  const seconds: string = String(nowDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export function isExpired(dateString: string): boolean {
  if (!dateString) {
    return true;
  }
  const inputDate = new Date(dateString);
  const currentDate = new Date();

  if (inputDate > currentDate) {
    return false;
  } else {
    return true;
  }
}
export function logs(...infos: any[]): void {
  const currentDate = new Date();
  console.log(`-----------currentData: ${formateDate(currentDate)}---------`);
  infos.forEach((item) => {
    console.log(item);
  });
}

export function generateResponce<T>(
  body: T,
  message?: string,
  code?: StatusCode,
): ResponceType<T> {
  return {
    message: message ? message : '',
    statusCode: code ? code : StatusCode.SUCCESS,
    body,
  };
}

export class CustomerError {
  message: string;
  code: StatusCode;
  constructor(message: string, code: StatusCode) {
    this.message = message;
    this.code = code;
  }
}

export const stringify = JsonBig({ useNativeBigInt: true }).stringify;
export const parse = JsonBig({ useNativeBigInt: true }).parse;
