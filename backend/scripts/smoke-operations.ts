import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const authBaseUrl = process.env.AUTH_BASE_URL ?? 'http://localhost:3101/api/v1';
const operationsBaseUrl = process.env.OPERATIONS_BASE_URL ?? 'http://localhost:3102/api/v1';

interface LoginResponse {
  accessToken: string;
}

async function expectStatus(
  response: Response,
  expected: number,
  label: string,
): Promise<Response> {
  if (response.status === expected) {
    console.log(`✓ ${label}: HTTP ${expected}`);
    return response;
  }
  const body = await response.text();
  throw new Error(`${label}: se esperaba HTTP ${expected}, se obtuvo ${response.status}. ${body}`);
}

async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${authBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  await expectStatus(response, 200, `Login ${username}`);
  return (await response.json()) as LoginResponse;
}

function bearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function expectArrayCount(response: Response, minimum: number, label: string): Promise<void> {
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || data.length < minimum) {
    throw new Error(`${label}: se esperaban al menos ${minimum} registros.`);
  }
  console.log(`✓ ${label}: ${data.length} registro(s)`);
}

async function main(): Promise<void> {
  await expectStatus(await fetch(`${operationsBaseUrl}/health/ready`), 200, 'Operations readiness');

  const unauthorized = await fetch(`${operationsBaseUrl}/productos`);
  await expectStatus(unauthorized, 401, 'Catálogo protegido sin JWT');

  const admin = await login('admin', process.env.SEED_ADMIN_PASSWORD ?? 'Roma2026*');

  const categories = await expectStatus(
    await fetch(`${operationsBaseUrl}/categorias`, { headers: bearer(admin.accessToken) }),
    200,
    'Administrador consulta categorías',
  );
  await expectArrayCount(categories, 5, 'Seed de categorías');

  const products = await expectStatus(
    await fetch(`${operationsBaseUrl}/productos`, { headers: bearer(admin.accessToken) }),
    200,
    'Administrador consulta productos',
  );
  await expectArrayCount(products, 6, 'Seed de productos');

  const clients = await expectStatus(
    await fetch(`${operationsBaseUrl}/clientes`, { headers: bearer(admin.accessToken) }),
    200,
    'Administrador consulta clientes',
  );
  await expectArrayCount(clients, 4, 'Seed de clientes');

  const cashier = await login('cajero01', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');
  await expectStatus(
    await fetch(`${operationsBaseUrl}/productos`, { headers: bearer(cashier.accessToken) }),
    200,
    'Cajero puede consultar productos',
  );
  await expectStatus(
    await fetch(`${operationsBaseUrl}/clientes`, { headers: bearer(cashier.accessToken) }),
    200,
    'Cajero puede consultar clientes',
  );
  await expectStatus(
    await fetch(`${operationsBaseUrl}/categorias`, {
      method: 'POST',
      headers: { ...bearer(cashier.accessToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Smoke no debe crearse',
        descripcion: 'Intento sin permiso.',
      }),
    }),
    403,
    'Cajero bloqueado al gestionar categorías',
  );

  const inventory = await login(
    'inventario01',
    process.env.SEED_INVENTARIO_PASSWORD ?? 'Stock2026*',
  );
  await expectStatus(
    await fetch(`${operationsBaseUrl}/productos`, { headers: bearer(inventory.accessToken) }),
    200,
    'Inventario puede consultar productos',
  );
  await expectStatus(
    await fetch(`${operationsBaseUrl}/clientes`, { headers: bearer(inventory.accessToken) }),
    403,
    'Inventario bloqueado al consultar clientes',
  );

  console.log('Smoke test Operations catálogo completado correctamente.');
}

void main().catch((error: unknown) => {
  console.error('Smoke test Operations catálogo falló.', error);
  process.exitCode = 1;
});
