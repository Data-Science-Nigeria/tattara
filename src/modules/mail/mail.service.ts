import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.resendApiKey');
    if (!apiKey) {
      this.logger.warn('Resend API key not found');
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmailVerification(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
    const fromEmail = this.configService.get<string>('mail.fromEmail');

    if (!fromEmail) {
      throw new Error('From email address not configured');
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Verify Your Email Address',
        html: this.getEmailVerificationTemplate(firstName, verificationUrl),
      });

      if (error) {
        this.logger.error(
          `Failed to send email verification to ${email}:`,
          error,
        );
        throw new Error(`Failed to send verification email: ${error.message}`);
      }

      this.logger.log(`Email verification sent to ${email}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email verification to ${email}:`,
        error,
      );
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordReset(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
    const fromEmail = this.configService.get<string>('mail.fromEmail');

    if (!fromEmail) {
      throw new Error('From email address not configured');
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Reset Your Password',
        html: this.getPasswordResetTemplate(firstName, resetUrl),
      });

      if (error) {
        this.logger.error(
          `Failed to send password reset email to ${email}:`,
          error,
        );
        throw new Error(
          `Failed to send password reset email: ${error.message}`,
        );
      }

      this.logger.log(`Password reset email sent to ${email}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  private getEmailVerificationTemplate(
    firstName: string,
    verificationUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome ${this.escapeHtml(firstName)}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Please verify your email address</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for registering! Please click the button below to verify your email address and activate your account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn't create an account, please ignore this email.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              This link will expire in 24 hours for security reasons.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(
    firstName: string,
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Reset your password securely</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${this.escapeHtml(firstName)}, we received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn't request a password reset, please ignore this email. Your password won't be changed.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
