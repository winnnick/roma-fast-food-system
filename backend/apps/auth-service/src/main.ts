import 'reflect-metadata';

import { bootstrapHttpService } from '@roma/shared';

import { AppModule } from './app.module';

process.env.SERVICE_NAME = 'auth-service';

void bootstrapHttpService(AppModule, {
  serviceName: 'Roma Auth Service',
  serviceDescription: 'Autenticación, usuarios, roles, permisos y tokens de Roma Fast Food.',
  defaultPort: 3101,
  rabbitMqQueue: 'roma.auth',
});
