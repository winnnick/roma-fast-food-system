export type AuditLevel = 'Información' | 'Advertencia' | 'Crítico';
export type AuditOrigin = 'Interfaz web' | 'Proceso automático' | 'Migración' | 'Sistema';

export interface AuditEventInput {
  userId: number | null;
  userName: string;
  userRole: string | null;
  module: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  previousData: unknown;
  nextData: unknown;
  level: AuditLevel;
  origin: AuditOrigin;
  occurredAt: Date;
}

export interface AuditEventRecord extends AuditEventInput {
  id: number;
}

export interface AuditFilter {
  from?: Date;
  to?: Date;
  userId?: number;
  module?: string;
  level?: AuditLevel;
  text?: string;
}
