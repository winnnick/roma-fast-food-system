import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AccessResolverService } from '../access/access-resolver.service';
import {
  PASSWORD_HASHER,
  REFRESH_SESSION_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
  type PasswordHasherPort,
  type RefreshSessionRepositoryPort,
  type RoleRepositoryPort,
  type UserRepositoryPort,
} from '../../domain/ports/auth.ports';
import { UpdateUserCommand } from './update-user.command';
import { toManagedUserView, type ManagedUserView } from './user-management.mapper';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, ManagedUserView> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly rolesRepository: RoleRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly refreshSessions: RefreshSessionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    private readonly accessResolver: AccessResolverService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<ManagedUserView> {
    const current = await this.users.findManagedById(command.id);
    if (!current) {
      throw new NotFoundException('El usuario seleccionado no existe.');
    }

    const username = command.username.trim().toLowerCase();
    if (await this.users.usernameExists(username, command.id)) {
      throw new ConflictException('El nombre de usuario ya se encuentra registrado.');
    }

    const roles = this.accessResolver.normalizeRoles(command.roles, command.primaryRole);
    const primaryRole = this.accessResolver.resolvePrimaryRole(roles, command.primaryRole);

    const losesAdministrator =
      current.roles.includes('Administrador') && !roles.includes('Administrador');
    if (
      losesAdministrator &&
      current.status === 'Activo' &&
      (await this.users.countActiveAdministrators()) <= 1
    ) {
      throw new ConflictException(
        'No se puede retirar el rol Administrador del único administrador activo.',
      );
    }

    const inherited = await this.resolveInheritedPermissions(roles);
    const additionalPermissions = roles.includes('Administrador')
      ? []
      : current.additionalPermissions.filter((permission) => !inherited.has(permission));

    const updated = await this.users.updateManaged(command.id, {
      username,
      fullName: command.fullName.trim(),
      primaryRole,
      roles,
      additionalPermissions,
      ...(command.password?.trim()
        ? { passwordHash: await this.passwordHasher.hash(command.password) }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException('El usuario seleccionado no existe.');
    }

    if (command.password?.trim() || losesAdministrator || current.primaryRole !== primaryRole) {
      await this.refreshSessions.revokeAllByUserId(command.id, new Date());
    }

    return toManagedUserView(updated);
  }

  private async resolveInheritedPermissions(roles: readonly string[]): Promise<Set<string>> {
    const configurations = await this.rolesRepository.list();
    const inherited = new Set<string>();
    for (const role of configurations) {
      if (roles.includes(role.code)) {
        role.permissions.forEach((permission) => inherited.add(permission));
      }
    }
    return inherited;
  }
}
