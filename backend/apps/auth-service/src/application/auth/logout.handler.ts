import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  REFRESH_SESSION_REPOSITORY,
  type RefreshSessionRepositoryPort,
} from '../../domain/ports/auth.ports';
import { OpaqueRefreshTokenService } from '../../infrastructure/security/opaque-refresh-token.service';
import { LogoutCommand } from './logout.command';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly refreshSessions: RefreshSessionRepositoryPort,
    private readonly refreshTokens: OpaqueRefreshTokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    if (!command.refreshToken) {
      return;
    }

    await this.refreshSessions.revokeByTokenHash(
      this.refreshTokens.hash(command.refreshToken),
      new Date(),
    );
  }
}
