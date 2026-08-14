import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AccessResolverService } from '../access/access-resolver.service';
import { ROLE_REPOSITORY, type RoleRepositoryPort } from '../../domain/ports/auth.ports';
import { UpdateRolePermissionsCommand } from './update-role-permissions.command';
import { toRoleConfigurationView, type RoleConfigurationView } from './role-management.mapper';

@CommandHandler(UpdateRolePermissionsCommand)
export class UpdateRolePermissionsHandler implements ICommandHandler<
  UpdateRolePermissionsCommand,
  RoleConfigurationView
> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort,
    private readonly accessResolver: AccessResolverService,
  ) {}

  async execute(command: UpdateRolePermissionsCommand): Promise<RoleConfigurationView> {
    const current = await this.roles.findByCode(command.role);
    if (!current) {
      throw new NotFoundException('El rol seleccionado no existe.');
    }
    if (!current.editable) {
      throw new BadRequestException('Los permisos del rol Administrador no pueden modificarse.');
    }

    const permissions = this.accessResolver
      .normalizePermissions(command.permissions)
      .filter((permission) => permission !== 'ROLES_GESTIONAR');

    const updated = await this.roles.updatePermissions(command.role, permissions);
    if (!updated) {
      throw new NotFoundException('El rol seleccionado no existe.');
    }
    return toRoleConfigurationView(updated);
  }
}
