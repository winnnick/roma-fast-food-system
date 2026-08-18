import type {
  ReportingDomain,
  ReportingSnapshot,
  ReportingSnapshotInput,
} from '../reporting/reporting.models';
import type { AuditEventInput, AuditEventRecord, AuditFilter } from '../reporting/audit.models';

export const REPORTING_REPOSITORY = Symbol('REPORTING_REPOSITORY');
export const REPORTING_SOURCE = Symbol('REPORTING_SOURCE');

export interface ReportingRepositoryPort {
  replaceSnapshots(inputs: ReportingSnapshotInput[]): Promise<void>;
  listSnapshots(): Promise<ReportingSnapshot[]>;
  createAuditEvent(input: AuditEventInput): Promise<AuditEventRecord>;
  listAuditEvents(filter: AuditFilter): Promise<AuditEventRecord[]>;
}

export interface ReportingSourcePort {
  fetch(domain: ReportingDomain): Promise<Record<string, unknown>>;
}
