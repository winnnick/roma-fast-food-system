import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { AuditEventRecord } from '../../domain/reporting/audit.models';
import type { ReportingRepositoryPort } from '../../domain/ports/reporting.ports';
import { REPORTING_REPOSITORY } from '../../domain/ports/reporting.ports';
import { RegisterAuditEventCommand } from './audit.commands';
import { ListAuditEventsQuery } from './audit.queries';

const SENSITIVE_KEYS = new Set([
  'password',
  'contrasena',
  'contraseña',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'secret',
  'secreto',
]);

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        const normalized = key.toLocaleLowerCase('es').replaceAll('-', '').replaceAll('_', '');
        const protectedValue =
          SENSITIVE_KEYS.has(key.toLocaleLowerCase('es')) || SENSITIVE_KEYS.has(normalized);
        return [key, protectedValue ? '[PROTEGIDO]' : sanitize(item)];
      }),
    );
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'symbol') return value.description ?? '[SÍMBOLO]';
  if (typeof value === 'function') return '[FUNCIÓN]';
  return null;
}

@CommandHandler(RegisterAuditEventCommand)
export class RegisterAuditEventHandler implements ICommandHandler<
  RegisterAuditEventCommand,
  AuditEventRecord
> {
  constructor(@Inject(REPORTING_REPOSITORY) private readonly repository: ReportingRepositoryPort) {}

  execute(command: RegisterAuditEventCommand): Promise<AuditEventRecord> {
    return this.repository.createAuditEvent({
      userId: command.userId,
      userName: command.userName,
      userRole: command.userRole,
      module: command.module.trim(),
      action: command.action.trim(),
      entity: command.entity.trim(),
      entityId: command.entityId,
      description: command.description.trim(),
      previousData: sanitize(command.previousData),
      nextData: sanitize(command.nextData),
      level: command.level,
      origin: command.origin,
      occurredAt: new Date(),
    });
  }
}

@QueryHandler(ListAuditEventsQuery)
export class ListAuditEventsHandler implements IQueryHandler<
  ListAuditEventsQuery,
  AuditEventRecord[]
> {
  constructor(@Inject(REPORTING_REPOSITORY) private readonly repository: ReportingRepositoryPort) {}

  execute(query: ListAuditEventsQuery): Promise<AuditEventRecord[]> {
    return this.repository.listAuditEvents(query.filter);
  }
}
