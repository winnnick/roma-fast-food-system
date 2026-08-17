import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  ReportingSnapshot,
  ReportingSnapshotInput,
} from '../../domain/reporting/reporting.models';
import type { ReportingRepositoryPort } from '../../domain/ports/reporting.ports';
import { ReportingSnapshotOrmEntity } from './entities/reporting-snapshot.orm-entity';

@Injectable()
export class TypeOrmReportingRepository implements ReportingRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  async replaceSnapshots(inputs: ReportingSnapshotInput[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ReportingSnapshotOrmEntity);
      for (const input of inputs) {
        const row = repository.create({
          domain: input.domain,
          payload: input.payload,
          capturedAt: input.capturedAt,
        });
        await repository.save(row);
      }
    });
  }

  async listSnapshots(): Promise<ReportingSnapshot[]> {
    const rows = await this.dataSource.getRepository(ReportingSnapshotOrmEntity).find({
      order: { domain: 'ASC' },
    });
    return rows.map((row) => ({
      domain: row.domain,
      payload: row.payload,
      capturedAt: row.capturedAt,
    }));
  }
}
