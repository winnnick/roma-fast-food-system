import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DEFAULT_ROLE_PERMISSIONS } from '../../domain/access/access.constants';
import { ROLE_REPOSITORY, type RoleRepositoryPort } from '../../domain/ports/auth.ports';
import { ResetRolePermissionsCommand } from './reset-role-permissions.command';
import { toRoleConfigurationView, type RoleConfigurationView } from './role-management.mapper';

@CommandHandler(ResetRolePermissionsCommand)
export class ResetRolePermissionsHandler implements ICommandHandler<
  ResetRolePermissionsCommand,
  RoleConfigurationView
> {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort) {}

  async execute(command: ResetRolePermissionsCommand): Promise<RoleConfigurationView> {
    const current = await this.roles.findByCode(command.role);
    if (!current) {
      throw new NotFoundException('El rol seleccionado no existe.');
    }
    if (!current.editable) {
      throw new BadRequestException('Los permisos del rol Administrador no pueden modificarse.');
    }

    const updated = await this.roles.updatePermissions(
      command.role,
      DEFAULT_ROLE_PERMISSIONS[command.role].filter(
        (permission) => permission !== 'ROLES_GESTIONAR',
      ),
    );
    if (!updated) {
      throw new NotFoundException('El rol seleccionado no existe.');
    }
    return toRoleConfigurationView(updated);
  }
}
