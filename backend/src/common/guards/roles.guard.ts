import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AUTHENTICATED_KEY } from '../decorators/authenticated.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    @Optional() private config?: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const targets: [Function, Function] = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets);
    const authenticated = this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_KEY, targets);

    if (!requiredRoles && !authenticated) {
      if (this.isLogOnly()) {
        const handler = context.getHandler();
        const cls = context.getClass();
        this.logger.warn(`No access rule on ${cls?.name ?? 'unknown'}.${handler?.name ?? 'unknown'}`);
        return true;
      }
      throw new ForbiddenException('Insufficient permissions');
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    if (!requiredRoles) {
      return true;
    }

    const currentUserRole = String(user.role || '').trim().toLowerCase();
    const hasRole = requiredRoles.some((role) => currentUserRole === String(role || '').trim().toLowerCase());
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }

  private isLogOnly(): boolean {
    const raw = this.config?.get<string>('AUTHZ_LOG_ONLY') ?? process.env.AUTHZ_LOG_ONLY;
    return raw === 'true' || raw === '1';
  }
}
