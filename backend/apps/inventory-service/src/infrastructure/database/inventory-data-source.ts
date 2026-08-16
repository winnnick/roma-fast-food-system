import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

import { IngredientOrmEntity } from '../persistence/entities/ingredient.orm-entity';
import { InventoryCountDetailOrmEntity } from '../persistence/entities/inventory-count-detail.orm-entity';
import { InventoryCountOrmEntity } from '../persistence/entities/inventory-count.orm-entity';
import { InventoryMovementOrmEntity } from '../persistence/entities/movement.orm-entity';
import { ProductReferenceOrmEntity } from '../persistence/entities/product-reference.orm-entity';
import { RecipeItemOrmEntity } from '../persistence/entities/recipe-item.orm-entity';
import { RecipeOrmEntity } from '../persistence/entities/recipe.orm-entity';
import { SaleConsumptionDetailOrmEntity } from '../persistence/entities/sale-consumption-detail.orm-entity';
import { SaleConsumptionOrmEntity } from '../persistence/entities/sale-consumption.orm-entity';
import { CreateInventorySchema1786960800000 } from './migrations/1786960800000-create-inventory-schema';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const databaseUrl = process.env.INVENTORY_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INVENTORY_DATABASE_URL es obligatorio para migraciones de Inventory. No se permite una URL genérica compartida.',
  );
}

export const InventoryDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [
    IngredientOrmEntity,
    ProductReferenceOrmEntity,
    RecipeOrmEntity,
    RecipeItemOrmEntity,
    InventoryMovementOrmEntity,
    SaleConsumptionOrmEntity,
    SaleConsumptionDetailOrmEntity,
    InventoryCountOrmEntity,
    InventoryCountDetailOrmEntity,
  ],
  migrations: [CreateInventorySchema1786960800000],
  migrationsTableName: 'inventory_migrations',
});
