import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const authBase = process.env.SMOKE_AUTH_URL ?? 'http://localhost:3101/api/v1';
const operationsBase = process.env.SMOKE_OPERATIONS_URL ?? 'http://localhost:3102/api/v1';
const inventoryBase = process.env.SMOKE_INVENTORY_URL ?? 'http://localhost:3103/api/v1';

interface LoginResult {
  accessToken: string;
}
interface CashSession {
  id: number;
  estado: 'Abierta' | 'Cerrada';
}
interface CashSummary {
  efectivoEsperado: number;
}
interface Ingredient {
  id: number;
  codigo: string;
  stockActual: number;
}
interface Sale {
  id: number;
  numeroPedido: string;
  estadoPreparacion: string;
  estadoInventario: string;
  consumoInventarioId: number | null;
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
      body = JSON.parse(bodyText) as unknown;
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

const bearer = (token: string, body?: unknown): RequestInit => ({
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

async function ensureCash(token: string): Promise<{ session: CashSession; created: boolean }> {
  const current = await request<CashSession | null>(
    'Consultar caja actual del cajero',
    `${operationsBase}/caja/actual`,
    bearer(token),
  );
  if (current) return { session: current, created: false };
  const session = await request<CashSession>(
    'Abrir caja para integración Operations–Inventory',
    `${operationsBase}/caja/aperturas`,
    bearer(token, { montoInicial: 100, observacion: 'Smoke integración inventario' }),
    201,
  );
  return { session, created: true };
}

async function closeIfCreated(
  token: string,
  cash: { session: CashSession; created: boolean },
): Promise<void> {
  if (!cash.created) return;
  const summary = await request<CashSummary>(
    `Resumen caja ${cash.session.id}`,
    `${operationsBase}/caja/sesiones/${cash.session.id}/resumen`,
    bearer(token),
  );
  await request(
    `Cerrar caja ${cash.session.id}`,
    `${operationsBase}/caja/cierre`,
    bearer(token, {
      montoContado: summary.efectivoEsperado,
      observacion: 'Cierre smoke integración inventario',
    }),
    201,
  );
}

async function main(): Promise<void> {
  await request('Operations readiness', `${operationsBase}/health/ready`, { method: 'GET' });
  await request('Inventory readiness', `${inventoryBase}/health/ready`, { method: 'GET' });

  await request(
    'Endpoint interno bloqueado sin credencial de servicio',
    `${inventoryBase}/internal/inventario/evaluaciones-venta`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detalles: [{ productoId: 1, cantidad: 1 }] }),
    },
    401,
  );

  const cajero = await login('cajero01', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');
  const admin = await login('admin', process.env.SEED_ADMIN_PASSWORD ?? 'Roma2026*');
  const cash = await ensureCash(cajero);

  try {
    const before = await request<Ingredient>(
      'Consultar carne antes del pedido',
      `${inventoryBase}/inventario/insumos/1`,
      bearer(admin),
    );

    const sale = await request<Sale>(
      'Crear pedido y consumir inventario automáticamente',
      `${operationsBase}/ventas`,
      bearer(cajero, {
        canalVenta: 'Local',
        tipoCliente: 'Consumidor final',
        detalles: [{ productoId: 1, cantidad: 1, observacion: null }],
        observaciones: 'Smoke comunicación Operations–Inventory',
        autorizaSaldoNegativo: false,
      }),
      201,
    );

    if (sale.estadoInventario !== 'Aplicado' || sale.consumoInventarioId === null) {
      throw new Error('Operations no registró el consumo de Inventory dentro de la venta.');
    }

    const after = await request<Ingredient>(
      'Consultar carne después del pedido',
      `${inventoryBase}/inventario/insumos/1`,
      bearer(admin),
    );
    const expectedAfter = Math.round((before.stockActual - 110) * 10000) / 10000;
    if (after.stockActual !== expectedAfter) {
      throw new Error(
        `Se esperaba que la carne bajara de ${before.stockActual} a ${expectedAfter}, pero quedó en ${after.stockActual}.`,
      );
    }
    console.log('✓ Operations consumió Inventory sin que el cajero tenga permisos de inventario');

    const cancelled = await request<Sale>(
      'Anular pedido y reintegrar inventario',
      `${operationsBase}/ventas/${sale.id}/anulacion`,
      bearer(cajero, {
        motivo: 'Smoke reintegro automático entre microservicios',
        tratamientoInventario: 'Reintegrar insumos',
      }),
      201,
    );
    if (cancelled.estadoInventario !== 'Reintegrado') {
      throw new Error('La venta anulada no quedó marcada como Reintegrada en Operations.');
    }

    const restored = await request<Ingredient>(
      'Comprobar carne reintegrada',
      `${inventoryBase}/inventario/insumos/1`,
      bearer(admin),
    );
    if (restored.stockActual !== before.stockActual) {
      throw new Error(
        `El reintegro debía restaurar ${before.stockActual}, pero dejó ${restored.stockActual}.`,
      );
    }
    console.log('✓ Anulación en Operations reintegró Inventory automáticamente');
  } finally {
    await closeIfCreated(cajero, cash);
  }

  console.log('Smoke test Operations–Inventory completado correctamente.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
