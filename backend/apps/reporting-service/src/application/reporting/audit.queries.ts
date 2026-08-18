import type { AuditFilter } from '../../domain/reporting/audit.models';

export class ListAuditEventsQuery {
  constructor(public readonly filter: AuditFilter) {}
}
