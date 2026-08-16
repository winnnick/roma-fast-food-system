import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

import { CashMovementOrmEntity } from '../persistence/entities/cash-movement.orm-entity';
import { CashSessionOrmEntity } from '../persistence/entities/cash-session.orm-entity';
import { CategoryOrmEntity } from '../persistence/entities/category.orm-entity';
import { ClientOrmEntity } from '../persistence/entities/client.orm-entity';
import { OperationsSettingOrmEntity } from '../persistence/entities/operations-setting.orm-entity';
import { ProductOrmEntity } from '../persistence/entities/product.orm-entity';
import { SaleDetailOrmEntity } from '../persistence/entities/sale-detail.orm-entity';
import { SalePaymentOrmEntity } from '../persistence/entities/sale-payment.orm-entity';
import { SaleOrmEntity } from '../persistence/entities/sale.orm-entity';
import { CreateCatalogSchema1786788000000 } from './migrations/1786788000000-create-catalog-schema';
import { CreateSalesCashSchema1786874400000 } from './migrations/1786874400000-create-sales-cash-schema';

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
  entities: [
    CategoryOrmEntity,
    ProductOrmEntity,
    ClientOrmEntity,
    CashSessionOrmEntity,
    SaleOrmEntity,
    SaleDetailOrmEntity,
    SalePaymentOrmEntity,
    CashMovementOrmEntity,
    OperationsSettingOrmEntity,
  ],
  migrations: [CreateCatalogSchema1786788000000, CreateSalesCashSchema1786874400000],
  migrationsTableName: 'operations_migrations',
});
