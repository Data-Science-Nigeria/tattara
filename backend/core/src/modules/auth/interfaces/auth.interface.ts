import type { Request as ExpressRequest } from 'express';
import { User } from '@/database/entities';

export interface AuthenticatedRequest extends ExpressRequest {
  user: User;
}
