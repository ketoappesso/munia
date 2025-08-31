import { Test, TestingModule } from '@nestjs/testing';
import { RedEnvelopeService } from './red-envelope.service';

describe('RedEnvelopeService', () => {
  let service: RedEnvelopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedEnvelopeService],
    }).compile();

    service = module.get<RedEnvelopeService>(RedEnvelopeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
