import { Test, TestingModule } from '@nestjs/testing';
import { ExternalConnectionsController } from './external-connections.controller';

describe('ExternalConnectionsController', () => {
  let controller: ExternalConnectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExternalConnectionsController],
    }).compile();

    controller = module.get<ExternalConnectionsController>(
      ExternalConnectionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
