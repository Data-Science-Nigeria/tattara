import { ForbiddenException } from '@nestjs/common';
import { EntityMetadata, In } from 'typeorm';
import {
  addOwnershipConstraint,
  buildWhereClause,
  extractIds,
  validateOwnershipChange,
} from '../repository.helpers';

describe('Repository Helpers', () => {
  // Mock metadata
  const mockMetadata = {
    primaryColumns: [{ propertyName: 'id' }],
  } as unknown as EntityMetadata;

  describe('buildWhereClause', () => {
    it('should return the same object if already a where clause', () => {
      const whereClause = { name: 'test', isActive: true };
      const result = buildWhereClause(whereClause, mockMetadata);

      expect(result).toEqual(whereClause);
    });

    it('should convert single string ID to where clause', () => {
      const result = buildWhereClause('uuid-123', mockMetadata);

      expect(result).toEqual({ id: 'uuid-123' });
    });

    it('should convert single number ID to where clause', () => {
      const result = buildWhereClause(123, mockMetadata);

      expect(result).toEqual({ id: 123 });
    });

    it('should convert Date to where clause', () => {
      const date = new Date('2025-01-01');
      const result = buildWhereClause(date, mockMetadata);

      expect(result).toEqual({ id: date });
    });

    it('should convert array of IDs to In() clause', () => {
      const ids = ['uuid-1', 'uuid-2', 'uuid-3'];
      const result = buildWhereClause(ids, mockMetadata);

      expect(result).toEqual({ id: In(ids) });
    });

    it('should handle array of numbers', () => {
      const ids = [1, 2, 3];
      const result = buildWhereClause(ids, mockMetadata);

      expect(result).toEqual({ id: In(ids) });
    });
  });

  describe('addOwnershipConstraint', () => {
    it('should add ownership field to where clause', () => {
      const whereClause = { name: 'test' };
      const result = addOwnershipConstraint(
        whereClause,
        'createdBy',
        'user-123',
      );

      expect(result).toEqual({
        name: 'test',
        createdBy: 'user-123',
      });
    });

    it('should not override existing fields', () => {
      const whereClause = { id: 'uuid-1', name: 'test' };
      const result = addOwnershipConstraint(
        whereClause,
        'createdBy',
        'user-123',
      );

      expect(result).toEqual({
        id: 'uuid-1',
        name: 'test',
        createdBy: 'user-123',
      });
    });

    it('should work with empty where clause', () => {
      const result = addOwnershipConstraint({}, 'createdBy', 'user-123');

      expect(result).toEqual({ createdBy: 'user-123' });
    });
  });

  describe('extractIds', () => {
    it('should extract IDs from entities', () => {
      const entities = [
        { id: 'uuid-1', name: 'test1' },
        { id: 'uuid-2', name: 'test2' },
        { id: 'uuid-3', name: 'test3' },
      ];

      const result = extractIds(entities);

      expect(result).toEqual(['uuid-1', 'uuid-2', 'uuid-3']);
    });

    it('should filter out entities without IDs', () => {
      const entities = [
        { id: 'uuid-1', name: 'test1' },
        { name: 'test2' } as any, // No ID
        { id: 'uuid-3', name: 'test3' },
      ];

      const result = extractIds(entities);

      expect(result).toEqual(['uuid-1', 'uuid-3']);
    });

    it('should handle empty array', () => {
      const result = extractIds([]);

      expect(result).toEqual([]);
    });

    it('should handle numeric IDs', () => {
      const entities = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ];

      const result = extractIds(entities);

      expect(result).toEqual([1, 2]);
    });
  });

  describe('validateOwnershipChange', () => {
    it('should throw error when trying to change ownership', () => {
      const partialEntity = { name: 'updated', createdBy: 'other-user' };

      expect(() => {
        validateOwnershipChange(partialEntity, 'createdBy', 'user-123');
      }).toThrow(ForbiddenException);

      expect(() => {
        validateOwnershipChange(partialEntity, 'createdBy', 'user-123');
      }).toThrow('Cannot change record ownership');
    });

    it('should allow updates when ownership stays the same', () => {
      const partialEntity = { name: 'updated', createdBy: 'user-123' };

      expect(() => {
        validateOwnershipChange(partialEntity, 'createdBy', 'user-123');
      }).not.toThrow();
    });

    it('should allow updates when ownership field is not included', () => {
      const partialEntity = { name: 'updated', isActive: false };

      expect(() => {
        validateOwnershipChange(partialEntity, 'createdBy', 'user-123');
      }).not.toThrow();
    });

    it('should allow updates when ownership field is undefined', () => {
      const partialEntity = { name: 'updated', createdBy: undefined };

      expect(() => {
        validateOwnershipChange(partialEntity, 'createdBy', 'user-123');
      }).not.toThrow();
    });
  });
});
