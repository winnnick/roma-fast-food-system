export type ReportingDomain = 'auth' | 'operations' | 'inventory';

export interface ReportingSnapshotInput {
  domain: ReportingDomain;
  payload: Record<string, unknown>;
  capturedAt: Date;
}

export interface ReportingSnapshot {
  domain: ReportingDomain;
  payload: Record<string, unknown>;
  capturedAt: Date;
}

export interface ReportingSnapshotStatus {
  domain: ReportingDomain;
  capturedAt: string;
  sections: Record<string, number>;
}

export interface ReportingStatusView {
  generatedAt: string;
  snapshots: ReportingSnapshotStatus[];
}
