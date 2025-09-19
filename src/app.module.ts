import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import basicAuth from 'express-basic-auth';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CollectorModule } from './modules/collector/collector.module';
import { FileManagerModule } from './modules/file-manager/file-manager.module';
import { ProgramModule } from './modules/program/program.module';
import { UserModule } from './modules/user/user.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { MailModule } from './shared/mail/mail.module';
import { QueueModule } from './shared/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    MailModule,
    FileManagerModule,
    ProgramModule,
    QueueModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      middleware: basicAuth({
        challenge: true,
        users: { admin: 'tattara' },
      }),
    }),
    WorkflowModule,
    CollectorModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
