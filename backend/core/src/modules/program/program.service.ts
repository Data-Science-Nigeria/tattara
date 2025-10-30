import { BaseRepository } from '@/common/repositories/base.repository';
import { Program, User, Workflow } from '@/database/entities';
import { RequestContext } from '@/shared/request-context/request-context.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProgramService {
  private readonly workflowRepository: BaseRepository<Workflow>;
  private readonly userRepository: BaseRepository<User>;
  private readonly programRepository: BaseRepository<Program>;

  constructor(
    private dataSource: DataSource,
    private readonly requestContext: RequestContext,
  ) {
    this.programRepository = new BaseRepository<Program>(
      Program,
      dataSource,
      this.requestContext,
    );
    this.workflowRepository = new BaseRepository<Workflow>(
      Workflow,
      dataSource,
      this.requestContext,
    );
    this.userRepository = new BaseRepository<User>(
      User,
      dataSource,
      this.requestContext,
    );
  }

  async create(programData: Partial<Program>): Promise<Program> {
    const program = this.programRepository.create({
      ...programData,
    });

    return this.programRepository.save(program);
  }

  async findAll(): Promise<Program[]> {
    return this.programRepository.find({
      relations: ['workflows'],
    });
  }

  async getPrograms(
    page: number = 1,
    limit: number = 10,
    currentUser: User,
    userId?: string | string[],
  ): Promise<{ programs: Program[]; total: number }> {
    const alias = 'program';
    const qb = this.programRepository.withScope(alias);

    qb.leftJoinAndSelect(`${alias}.workflows`, 'workflows').leftJoinAndSelect(
      `${alias}.users`,
      'users',
    );

    if (currentUser.hasRole('user') && !currentUser.hasRole('admin')) {
      qb.innerJoin(`${alias}.users`, 'user').andWhere('user.id = :userId', {
        userId: currentUser.id,
      });
    } else {
      if (userId) {
        const targetUserIds = Array.isArray(userId) ? userId : [userId];
        qb.andWhere('users.id IN (:...targetUserIds)', { targetUserIds });
      }
    }

    qb.orderBy(`${alias}.createdAt`, 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [programs, total] = await qb.getManyAndCount();

    return { programs, total };
  }

  async findOne(programId: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['workflows'],
    });
    if (!program) {
      throw new ConflictException('Program not found');
    }
    return program;
  }

  async update(
    programId: string,
    programData: Partial<Program>,
  ): Promise<Program> {
    await this.programRepository.update(programId, programData);
    return this.findOne(programId);
  }

  async remove(programId: string): Promise<void> {
    await this.programRepository.delete(programId);
  }

  async findAllWorkflows(programId: string): Promise<Workflow[]> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['workflows'],
    });

    if (!program) {
      throw new ConflictException('Program not found');
    }

    return program.workflows;
  }

  async addWorkflowToProgram(
    programId: string,
    workflowIds: string[],
  ): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['workflows'],
    });

    if (!program) {
      throw new ConflictException('Program not found');
    }

    // Fetch all workflow by their IDs
    const workflows = await this.workflowRepository.find({
      where: workflowIds.map(id => ({ id })),
    });

    if (workflows.length !== workflowIds.length) {
      throw new ConflictException('One or more workflows not found');
    }

    program.workflows.push(...workflows);

    return this.programRepository.save(program);
  }

  async assignUsersToProgram(
    userIds: string[],
    programId: string,
  ): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['users'],
    });

    if (!program) {
      throw new ConflictException('Program not found');
    }

    const users = await this.userRepository.find({
      where: userIds.map(id => ({ id })),
    });

    if (users.length !== userIds.length) {
      throw new ConflictException('One or more users not found');
    }

    program.users.push(...users);

    return this.programRepository.save(program);
  }

  async getAllProgramsForUser(userId: string): Promise<Program[]> {
    return this.programRepository.find({
      relations: ['users', 'workflows'],
      where: {
        users: {
          id: userId,
        },
      },
    });
  }
}
