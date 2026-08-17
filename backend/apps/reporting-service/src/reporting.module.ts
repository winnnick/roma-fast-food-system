import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiSecurityModule } from '@roma/shared';
import {
  GetReportingStatusHandler,
  RebuildReportingSnapshotsHandler,
} from './application/reporting/reporting.handlers';
import { REPORTING_REPOSITORY, REPORTING_SOURCE } from './domain/ports/reporting.ports';
import { HttpReportingSource } from './infrastructure/integration/http-reporting-source.integration';
import { ReportingSnapshotOrmEntity } from './infrastructure/persistence/entities/reporting-snapshot.orm-entity';
import { TypeOrmReportingRepository } from './infrastructure/persistence/typeorm-reporting.repository';
import { ReportingController } from './interface/http/reporting.controller';

@Module({
  imports: [CqrsModule, ApiSecurityModule, TypeOrmModule.forFeature([ReportingSnapshotOrmEntity])],
  controllers: [ReportingController],
  providers: [
    RebuildReportingSnapshotsHandler,
    GetReportingStatusHandler,
    { provide: REPORTING_REPOSITORY, useClass: TypeOrmReportingRepository },
    { provide: REPORTING_SOURCE, useClass: HttpReportingSource },
  ],
})
export class ReportingModule {}
