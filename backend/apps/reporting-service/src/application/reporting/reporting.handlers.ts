import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ServiceUnavailableException } from '@nestjs/common';
import type {
  ReportingDataView,
  ReportingDomain,
  ReportingSnapshot,
  ReportingStatusView,
} from '../../domain/reporting/reporting.models';
import type {
  ReportingRepositoryPort,
  ReportingSourcePort,
} from '../../domain/ports/reporting.ports';
import { REPORTING_REPOSITORY, REPORTING_SOURCE } from '../../domain/ports/reporting.ports';
import {
  RebuildReportingSnapshotsCommand,
  RefreshReportingDomainCommand,
} from './reporting.commands';
import { GetReportingDataQuery, GetReportingStatusQuery } from './reporting.queries';

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

@CommandHandler(RefreshReportingDomainCommand)
export class RefreshReportingDomainHandler implements ICommandHandler<
  RefreshReportingDomainCommand,
  ReportingStatusView
> {
  constructor(
    @Inject(REPORTING_REPOSITORY) private readonly repository: ReportingRepositoryPort,
    @Inject(REPORTING_SOURCE) private readonly source: ReportingSourcePort,
  ) {}

  async execute(command: RefreshReportingDomainCommand): Promise<ReportingStatusView> {
    const payload = await this.source.fetch(command.domain);
    await this.repository.replaceSnapshots([
      {
        domain: command.domain,
        payload,
        capturedAt: new Date(),
      },
    ]);

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

@QueryHandler(GetReportingDataQuery)
export class GetReportingDataHandler implements IQueryHandler<
  GetReportingDataQuery,
  ReportingDataView
> {
  constructor(@Inject(REPORTING_REPOSITORY) private readonly repository: ReportingRepositoryPort) {}

  async execute(): Promise<ReportingDataView> {
    const snapshots = await this.repository.listSnapshots();
    const byDomain = new Map(snapshots.map((snapshot) => [snapshot.domain, snapshot]));
    const auth = byDomain.get('auth');
    const operations = byDomain.get('operations');
    const inventory = byDomain.get('inventory');

    if (!auth || !operations || !inventory) {
      throw new ServiceUnavailableException(
        'Los modelos de lectura aún no están completos. Reconstruye Reporting e inténtalo nuevamente.',
      );
    }

    return {
      generatedAt: new Date().toISOString(),
      capturedAt: {
        auth: auth.capturedAt.toISOString(),
        operations: operations.capturedAt.toISOString(),
        inventory: inventory.capturedAt.toISOString(),
      },
      auth: auth.payload,
      operations: operations.payload,
      inventory: inventory.payload,
    };
  }
}
