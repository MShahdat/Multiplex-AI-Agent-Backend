import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import type { ExecutionContext } from '@nestjs/common';

@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return true;
      }
      throw error;
    }
  }
}