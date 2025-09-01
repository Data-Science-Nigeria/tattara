import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { User } from 'src/database/entities';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      const userData = {
        ...registerDto,
        emailVerificationToken,
        isEmailVerified: false,
      };

      const user = await this.userService.create(userData);

      await this.mailService.sendEmailVerification(
        user.email,
        user.firstName,
        emailVerificationToken,
      );

      return {
        message:
          'Registration successful. Please check your email to verify your account.',
        userId: user.id,
      };
    } catch (error) {
      try {
        await this.userService.deleteByEmail(registerDto.email);
      } catch (deleteError) {
        this.logger.error(
          'Failed to cleanup user after email failure:',
          deleteError,
        );
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map(role => role.name) || [],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles?.map(role => role.name) || [],
        permissions: user.getAllPermissions(),
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.userService.findByEmailVerificationToken(
      verifyEmailDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.userService.updateEmailVerification(user.id, true);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto) {
    const user = await this.userService.findByEmail(
      resendVerificationDto.email,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await this.userService.updateEmailVerificationToken(
      user.id,
      emailVerificationToken,
    );

    await this.mailService.sendEmailVerification(
      user.email,
      user.firstName,
      emailVerificationToken,
    );

    return {
      message: 'Verification email sent successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(
      Date.now() +
        (this.configService.get<number>(
          'app.passwordResetExpiresIn',
        ) as number),
    );

    await this.userService.updateResetPasswordToken(
      user.id,
      resetToken,
      resetExpires,
    );

    await this.mailService.sendPasswordReset(
      user.email,
      user.firstName,
      resetToken,
    );

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findByResetPasswordToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    await this.userService.updatePassword(user.id, hashedPassword);

    return {
      message:
        'Password reset successful. You can now login with your new password.',
    };
  }

  refreshToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map(role => role.name) || [],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles?.map(role => role.name) || [],
        permissions: user.getAllPermissions(),
      },
    };
  }
}
