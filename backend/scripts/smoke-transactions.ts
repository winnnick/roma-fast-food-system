import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: false, quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), override: false, quiet: true });

const authBase = process.env.SMOKE_AUTH_URL ?? 'http://localhost:3101/api/v1';
const operationsBase = process.env.SMOKE_OPERATIONS_URL ?? 'http://localhost:3102/api/v1';

interface LoginResult {
  accessToken: string;
}
interface CashSession {
  id: number;
  estado: 'Abierta' | 'Cerrada';
}
interface Sale {
  id: number;
  numeroPedido: string;
  total: number;
  estadoCobro: string;
  estadoPreparacion: string;
}
interface Payment {
  id: number;
  sesionCajaId: number;
  totalCobrado: number;
}
interface CashSummary {
  efectivoEsperado: number;
  totalVentasEfectivo: number;
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

async function ensureCash(
  token: string,
  initialAmount: number,
): Promise<{ session: CashSession; created: boolean }> {
  const current = await request<CashSession | null>(
    'Consultar caja actual',
    `${operationsBase}/caja/actual`,
    json(token),
  );
  if (current) return { session: current, created: false };
  const session = await request<CashSession>(
    'Abrir caja',
    `${operationsBase}/caja/aperturas`,
    json(token, { montoInicial: initialAmount, observacion: 'Smoke test transaccional' }),
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
    json(token),
  );
  await request(
    `Cerrar caja ${cash.session.id}`,
    `${operationsBase}/caja/cierre`,
    json(token, { montoContado: summary.efectivoEsperado, observacion: 'Cierre smoke test' }),
    201,
  );
}

async function main(): Promise<void> {
  await request('Operations readiness', `${operationsBase}/health/ready`, { method: 'GET' });

  const cajero1 = await login('cajero01', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');
  const cajero2 = await login('cajero02', process.env.SEED_CAJERO_PASSWORD ?? 'Caja2026*');
  const admin = await login('admin', process.env.SEED_ADMIN_PASSWORD ?? 'Roma2026*');

  const cash1 = await ensureCash(cajero1, 100);
  const cash2 = await ensureCash(cajero2, 50);

  try {
    await request(
      'Fijar preparación inmediata',
      `${operationsBase}/ventas/configuracion/preparacion`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${cajero1}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: 'En preparación' }),
      },
    );

    const sale1 = await request<Sale>(
      'Crear pedido de Bs 60',
      `${operationsBase}/ventas`,
      json(cajero1, {
        canalVenta: 'Local',
        tipoCliente: 'Consumidor final',
        clienteId: null,
        clienteNombre: null,
        detalles: [
          { productoId: 1, cantidad: 2, observacion: null },
          { productoId: 5, cantidad: 1, observacion: null },
        ],
        observaciones: 'Smoke pago parcial entre cajas',
      }),
      201,
    );
    if (sale1.total !== 60) throw new Error(`Pedido esperado Bs 60; recibido Bs ${sale1.total}.`);

    const first = await request<{ pago: Payment; venta: Sale }>(
      'Primer abono Bs 40 en caja cajero01',
      `${operationsBase}/ventas/${sale1.id}/pagos`,
      json(cajero1, {
        tipoDescuento: 'Ninguno',
        valorDescuento: 0,
        motivoDescuento: null,
        metodoPago: 'Efectivo',
        montoQr: 0,
        montoEfectivo: 40,
        montoRecibido: 40,
        referenciaQr: null,
      }),
      201,
    );
    if (first.venta.estadoCobro !== 'Pendiente de cobro' || first.pago.totalCobrado !== 40) {
      throw new Error('El primer abono no dejó la venta con saldo pendiente correcto.');
    }

    const second = await request<{ pago: Payment; venta: Sale }>(
      'Saldo Bs 20 en caja cajero02',
      `${operationsBase}/ventas/${sale1.id}/pagos`,
      json(cajero2, {
        tipoDescuento: 'Ninguno',
        valorDescuento: 0,
        motivoDescuento: null,
        metodoPago: 'Efectivo',
        montoQr: 0,
        montoEfectivo: 20,
        montoRecibido: 20,
        referenciaQr: null,
      }),
      201,
    );
    if (second.venta.estadoCobro !== 'Cobrada' || second.venta.total !== 60) {
      throw new Error('La venta de Bs 60 no quedó completamente cobrada.');
    }

    const payments1 = await request<Payment[]>(
      'Consultar los dos abonos del pedido',
      `${operationsBase}/ventas/${sale1.id}/pagos`,
      json(admin),
    );
    if (payments1.length !== 2 || payments1[0].sesionCajaId === payments1[1].sesionCajaId) {
      throw new Error('Los abonos no conservaron dos sesiones de caja diferentes.');
    }
    console.log('✓ Pago parcial multi-cajero: Bs 40 + Bs 20 conservan cajas diferentes');

