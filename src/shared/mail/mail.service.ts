import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { join } from 'path';
import { Resend } from 'resend';
import { SendMailOptions } from './interfaces';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private templatesDir: string;
  constructor(private configService: ConfigService) {
    const apiKey =
      process.env.RESEND_API_KEY ||
      this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn('Resend API key not found');
    }
    this.resend = new Resend(apiKey);
    this.templatesDir = this.getTemplatesDirectory();
    this.logger.log(`Templates directory: ${this.templatesDir}`);
  }

  private getTemplatesDirectory(): string {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      return join(process.cwd(), 'src', 'shared', 'mail', 'templates');
    }

    return join(process.cwd(), 'dist', 'shared', 'mail', 'templates');
  }

  private compileTemplate(
    templateName: string,
    context: Record<string, string> = {},
  ): string {
    try {
      const defaultContext = {
        ...context,
      };

      let templatePath = join(this.templatesDir, `${templateName}.hbs`);

      try {
        readFileSync(templatePath, 'utf8');
      } catch {
        templatePath = join(this.templatesDir, 'default.hbs');
      }

      const templateContent = readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      return template(defaultContext);
    } catch (error) {
      throw new Error(`Failed to compile template: ${error}`);
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const { to, subject, template, context = {} } = options;
    const from = this.configService.get<string>('mail.fromEmail') as string;

    if (!from) {
      throw new Error('From email address not configured');
    }

    try {
      const html = this.compileTemplate(template, context);

      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email verification to ${to}:`, error);
        throw new Error(`Failed to send verification email: ${error.message}`);
      }

      this.logger.log(`Email sent to ${to}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send verification email');
    }
  }
}
