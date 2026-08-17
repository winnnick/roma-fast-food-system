import { ReportingDataSource } from '../apps/reporting-service/src/infrastructure/database/reporting-data-source';

async function main(): Promise<void> {
  await ReportingDataSource.initialize();
  const migrations = await ReportingDataSource.runMigrations({ transaction: 'all' });
  console.log(
    migrations.length === 0
      ? 'Reporting DB: no hay migraciones pendientes.'
      : `Reporting DB: ${migrations.length} migración(es) aplicada(s).`,
  );
  await ReportingDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudieron ejecutar las migraciones de Reporting.', error);
  if (ReportingDataSource.isInitialized) await ReportingDataSource.destroy();
  process.exitCode = 1;
});
