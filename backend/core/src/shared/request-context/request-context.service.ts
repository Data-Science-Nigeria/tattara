import { User } from '@/database/entities';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContext {
  constructor(private readonly cls: ClsService) {}

  getUser() {
    return this.cls.get<User>('user');
  }

  getUserId() {
    return this.getUser()?.id;
  }

  getRoles() {
    return this.getUser()?.roles;
  }

  isSuperAdmin() {
    return this.getUser()?.roles?.some(role => role.name === 'superadmin');
  }

  isAdmin() {
    return this.getUser()?.roles?.some(
      role => role.name === 'admin' || role.name === 'superadmin',
    );
  }
}
