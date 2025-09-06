import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeedService } from './seeds/seed.service';
import { User, Role, Permission } from './entities';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [User, Role, Permission],
        migrations: ['src/database/migrations/*{.ts,.js}'], // Updated path
        synchronize: false, // Set to false in production
        logging: false,
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Role, Permission]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
