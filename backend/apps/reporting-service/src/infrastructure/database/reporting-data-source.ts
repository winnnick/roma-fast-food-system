import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

import { CreateReportingSnapshots1787392800000 } from './migrations/1787392800000-create-reporting-snapshots';
import { CreateReportingAudit1787479200000 } from './migrations/1787479200000-create-reporting-audit';
import { ReportingSnapshotOrmEntity } from '../persistence/entities/reporting-snapshot.orm-entity';
import { AuditEventOrmEntity } from '../persistence/entities/audit-event.orm-entity';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const databaseUrl = process.env.REPORTING_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('REPORTING_DATABASE_URL es obligatorio para migraciones de Reporting.');
}

export const ReportingDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [ReportingSnapshotOrmEntity, AuditEventOrmEntity],
  migrations: [CreateReportingSnapshots1787392800000, CreateReportingAudit1787479200000],
  migrationsTableName: 'reporting_migrations',
});
