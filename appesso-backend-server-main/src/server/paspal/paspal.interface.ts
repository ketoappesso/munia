export type RespType<T> = {
  data: T;
  status: string;
  messages: string[];
};

export enum ApiNames {
  QueryCustomerPages = 'customerOpenApi/queryCustomerPages', // 分页请求所有用户数据。
  QueryPushUrl = 'openNotificationOpenApi/queryPushUrl', // 推送地址查询
  UpdatePushUrl = 'openNotificationOpenApi/updatePushUrl', // 推送地址修改
  QueryByNumber = 'customerOpenApi/queryByNumber', // 会员号查询对应顾客信息
  QueryByPhone = 'customerOpenapi/queryBytel', // 根据手机号查询会员信息
  UpdateBalancePointByIncrement = 'customerOpenApi/updateBalancePointByIncrement', // 修改会员积分/余额
}

// 由于每一个Req类型都需要appId，因此AppId不定义在请求体里，剥离出去，不需要在这里填

// -----------------------------------------------QueryPushUrl------推送地址查询-----------------------------------------------
export type QueryPushUrlReq = Record<string, never>;
export type QueryPushUrlResp = {
  enable: number; // 1 可用，0不可用
  configTime: string; // 配置时间
  startUseTime: string; // 开始使用时间
  endUseTime: string; // 停止使用时间
};

// -----------------------------------------------UpdatePushUrl------推送地址修改-----------------------------------------------
export type UpdatePushUrlReq = {
  pushUrl: string;
};
export type UpdatePushUrlResp = undefined;

// -----------------------------------------------QueryByNumber------会员号查询对应顾客信息-----------------------------------------------
type WeixinOpenId = {
  openId: string; // openId
  openIdType: number; // 0公众号 1小程序 1000微信UnionId
};
type ExtInfo = {
  sex: number | null; // 性别：1-男，0-女，NULL未填写
  lunarBirthday: string; // 阴历生日
  totalPoint: number; // 累计积分
  creditLimit: number; // 赊账额度
  creditPeriod: number; // 赊账账期，单位天
  photoPath: string; // 会员照片路径 返回的不带域名，请自行加上域名:https://imgw.pospal.cn
  nickName: string; // 会员昵称
  subsidyAmount: number; // 补贴余额
};
export type QueryByNumberReq = {
  customerNum: string;
};
export type QueryByNumberResp = {
  customerUid: bigint; // 会员在银豹系统的唯一标识
  categoryName: string; // 会员所属分类名称
  number: string; // 会员号
  name: string; // 会员姓名
  point: number; // 会员当前积分
  discount: number; // 会员享受的折扣，60%以60表示
  balance: number; // 会员当前通用余额
  phone: string; // 会员联系电话
  birthday: string; // 会员生日
  qq: string; // QQ号
  email: string; // 会员邮箱
  address: string; // 会员住址
  remarks: string; // 备注信息
  createdDate: string; // 创建会员的日期
  onAccount: number; // 是否允许赊账，1表示允许
  enable: number; // -1:删除;0:禁用;1:可用;
  password: string; // 调用encryptToMd5String(String content)处理
  expiryDate: string; // 到期日期
  createStoreAppIdOrAccount: string; // 开卡门店
  department: string; // 部门（仅团餐业务支持）
  weixinOpenIds?: WeixinOpenId[]; // 微信openId相关信息
  extInfo?: ExtInfo; // 扩展信息
};

// -----------------------------------------------QueryByPhone------手机号查询对应顾客信息-----------------------------------------------
export type QueryByPhoneReq = {
  customerTel: string;
};

export type QueryByPhoneResp = QueryByNumberResp[];

// -----------------------------------------------QueryCustomerPages------分页请求所有用户数据。-----------------------------------------------
type PostBackParameter = {
  parameterType: string; // 从返回结果中直接取出用于回传，不能变其值
  parameterValue: string; // 从返回结果中直接取出用于回传，不能变其值
};

type Customer = {
  // Customer字段详情参考上面的接口
  customerUid: bigint;
  categoryName: string;
  number: string;
  name: string;
  point: number;
  discount: number;
  balance: number;
  phone: string;
  birthday: string;
  qq: string;
  email: string;
  address: string;
  createdDate: string;
  password: string;
  onAccount: number;
  enable: number;
};
export type QueryCustomerPagesReq = {
  postBackParameter?: PostBackParameter;
};
export type QueryCustomerPagesResp = {
  postBackParameter?: PostBackParameter; // 分页查询回传到服务器的参数结构从第二页开始必须回传，如果没传，每次查询都是第一页
  pageSize: number; // 本次查询预期从数据库中取出记录数，如果结果集的长度小于pageSize，不需要进行下一页查询
  result: Customer[]; // 会员字段参照上面那个json的定义
};

// -----------------------------------------------updateBalancePointByIncrement------修改会员余额积分-----------------------------------------------
export enum IsValidateBalance {
  TRUE = 1,
  FALSE = 0,
}
export type updateBalancePointByIncrementReq = {
  customerUid: bigint;
  balanceIncrement?: number; // 余额增长量，正数为相应增加，负数为相应减少。
  pointIncrement?: number; // 积分增长量，正数为相应增加，负数为相应减少。
  dataChangeTime: string; // 调用时间。
  validateBalance: IsValidateBalance; // 是否校验余额。
};

export type updateBalancePointByIncrementResp = {
  customerUid: bigint;
  balanceBeforeUpdate: number;
  balanceAfterUpdate: number;
  balanceIncrement: number;
  pointBeforeUpdate: number;
  pointAfterUpdate: number;
  pointIncrement: number;
  dataChangeTime: string;
  updateCustomerTime: string;
};
// -----------------------------------------------输入类型和输出类型定义------新增接口这里需同步修改-----------------------------------------------
// 输入类型映射
export type ApiReq<T extends ApiNames> = T extends ApiNames.QueryCustomerPages
  ? QueryCustomerPagesReq
  : T extends ApiNames.QueryPushUrl
  ? QueryPushUrlReq
  : T extends ApiNames.UpdatePushUrl
  ? UpdatePushUrlReq
  : T extends ApiNames.QueryByNumber
  ? QueryByNumberReq
  : T extends ApiNames.QueryByPhone
  ? QueryByPhoneReq
  : T extends ApiNames.UpdateBalancePointByIncrement
  ? updateBalancePointByIncrementReq
  : never;

// 输出类型映射
export type ApiResp<T extends ApiNames> = T extends ApiNames.QueryCustomerPages
  ? QueryCustomerPagesResp
  : T extends ApiNames.QueryPushUrl
  ? QueryPushUrlResp
  : T extends ApiNames.UpdatePushUrl
  ? UpdatePushUrlResp
  : T extends ApiNames.QueryByNumber
  ? QueryByNumberResp
  : T extends ApiNames.QueryByPhone
  ? QueryByPhoneResp
  : T extends ApiNames.UpdateBalancePointByIncrement
  ? updateBalancePointByIncrementResp
  : never;
