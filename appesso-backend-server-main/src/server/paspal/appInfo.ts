export type AppConfig = {
  appId: string;
  name: string;
  appKey: string;
};

export type AppConfigWithoutKey = {
  appId: string;
  name: string;
  ID: string;
};

type AppConfigKey =
  | 'ZD'
  | 'GFKD'
  | 'WDY'
  | 'YRMT'
  | 'LGRJYY'
  | 'WK'
  | 'HH'
  | 'XHGJ';

export const AppConfigs: {
  [key in AppConfigKey]: AppConfigWithoutKey;
} = {
  // 总店
  ZD: {
    appId: '425063AC22F21CCD8E293004DDD8DA95',
    name: '总店',
    ID: 'ZD',
  },
  // 国防科大店
  GFKD: {
    appId: '61E01736F3D18ED9DFF010822727A554',
    name: '国防科大店',
    ID: 'GFKD',
  },
  // 物电院店
  WDY: {
    appId: '6404DCDF60F11C631B351FB22A5FA160',
    name: '物电院店',
    ID: 'WDY',
  },
  // 渔人码头店
  YRMT: {
    appId: '4B2ACEBACEB8B4D72F5BC73342F80349',
    name: '渔人码头店',
    ID: 'YRMT',
  },
  // 麓谷软件园店
  LGRJYY: {
    appId: '680B5B171182B5A560AB5E8DFDBF8702',
    name: '麓谷软件园店',
    ID: 'LGRJYY',
  },
  // 五矿店
  WK: {
    appId: '08F7923F3FA9B18E2B6F3C22D8A99A8B',
    name: '五矿店',
    ID: 'WK',
  },
  // 后湖店
  HH: {
    appId: '854FBFA0B529EF89C7470ADD0B438D80',
    name: '后湖店',
    ID: 'HH',
  },
  // 旭辉国际店
  XHGJ: {
    appId: 'C349F318D17EAAA3DF40021833636734',
    name: '旭辉国际店',
    ID: 'XHGJ',
  },
};
