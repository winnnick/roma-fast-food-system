import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { readFileSync } from 'node:fs';

import type { AccessTokenClaims, SessionUser } from '../../domain/models/auth.models';
import type { AccessTokenServicePort } from '../../domain/ports/auth.ports';

@Injectable()
export class RsaAccessTokenService implements AccessTokenServicePort {
  private readonly privateKey: Buffer;
  private readonly publicKey: Buffer;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.privateKey = readFileSync(config.getOrThrow<string>('JWT_PRIVATE_KEY_PATH'));
    this.publicKey = readFileSync(config.getOrThrow<string>('JWT_PUBLIC_KEY_PATH'));
    this.issuer = config.get<string>('JWT_ISSUER', 'roma-fast-food-auth');
    this.audience = config.get<string>('JWT_AUDIENCE', 'roma-fast-food-api');
    const rawTtl = config.get<string>('JWT_ACCESS_TTL_SECONDS');
    const parsedTtl = Number(rawTtl ?? 900);
    this.ttlSeconds = Number.isSafeInteger(parsedTtl) && parsedTtl > 0 ? parsedTtl : 900;
  }

  issue(user: SessionUser, sessionId: string): Promise<string> {
    const payload = {
      sub: String(user.id),
      username: user.username,
      nombreCompleto: user.nombreCompleto,
      rol: user.rol,
      roles: user.roles,
      permissions: user.permisos,
      sid: sessionId,
    };

    return this.jwt.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.privateKey,
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: this.ttlSeconds,
    });
  }

  verify(token: string): Promise<AccessTokenClaims> {
    return this.jwt.verifyAsync<AccessTokenClaims>(token, {
      algorithms: ['RS256'],
      publicKey: this.publicKey,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  getAccessTtlSeconds(): number {
    return this.ttlSeconds;
  }
}
