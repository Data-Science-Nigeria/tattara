import { Test, TestingModule } from '@nestjs/testing';
import { ExternalConnectionService } from './external-connections.service';

describe('ExternalConnectionsService', () => {
  let service: ExternalConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExternalConnectionService],
    }).compile();

    service = module.get<ExternalConnectionService>(ExternalConnectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
