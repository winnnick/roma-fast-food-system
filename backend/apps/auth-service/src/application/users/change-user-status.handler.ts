import { BadRequestException, ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
  type RefreshSessionRepositoryPort,
  type UserRepositoryPort,
} from '../../domain/ports/auth.ports';
import { ChangeUserStatusCommand } from './change-user-status.command';
import { toManagedUserView, type ManagedUserView } from './user-management.mapper';

@CommandHandler(ChangeUserStatusCommand)
export class ChangeUserStatusHandler implements ICommandHandler<
  ChangeUserStatusCommand,
  ManagedUserView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly refreshSessions: RefreshSessionRepositoryPort,
  ) {}

  async execute(command: ChangeUserStatusCommand): Promise<ManagedUserView> {
    const current = await this.users.findManagedById(command.id);
    if (!current) {
      throw new NotFoundException('El usuario seleccionado no existe.');
    }

    if (command.status === 'Inactivo' && command.id === command.actorUserId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta mientras la utilizas.');
    }

    if (
      command.status === 'Inactivo' &&
      current.status === 'Activo' &&
      current.roles.includes('Administrador') &&
      (await this.users.countActiveAdministrators()) <= 1
    ) {
      throw new ConflictException('No se puede desactivar al único administrador activo.');
    }

    const updated = await this.users.updateStatus(command.id, command.status);
    if (!updated) {
      throw new NotFoundException('El usuario seleccionado no existe.');
    }

    if (command.status === 'Inactivo') {
      await this.refreshSessions.revokeAllByUserId(command.id, new Date());
    }

    return toManagedUserView(updated);
  }
}
