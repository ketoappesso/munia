import { Test, TestingModule } from '@nestjs/testing';
import { StsController } from './sts.controller';

describe('StsController', () => {
  let controller: StsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StsController],
    }).compile();

    controller = module.get<StsController>(StsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
