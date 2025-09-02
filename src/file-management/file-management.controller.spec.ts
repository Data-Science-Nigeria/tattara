import { Test, TestingModule } from '@nestjs/testing';
import { FileManagementController } from './file-management.controller';

describe('FileManagementController', () => {
  let controller: FileManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileManagementController],
    }).compile();

    controller = module.get<FileManagementController>(FileManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
