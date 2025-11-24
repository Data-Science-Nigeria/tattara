import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './processors/mail.processor';
import { MailModule } from '../mail/mail.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'mail' }),
    BullBoardModule.forFeature({
      name: 'mail',
      adapter: BullAdapter,
    }),
    MailModule,
  ],
  providers: [QueueService, MailProcessor],
  exports: [BullModule],
})
export class QueueModule {}
