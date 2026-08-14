import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AccessResolverService } from '../access/access-resolver.service';
import {
  REFRESH_SESSION_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
  type RefreshSessionRepositoryPort,
  type RoleRepositoryPort,
  type UserRepositoryPort,
} from '../../domain/ports/auth.ports';
import type { PermissionCode, RoleCode } from '../../domain/access/access.constants';
import { UpdateUserAccessCommand } from './update-user-access.command';
import { toManagedUserView, type ManagedUserView } from './user-management.mapper';

@CommandHandler(UpdateUserAccessCommand)
export class UpdateUserAccessHandler implements ICommandHandler<
  UpdateUserAccessCommand,
  ManagedUserView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly rolesRepository: RoleRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly refreshSessions: RefreshSessionRepositoryPort,
    private readonly accessResolver: AccessResolverService,
  ) {}

  async execute(command: UpdateUserAccessCommand): Promise<ManagedUserView> {
    const current = await this.users.findManagedById(command.id);
    if (!current) {
      throw new NotFoundException('El usuario seleccionado no existe.');
    }
    if (current.roles.includes('Administrador') || current.primaryRole === 'Administrador') {
      throw new BadRequestException(
        'El acceso del Administrador es completo y no requiere permisos adicionales.',
      );
    }

    const requested = command.roles.filter((role) => role !== 'Administrador');
    const roles = this.accessResolver.normalizeRoles(
      requested.includes(current.primaryRole) ? requested : [current.primaryRole, ...requested],
      current.primaryRole,
    );

    const inherited = await this.resolveInheritedPermissions(roles);
    const normalizedAdditional = this.accessResolver
      .normalizePermissions(command.additionalPermissions)
      .filter((permission) => permission !== 'ROLES_GESTIONAR')
      .filter((permission) => !inherited.has(permission));

    const updated = await this.users.updateAccess(command.id, roles, normalizedAdditional);
    if (!updated) {
      throw new NotFoundException('El usuario seleccionado no existe.');
    }

    await this.refreshSessions.revokeAllByUserId(command.id, new Date());
    return toManagedUserView(updated);
  }

  private async resolveInheritedPermissions(roles: RoleCode[]): Promise<Set<PermissionCode>> {
    const configurations = await this.rolesRepository.list();
    const inherited = new Set<PermissionCode>();
    for (const role of configurations) {
      if (roles.includes(role.code)) {
        role.permissions.forEach((permission) => inherited.add(permission));
      }
    }
    return inherited;
  }
}
