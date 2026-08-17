import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipeItemDisplayOrder1787306400000 implements MigrationInterface {
  name = 'AddRecipeItemDisplayOrder1787306400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE inv_recipe_items ADD COLUMN display_order integer NULL');

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY recipe_id ORDER BY id)::integer AS position
        FROM inv_recipe_items
      )
      UPDATE inv_recipe_items AS item
      SET display_order = ranked.position
      FROM ranked
      WHERE ranked.id = item.id
    `);

    await queryRunner.query('ALTER TABLE inv_recipe_items ALTER COLUMN display_order SET NOT NULL');
    await queryRunner.query(
      'ALTER TABLE inv_recipe_items ADD CONSTRAINT ck_inv_recipe_items_display_order CHECK (display_order > 0)',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX ux_inv_recipe_items_recipe_display_order ON inv_recipe_items(recipe_id, display_order)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS ux_inv_recipe_items_recipe_display_order');
    await queryRunner.query(
      'ALTER TABLE inv_recipe_items DROP CONSTRAINT IF EXISTS ck_inv_recipe_items_display_order',
    );
    await queryRunner.query('ALTER TABLE inv_recipe_items DROP COLUMN IF EXISTS display_order');
  }
}
