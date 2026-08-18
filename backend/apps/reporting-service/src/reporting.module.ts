import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiSecurityModule } from '@roma/shared';
import {
  GetReportingStatusHandler,
  GetReportingDataHandler,
  RebuildReportingSnapshotsHandler,
  RefreshReportingDomainHandler,
} from './application/reporting/reporting.handlers';
import { REPORTING_REPOSITORY, REPORTING_SOURCE } from './domain/ports/reporting.ports';
import { HttpReportingSource } from './infrastructure/integration/http-reporting-source.integration';
import { ReportingSnapshotOrmEntity } from './infrastructure/persistence/entities/reporting-snapshot.orm-entity';
import { AuditEventOrmEntity } from './infrastructure/persistence/entities/audit-event.orm-entity';
import { AuditController } from './interface/http/audit.controller';
import {
  ListAuditEventsHandler,
  RegisterAuditEventHandler,
} from './application/reporting/audit.handlers';
import { TypeOrmReportingRepository } from './infrastructure/persistence/typeorm-reporting.repository';
import { ReportingController } from './interface/http/reporting.controller';
import { ReportingEventsController } from './interface/messaging/reporting-events.controller';

@Module({
  imports: [
    CqrsModule,
    ApiSecurityModule,
    TypeOrmModule.forFeature([ReportingSnapshotOrmEntity, AuditEventOrmEntity]),
  ],
  controllers: [ReportingController, AuditController, ReportingEventsController],
  providers: [
    RebuildReportingSnapshotsHandler,
    GetReportingStatusHandler,
    GetReportingDataHandler,
    RefreshReportingDomainHandler,
    RegisterAuditEventHandler,
    ListAuditEventsHandler,
    { provide: REPORTING_REPOSITORY, useClass: TypeOrmReportingRepository },
    { provide: REPORTING_SOURCE, useClass: HttpReportingSource },
  ],
})
export class ReportingModule {}
