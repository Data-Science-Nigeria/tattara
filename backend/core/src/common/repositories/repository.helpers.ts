import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  EntityMetadata,
  FindOptionsWhere,
  In,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  AnyCriteria,
  CreatorFieldConfig,
  ScopingContext,
} from '../interfaces/repository.interface';

/**
 * Converts various criteria formats to FindOptionsWhere
 */
export function buildWhereClause<T extends ObjectLiteral>(
  criteria: AnyCriteria<T>,
  metadata: EntityMetadata,
): FindOptionsWhere<T> {
  // Already a proper where clause
  if (
    typeof criteria === 'object' &&
    !Array.isArray(criteria) &&
    !(criteria instanceof Date)
  ) {
    return criteria;
  }

  const primaryColumn = metadata.primaryColumns[0].propertyName;

  // Handle arrays (multiple IDs)
  if (Array.isArray(criteria)) {
    return {
      [primaryColumn]: In(criteria as any[]),
    } as FindOptionsWhere<T>;
  }

  // Handle single values
  return {
    [primaryColumn]: criteria,
  } as FindOptionsWhere<T>;
}

/**
 * Adds ownership constraint to where clause
 */
export function addOwnershipConstraint<T extends ObjectLiteral>(
  whereClause: FindOptionsWhere<T>,
  creatorField: string,
  userId: string,
): FindOptionsWhere<T> {
  return {
    ...whereClause,
    [creatorField]: userId,
  } as FindOptionsWhere<T>;
}

/**
 * Applies user-based scoping to query builder
 */
export function applyScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  context: ScopingContext,
  creatorConfig: CreatorFieldConfig,
  skipScope = false,
): void {
  if (skipScope || context.isSuperAdmin || !creatorConfig.exists) {
    return;
  }

  if (context.userId && context.isAdmin) {
    qb.andWhere(`${qb.alias}.${creatorConfig.columnName} = :userId`, {
      userId: context.userId,
    });
  }
}

/**
 * Applies relations recursively to query builder
 */
export function applyRelations<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  relations: string[],
): void {
  for (const relation of relations) {
    const parts = relation.split('.');
    let parentAlias = alias;

    for (let i = 0; i < parts.length; i++) {
      const relAlias = parts.slice(0, i + 1).join('_');

      if (
        !qb.expressionMap.joinAttributes.find(j => j.alias?.name === relAlias)
      ) {
        qb.leftJoinAndSelect(`${parentAlias}.${parts[i]}`, relAlias);
      }

      parentAlias = relAlias;
    }
  }
}

/**
 * Extracts IDs from entities
 */
export function extractIds<T extends { id: string | number }>(
  entities: T[],
): (string | number)[] {
  return entities.map(entity => entity.id).filter(Boolean);
}

/**
 * Validates that user owns all entities by their IDs
 */
export async function validateOwnership<T extends ObjectLiteral>(
  repository: Repository<T>,
  ids: (string | number)[],
  userId: string,
  creatorField: string,
): Promise<void> {
  if (ids.length === 0) {
    throw new BadRequestException('No valid entities provided');
  }

  const ownedCount = await repository.count({
    where: {
      id: In(ids),
      [creatorField]: userId,
    } as unknown as FindOptionsWhere<T>,
  });

  if (ownedCount !== ids.length) {
    throw new ForbiddenException(
      'Cannot perform operation - some records do not belong to you or do not exist',
    );
  }
}

/**
 * Validates ownership change attempts
 */
export function validateOwnershipChange(
  partialEntity: any,
  creatorField: string,
  userId: string,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (partialEntity[creatorField] && partialEntity[creatorField] !== userId) {
    throw new ForbiddenException('Cannot change record ownership');
  }
}
