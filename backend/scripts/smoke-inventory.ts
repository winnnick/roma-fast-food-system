import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const authBase = process.env.SMOKE_AUTH_URL ?? 'http://localhost:3101/api/v1';
const inventoryBase = process.env.SMOKE_INVENTORY_URL ?? 'http://localhost:3103/api/v1';

interface LoginResult {
  accessToken: string;
}

interface IngredientResponse {
  id: number;
  codigo: string;
  stockActual: number;
}

interface EvaluationResponse {
  bloqueada: boolean;
  requiereConfirmacion: boolean;
}

interface ConsumptionResponse {
  id: number;
  ventaId: number;
  estado: string;
}

interface SummaryResponse {
  totalInsumosActivos: number;
}

async function request<T>(
  label: string,
  url: string,
  options: RequestInit,
  expected = 200,
): Promise<T> {
  const response = await fetch(url, options);
  const bodyText = await response.text();
  let body: unknown = null;
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }
  }
  if (response.status !== expected) {
    throw new Error(
      `${label}: esperaba HTTP ${expected}, recibió ${response.status}. Respuesta: ${bodyText}`,
    );
  }
  console.log(`✓ ${label}: HTTP ${response.status}`);
  return body as T;
}

const json = (token: string, body?: unknown): RequestInit => ({
  method: body === undefined ? 'GET' : 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

async function login(username: string, password: string): Promise<string> {
  const result = await request<LoginResult>(`Login ${username}`, `${authBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return result.accessToken;
}

async function main(): Promise<void> {
  await request('Inventory readiness', `${inventoryBase}/health/ready`, { method: 'GET' });
  await request(
    'Inventario protegido sin JWT',
    `${inventoryBase}/inventario/insumos`,
    { method: 'GET' },
    401,
  );

  const inventoryUser = await login(
    'inventario01',
    process.env.SEED_INVENTARIO_PASSWORD ?? 'Stock2026*',
  );
  const cashier = await login('cajero01', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');

  const ingredients = await request<IngredientResponse[]>(
    'Encargado consulta insumos',
    `${inventoryBase}/inventario/insumos`,
    json(inventoryUser),
  );
  if (ingredients.length < 13)
    throw new Error(`Se esperaban al menos 13 insumos; llegaron ${ingredients.length}.`);
  console.log(`✓ Seed de inventario: ${ingredients.length} insumo(s)`);

  const recipes = await request<unknown[]>(
    'Encargado consulta recetas',
    `${inventoryBase}/inventario/recetas`,
    json(inventoryUser),
  );
  if (recipes.length < 6)
    throw new Error(`Se esperaban al menos 6 recetas; llegaron ${recipes.length}.`);
  console.log(`✓ Seed de recetas: ${recipes.length} receta(s)`);

  await request(
    'Cajero bloqueado al consultar inventario',
    `${inventoryBase}/inventario/insumos`,
    json(cashier),
    403,
  );

  const evaluation = await request<EvaluationResponse>(
    'Evaluar inventario para hamburguesa doble',
    `${inventoryBase}/inventario/evaluaciones-venta`,
    json(inventoryUser, { detalles: [{ productoId: 2, cantidad: 1 }] }),
    201,
  );
  const blocked = evaluation.bloqueada;
  if (blocked)
    throw new Error('La hamburguesa doble inicial no debería quedar bloqueada por stock.');

  const unique = Date.now() % 1_000_000_000;
  const saleId = 1_000_000_000 + (unique % 900_000_000);
  const orderNumber = `SMK-${String(unique).slice(-8)}`;

  const before = await request<IngredientResponse>(
    'Consultar carne antes del consumo',
    `${inventoryBase}/inventario/insumos/1`,
    json(inventoryUser),
  );
  const beforeStock = before.stockActual;

  const first = await request<ConsumptionResponse>(
    'Registrar consumo idempotente de venta',
    `${inventoryBase}/inventario/consumos-venta`,
    json(inventoryUser, {
      ventaId: saleId,
      numeroPedido: orderNumber,
      detalles: [{ productoId: 2, cantidad: 1 }],
      autorizaSaldoNegativo: false,
    }),
    201,
  );

  const afterFirst = await request<IngredientResponse>(
    'Consultar carne después del primer consumo',
    `${inventoryBase}/inventario/insumos/1`,
    json(inventoryUser),
  );
  const afterFirstStock = afterFirst.stockActual;
  if (Math.abs(beforeStock - afterFirstStock - 220) > 0.0001) {
    throw new Error(
      `Se esperaban 220 g consumidos; diferencia detectada: ${beforeStock - afterFirstStock}.`,
    );
  }

  const second = await request<ConsumptionResponse>(
    'Repetir mismo consumo sin descontar dos veces',
    `${inventoryBase}/inventario/consumos-venta`,
    json(inventoryUser, {
      ventaId: saleId,
      numeroPedido: orderNumber,
      detalles: [{ productoId: 2, cantidad: 1 }],
      autorizaSaldoNegativo: false,
    }),
    201,
  );
  if (Number(first.id) !== Number(second.id)) {
    throw new Error('La segunda llamada no devolvió el consumo idempotente original.');
  }

  const afterSecond = await request<IngredientResponse>(
    'Verificar que el stock no volvió a bajar',
    `${inventoryBase}/inventario/insumos/1`,
    json(inventoryUser),
  );
  const afterSecondStock = afterSecond.stockActual;
  if (Math.abs(afterSecondStock - afterFirstStock) > 0.0001) {
    throw new Error('El consumo repetido descontó inventario por segunda vez.');
  }
  console.log('✓ Idempotencia: la misma venta no descuenta inventario dos veces');

  await request<ConsumptionResponse>(
    'Reintegrar consumo por anulación',
    `${inventoryBase}/inventario/anulaciones-venta`,
    json(inventoryUser, {
      ventaId: saleId,
      numeroPedido: orderNumber,
      tratamiento: 'Reintegrar insumos',
      motivo: 'Reversión del smoke test de inventario',
    }),
    201,
  );

  const restored = await request<IngredientResponse>(
    'Comprobar stock restaurado',
    `${inventoryBase}/inventario/insumos/1`,
    json(inventoryUser),
  );
  const restoredStock = restored.stockActual;
  if (Math.abs(restoredStock - beforeStock) > 0.0001) {
    throw new Error(
      `El reintegro no restauró el stock. Antes ${beforeStock}; después ${restoredStock}.`,
    );
  }
  console.log('✓ Anulación con reintegro restaura el stock original');

  const summary = await request<SummaryResponse>(
    'Consultar resumen de inventario',
    `${inventoryBase}/inventario/resumen`,
    json(inventoryUser),
  );
  const active = summary.totalInsumosActivos;
  if (active < 13) throw new Error('El resumen no refleja los insumos activos esperados.');

  console.log('Smoke test Inventory completado correctamente.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
