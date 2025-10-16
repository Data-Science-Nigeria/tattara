import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Program, User, Workflow } from '@/database/entities';
import { FindOptionsWhere, In, Repository } from 'typeorm';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    programData: Partial<Program>,
    currentUser: User,
  ): Promise<Program> {
    const existingProgram = await this.programRepository.findOne({
      where: { name: programData.name },
    });

    if (existingProgram) {
      throw new ConflictException('Program with this name already exists');
    }

    const program = this.programRepository.create({
      ...programData,
      createdBy: currentUser,
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
    const where: FindOptionsWhere<Program> | FindOptionsWhere<Program>[] = {};

    if (currentUser.hasRole('admin')) {
      if (userId) {
        const targetUserIds = Array.isArray(userId) ? userId : [userId];
        where.users = { id: In(targetUserIds) };
        where.createdBy = { id: currentUser.id };
      } else {
        where.createdBy = { id: currentUser.id };
      }
    } else {
      where.users = { id: In([currentUser.id]) };
    }

    const [programs, total] = await this.programRepository.findAndCount({
      where,
      relations: ['workflows', 'users'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

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
