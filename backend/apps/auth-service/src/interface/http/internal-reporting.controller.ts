import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';

import { InternalServiceGuard } from '@roma/shared';
import { GetAuthReportingSnapshotQuery } from '../../application/reporting/auth-reporting.query';
import type { AuthReportingSnapshotView } from '../../application/reporting/auth-reporting.handler';

@ApiExcludeController()
@UseGuards(InternalServiceGuard)
@Controller('internal/reporting')
export class AuthInternalReportingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('snapshot')
  snapshot(): Promise<AuthReportingSnapshotView> {
    return this.queryBus.execute(new GetAuthReportingSnapshotQuery());
  }
}
