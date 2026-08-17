import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const authBaseUrl = process.env.AUTH_BASE_URL ?? 'http://localhost:3101/api/v1';
const reportingBaseUrl = process.env.REPORTING_BASE_URL ?? 'http://localhost:3104/api/v1';

interface LoginResponse {
  accessToken: string;
}

interface StatusResponse {
  snapshots: Array<{ domain: string; capturedAt: string; sections: Record<string, number> }>;
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
  throw new Error(`${label}: esperaba HTTP ${expected}, recibió ${response.status}. ${body}`);
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

function verifyDomains(status: StatusResponse): void {
  const domains = new Set(status.snapshots.map((item) => item.domain));
  for (const expected of ['auth', 'operations', 'inventory']) {
    if (!domains.has(expected)) throw new Error(`Reporting no guardó el snapshot ${expected}.`);
  }
  console.log('✓ Reporting conserva snapshots separados de Auth, Operations e Inventory');
}

async function main(): Promise<void> {
  await expectStatus(await fetch(`${reportingBaseUrl}/health/ready`), 200, 'Reporting readiness');
  await expectStatus(
    await fetch(`${reportingBaseUrl}/reportes/estado`),
    401,
    'Reporting protegido sin JWT',
  );

  const admin = await login('admin', process.env.SEED_ADMIN_PASSWORD ?? 'Roma2026*');
  const rebuild = await expectStatus(
    await fetch(`${reportingBaseUrl}/reportes/reconstruir`, {
      method: 'POST',
      headers: bearer(admin.accessToken),
    }),
    200,
    'Administrador reconstruye modelos de lectura',
  );
  verifyDomains((await rebuild.json()) as StatusResponse);

  const status = await expectStatus(
    await fetch(`${reportingBaseUrl}/reportes/estado`, { headers: bearer(admin.accessToken) }),
    200,
    'Administrador consulta estado de Reporting',
  );
  verifyDomains((await status.json()) as StatusResponse);

  const cashier = await login('cajero01', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');
  await expectStatus(
    await fetch(`${reportingBaseUrl}/reportes/estado`, { headers: bearer(cashier.accessToken) }),
    403,
    'Cajero bloqueado en Reporting',
  );

  console.log('Smoke test Reporting snapshots completado correctamente.');
}

void main().catch((error: unknown) => {
  console.error('Smoke test Reporting falló.', error);
  process.exitCode = 1;
});
