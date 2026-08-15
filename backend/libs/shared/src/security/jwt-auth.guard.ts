import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import type { AuthenticatedApiRequest } from './authenticated-request';
import { RsaJwtVerifierService } from './rsa-jwt-verifier.service';

@Injectable()
export class ApiJwtAuthGuard implements CanActivate {
  constructor(private readonly verifier: RsaJwtVerifierService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedApiRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Se requiere un token de acceso válido.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Se requiere un token de acceso válido.');
    }

    try {
      request.authUser = await this.verifier.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('El token de acceso es inválido o ha expirado.');
    }
  }
}
