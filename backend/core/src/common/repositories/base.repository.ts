/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { RequestContext } from '@/shared/request-context/request-context.service';
import { ForbiddenException } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  RemoveOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

/**
 * BaseRepository that automatically scopes queries by created_by_id.
 * Ideal when each record belongs to its creator (multi-user data separation).
 */
export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  private readonly creatorPropertyName: string;
  private readonly creatorColumnName: string;

  constructor(
    entity: EntityTarget<T>,
    dataSourceOrManager: DataSource | EntityManager,
    private readonly requestContext: RequestContext,
    private readonly creatorField: string = 'createdBy',
  ) {
    // super(entity, dataSource.createEntityManager());
    // const manager =
    //   dataSourceOrManager instanceof DataSource
    //     ? dataSourceOrManager.createEntityManager()
    //     : dataSourceOrManager;

    // super(entity, manager);

    const manager =
      dataSourceOrManager instanceof DataSource
        ? dataSourceOrManager.createEntityManager()
        : dataSourceOrManager;

    super(entity, manager);

    // Smart lookup: try to find by property name or column name
    const metadata = manager.connection.getMetadata(entity);
    const column =
      metadata.findColumnWithPropertyName(creatorField) ||
      metadata.columns.find(col => col.databaseName === creatorField);

    if (column) {
      this.creatorPropertyName = column.propertyName; // For entity operations
      this.creatorColumnName = column.databaseName; // For query builder
    } else {
      this.creatorPropertyName = creatorField;
      this.creatorColumnName = creatorField;
    }
  }

  /**
   * Returns a query builder that automatically applies the creator scope.
   */
  withScope(alias: string): SelectQueryBuilder<T> {
    const qb = this.createQueryBuilder(alias);
    this.applyScope(qb);
    return qb;
  }

  static fromManager<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    manager: EntityManager,
    requestContext: RequestContext,
    creatorField = 'createdBy',
  ): BaseRepository<T> {
    // const dataSource: DataSource = (
    //   manager as EntityManager & { dataSource: DataSource }
    // ).dataSource;

    const repo = new BaseRepository<T>(
      entity,
      manager,
      requestContext,
      creatorField,
    );

    Object.setPrototypeOf(repo, BaseRepository.prototype);

    // (repo as unknown as { manager: EntityManager }).manager = manager;

    return repo;
  }

  /**
   * Applies user-based scoping unless the user is a super admin.
   */
  private applyScope(qb: SelectQueryBuilder<T>, skipScope = false): void {
    if (skipScope || this.requestContext.isSuperAdmin()) return;

    const userId = this.requestContext.getUserId();

    const hasCreatorField = this.metadata.findColumnWithPropertyName(
      this.creatorPropertyName,
    );

    if (userId && hasCreatorField) {
      qb.andWhere(`${qb.alias}.${this.creatorColumnName} = :userId`, {
        userId,
      });
    }
  }

  private applyRelationsRecursively(
    qb: SelectQueryBuilder<T>,
    alias: string,
    relations: string[],
  ) {
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
   * Overridden find() — automatically scoped by created_by_id.
   */
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    const alias = this.metadata.name.toLowerCase();
    const qb = this.createQueryBuilder(alias);

    if (options?.where) {
      if (
        typeof options.where === 'string' ||
        typeof options.where === 'function'
      ) {
        qb.andWhere(options.where);
      } else if (typeof options.where === 'object') {
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
      this.applyRelationsRecursively(qb, alias, options.relations as string[]);
    }

    this.applyScope(qb);

    return qb.getMany();
  }

  /**
   * Overridden findOne() — automatically scoped by created_by_id.
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const alias = this.metadata.name.toLowerCase();
    const qb = this.createQueryBuilder(alias);

    if (options.where) qb.andWhere(options.where as any);
    if (options.relations?.length) {
      this.applyRelationsRecursively(qb, alias, options.relations as string[]);
    }

    this.applyScope(qb);

    return qb.getOne();
  }

  /**
   * Overridden findAndCount() — role-aware and scoped for pagination.
   */
  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    const alias = this.metadata.name.toLowerCase();
    const qb = this.createQueryBuilder(alias);
    if (options?.where) {
      if (
        typeof options.where === 'string' ||
        typeof options.where === 'function'
      ) {
        qb.andWhere(options.where);
      } else if (typeof options.where === 'object') {
        qb.where(options.where);
      }
    }
    if (options?.relations?.length) {
      this.applyRelationsRecursively(qb, alias, options.relations as string[]);
    }
    if (options?.take) qb.take(options.take);
    if (options?.skip) qb.skip(options.skip);
    this.applyScope(qb);
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

      // Set created_by_id on new records
      if (
        isNew &&
        userId &&
        !entityAny[this.creatorPropertyName as keyof T] &&
        this.metadata.findColumnWithPropertyName(this.creatorPropertyName)
      ) {
        entityAny[this.creatorPropertyName] = userId;
      }

      // SECURITY: Verify ownership on updates
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
        if (
          entityAny[this.creatorPropertyName as keyof T] &&
          entityAny[this.creatorPropertyName as keyof T] !== userId
        ) {
          throw new ForbiddenException('Cannot change record ownership');
        }
      }
    }

    console.log('Saving entities:', entities);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return super.save(entities as any, options);
  }

  async remove(entity: T, options?: RemoveOptions): Promise<T>;
  async remove(entities: T[], options?: RemoveOptions): Promise<T[]>;

  async remove(entities: T | T[], options?: RemoveOptions): Promise<T | T[]> {
    const isSuperAdmin = this.requestContext.isSuperAdmin();

    if (!isSuperAdmin) {
      const list = Array.isArray(entities) ? entities : [entities];
      for (const entity of list) {
        const exists = await this.findOne({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: { id: entity['id'] } as any,
        });
        if (!exists) {
          throw new ForbiddenException('Cannot delete record');
        }
      }
    }

    return super.remove(entities as any, options);
  }

  /**
   * Override update() to ensure users can only update their own records
   */
  async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    const isSuperAdmin = this.requestContext.isSuperAdmin();
    const userId = this.requestContext.getUserId();

    // Check if this entity uses the creator field
    const hasCreatorField = this.metadata.findColumnWithPropertyName(
      this.creatorField,
    );

    // If no creator field, allow the update (no scoping needed)
    if (!hasCreatorField) {
      return super.update(criteria, partialEntity);
    }

    // Super admins can update anything
    if (isSuperAdmin) {
      return super.update(criteria, partialEntity);
    }

    // For regular users, verify they own the records first
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Find the entities that match the criteria to verify ownership
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entitiesToUpdate = await this.find({ where: criteria as any });

    if (entitiesToUpdate.length === 0) {
      // No records found (either don't exist or don't belong to user)
      return { affected: 0, raw: [], generatedMaps: [] };
    }

    // Prevent changing ownership
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const partialAny = partialEntity as any;
    if (
      partialAny[this.creatorField] &&
      partialAny[this.creatorField] !== userId
    ) {
      throw new ForbiddenException('Cannot change record ownership');
    }

    // All checks passed, perform the update
    return super.update(criteria, partialEntity);
  }
}
