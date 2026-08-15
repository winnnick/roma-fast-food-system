import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseModule, HealthModule } from '@roma/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    CqrsModule.forRoot(),
    DatabaseModule.forRoot({ databaseUrlEnv: 'REPORTING_DATABASE_URL' }),
    HealthModule,
  ],
})
export class AppModule {}
