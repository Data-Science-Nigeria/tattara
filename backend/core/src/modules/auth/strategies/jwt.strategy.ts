import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/modules/user/user.service';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.accessToken as string,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || '',
    });
  }

  //TODO: implement caching approach to better optimize getting user data
  async validate(payload: { sub: string }) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    return user;
  }
}
