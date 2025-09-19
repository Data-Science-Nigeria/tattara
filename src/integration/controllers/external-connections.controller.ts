import { Controller, Post, Body, Param, Get, Patch, Delete } from '@nestjs/common';
import { ExternalConnectionsService } from '../services/external-connections.service';
import { ExternalConnection } from 'src/database/entities';


@Controller('external-connections')
export class ExternalConnectionsController {
    constructor(
        private readonly service: ExternalConnectionsService,
    ) {}

    @Post()
    async create(@Body() data: Partial<ExternalConnection>) {
        return this.service.create(data);
    }

    @Get()
    async findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: Partial<ExternalConnection>) {
        return this.service.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
