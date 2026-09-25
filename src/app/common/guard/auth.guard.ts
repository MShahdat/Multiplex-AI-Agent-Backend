import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { jwtUtils } from '../../utils/jwt.js';
import config from '../../config/index.js';
import type { AuthenticatedUser } from '../../interface/index.js';
import { prisma } from '../../lib/prisma.js';
import { UserStatus } from '../../../../generated/prisma/enums.js';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const authorization = req.headers.authorization;
    const token =
      req.cookies?.accessToken ??
      (authorization?.startsWith('Bearer ')
        ? authorization.slice(7)
        : undefined);

    if (!token) {
      throw new UnauthorizedException('Unauthorized token missing')
    }

    const verified = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verified.success || !verified.data || typeof verified.data === 'string') {
      throw new UnauthorizedException('Unauthorized: invalid or expired token');
    }

    const payload = verified.data as AuthenticatedUser;

    if (!payload.id || !payload.email || !payload.role) {
      throw new UnauthorizedException('Unauthorized: malformed token');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id
      },
      omit: { password: true },
    })

    if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Unauthorized: user inactive');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }

    return true;
  }
}
