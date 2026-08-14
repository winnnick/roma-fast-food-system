import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import type { InternalAuthSessionResult } from '../../domain/models/auth.models';
import {
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
  type RefreshSessionRepositoryPort,
  type UserRepositoryPort,
} from '../../domain/ports/auth.ports';
import { OpaqueRefreshTokenService } from '../../infrastructure/security/opaque-refresh-token.service';
import { AuthSessionFactory } from './auth-session.factory';
import { RefreshSessionCommand } from './refresh-session.command';

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler implements ICommandHandler<
  RefreshSessionCommand,
  InternalAuthSessionResult
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly refreshSessions: RefreshSessionRepositoryPort,
    private readonly refreshTokens: OpaqueRefreshTokenService,
    private readonly sessionFactory: AuthSessionFactory,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<InternalAuthSessionResult> {
    const now = new Date();
    const tokenHash = this.refreshTokens.hash(command.refreshToken);
    const currentSession = await this.refreshSessions.findByTokenHash(tokenHash);

    if (
      !currentSession ||
      currentSession.revokedAt ||
      currentSession.expiresAt.getTime() <= now.getTime()
    ) {
      throw new UnauthorizedException('La sesión ha expirado. Inicia sesión nuevamente.');
    }

    const user = await this.users.findById(currentSession.userId);
    if (!user || user.status !== 'Activo') {
      throw new UnauthorizedException('La cuenta ya no se encuentra habilitada.');
    }

    const { result, session: replacement } = await this.sessionFactory.create(
      user,
      command.userAgent,
      command.ipAddress,
    );

    await this.refreshSessions.rotate(currentSession.id, replacement, now);
    return result;
  }
}
