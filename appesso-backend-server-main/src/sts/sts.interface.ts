export type TempKeys = {
  expiredTime: number;
  expiration: string;
  credentials: {
    sessionToken: string;
    tmpSecretId: string;
    tmpSecretKey: string;
  };
  requestId: string;
  startTime: number;
};
