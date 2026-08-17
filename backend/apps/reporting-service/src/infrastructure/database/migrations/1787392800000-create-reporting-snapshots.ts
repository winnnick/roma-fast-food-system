import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportingSnapshots1787392800000 implements MigrationInterface {
  name = 'CreateReportingSnapshots1787392800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rpt_domain_snapshots (
        domain varchar(20) PRIMARY KEY,
        payload jsonb NOT NULL,
        captured_at timestamptz NOT NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS rpt_domain_snapshots');
  }
}
