import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  ReportingSnapshot,
  ReportingSnapshotInput,
} from '../../domain/reporting/reporting.models';
import type { ReportingRepositoryPort } from '../../domain/ports/reporting.ports';
import type {
  AuditEventInput,
  AuditEventRecord,
  AuditFilter,
} from '../../domain/reporting/audit.models';
import { AuditEventOrmEntity } from './entities/audit-event.orm-entity';
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

  async createAuditEvent(input: AuditEventInput): Promise<AuditEventRecord> {
    const repository = this.dataSource.getRepository(AuditEventOrmEntity);
    const saved = await repository.save(
      repository.create({
        occurredAt: input.occurredAt,
        userId: input.userId,
        userName: input.userName,
        userRole: input.userRole,
        module: input.module,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        description: input.description,
        previousData: input.previousData,
        nextData: input.nextData,
        level: input.level,
        origin: input.origin,
      }),
    );
    return {
      id: saved.id,
      ...input,
    };
  }

  async listAuditEvents(filter: AuditFilter): Promise<AuditEventRecord[]> {
    const query = this.dataSource
      .getRepository(AuditEventOrmEntity)
      .createQueryBuilder('audit')
      .orderBy('audit.occurredAt', 'DESC');

    if (filter.from) query.andWhere('audit.occurredAt >= :from', { from: filter.from });
    if (filter.to) query.andWhere('audit.occurredAt <= :to', { to: filter.to });
    if (filter.userId !== undefined)
      query.andWhere('audit.userId = :userId', { userId: filter.userId });
    if (filter.module) query.andWhere('audit.module = :module', { module: filter.module });
    if (filter.level) query.andWhere('audit.level = :level', { level: filter.level });
    if (filter.text?.trim()) {
      query.andWhere(
        `LOWER(CONCAT_WS(' ', audit.userName, audit.module, audit.action, audit.entity, COALESCE(audit.entityId, ''), audit.description)) LIKE :text`,
        { text: `%${filter.text.trim().toLocaleLowerCase('es')}%` },
      );
    }

    const rows = await query.getMany();
    return rows.map((row) => ({
      id: row.id,
      occurredAt: row.occurredAt,
      userId: row.userId,
      userName: row.userName,
      userRole: row.userRole,
      module: row.module,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      description: row.description,
      previousData: row.previousData,
      nextData: row.nextData,
      level: row.level as AuditEventRecord['level'],
      origin: row.origin as AuditEventRecord['origin'],
    }));
  }
}
