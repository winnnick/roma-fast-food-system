import type {
  ReportingDomain,
  ReportingSnapshot,
  ReportingSnapshotInput,
} from '../reporting/reporting.models';

export const REPORTING_REPOSITORY = Symbol('REPORTING_REPOSITORY');
export const REPORTING_SOURCE = Symbol('REPORTING_SOURCE');

export interface ReportingRepositoryPort {
  replaceSnapshots(inputs: ReportingSnapshotInput[]): Promise<void>;
  listSnapshots(): Promise<ReportingSnapshot[]>;
}

export interface ReportingSourcePort {
  fetch(domain: ReportingDomain): Promise<Record<string, unknown>>;
}
