import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

const INTERNAL_TOKEN_HEADER = 'x-roma-internal-token';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly expectedToken: Buffer;

  constructor(config: ConfigService) {
    const token = config.getOrThrow<string>('INTERNAL_SERVICE_TOKEN');
    this.expectedToken = Buffer.from(token);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const received = request.header(INTERNAL_TOKEN_HEADER)?.trim();

    if (!received) {
      throw new UnauthorizedException('Se requiere autenticación interna de servicio.');
    }

    const receivedBuffer = Buffer.from(received);
    if (
      receivedBuffer.length !== this.expectedToken.length ||
      !timingSafeEqual(receivedBuffer, this.expectedToken)
    ) {
      throw new UnauthorizedException('La credencial interna del servicio es inválida.');
    }

    return true;
  }
}
