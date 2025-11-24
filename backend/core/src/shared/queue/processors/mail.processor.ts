import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailService } from '@/shared/mail/mail.service';
import { QueueService } from '../queue.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(QueueService.name);

  constructor(private mailService: MailService) {}

  @Process('sendEmail')
  async handleSendEmail(
    job: Job<{
      to: string;
      subject: string;
      template: string;
      context: Record<string, any>;
    }>,
  ) {
    const { to, subject, template, context } = job.data;
    this.logger.log('Sending mail in queue to', to, subject, template, context);

    try {
      await this.mailService.sendMail({
        to,
        subject,
        template,
        context,
      });

      this.logger.log('Mail sent in queue');

      return true;
    } catch (err) {
      this.logger.error(`❌ Failed to send email to ${to}`, err);
      throw err;
    }
  }
}
