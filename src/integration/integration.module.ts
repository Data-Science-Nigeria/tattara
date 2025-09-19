import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalConnection } from 'src/database/entities';
import { ExternalConnectionsService, IntegrationService } from './services';
import { ExternalConnectionsController, IntegrationController  } from './controllers';
import { PostgresStrategy, Dhis2Strategy } from './strategies';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalConnection])],
  providers: [
    IntegrationService, 
    ExternalConnectionsService,
    PostgresStrategy,
    Dhis2Strategy
  ],
  controllers: [IntegrationController, ExternalConnectionsController],
  exports: [IntegrationService, ExternalConnectionsService],
})
export class IntegrationModule {}
