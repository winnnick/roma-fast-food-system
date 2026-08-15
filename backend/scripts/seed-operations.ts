import { OperationsDataSource } from '../apps/operations-service/src/infrastructure/database/operations-data-source';

async function main(): Promise<void> {
  await OperationsDataSource.initialize();

  await OperationsDataSource.query(`
    INSERT INTO ops_categories (id, name, description, status, registered_at, updated_at) VALUES
      (1, 'Hamburguesas', 'Hamburguesas tradicionales, especiales y dobles.', 'Activo', '2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00.000Z'),
      (2, 'Pizzas', 'Pizzas personales, medianas y familiares.', 'Activo', '2026-07-01T12:05:00.000Z', '2026-07-01T12:05:00.000Z'),
      (3, 'Combos', 'Combinaciones de productos con bebidas y acompañamientos.', 'Activo', '2026-07-01T12:10:00.000Z', '2026-07-01T12:10:00.000Z'),
      (4, 'Bebidas', 'Bebidas gaseosas, jugos y agua.', 'Activo', '2026-07-01T12:15:00.000Z', '2026-07-01T12:15:00.000Z'),
      (5, 'Acompañamientos', 'Papas fritas, aros de cebolla y porciones adicionales.', 'Activo', '2026-07-01T12:20:00.000Z', '2026-07-01T12:20:00.000Z')
    ON CONFLICT DO NOTHING
  `);

  await OperationsDataSource.query(`
    INSERT INTO ops_products (
      id, code, name, description, category_id, price, available_pedidosya, pedidosya_price,
      status, available, featured, preparation_mode, inventory_control, image_url,
      registered_at, updated_at
    ) VALUES
      (1, 'HAMB-001', 'Hamburguesa clásica', 'Carne, queso, lechuga, tomate y salsa de la casa.', 1, 25.00, false, NULL, 'Activo', true, true, 'Requiere preparación', 'Con receta', NULL, '2026-07-02T12:00:00.000Z', '2026-07-02T12:00:00.000Z'),
      (2, 'HAMB-002', 'Hamburguesa doble', 'Doble carne, doble queso, vegetales y salsa especial.', 1, 35.00, false, NULL, 'Activo', true, true, 'Requiere preparación', 'Con receta', NULL, '2026-07-02T12:05:00.000Z', '2026-07-02T12:05:00.000Z'),
      (3, 'PIZZ-001', 'Pizza familiar', 'Pizza familiar con queso, jamón y salsa de tomate.', 2, 65.00, false, NULL, 'Activo', true, false, 'Requiere preparación', 'Con receta', NULL, '2026-07-02T12:10:00.000Z', '2026-07-02T12:10:00.000Z'),
      (4, 'COMB-001', 'Combo clásico', 'Hamburguesa clásica, papas fritas y bebida personal.', 3, 38.00, false, NULL, 'Activo', true, true, 'Requiere preparación', 'Con receta', NULL, '2026-07-02T12:15:00.000Z', '2026-07-02T12:15:00.000Z'),
      (5, 'BEB-001', 'Coca-Cola 500 ml', 'Bebida gaseosa personal de 500 mililitros.', 4, 10.00, false, NULL, 'Activo', true, false, 'Entrega directa', 'Con receta', NULL, '2026-07-02T12:20:00.000Z', '2026-07-02T12:20:00.000Z'),
      (6, 'ACOMP-001', 'Papas fritas', 'Porción individual de papas fritas.', 5, 12.00, false, NULL, 'Activo', true, false, 'Requiere preparación', 'Con receta', NULL, '2026-07-02T12:25:00.000Z', '2026-07-02T12:25:00.000Z')
    ON CONFLICT DO NOTHING
  `);

  await OperationsDataSource.query(`
    INSERT INTO ops_clients (
      id, full_name, document_type, document_number, phone, email, address, zone,
      address_reference, location_url, delivery_instructions, observations, status,
      archived, archived_at, registered_at, updated_at
    ) VALUES
      (1, 'María Fernanda López', 'CI', '7123456', '72900101', 'maria.lopez@correo.com', 'Calle Bolívar N.º 325', 'Barrio San Martín', 'Portón negro frente a la farmacia.', NULL, 'Llamar al llegar.', 'Cliente frecuente.', 'Activo', false, NULL, '2026-07-10T14:30:00.000Z', '2026-07-10T14:30:00.000Z'),
      (2, 'Carlos Alberto Rojas', 'CI', '6987452', '76122334', NULL, 'Calle Sucre esquina Colón', 'Zona Central', NULL, NULL, NULL, NULL, 'Activo', false, NULL, '2026-07-11T18:20:00.000Z', '2026-07-11T18:20:00.000Z'),
      (3, 'Distribuidora San Luis', 'NIT', '1029384756', '46612345', 'contacto@sanluis.com', 'Av. Las Américas N.º 841', 'Las Américas', 'Ingreso por el portón lateral.', NULL, 'Entregar en recepción.', 'Solicita factura en sus compras.', 'Activo', false, NULL, '2026-07-12T16:10:00.000Z', '2026-07-12T16:10:00.000Z'),
      (4, 'Andrea Valdez', NULL, NULL, '71881122', NULL, NULL, NULL, NULL, NULL, NULL, 'Prefiere contacto mediante WhatsApp.', 'Inactivo', true, '2026-07-15T09:45:00.000Z', '2026-07-13T12:00:00.000Z', '2026-07-15T09:45:00.000Z')
    ON CONFLICT DO NOTHING
  `);

  for (const table of ['ops_categories', 'ops_products', 'ops_clients']) {
    await OperationsDataSource.query(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
    );
  }

  console.log('Operations DB: categorías, productos y clientes iniciales verificados.');
  await OperationsDataSource.destroy();
}

void main().catch(async (error: unknown) => {
  console.error('No se pudo completar el seed de Operations.', error);
  if (OperationsDataSource.isInitialized) await OperationsDataSource.destroy();
  process.exitCode = 1;
});
