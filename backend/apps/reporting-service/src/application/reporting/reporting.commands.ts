import type { ReportingDomain } from '../../domain/reporting/reporting.models';

export class RebuildReportingSnapshotsCommand {}

export class RefreshReportingDomainCommand {
  constructor(public readonly domain: ReportingDomain) {}
}
