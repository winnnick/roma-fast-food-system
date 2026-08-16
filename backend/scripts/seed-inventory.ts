import { InventoryDataSource } from '../apps/inventory-service/src/infrastructure/database/inventory-data-source';

async function main(): Promise<void> {
  await InventoryDataSource.initialize();

  await InventoryDataSource.query(`
    INSERT INTO inv_product_refs (product_id, code, name, inventory_control, status, updated_at) VALUES
      (1, 'HAMB-001', 'Hamburguesa clásica', 'Con receta', 'Activo', now()),
      (2, 'HAMB-002', 'Hamburguesa doble', 'Con receta', 'Activo', now()),
      (3, 'PIZZ-001', 'Pizza familiar', 'Con receta', 'Activo', now()),
      (4, 'COMB-001', 'Combo clásico', 'Con receta', 'Activo', now()),
      (5, 'BEB-001', 'Coca-Cola 500 ml', 'Con receta', 'Activo', now()),
      (6, 'ACOMP-001', 'Papas fritas', 'Con receta', 'Activo', now())
    ON CONFLICT (product_id) DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      inventory_control = EXCLUDED.inventory_control,
      status = EXCLUDED.status,
      updated_at = now()
  `);

  await InventoryDataSource.query(`
    INSERT INTO inv_ingredients (
      id, code, name, category, base_unit, purchase_presentation,
      purchase_conversion_factor, stock, low_stock_control, minimum_stock,
      shortage_policy, economic_control, average_base_unit_cost, status,
      registered_at, updated_at, updated_by_user_id, updated_by_user_name
    ) VALUES
      (1, 'CARNE-HAMB', 'Carne de hamburguesa', 'Carnes', 'g', 'kg', 1000, 5000, true, 500, 'Permitir con advertencia', true, 0.045, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (2, 'PAN-HAMB', 'Pan de hamburguesa', 'Panadería', 'unidad', 'paquete', 12, 72, true, 20, 'Permitir con advertencia', true, 1.5, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (3, 'QUESO-LAM', 'Queso en láminas', 'Lácteos', 'unidad', 'paquete', 20, 120, true, 20, 'Permitir con advertencia', true, 1.2, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (4, 'TOMATE', 'Tomate', 'Vegetales', 'g', 'kg', 1000, 3000, true, 500, 'Permitir con advertencia', true, 0.008, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (5, 'LECHUGA', 'Lechuga', 'Vegetales', 'g', 'kg', 1000, 2000, true, 300, 'Permitir con advertencia', false, NULL, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (6, 'SALSA-CASA', 'Salsa de la casa', 'Salsas', 'ml', 'litro', 1000, 5000, true, 500, 'Permitir con advertencia', false, NULL, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (7, 'PAPA', 'Papa', 'Vegetales', 'g', 'kg', 1000, 10000, true, 2000, 'Permitir con advertencia', true, 0.008, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (8, 'ACEITE', 'Aceite de cocina', 'Aceites', 'ml', 'litro', 1000, 5000, true, 1000, 'Permitir con advertencia', true, 0.014, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (9, 'COCA500', 'Coca-Cola 500 ml', 'Bebidas', 'unidad', 'caja', 12, 48, true, 12, 'Permitir con advertencia', true, 6.5, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (10, 'BASE-PIZZA', 'Base de pizza familiar', 'Panadería', 'unidad', 'unidad', 1, 20, true, 5, 'Permitir con advertencia', true, 10, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (11, 'MOZZARELLA', 'Queso mozzarella', 'Lácteos', 'g', 'kg', 1000, 4000, true, 800, 'Permitir con advertencia', true, 0.05, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (12, 'JAMON', 'Jamón', 'Carnes', 'g', 'kg', 1000, 3000, true, 500, 'Permitir con advertencia', true, 0.04, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General'),
      (13, 'SALSA-TOMATE', 'Salsa de tomate', 'Salsas', 'ml', 'litro', 1000, 4000, true, 700, 'Permitir con advertencia', true, 0.018, 'Activo', '2026-07-21T08:00:00Z', '2026-07-21T08:00:00Z', 1, 'Administrador General')
    ON CONFLICT DO NOTHING
  `);

  await InventoryDataSource.query(`
    INSERT INTO inv_recipes (
      id, product_id, product_code, product_name, version, status,
      valid_from, valid_until, registered_by_user_id, registered_by_user_name
    ) VALUES
      (1, 1, 'HAMB-001', 'Hamburguesa clásica', 1, 'Vigente', '2026-07-21T08:00:00Z', NULL, 1, 'Administrador General'),
      (2, 2, 'HAMB-002', 'Hamburguesa doble', 1, 'Vigente', '2026-07-21T08:00:00Z', NULL, 1, 'Administrador General'),
      (3, 3, 'PIZZ-001', 'Pizza familiar', 1, 'Vigente', '2026-07-21T08:00:00Z', NULL, 1, 'Administrador General'),
      (4, 4, 'COMB-001', 'Combo clásico', 1, 'Vigente', '2026-07-21T08:00:00Z', NULL, 1, 'Administrador General'),
      (5, 5, 'BEB-001', 'Coca-Cola 500 ml', 1, 'Vigente', '2026-07-21T08:00:00Z', NULL, 1, 'Administrador General'),
      (6, 6, 'ACOMP-001', 'Papas fritas', 1, 'Vigente', '2026-07-21T08:00:00Z', NULL, 1, 'Administrador General')
    ON CONFLICT DO NOTHING
  `);

  await InventoryDataSource.query(`
    INSERT INTO inv_recipe_items (recipe_id, ingredient_id, quantity_per_product) VALUES
      (1,1,110),(1,2,1),(1,3,1),(1,4,30),(1,5,20),(1,6,15),
      (2,1,220),(2,2,1),(2,3,2),(2,4,30),(2,5,20),(2,6,20),
      (3,10,1),(3,11,300),(3,12,150),(3,13,100),
      (4,1,110),(4,2,1),(4,3,1),(4,4,30),(4,5,20),(4,6,15),(4,7,180),(4,8,20),(4,9,1),
      (5,9,1),
      (6,7,180),(6,8,20)
    ON CONFLICT DO NOTHING
  `);

  const movementCount = await InventoryDataSource.query<Array<{ count: string }>>(
    `SELECT COUNT(*)::text AS count FROM inv_movements WHERE type = 'Stock inicial'`,
  );
  if (Number(movementCount[0]?.count ?? 0) === 0) {
    await InventoryDataSource.query(`
      INSERT INTO inv_movements (
        ingredient_id, ingredient_code, ingredient_name, base_unit, type, origin,
        quantity, classified_quantity, previous_stock, resulting_stock, reason,
        reference, sale_id, order_number, recipe_version_ids, applied_unit_cost,
        economic_impact, registered_at, user_id, user_name
      )
      SELECT
        id, code, name, base_unit, 'Stock inicial', 'Configuración inicial', stock,
        NULL, 0, stock, 'Stock inicial del insumo.', NULL, NULL, NULL, '{}',
        average_base_unit_cost,
        CASE WHEN economic_control AND average_base_unit_cost IS NOT NULL
          THEN ROUND((stock * average_base_unit_cost)::numeric, 2)
          ELSE NULL END,
        '2026-07-21T08:00:00Z', 1, 'Administrador General'
      FROM inv_ingredients
    `);
  }

  for (const table of ['inv_ingredients', 'inv_recipes', 'inv_recipe_items', 'inv_movements']) {
    await InventoryDataSource.query(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
    );
  }

  console.log('Inventory DB: insumos, proyección de productos y recetas iniciales verificados.');
  await InventoryDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudo completar el seed de Inventory.', error);
  if (InventoryDataSource.isInitialized) await InventoryDataSource.destroy();
  process.exitCode = 1;
});
