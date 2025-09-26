import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RolesPermissionsSeed } from './roles-permissions.seed';

@Injectable()
export class SeedService {
  constructor(private readonly dataSource: DataSource) {}

  async runSeeds() {
    console.log('Running database seeds...');

    const rolesPermissionsSeed = new RolesPermissionsSeed();
    await rolesPermissionsSeed.run(this.dataSource);

    console.log('All seeds completed!');
  }
}
