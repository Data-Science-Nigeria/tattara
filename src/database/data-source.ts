import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, Role, Permission, FileUploads } from './entities';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Role, Permission, FileUploads],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  namingStrategy: new SnakeNamingStrategy(),
});
