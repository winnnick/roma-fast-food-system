import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportingAudit1787479200000 implements MigrationInterface {
  name = 'CreateReportingAudit1787479200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rpt_audit_events (
        id SERIAL PRIMARY KEY,
        occurred_at TIMESTAMPTZ NOT NULL,
        user_id INTEGER NULL,
        user_name VARCHAR(160) NOT NULL,
        user_role VARCHAR(80) NULL,
        module VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id VARCHAR(160) NULL,
        description VARCHAR(600) NOT NULL,
        previous_data JSONB NULL,
        next_data JSONB NULL,
        level VARCHAR(30) NOT NULL,
        origin VARCHAR(40) NOT NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_rpt_audit_occurred_at ON rpt_audit_events (occurred_at DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_rpt_audit_user_id ON rpt_audit_events (user_id)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_rpt_audit_module ON rpt_audit_events (module)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS rpt_audit_events');
  }
}
