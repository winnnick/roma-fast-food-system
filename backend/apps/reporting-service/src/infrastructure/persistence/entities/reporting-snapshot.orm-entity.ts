import { Column, Entity, PrimaryColumn } from 'typeorm';

import type { ReportingDomain } from '../../../domain/reporting/reporting.models';

@Entity({ name: 'rpt_domain_snapshots' })
export class ReportingSnapshotOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  domain!: ReportingDomain;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt!: Date;
}
