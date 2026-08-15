import { OperationsDataSource } from '../apps/operations-service/src/infrastructure/database/operations-data-source';

async function main(): Promise<void> {
  await OperationsDataSource.initialize();
  const migrations = await OperationsDataSource.runMigrations({ transaction: 'all' });
  console.log(
    migrations.length === 0
      ? 'Operations DB: no hay migraciones pendientes.'
      : `Operations DB: ${migrations.length} migración(es) aplicada(s).`,
  );
  await OperationsDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudieron ejecutar las migraciones de Operations.', error);
  if (OperationsDataSource.isInitialized) await OperationsDataSource.destroy();
  process.exitCode = 1;
});
