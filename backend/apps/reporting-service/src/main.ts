import 'reflect-metadata';

import { bootstrapHttpService } from '@roma/shared';

import { AppModule } from './app.module';

process.env.SERVICE_NAME = 'reporting-service';

void bootstrapHttpService(AppModule, {
  serviceName: 'Roma Reporting Service',
  serviceDescription: 'Dashboard, reportes, conciliación, arqueos y proyecciones de lectura.',
  defaultPort: 3104,
  rabbitMqQueue: 'roma.reporting',
});
