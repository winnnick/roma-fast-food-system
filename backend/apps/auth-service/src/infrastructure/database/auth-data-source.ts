import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

import { PermissionOrmEntity } from '../persistence/entities/permission.orm-entity';
import { RefreshSessionOrmEntity } from '../persistence/entities/refresh-session.orm-entity';
import { RoleOrmEntity } from '../persistence/entities/role.orm-entity';
import { UserOrmEntity } from '../persistence/entities/user.orm-entity';
import { CreateAuthSchema1786644000000 } from './migrations/1786644000000-create-auth-schema';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL es obligatorio para ejecutar las migraciones de Auth.');
}

export const AuthDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [UserOrmEntity, RoleOrmEntity, PermissionOrmEntity, RefreshSessionOrmEntity],
  migrations: [CreateAuthSchema1786644000000],
  migrationsTableName: 'auth_migrations',
});
