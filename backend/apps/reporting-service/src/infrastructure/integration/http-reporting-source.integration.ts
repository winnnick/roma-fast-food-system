import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ReportingDomain } from '../../domain/reporting/reporting.models';
import type { ReportingSourcePort } from '../../domain/ports/reporting.ports';

@Injectable()
export class HttpReportingSource implements ReportingSourcePort {
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly urls: Record<ReportingDomain, string>;

  constructor(config: ConfigService) {
    this.token = config.getOrThrow<string>('INTERNAL_SERVICE_TOKEN');
    this.timeoutMs = Number(config.get<string>('INTERNAL_HTTP_TIMEOUT_MS', '5000'));
    this.urls = {
      auth: config.getOrThrow<string>('AUTH_INTERNAL_REPORTING_URL'),
      operations: config.getOrThrow<string>('OPERATIONS_INTERNAL_REPORTING_URL'),
      inventory: config.getOrThrow<string>('INVENTORY_INTERNAL_REPORTING_URL'),
    };
  }

  async fetch(domain: ReportingDomain): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(this.urls[domain], {
        headers: { 'x-roma-internal-token': this.token },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'REPORTING_SOURCE_UNAVAILABLE',
        message: `No fue posible consultar el origen ${domain}.`,
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new ServiceUnavailableException({
        code: 'REPORTING_SOURCE_REJECTED',
        message: `El origen ${domain} rechazó la reconstrucción.`,
        detail,
      });
    }

    const data = (await response.json()) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new ServiceUnavailableException(`El origen ${domain} devolvió un snapshot inválido.`);
    }
    return data as Record<string, unknown>;
  }
}
