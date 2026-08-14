import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AccessResolverService } from '../access/access-resolver.service';
import {
  PASSWORD_HASHER,
  USER_REPOSITORY,
  type PasswordHasherPort,
  type UserRepositoryPort,
} from '../../domain/ports/auth.ports';
import { CreateUserCommand } from './create-user.command';
import { toManagedUserView, type ManagedUserView } from './user-management.mapper';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, ManagedUserView> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    private readonly accessResolver: AccessResolverService,
  ) {}

  async execute(command: CreateUserCommand): Promise<ManagedUserView> {
    const username = command.username.trim().toLowerCase();
    if (await this.users.usernameExists(username)) {
      throw new ConflictException('El nombre de usuario ya se encuentra registrado.');
    }

    const roles = this.accessResolver.normalizeRoles(command.roles, command.primaryRole);
    const primaryRole = this.accessResolver.resolvePrimaryRole(roles, command.primaryRole);

    const created = await this.users.createManaged({
      username,
      fullName: command.fullName.trim(),
      passwordHash: await this.passwordHasher.hash(command.password),
      primaryRole,
      roles,
      additionalPermissions: [],
    });

    return toManagedUserView(created);
  }
}
