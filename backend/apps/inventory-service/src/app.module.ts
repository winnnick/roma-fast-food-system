import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseModule, HealthModule, ReportingEventsModule } from '@roma/shared';
import { InventoryModule } from './inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    CqrsModule.forRoot(),
    DatabaseModule.forRoot({ databaseUrlEnv: 'INVENTORY_DATABASE_URL' }),
    InventoryModule,
    HealthModule,
    ReportingEventsModule.forDomain('inventory'),
  ],
})
export class AppModule {}
