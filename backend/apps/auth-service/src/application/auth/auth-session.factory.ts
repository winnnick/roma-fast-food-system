import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  InternalAuthSessionResult,
  RefreshSessionSnapshot,
  UserSnapshot,
} from '../../domain/models/auth.models';
import { ACCESS_TOKEN_SERVICE, type AccessTokenServicePort } from '../../domain/ports/auth.ports';
import { AccessResolverService } from '../access/access-resolver.service';
import { OpaqueRefreshTokenService } from '../../infrastructure/security/opaque-refresh-token.service';

@Injectable()
export class AuthSessionFactory {
  constructor(
    private readonly accessResolver: AccessResolverService,
    private readonly refreshTokens: OpaqueRefreshTokenService,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenServicePort,
  ) {}

  async create(
    user: UserSnapshot,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<{ result: InternalAuthSessionResult; session: RefreshSessionSnapshot }> {
    const usuario = this.accessResolver.resolve(user);
    const sessionId = randomUUID();
    const refreshToken = this.refreshTokens.generate();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.refreshTokens.getTtlSeconds() * 1000);

    const session: RefreshSessionSnapshot = {
      id: sessionId,
      userId: user.id,
      tokenHash: this.refreshTokens.hash(refreshToken),
      createdAt: now,
      expiresAt,
      revokedAt: null,
      replacedBySessionId: null,
      userAgent,
      ipAddress,
    };

    const accessToken = await this.accessTokens.issue(usuario, sessionId);

    return {
      session,
      result: {
        usuario,
        accessToken,
        fechaInicio: now.toISOString(),
        expiresInSeconds: this.accessTokens.getAccessTtlSeconds(),
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
      },
    };
  }
}
