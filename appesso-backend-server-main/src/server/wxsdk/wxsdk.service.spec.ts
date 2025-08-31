import { Test, TestingModule } from '@nestjs/testing';
import { WxsdkService } from './wxsdk.service';

describe('WxsdkService', () => {
  let service: WxsdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WxsdkService],
    }).compile();

    service = module.get<WxsdkService>(WxsdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
