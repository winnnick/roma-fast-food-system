import { describe, expect, it } from 'vitest';

import type {
  ReportingRepositoryPort,
  ReportingSourcePort,
} from '../../domain/ports/reporting.ports';
import type {
  ReportingDomain,
  ReportingSnapshot,
  ReportingSnapshotInput,
} from '../../domain/reporting/reporting.models';
import type {
  AuditEventInput,
  AuditEventRecord,
  AuditFilter,
} from '../../domain/reporting/audit.models';
import {
  GetReportingDataHandler,
  RebuildReportingSnapshotsHandler,
  RefreshReportingDomainHandler,
} from './reporting.handlers';
import {
  RebuildReportingSnapshotsCommand,
  RefreshReportingDomainCommand,
} from './reporting.commands';

class MemoryReportingRepository implements ReportingRepositoryPort {
  private snapshots: ReportingSnapshot[];

  constructor(initial: ReportingSnapshot[] = []) {
    this.snapshots = [...initial];
  }

  replaceSnapshots(inputs: ReportingSnapshotInput[]): Promise<void> {
    for (const input of inputs) {
      this.snapshots = this.snapshots.filter((item) => item.domain !== input.domain);
      this.snapshots.push({ ...input });
    }
    return Promise.resolve();
  }

  listSnapshots(): Promise<ReportingSnapshot[]> {
    return Promise.resolve([...this.snapshots]);
  }

  createAuditEvent(input: AuditEventInput): Promise<AuditEventRecord> {
    return Promise.resolve({ id: 1, ...input });
  }

  listAuditEvents(filter: AuditFilter): Promise<AuditEventRecord[]> {
    void filter;
    return Promise.resolve([]);
  }
}

class FakeReportingSource implements ReportingSourcePort {
  readonly calls: ReportingDomain[] = [];

  fetch(domain: ReportingDomain): Promise<Record<string, unknown>> {
    this.calls.push(domain);
    return Promise.resolve({ domain, rows: [1, 2], updated: true });
  }
}

describe('Reporting handlers', () => {
  it('rebuilds the three bounded-context snapshots', async () => {
    const repository = new MemoryReportingRepository();
    const source = new FakeReportingSource();
    const handler = new RebuildReportingSnapshotsHandler(repository, source);

    const result = await handler.execute(new RebuildReportingSnapshotsCommand());

    expect(source.calls).toEqual(['auth', 'operations', 'inventory']);
    expect(result.snapshots.map((item) => item.domain)).toEqual([
      'auth',
      'inventory',
      'operations',
    ]);
  });

  it('refreshes only the domain announced by an event', async () => {
    const repository = new MemoryReportingRepository([
      { domain: 'auth', payload: { users: [1] }, capturedAt: new Date('2026-08-17T10:00:00Z') },
      {
        domain: 'operations',
        payload: { sales: [1] },
        capturedAt: new Date('2026-08-17T10:00:00Z'),
      },
      {
        domain: 'inventory',
        payload: { ingredients: [1] },
        capturedAt: new Date('2026-08-17T10:00:00Z'),
      },
    ]);
    const source = new FakeReportingSource();
    const handler = new RefreshReportingDomainHandler(repository, source);

    const result = await handler.execute(new RefreshReportingDomainCommand('operations'));

    expect(source.calls).toEqual(['operations']);
    expect(result.snapshots).toHaveLength(3);
    expect(result.snapshots.find((item) => item.domain === 'operations')?.sections.updated).toBe(1);
  });

  it('returns consolidated data when all snapshots exist', async () => {
    const repository = new MemoryReportingRepository([
      { domain: 'auth', payload: { users: [1] }, capturedAt: new Date('2026-08-17T10:00:00Z') },
      {
        domain: 'operations',
        payload: { sales: [1, 2] },
        capturedAt: new Date('2026-08-17T10:01:00Z'),
      },
      {
        domain: 'inventory',
        payload: { ingredients: [1, 2, 3] },
        capturedAt: new Date('2026-08-17T10:02:00Z'),
      },
    ]);
    const handler = new GetReportingDataHandler(repository);

    const result = await handler.execute();

    expect(result.auth.users).toEqual([1]);
    expect(result.operations.sales).toEqual([1, 2]);
    expect(result.inventory.ingredients).toEqual([1, 2, 3]);
  });
});
