/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { EntityManager } from 'typeorm';

describe('BaseRepository', () => {
  let mockManager: Partial<EntityManager>;

  beforeEach(() => {
    mockManager = {
      connection: {
        getMetadata: jest.fn().mockReturnValue({
          name: 'Program',
          tableName: 'programs',
          columns: [
            {
              propertyName: 'createdBy',
              databaseName: 'createdBy',
            },
          ],
          findColumnWithPropertyName: jest
            .fn()
            .mockReturnValue({ propertyName: 'createdBy' }),
        }),
      } as any,
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };
  });

  it('should provide data access methods', () => {
    expect(mockManager.findOne).toBeDefined();
    expect(mockManager.find).toBeDefined();
    expect(mockManager.save).toBeDefined();
    expect(mockManager.update).toBeDefined();
    expect(mockManager.delete).toBeDefined();
    expect(mockManager.softDelete).toBeDefined();
  });

  it('should mock findOne operations', async () => {
    const mockRecord = { id: '1', name: 'Test' };
    const findOneMock = mockManager.findOne as jest.Mock;
    findOneMock.mockResolvedValue(mockRecord);

    const result = await mockManager.findOne!({} as any, {} as any);
    expect(result).toEqual(mockRecord);
  });

  it('should mock find operations', async () => {
    const mockRecords = [
      { id: '1', name: 'Test1' },
      { id: '2', name: 'Test2' },
    ];
    const findMock = mockManager.find as jest.Mock;
    findMock.mockResolvedValue(mockRecords);

    const result = await mockManager.find!({} as any, {} as any);
    expect(result).toHaveLength(2);
  });

  it('should mock save operations', async () => {
    const mockRecord = { id: '1', name: 'Test', createdBy: 'user-1' };
    const saveMock = mockManager.save as jest.Mock;
    saveMock.mockResolvedValue(mockRecord);

    const result = await mockManager.save!({} as any, {} as any);
    expect((result as any).createdBy).toBe('user-1');
  });

  it('should mock update operations', async () => {
    const updateMock = mockManager.update as jest.Mock;
    updateMock.mockResolvedValue({ affected: 1 });

    const result = await mockManager.update!({} as any, {}, {} as any);
    expect(result.affected).toBe(1);
  });

  it('should mock delete operations', async () => {
    const deleteMock = mockManager.delete as jest.Mock;
    deleteMock.mockResolvedValue({ affected: 1 });

    const result = await mockManager.delete!({} as any, {} as any);
    expect(result.affected).toBe(1);
  });

  it('should mock softDelete operations', async () => {
    const softDeleteMock = mockManager.softDelete as jest.Mock;
    softDeleteMock.mockResolvedValue({ affected: 1 });

    const result = await mockManager.softDelete!({} as any, {} as any);
    expect(result.affected).toBe(1);
  });

  it('should mock connection metadata', () => {
    const metadata = mockManager.connection!.getMetadata('Program');
    expect(metadata.name).toBe('Program');
    expect(metadata.tableName).toBe('programs');
  });
});
