import { Test, TestingModule } from '@nestjs/testing';
import { PaspalService } from './paspal.service';

describe('PospalService', () => {
  let service: PaspalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaspalService],
    }).compile();

    service = module.get<PaspalService>(PaspalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
