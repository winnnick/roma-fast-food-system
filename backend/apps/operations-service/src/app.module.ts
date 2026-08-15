import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseModule, HealthModule } from '@roma/shared';
import { OperationsModule } from './operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    CqrsModule.forRoot(),
    DatabaseModule.forRoot({ databaseUrlEnv: 'OPERATIONS_DATABASE_URL' }),
    OperationsModule,
    HealthModule,
  ],
})
export class AppModule {}
