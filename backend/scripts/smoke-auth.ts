import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const baseUrl = process.env.AUTH_BASE_URL ?? 'http://localhost:3101/api/v1';

interface LoginResponse {
  accessToken: string;
  usuario: {
    username: string;
  };
}

async function expectStatus(response: Response, expected: number, label: string): Promise<void> {
  if (response.status === expected) {
    console.log(`✓ ${label}: HTTP ${expected}`);
    return;
  }

  const body = await response.text();
  throw new Error(`${label}: se esperaba HTTP ${expected}, se obtuvo ${response.status}. ${body}`);
}

async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  await expectStatus(response, 200, `Login ${username}`);
  return (await response.json()) as LoginResponse;
}

async function main(): Promise<void> {
  const ready = await fetch(`${baseUrl}/health/ready`);
  await expectStatus(ready, 200, 'Health readiness');

  const admin = await login('admin', process.env.SEED_ADMIN_PASSWORD ?? 'Roma2026*');

  const me = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  });
  await expectStatus(me, 200, 'JWT /auth/me');

  const usersAsAdmin = await fetch(`${baseUrl}/usuarios`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  });
  await expectStatus(usersAsAdmin, 200, 'Administrador consulta usuarios');

  const cajero = await login('cajero01', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');
  const usersAsCashier = await fetch(`${baseUrl}/usuarios`, {
    headers: { Authorization: `Bearer ${cajero.accessToken}` },
  });
  await expectStatus(usersAsCashier, 403, 'Cajero bloqueado en administración de usuarios');

  console.log('Smoke test Auth completado correctamente.');
}

void main().catch((error: unknown) => {
  console.error('Smoke test Auth falló.', error);
  process.exitCode = 1;
});
