import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryIntegrationToSales1787047200000 implements MigrationInterface {
  name = 'AddInventoryIntegrationToSales1787047200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ops_sales
        ADD COLUMN inventory_status varchar(30) NOT NULL DEFAULT 'No integrado',
        ADD COLUMN inventory_consumption_id integer NULL,
        ADD COLUMN inventory_last_error varchar(500) NULL,
        ADD COLUMN inventory_updated_at timestamptz NULL,
        ADD CONSTRAINT ck_ops_sales_inventory_status CHECK (inventory_status IN ('No integrado','Pendiente','Aplicado','Reintegrado','Merma','Error'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ops_sales DROP CONSTRAINT IF EXISTS ck_ops_sales_inventory_status`,
    );
    await queryRunner.query(`
      ALTER TABLE ops_sales
        DROP COLUMN IF EXISTS inventory_updated_at,
        DROP COLUMN IF EXISTS inventory_last_error,
        DROP COLUMN IF EXISTS inventory_consumption_id,
        DROP COLUMN IF EXISTS inventory_status
    `);
  }
}
