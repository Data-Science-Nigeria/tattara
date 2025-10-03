import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalConnection, User } from 'src/database/entities';

@Injectable()
export class ExternalConnectionService {
  constructor(
    @InjectRepository(ExternalConnection)
    private readonly connectionRepo: Repository<ExternalConnection>,
  ) {}

  async create(data: Partial<ExternalConnection>): Promise<ExternalConnection> {
    const conn = this.connectionRepo.create(data);
    return this.connectionRepo.save(conn);
  }

  async createByUser(
    data: Partial<ExternalConnection>,
    currentUser: User,
  ): Promise<ExternalConnection> {
    const conn = this.connectionRepo.create({
      ...data,
      createdBy: currentUser,
    });

    return this.connectionRepo.save(conn);
  }

  async findAll(currentUser: User): Promise<ExternalConnection[]> {
    return this.connectionRepo.find({
      where: { createdBy: { id: currentUser.id } },
    });
  }

  async findAllByUserId(userId: string): Promise<ExternalConnection[]> {
    return this.connectionRepo.find({
      where: {
        createdBy: {
          id: userId,
        },
      },
    });
  }

  async findOne(id: string): Promise<ExternalConnection> {
    return this.connectionRepo.findOneOrFail({ where: { id } });
  }

  async findOneByUser(id: string, user: User): Promise<ExternalConnection> {
    const conn = await this.connectionRepo.findOne({
      where: { id, createdBy: { id: user.id } },
    });

    if (!conn)
      throw new NotFoundException(`Connection with id ${id} not found`);

    return conn;
  }

  async update(
    id: string,
    user: User,
    data: Partial<ExternalConnection>,
  ): Promise<ExternalConnection> {
    const existing = await this.findOneByUser(id, user);

    if (data.configuration) {
      existing.configuration = {
        ...existing.configuration,
        ...data.configuration,
      };
      delete data.configuration;
    }

    Object.assign(existing, data);

    return this.connectionRepo.save(existing);
  }

  async remove(id: string, user: User): Promise<void> {
    const conn = await this.findOneByUser(id, user);
    await this.connectionRepo.remove(conn);
  }
}
