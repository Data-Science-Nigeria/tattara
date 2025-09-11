import { ConflictException, Injectable } from '@nestjs/common';
import { Program } from 'src/database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow } from 'src/database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
  ) {}

  async create(programData: Partial<Program>): Promise<Program> {
    const existingProgram = await this.programRepository.findOne({
      where: { name: programData.name },
    });

    if (existingProgram) {
      throw new ConflictException('Program with this name already exists');
    }

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

  async findAllWithPagination(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ programs: Program[]; total: number }> {
    const [programs, total] = await this.programRepository.findAndCount({
      relations: ['workflows'],
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
}
