import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface DatabaseModuleOptions {
  databaseUrlEnv: string;
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService): TypeOrmModuleOptions => {
            const databaseUrl = config.get<string>(options.databaseUrlEnv);

            if (!databaseUrl) {
              throw new Error(
                `Se requiere ${options.databaseUrlEnv}. Cada microservicio debe usar su propia base de datos.`,
              );
            }

            const sslEnabled = config.get<string>('DATABASE_SSL', 'false') === 'true';

            return {
              type: 'postgres',
              url: databaseUrl,
              autoLoadEntities: true,
              synchronize: false,
              migrationsRun: false,
              logging: config.get<string>('NODE_ENV') === 'development',
              ssl: sslEnabled ? { rejectUnauthorized: false } : false,
            };
          },
        }),
      ],
    };
  }
}
