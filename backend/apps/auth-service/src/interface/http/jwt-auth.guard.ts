import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ACCESS_TOKEN_SERVICE, type AccessTokenServicePort } from '../../domain/ports/auth.ports';
import type { AuthenticatedRequest } from './auth-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenServicePort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Se requiere un token de acceso válido.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Se requiere un token de acceso válido.');
    }

    try {
      request.authUser = await this.accessTokens.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('El token de acceso es inválido o ha expirado.');
    }
  }
}
