import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ChangeUserStatusCommand } from '../../application/users/change-user-status.command';
import { CreateUserCommand } from '../../application/users/create-user.command';
import { ListUsersQuery } from '../../application/users/list-users.query';
import type { ManagedUserView } from '../../application/users/user-management.mapper';
import { UpdateUserAccessCommand } from '../../application/users/update-user-access.command';
import { UpdateUserCommand } from '../../application/users/update-user.command';
import type { AccessTokenClaims } from '../../domain/models/auth.models';
import { CurrentAuthUser } from './current-auth-user.decorator';
import { ChangeUserStatusRequestDto } from './dto/change-user-status-request.dto';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { UpdateUserAccessRequestDto } from './dto/update-user-access-request.dto';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './require-permissions.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @RequirePermissions('USUARIOS_VER')
  @ApiOperation({ summary: 'Lista las cuentas registradas.' })
  list(): Promise<ManagedUserView[]> {
    return this.queryBus.execute(new ListUsersQuery());
  }

  @Post()
  @RequirePermissions('USUARIOS_CREAR')
  @ApiOperation({ summary: 'Crea una cuenta de usuario.' })
  create(@Body() dto: CreateUserRequestDto): Promise<ManagedUserView> {
    return this.commandBus.execute(
      new CreateUserCommand(
        dto.username,
        dto.nombreCompleto,
        dto.rol,
        dto.roles ?? [dto.rol],
        dto.password,
      ),
    );
  }

  @Put(':id')
  @RequirePermissions('USUARIOS_EDITAR')
  @ApiOperation({ summary: 'Actualiza datos y rol principal de una cuenta.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<ManagedUserView> {
    return this.commandBus.execute(
      new UpdateUserCommand(
        id,
        dto.username,
        dto.nombreCompleto,
        dto.rol,
        dto.roles ?? [dto.rol],
        dto.password,
      ),
    );
  }

  @Put(':id/accesos')
  @RequirePermissions('ROLES_GESTIONAR')
  @ApiOperation({ summary: 'Actualiza roles adicionales y permisos especiales.' })
  updateAccess(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAccessRequestDto,
  ): Promise<ManagedUserView> {
    return this.commandBus.execute(
      new UpdateUserAccessCommand(id, dto.roles, dto.permisosAdicionales),
    );
  }

  @Patch(':id/estado')
  @RequirePermissions('USUARIOS_DESACTIVAR')
  @ApiOperation({ summary: 'Activa o desactiva una cuenta sin eliminar su historial.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeUserStatusRequestDto,
    @CurrentAuthUser() actor: AccessTokenClaims,
  ): Promise<ManagedUserView> {
    return this.commandBus.execute(new ChangeUserStatusCommand(id, dto.estado, Number(actor.sub)));
  }
}
