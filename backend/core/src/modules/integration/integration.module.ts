import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalConnection } from '@/database/entities';
import { ExternalConnectionService, IntegrationService } from './services';
import {
  ExternalConnectionsController,
  IntegrationController,
} from './controllers';
import {
  PostgresStrategy,
  Dhis2Strategy,
  SqlDatabaseStrategy,
  MysqlStrategy,
  SqliteStrategy,
  MssqlStrategy,
  OracleStrategy,
} from './strategies';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalConnection]), HttpModule],
  providers: [
    IntegrationService,
    ExternalConnectionService,
    PostgresStrategy,
    Dhis2Strategy,
    SqlDatabaseStrategy,
    MysqlStrategy,
    SqliteStrategy,
    MssqlStrategy,
    OracleStrategy,
  ],
  controllers: [IntegrationController, ExternalConnectionsController],
  exports: [IntegrationService, ExternalConnectionService],
})
export class IntegrationModule {}
