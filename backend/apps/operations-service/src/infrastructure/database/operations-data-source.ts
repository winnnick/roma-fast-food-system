import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

import { CategoryOrmEntity } from '../persistence/entities/category.orm-entity';
import { ClientOrmEntity } from '../persistence/entities/client.orm-entity';
import { ProductOrmEntity } from '../persistence/entities/product.orm-entity';
import { CreateCatalogSchema1786788000000 } from './migrations/1786788000000-create-catalog-schema';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const databaseUrl = process.env.OPERATIONS_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'OPERATIONS_DATABASE_URL (o DATABASE_URL como compatibilidad) es obligatorio para migraciones de Operations.',
  );
}

export const OperationsDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [CategoryOrmEntity, ProductOrmEntity, ClientOrmEntity],
  migrations: [CreateCatalogSchema1786788000000],
  migrationsTableName: 'operations_migrations',
});
