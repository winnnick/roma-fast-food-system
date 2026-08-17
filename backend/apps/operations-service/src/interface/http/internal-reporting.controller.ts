import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';

import { InternalServiceGuard } from '@roma/shared';
import type { OperationsReportingSnapshotView } from '../../application/reporting/operations-reporting.handler';
import { GetOperationsReportingSnapshotQuery } from '../../application/reporting/operations-reporting.query';

@ApiExcludeController()
@UseGuards(InternalServiceGuard)
@Controller('internal/reporting')
export class OperationsInternalReportingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('snapshot')
  snapshot(): Promise<OperationsReportingSnapshotView> {
    return this.queryBus.execute(new GetOperationsReportingSnapshotQuery());
  }
}
