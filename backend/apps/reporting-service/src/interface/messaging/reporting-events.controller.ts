import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import type { ReportingDomainChangedEvent, ReportingSourceDomain } from '@roma/shared';
import { RefreshReportingDomainCommand } from '../../application/reporting/reporting.commands';

const SUPPORTED_DOMAINS = new Set<ReportingSourceDomain>(['auth', 'operations', 'inventory']);

interface RmqChannelRef {
  ack(message: unknown): void;
  nack(message: unknown, allUpTo: boolean, requeue: boolean): void;
}

@Controller()
export class ReportingEventsController {
  private readonly logger = new Logger(ReportingEventsController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern('reporting.domain.changed')
  async domainChanged(
    @Payload() event: ReportingDomainChangedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as unknown as RmqChannelRef;
    const message: unknown = context.getMessage();

    if (!event || !SUPPORTED_DOMAINS.has(event.domain)) {
      this.logger.warn('Se recibió un evento de Reporting con dominio no soportado.');
      channel.ack(message);
      return;
    }

    try {
      await this.commandBus.execute(new RefreshReportingDomainCommand(event.domain));
      channel.ack(message);
      this.logger.log(
        `Snapshot ${event.domain} actualizado por evento ${event.method} ${event.path}.`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Falló la actualización automática de ${event.domain}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      channel.nack(message, false, true);
    }
  }
}
