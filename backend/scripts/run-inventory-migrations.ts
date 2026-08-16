import { InventoryDataSource } from '../apps/inventory-service/src/infrastructure/database/inventory-data-source';

async function main(): Promise<void> {
  await InventoryDataSource.initialize();
  const migrations = await InventoryDataSource.runMigrations({ transaction: 'all' });
  console.log(
    migrations.length === 0
      ? 'Inventory DB: no hay migraciones pendientes.'
      : `Inventory DB: ${migrations.length} migración(es) aplicada(s).`,
  );
  await InventoryDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudieron ejecutar las migraciones de Inventory.', error);
  if (InventoryDataSource.isInitialized) await InventoryDataSource.destroy();
  process.exitCode = 1;
});
