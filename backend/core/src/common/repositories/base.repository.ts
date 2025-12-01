/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { RequestContext } from '@/shared/request-context/request-context.service';
import { ForbiddenException } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  DeleteResult,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  RemoveOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  addOwnershipConstraint,
  applyRelations,
  applyScope,
  buildWhereClause,
  extractIds,
  validateOwnership,
  validateOwnershipChange,
} from './repository.helpers';
import { AnyCriteria, CreatorFieldConfig, ScopingContext } from '../interfaces';

/**
 * BaseRepository that automatically scopes queries by created_by_id.
 * Ideal for multi-user data separation with ownership validation.
 */
export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  private readonly creatorConfig: CreatorFieldConfig;

  constructor(
    entity: EntityTarget<T>,
    dataSourceOrManager: DataSource | EntityManager,
    private readonly requestContext: RequestContext,
    private readonly creatorField: string = 'createdBy',
  ) {
    const manager =
      dataSourceOrManager instanceof DataSource
        ? dataSourceOrManager.createEntityManager()
        : dataSourceOrManager;

    super(entity, manager);

    this.creatorConfig = this.initializeCreatorConfig(manager, entity);
  }

  private initializeCreatorConfig(
    manager: EntityManager,
    entity: EntityTarget<T>,
  ): CreatorFieldConfig {
    const metadata = manager.connection.getMetadata(entity);
    const column =
      metadata.findColumnWithPropertyName(this.creatorField) ||
      metadata.columns.find(col => col.databaseName === this.creatorField);

    if (column) {
      return {
        propertyName: column.propertyName,
        columnName: column.databaseName,
        exists: true,
      };
    }

    return {
      propertyName: this.creatorField,
      columnName: this.creatorField,
      exists: false,
    };
  }

  private getScopingContext(): ScopingContext {
    return {
      userId: this.requestContext.getUserId(),
      isSuperAdmin: this.requestContext.isSuperAdmin(),
      isAdmin: this.requestContext.isAdmin(),
    };
  }

  private shouldSkipScoping(): boolean {
    return !this.creatorConfig.exists || this.requestContext.isSuperAdmin();
  }

  /**
   * Returns a query builder that automatically applies the creator scope.
   */
  withScope(alias: string): SelectQueryBuilder<T> {
    const qb = this.createQueryBuilder(alias);
    applyScope(qb, this.getScopingContext(), this.creatorConfig);
    return qb;
  }

  static fromManager<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    manager: EntityManager,
    requestContext: RequestContext,
    creatorField = 'createdBy',
  ): BaseRepository<T> {
    const repo = new BaseRepository<T>(
      entity,
      manager,
      requestContext,
      creatorField,
    );

    Object.setPrototypeOf(repo, BaseRepository.prototype);

    return repo;
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const alias = this.metadata.name.toLowerCase();
    const qb = this.createQueryBuilder(alias);

    if (options?.where) {
      if (
        typeof options.where === 'string' ||
        typeof options.where === 'function'
      ) {
        qb.andWhere(options.where);
      } else {
        qb.where(options.where);
      }
    }

    if (options?.order) {
      Object.entries(options.order).forEach(([field, direction]) => {
        qb.addOrderBy(`${alias}.${field}`, direction as 'ASC' | 'DESC');
      });
    }

    if (options?.take) qb.take(options.take);
    if (options?.skip) qb.skip(options.skip);

    if (options?.relations?.length) {
      applyRelations(qb, alias, options.relations as string[]);
    }

    applyScope(qb, this.getScopingContext(), this.creatorConfig);

    return qb.getMany();
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const alias = this.metadata.name.toLowerCase();
    const qb = this.createQueryBuilder(alias);

    if (options.where) qb.andWhere(options.where as any);

    if (options.relations?.length) {
      applyRelations(qb, alias, options.relations as string[]);
    }

    applyScope(qb, this.getScopingContext(), this.creatorConfig);

    return qb.getOne();
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    const alias = this.metadata.name.toLowerCase();
    const qb = this.createQueryBuilder(alias);

    if (options?.where) {
      if (
        typeof options.where === 'string' ||
        typeof options.where === 'function'
      ) {
        qb.andWhere(options.where);
      } else {
        qb.where(options.where);
      }
    }

    if (options?.relations?.length) {
      applyRelations(qb, alias, options.relations as string[]);
    }

    if (options?.take) qb.take(options.take);
    if (options?.skip) qb.skip(options.skip);

    applyScope(qb, this.getScopingContext(), this.creatorConfig);

    try {
      return await qb.getManyAndCount();
    } catch (error) {
      console.error('Error in getManyAndCount:', error);
      throw error;
    }
  }

  async save<T extends ObjectLiteral>(
    entity: DeepPartial<T>,
    options?: SaveOptions,
  ): Promise<T>;
  async save<T extends ObjectLiteral>(
    entities: DeepPartial<T>[],
    options?: SaveOptions,
  ): Promise<T[]>;
  async save<T extends ObjectLiteral>(
    entities: DeepPartial<T> | DeepPartial<T>[],
    options?: SaveOptions,
  ): Promise<T | T[]> {
    const userId = this.requestContext.getUserId();
    const isSuperAdmin = this.requestContext.isSuperAdmin();
    const list = Array.isArray(entities) ? entities : [entities];

    for (const entity of list) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const entityAny = entity as any;

      const isNew = !entityAny['id'];

      // Set creator on new records
      if (
        isNew &&
        userId &&
        !entityAny[this.creatorConfig.propertyName] &&
        this.creatorConfig.exists
      ) {
        entityAny[this.creatorConfig.propertyName] = userId;
      }

      // Verify ownership on updates
      if (!isNew && !isSuperAdmin) {
        const existing = await this.findOne({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: { id: entityAny['id'] } as any,
        });

        if (!existing) {
          throw new ForbiddenException(
            'Cannot update record that does not belong to you',
          );
        }

        // Prevent changing ownership
        validateOwnershipChange(
          entityAny,
          this.creatorConfig.propertyName,
          userId,
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return super.save(entities as any, options);
  }

  async update(
    criteria: AnyCriteria<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    if (this.shouldSkipScoping()) {
      return super.update(criteria, partialEntity);
    }

    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    validateOwnershipChange(
      partialEntity,
      this.creatorConfig.propertyName,
      userId,
    );

    const whereClause = buildWhereClause(criteria, this.metadata);
    const scopedWhere = addOwnershipConstraint(
      whereClause,
      this.creatorConfig.propertyName,
      userId,
    );

    return super.update(scopedWhere, partialEntity);
  }

  async delete(criteria: AnyCriteria<T>): Promise<DeleteResult> {
    if (this.shouldSkipScoping()) {
      return super.delete(criteria);
    }

    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const whereClause = buildWhereClause(criteria, this.metadata);
    const scopedWhere = addOwnershipConstraint(
      whereClause,
      this.creatorConfig.propertyName,
      userId,
    );

    return super.delete(scopedWhere);
  }

  async remove(entity: T, options?: RemoveOptions): Promise<T>;
  async remove(entities: T[], options?: RemoveOptions): Promise<T[]>;
  async remove(entities: T | T[], options?: RemoveOptions): Promise<T | T[]> {
    if (this.shouldSkipScoping()) {
      return super.remove(entities as any, options);
    }

    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const list = Array.isArray(entities) ? entities : [entities];
    const ids = extractIds(list as any);

    await validateOwnership(this, ids, userId, this.creatorConfig.propertyName);

    return super.remove(entities as any, options);
  }

  async softDelete(criteria: AnyCriteria<T>): Promise<UpdateResult> {
    if (this.shouldSkipScoping()) {
      return super.softDelete(criteria);
    }

    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const whereClause = buildWhereClause(criteria, this.metadata);
    const scopedWhere = addOwnershipConstraint(
      whereClause,
      this.creatorConfig.propertyName,
      userId,
    );

    return super.softDelete(scopedWhere);
  }

  async restore(criteria: AnyCriteria<T>): Promise<UpdateResult> {
    if (this.shouldSkipScoping()) {
      return super.restore(criteria);
    }

    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const whereClause = buildWhereClause(criteria, this.metadata);
    const scopedWhere = addOwnershipConstraint(
      whereClause,
      this.creatorConfig.propertyName,
      userId,
    );

    return super.restore(scopedWhere);
  }
}
