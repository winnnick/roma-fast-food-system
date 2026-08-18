import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiJwtAuthGuard, ApiPermissionsGuard, RequirePermissions } from '@roma/shared';
import { RebuildReportingSnapshotsCommand } from '../../application/reporting/reporting.commands';
import {
  GetReportingDataQuery,
  GetReportingStatusQuery,
} from '../../application/reporting/reporting.queries';
import type {
  ReportingDataView,
  ReportingStatusView,
} from '../../domain/reporting/reporting.models';

@ApiTags('Reporting')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('REPORTES_VER')
@Controller('reportes')
export class ReportingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('datos')
  @ApiOperation({ summary: 'Obtiene los modelos de lectura consolidados para reportes.' })
  data(): Promise<ReportingDataView> {
    return this.queryBus.execute(new GetReportingDataQuery());
  }

  @Get('estado')
  @ApiOperation({ summary: 'Consulta el estado de los modelos de lectura de Reporting.' })
  status(): Promise<ReportingStatusView> {
    return this.queryBus.execute(new GetReportingStatusQuery());
  }

  @Post('reconstruir')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reconstruye los snapshots de lectura desde los microservicios origen.',
  })
  rebuild(): Promise<ReportingStatusView> {
    return this.commandBus.execute(new RebuildReportingSnapshotsCommand());
  }
}
