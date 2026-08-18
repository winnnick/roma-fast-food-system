import type { AuditLevel, AuditOrigin } from '../../domain/reporting/audit.models';

export class RegisterAuditEventCommand {
  constructor(
    public readonly userId: number | null,
    public readonly userName: string,
    public readonly userRole: string | null,
    public readonly module: string,
    public readonly action: string,
    public readonly entity: string,
    public readonly entityId: string | null,
    public readonly description: string,
    public readonly previousData: unknown,
    public readonly nextData: unknown,
    public readonly level: AuditLevel,
    public readonly origin: AuditOrigin,
  ) {}
}
