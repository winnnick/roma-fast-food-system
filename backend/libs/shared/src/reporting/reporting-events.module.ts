import {
  DynamicModule,
  Inject,
  Injectable,
  Logger,
  Module,
  NestInterceptor,
  type CallHandler,
  type ExecutionContext,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { firstValueFrom, type Observable } from 'rxjs';
import { tap, timeout } from 'rxjs/operators';

export type ReportingSourceDomain = 'auth' | 'operations' | 'inventory';

export interface ReportingDomainChangedEvent {
  domain: ReportingSourceDomain;
  occurredAt: string;
  method: string;
  path: string;
  correlationId: string | null;
}

const REPORTING_EVENT_DOMAIN = Symbol('REPORTING_EVENT_DOMAIN');

@Injectable()
export class ReportingEventPublisher implements OnApplicationShutdown {
  private readonly logger = new Logger(ReportingEventPublisher.name);
  private readonly enabled: boolean;
  private readonly client: ClientProxy | null;

  constructor(
    private readonly config: ConfigService,
    @Inject(REPORTING_EVENT_DOMAIN) private readonly domain: ReportingSourceDomain,
  ) {
    this.enabled = this.config.get<string>('RABBITMQ_ENABLED', 'false') === 'true';

    if (!this.enabled) {
      this.client = null;
      return;
    }

    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    const queue = this.config.get<string>('REPORTING_RABBITMQ_QUEUE', 'roma.reporting');

    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue,
        queueOptions: {
          durable: true,
        },
        persistent: true,
      },
    });
  }

  publishChange(input: { method: string; path: string; correlationId: string | null }): void {
    if (!this.client) {
      return;
    }

    const event: ReportingDomainChangedEvent = {
      domain: this.domain,
      occurredAt: new Date().toISOString(),
      method: input.method,
      path: input.path,
      correlationId: input.correlationId,
    };

    void firstValueFrom(
      this.client
        .emit<ReportingDomainChangedEvent>('reporting.domain.changed', event)
        .pipe(timeout(2000)),
    ).catch((error: unknown) => {
      this.logger.warn(
        `No fue posible publicar actualización de Reporting para ${this.domain}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}

@Injectable()
export class ReportingChangeInterceptor implements NestInterceptor {
  constructor(private readonly publisher: ReportingEventPublisher) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method.toUpperCase();

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        this.publisher.publishChange({
          method,
          path: request.originalUrl || request.url,
          correlationId:
            typeof response.locals.correlationId === 'string'
              ? response.locals.correlationId
              : null,
        });
      }),
    );
  }
}

@Module({})
export class ReportingEventsModule {
  static forDomain(domain: ReportingSourceDomain): DynamicModule {
    return {
      module: ReportingEventsModule,
      providers: [
        {
          provide: REPORTING_EVENT_DOMAIN,
          useValue: domain,
        },
        ReportingEventPublisher,
        {
          provide: APP_INTERCEPTOR,
          useClass: ReportingChangeInterceptor,
        },
      ],
      exports: [ReportingEventPublisher],
    };
  }
}
