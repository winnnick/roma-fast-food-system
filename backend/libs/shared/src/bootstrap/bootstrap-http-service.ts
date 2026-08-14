import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { Type } from '@nestjs/common';

import { correlationIdMiddleware } from './correlation-id.middleware';
import type { ServiceBootstrapOptions } from './service-bootstrap.options';

function parseOrigins(rawOrigins: string | undefined): string[] | boolean {
  if (!rawOrigins || rawOrigins.trim() === '*') {
    return true;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function bootstrapHttpService(
  rootModule: Type<unknown>,
  options: ServiceBootstrapOptions,
): Promise<void> {
  const app = await NestFactory.create(rootModule, {
    bufferLogs: true,
  });

  const logger = new Logger(options.serviceName);
  const config = app.get(ConfigService);

  app.useLogger(logger);
  app.use(helmet());
  app.use(correlationIdMiddleware);
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  const origins = parseOrigins(config.get<string>('CORS_ORIGINS'));
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle(options.serviceName)
    .setDescription(options.serviceDescription)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const rabbitMqEnabled = config.get<string>('RABBITMQ_ENABLED', 'false') === 'true';

  if (rabbitMqEnabled) {
    const rabbitMqUrl = config.getOrThrow<string>('RABBITMQ_URL');
    const queue = config.get<string>('RABBITMQ_QUEUE', options.rabbitMqQueue);

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitMqUrl],
        queue,
        queueOptions: {
          durable: true,
        },
        prefetchCount: 10,
        noAck: false,
      },
    });

    await app.startAllMicroservices();
    logger.log(`RabbitMQ conectado. Cola: ${queue}`);
  } else {
    logger.warn('RabbitMQ deshabilitado para este proceso.');
  }

  const port = config.get<number>('HTTP_PORT', options.defaultPort);
  await app.listen(port, '0.0.0.0');

  logger.log(`${options.serviceName} escuchando en http://localhost:${port}/api/v1`);
  logger.log(`OpenAPI disponible en http://localhost:${port}/docs`);
}
