import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiJwtAuthGuard,
  ApiPermissionsGuard,
  RequirePermissions,
  type AuthenticatedApiRequest,
} from '@roma/shared';
import { RegisterAuditEventCommand } from '../../application/reporting/audit.commands';
import { ListAuditEventsQuery } from '../../application/reporting/audit.queries';
import type { AuditEventRecord, AuditFilter } from '../../domain/reporting/audit.models';
import { AuditFilterDto, RegisterAuditEventDto } from './dto/audit.dto';

function toView(item: AuditEventRecord) {
  return {
    id: item.id,
    fechaHora: item.occurredAt.toISOString(),
    usuarioId: item.userId,
    usuarioNombre: item.userName,
    usuarioRol: item.userRole,
    modulo: item.module,
    accion: item.action,
    entidad: item.entity,
    entidadId: item.entityId,
    descripcion: item.description,
    datosAnteriores: item.previousData,
    datosPosteriores: item.nextData,
    nivel: item.level,
    origen: item.origin,
  };
}

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@Controller('reportes/auditoria')
export class AuditController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async register(@Req() request: AuthenticatedApiRequest, @Body() dto: RegisterAuditEventDto) {
    if (!request.authUser) throw new Error('El guard JWT no cargó el usuario autenticado.');
    const item = await this.commandBus.execute<RegisterAuditEventCommand, AuditEventRecord>(
      new RegisterAuditEventCommand(
        Number(request.authUser.sub),
        request.authUser.nombreCompleto,
        request.authUser.rol,
        dto.modulo,
        dto.accion,
        dto.entidad,
        dto.entidadId === undefined || dto.entidadId === null ? null : String(dto.entidadId),
        dto.descripcion,
        dto.datosAnteriores ?? null,
        dto.datosPosteriores ?? null,
        dto.nivel ?? 'Información',
        dto.origen ?? 'Interfaz web',
      ),
    );
    return toView(item);
  }

  @Get()
  @RequirePermissions('REPORTES_BITACORA')
  async list(@Query() dto: AuditFilterDto) {
    const filter: AuditFilter = {
      from: dto.fechaDesde ? new Date(`${dto.fechaDesde}T00:00:00-04:00`) : undefined,
      to: dto.fechaHasta ? new Date(`${dto.fechaHasta}T23:59:59.999-04:00`) : undefined,
      userId: dto.usuarioId,
      module: dto.modulo,
      level: dto.nivel,
      text: dto.texto,
    };
    const items = await this.queryBus.execute<ListAuditEventsQuery, AuditEventRecord[]>(
      new ListAuditEventsQuery(filter),
    );
    return items.map(toView);
  }
}
