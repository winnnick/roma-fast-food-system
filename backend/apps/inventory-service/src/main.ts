import 'reflect-metadata';

import { bootstrapHttpService } from '@roma/shared';

import { AppModule } from './app.module';

process.env.SERVICE_NAME = 'inventory-service';

void bootstrapHttpService(AppModule, {
  serviceName: 'Roma Inventory Service',
  serviceDescription:
    'Insumos, recetas versionadas, movimientos, conteos y consumos de inventario.',
  defaultPort: 3103,
  rabbitMqQueue: 'roma.inventory',
});
