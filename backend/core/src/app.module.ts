import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import KeyvRedis from '@keyv/redis';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheableMemory } from 'cacheable';
import basicAuth from 'express-basic-auth';
import { Keyv } from 'keyv';
import { ClsModule } from 'nestjs-cls';
import { UserContextInterceptor } from './common/interceptors';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CollectorModule } from './modules/collector/collector.module';
import { FileManagerModule } from './modules/file-manager/file-manager.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ProgramModule } from './modules/program/program.module';
import { UserModule } from './modules/user/user.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { MailModule } from './shared/mail/mail.module';
import { QueueModule } from './shared/queue/queue.module';
import { RequestContextModule } from './shared/request-context/request-context.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({
                ttl: configService.get<number>('cacheTtl'),
                lruSize: configService.get<number>('lruSize'),
              }),
            }),
            new KeyvRedis(
              `redis://${configService.get<string>('redis.host', 'localhost')}:${configService.get<number>('redis.port', 6379)}`,
            ),
          ],
        };
      },
    }),
    RequestContextModule,
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
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password'),
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
    IntegrationModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
