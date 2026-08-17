import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type {
  ReportingDomain,
  ReportingSnapshot,
  ReportingStatusView,
} from '../../domain/reporting/reporting.models';
import type {
  ReportingRepositoryPort,
  ReportingSourcePort,
} from '../../domain/ports/reporting.ports';
import { REPORTING_REPOSITORY, REPORTING_SOURCE } from '../../domain/ports/reporting.ports';
import { RebuildReportingSnapshotsCommand } from './reporting.commands';
import { GetReportingStatusQuery } from './reporting.queries';

const DOMAINS: ReportingDomain[] = ['auth', 'operations', 'inventory'];

function sectionCounts(payload: Record<string, unknown>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.length : value === null || value === undefined ? 0 : 1,
    ]),
  );
}

function toStatus(snapshots: ReportingSnapshot[]): ReportingStatusView {
  return {
    generatedAt: new Date().toISOString(),
    snapshots: snapshots
      .map((snapshot) => ({
        domain: snapshot.domain,
        capturedAt: snapshot.capturedAt.toISOString(),
        sections: sectionCounts(snapshot.payload),
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain)),
  };
}

@CommandHandler(RebuildReportingSnapshotsCommand)
export class RebuildReportingSnapshotsHandler implements ICommandHandler<
  RebuildReportingSnapshotsCommand,
  ReportingStatusView
> {
  constructor(
    @Inject(REPORTING_REPOSITORY) private readonly repository: ReportingRepositoryPort,
    @Inject(REPORTING_SOURCE) private readonly source: ReportingSourcePort,
  ) {}

  async execute(): Promise<ReportingStatusView> {
    const fetched = await Promise.all(
      DOMAINS.map(async (domain) => ({ domain, payload: await this.source.fetch(domain) })),
    );
    const capturedAt = new Date();

    await this.repository.replaceSnapshots(fetched.map((item) => ({ ...item, capturedAt })));

    return toStatus(await this.repository.listSnapshots());
  }
}

@QueryHandler(GetReportingStatusQuery)
export class GetReportingStatusHandler implements IQueryHandler<
  GetReportingStatusQuery,
  ReportingStatusView
> {
  constructor(@Inject(REPORTING_REPOSITORY) private readonly repository: ReportingRepositoryPort) {}

  async execute(): Promise<ReportingStatusView> {
    return toStatus(await this.repository.listSnapshots());
  }
}
