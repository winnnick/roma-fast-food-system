import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import type { InternalAuthSessionResult } from '../../domain/models/auth.models';
import {
  PASSWORD_HASHER,
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
  type PasswordHasherPort,
  type RefreshSessionRepositoryPort,
  type UserRepositoryPort,
} from '../../domain/ports/auth.ports';
import { AuthSessionFactory } from './auth-session.factory';
import { LoginCommand } from './login.command';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, InternalAuthSessionResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly refreshSessions: RefreshSessionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    private readonly sessionFactory: AuthSessionFactory,
  ) {}

  async execute(command: LoginCommand): Promise<InternalAuthSessionResult> {
    const username = command.username.trim().toLowerCase();
    const user = await this.users.findByUsername(username);

    if (!user || user.status !== 'Activo') {
      throw new UnauthorizedException('El usuario o la contraseña son incorrectos.');
    }

    const passwordIsValid = await this.passwordHasher.verify(command.password, user.passwordHash);

    if (!passwordIsValid) {
      throw new UnauthorizedException('El usuario o la contraseña son incorrectos.');
    }

    const { result, session } = await this.sessionFactory.create(
      user,
      command.userAgent,
      command.ipAddress,
    );

    await this.refreshSessions.create(session);
    await this.users.updateLastAccess(user.id, new Date(result.fechaInicio));

    return result;
  }
}
