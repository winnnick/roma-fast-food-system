import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';

import { InternalServiceGuard } from '@roma/shared';
import type { InventoryReportingSnapshotView } from '../../application/reporting/inventory-reporting.handler';
import { GetInventoryReportingSnapshotQuery } from '../../application/reporting/inventory-reporting.query';

@ApiExcludeController()
@UseGuards(InternalServiceGuard)
@Controller('internal/reporting')
export class InventoryInternalReportingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('snapshot')
  snapshot(): Promise<InventoryReportingSnapshotView> {
    return this.queryBus.execute(new GetInventoryReportingSnapshotQuery());
  }
}
