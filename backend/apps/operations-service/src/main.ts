import 'reflect-metadata';

import { bootstrapHttpService } from '@roma/shared';

import { AppModule } from './app.module';

process.env.SERVICE_NAME = 'operations-service';

void bootstrapHttpService(AppModule, {
  serviceName: 'Roma Operations Service',
  serviceDescription: 'Productos, clientes, pedidos, ventas, preparación, pagos, caja y PedidosYa.',
  defaultPort: 3102,
  rabbitMqQueue: 'roma.operations',
});
