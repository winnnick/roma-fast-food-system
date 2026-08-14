import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseModule, HealthModule } from '@roma/shared';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    CqrsModule.forRoot(),
    DatabaseModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
