import { AuthDataSource } from '../apps/auth-service/src/infrastructure/database/auth-data-source';

async function main(): Promise<void> {
  await AuthDataSource.initialize();
  const migrations = await AuthDataSource.runMigrations({ transaction: 'all' });
  console.log(
    migrations.length === 0
      ? 'Auth DB: no hay migraciones pendientes.'
      : `Auth DB: ${migrations.length} migración(es) aplicada(s).`,
  );
  await AuthDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudieron ejecutar las migraciones de Auth.', error);
  if (AuthDataSource.isInitialized) {
    await AuthDataSource.destroy();
  }
  process.exitCode = 1;
});
