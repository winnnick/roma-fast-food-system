import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListRolesQuery } from '../../application/roles/list-roles.query';
import type { RoleConfigurationView } from '../../application/roles/role-management.mapper';
import { ResetRolePermissionsCommand } from '../../application/roles/reset-role-permissions.command';
import { UpdateRolePermissionsCommand } from '../../application/roles/update-role-permissions.command';
import { PERMISSION_CODES, ROLE_CODES, type RoleCode } from '../../domain/access/access.constants';
import { UpdateRolePermissionsRequestDto } from './dto/update-role-permissions-request.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './require-permissions.decorator';

@ApiTags('Roles y permisos')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('ROLES_GESTIONAR')
export class RolesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista roles y sus permisos efectivos configurados.' })
  list(): Promise<RoleConfigurationView[]> {
    return this.queryBus.execute(new ListRolesQuery());
  }

  @Get('permisos')
  @ApiOperation({ summary: 'Devuelve el catálogo de códigos de permiso válidos.' })
  permissions(): readonly string[] {
    return PERMISSION_CODES;
  }

  @Put(':role/permisos')
  @ApiOperation({ summary: 'Actualiza los permisos configurables de un rol.' })
  updatePermissions(
    @Param('role') role: string,
    @Body() dto: UpdateRolePermissionsRequestDto,
  ): Promise<RoleConfigurationView> {
    return this.commandBus.execute(
      new UpdateRolePermissionsCommand(this.asRoleCode(role), dto.permisos),
    );
  }

  @Post(':role/restablecer')
  @ApiOperation({ summary: 'Restablece los permisos iniciales de un rol editable.' })
  reset(@Param('role') role: string): Promise<RoleConfigurationView> {
    return this.commandBus.execute(new ResetRolePermissionsCommand(this.asRoleCode(role)));
  }

  private asRoleCode(value: string): RoleCode {
    if (!ROLE_CODES.includes(value as RoleCode)) {
      throw new BadRequestException('El rol solicitado no existe.');
    }
    return value as RoleCode;
  }
}
