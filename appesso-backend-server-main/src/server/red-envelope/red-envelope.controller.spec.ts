import { Test, TestingModule } from '@nestjs/testing';
import { RedEnvelopeController } from './red-envelope.controller';

describe('RedEnvelopeController', () => {
  let controller: RedEnvelopeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedEnvelopeController],
    }).compile();

    controller = module.get<RedEnvelopeController>(RedEnvelopeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