    const ready = await request<Sale>(
      'Marcar pedido listo',
      `${operationsBase}/ventas/${sale1.id}/preparacion`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${cajero1}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Listo' }),
      },
    );
    if (ready.estadoPreparacion !== 'Listo') throw new Error('El pedido no quedó Listo.');
    const delivered = await request<Sale>(
      'Entregar pedido',
      `${operationsBase}/ventas/${sale1.id}/preparacion`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${cajero1}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Entregado' }),
      },
    );
    if (delivered.estadoPreparacion !== 'Entregado')
      throw new Error('El pedido no quedó Entregado.');

    const sale2 = await request<Sale>(
      'Crear pedido para probar descuento congelado',
      `${operationsBase}/ventas`,
      json(cajero1, {
        canalVenta: 'Local',
        tipoCliente: 'Consumidor final',
        clienteId: null,
        clienteNombre: null,
        detalles: [{ productoId: 1, cantidad: 1, observacion: null }],
        observaciones: null,
      }),
      201,
    );
    const discountFirst = await request<{ pago: Payment; venta: Sale }>(
      'Aplicar descuento Bs 5 y abonar Bs 10',
      `${operationsBase}/ventas/${sale2.id}/pagos`,
      json(cajero1, {
        tipoDescuento: 'Monto fijo',
        valorDescuento: 5,
        motivoDescuento: 'Prueba control descuento',
        metodoPago: 'Efectivo',
        montoQr: 0,
        montoEfectivo: 10,
        montoRecibido: 10,
        referenciaQr: null,
      }),
      201,
    );
    if (
      discountFirst.venta.total !== 20 ||
      discountFirst.venta.estadoCobro !== 'Pendiente de cobro'
    ) {
      throw new Error('El descuento inicial o saldo parcial no se aplicó correctamente.');
    }

    await request(
      'Bloquear anulación con abono existente',
      `${operationsBase}/ventas/${sale2.id}/anulacion`,
      json(cajero1, { motivo: 'Intento de anulación con abono' }),
      409,
    );

    const discountSecond = await request<{ pago: Payment; venta: Sale }>(
      'Completar saldo conservando descuento original',
      `${operationsBase}/ventas/${sale2.id}/pagos`,
      json(cajero2, {
        tipoDescuento: 'Porcentaje',
        valorDescuento: 50,
        motivoDescuento: 'Este descuento debe ignorarse',
        metodoPago: 'Efectivo',
        montoQr: 0,
        montoEfectivo: 10,
        montoRecibido: 10,
        referenciaQr: null,
      }),
      201,
    );
    if (discountSecond.venta.total !== 20 || discountSecond.venta.estadoCobro !== 'Cobrada') {
      throw new Error('El segundo abono modificó indebidamente el descuento o total de la venta.');
    }
    console.log('✓ Descuento congelado después del primer abono');

    await request(
      'Registrar ingreso manual en caja cajero01',
      `${operationsBase}/caja/movimientos`,
      json(cajero1, { tipo: 'Ingreso', concepto: 'Prueba ingreso', monto: 5 }),
      201,
    );
    await request(
      'Registrar egreso manual en caja cajero01',
      `${operationsBase}/caja/movimientos`,
      json(cajero1, { tipo: 'Egreso', concepto: 'Prueba egreso', monto: 2 }),
      201,
    );

    const summary1 = await request<CashSummary>(
      'Resumen contable caja cajero01',
      `${operationsBase}/caja/sesiones/${cash1.session.id}/resumen`,
      json(cajero1),
    );
    if (cash1.created && summary1.totalVentasEfectivo !== 50) {
      throw new Error(
        `La caja 1 debía recibir Bs 50 en ventas y recibió Bs ${summary1.totalVentasEfectivo}.`,
      );
    }
    const summary2 = await request<CashSummary>(
      'Resumen contable caja cajero02',
      `${operationsBase}/caja/sesiones/${cash2.session.id}/resumen`,
      json(cajero2),
    );
    if (cash2.created && summary2.totalVentasEfectivo !== 30) {
      throw new Error(
        `La caja 2 debía recibir Bs 30 en ventas y recibió Bs ${summary2.totalVentasEfectivo}.`,
      );
    }
    console.log('✓ Distribución contable por cajero/caja verificada');
  } finally {
    await closeIfCreated(cajero1, cash1);
    await closeIfCreated(cajero2, cash2);
  }

  console.log('Smoke test transaccional de Ventas/Caja completado correctamente.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
