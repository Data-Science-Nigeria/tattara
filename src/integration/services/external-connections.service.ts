import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalConnection } from 'src/database/entities';

@Injectable()
export class ExternalConnectionsService {
    constructor(
        @InjectRepository(ExternalConnection)
        private readonly connectionRepo: Repository<ExternalConnection>,
    ) {}

    async create(data: Partial<ExternalConnection>): Promise<ExternalConnection> {
        const conn = this.connectionRepo.create(data);
        return this.connectionRepo.save(conn);
    }

    async findAll(): Promise<ExternalConnection[]> {
        return this.connectionRepo.find();
    }

    async findOne(id: string): Promise<ExternalConnection> {
        return this.connectionRepo.findOneOrFail({ where: { id}});
    }

    async update(id: string, data: Partial<ExternalConnection>): Promise<ExternalConnection> {
        const existing = await this.findOne(id);
        Object.assign(existing, data);
        return this.connectionRepo.save(existing);
    }

    async remove(id: string): Promise<void> {
        await this.connectionRepo.delete(id);
    }
}
