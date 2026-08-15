import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedApiRequest } from './authenticated-request';
import { API_REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class ApiPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(API_REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedApiRequest>();
    const permissions = request.authUser?.permissions ?? [];
    const missing = required.filter((permission) => !permissions.includes(permission));

    if (missing.length > 0) {
      throw new ForbiddenException('No tienes permisos para realizar esta operación.');
    }

    return true;
  }
}
