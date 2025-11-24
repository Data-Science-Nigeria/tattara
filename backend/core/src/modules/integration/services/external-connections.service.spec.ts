import { Test, TestingModule } from '@nestjs/testing';
import { ExternalConnectionsService } from './external-connections.service';

describe('ExternalConnectionsService', () => {
  let service: ExternalConnectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExternalConnectionsService],
    }).compile();

    service = module.get<ExternalConnectionsService>(
      ExternalConnectionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
