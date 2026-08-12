import type {
  UsuarioSesion,
} from "../tipos/auth";

import type {
  PermisoSistema,
} from "../tipos/rol";

import type {
  AbrirCajaDto,
  CerrarCajaDto,
  FiltroMovimientosCaja,
  FiltroSesionesCaja,
  MetodoPago,
  MovimientoCaja,
  PagoVenta,
  RegistrarMovimientoManualDto,
  RegistrarPagoVentaDto,
  ResumenCaja,
  SesionCaja,
  TipoDescuento,
} from "../tipos/caja";

import {
  obtenerVentaPorId,
  registrarCobroVenta,
} from "./ventaServicio";

const CLAVE_SESIONES_CAJA =
  "roma-caja-sesiones-v1";

const CLAVE_MOVIMIENTOS_CAJA =
  "roma-caja-movimientos-v1";

const CLAVE_PAGOS_VENTAS =
  "roma-pagos-ventas-v1";

function esperar(
  milisegundos: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milisegundos,
    );
  });
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function clonarSesion(
  sesion: SesionCaja,
): SesionCaja {
  return {
    ...sesion,
  };
}

function clonarMovimiento(
  movimiento: MovimientoCaja,
): MovimientoCaja {
  return {
    ...movimiento,
  };
}

function clonarPago(
  pago: PagoVenta,
): PagoVenta {
  return {
    ...pago,
  };
}

function leerArreglo<T>(
  clave: string,
): T[] {
  const datos =
    localStorage.getItem(clave);

  if (!datos) {
    localStorage.setItem(
      clave,
      JSON.stringify([]),
    );

    return [];
  }

  try {
    const arreglo = JSON.parse(
      datos,
    ) as T[];

    if (!Array.isArray(arreglo)) {
      throw new Error(
        "Los datos no son válidos.",
      );
    }

    return arreglo;
  } catch {
    localStorage.setItem(
      clave,
      JSON.stringify([]),
    );

    return [];
  }
}

function guardarArreglo<T>(
  clave: string,
  valores: T[],
): void {
  localStorage.setItem(
    clave,
    JSON.stringify(valores),
  );
}

function obtenerSesionesPersistidas():
  SesionCaja[] {
  return leerArreglo<SesionCaja>(
    CLAVE_SESIONES_CAJA,
  );
}

function obtenerMovimientosPersistidos():
  MovimientoCaja[] {
  return leerArreglo<MovimientoCaja>(
    CLAVE_MOVIMIENTOS_CAJA,
  );
}

function obtenerPagosPersistidos():
  PagoVenta[] {
  return leerArreglo<PagoVenta>(
    CLAVE_PAGOS_VENTAS,
  );
}

function obtenerSiguienteId(
  valores: Array<{
    id: number;
  }>,
): number {
  if (valores.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...valores.map(
        (valor) => valor.id,
      ),
    ) + 1
  );
}

function exigirPermiso(
  usuario: UsuarioSesion,
  permiso: PermisoSistema,
  mensaje: string,
): void {
  if (
    !usuario.permisos.includes(
      permiso,
    )
  ) {
    throw new Error(mensaje);
  }
}

function validarMontoNoNegativo(
  valor: number,
  nombreCampo: string,
): number {
  if (
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    throw new Error(
      `${nombreCampo} debe ser un monto válido igual o mayor a cero.`,
    );
  }

  return redondearMoneda(valor);
}

function validarMontoPositivo(
  valor: number,
  nombreCampo: string,
): number {
  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {
    throw new Error(
      `${nombreCampo} debe ser un monto mayor a cero.`,
    );
  }

  return redondearMoneda(valor);
}

function normalizarTextoOpcional(
  valor: string | null,
  longitudMaxima: number,
  nombreCampo: string,
): string | null {
  const texto =
    valor?.trim() ?? "";

  if (!texto) {
    return null;
  }

  if (
    texto.length >
    longitudMaxima
  ) {
    throw new Error(
      `${nombreCampo} no puede superar los ${longitudMaxima} caracteres.`,
    );
  }

  return texto;
}

function obtenerCajasAbiertasPersistidas():
  SesionCaja[] {
  return obtenerSesionesPersistidas()
    .filter(
      (sesion) =>
        sesion.estado ===
        "Abierta",
    )
    .sort(
      (sesionA, sesionB) =>
        new Date(
          sesionB.fechaHoraApertura,
        ).getTime() -
        new Date(
          sesionA.fechaHoraApertura,
        ).getTime(),
    );
}

function obtenerCajaAbiertaUsuarioPersistida(
  usuarioId: number,
): SesionCaja | null {
  return (
    obtenerCajasAbiertasPersistidas()
      .find(
        (sesion) =>
          sesion.usuarioAperturaId ===
          usuarioId,
      ) ?? null
  );
}

function exigirCajaAbiertaUsuario(
  usuario: UsuarioSesion,
): SesionCaja {
  const caja =
    obtenerCajaAbiertaUsuarioPersistida(
      usuario.id,
    );

  if (!caja) {
    throw new Error(
      "No tienes una caja abierta. Abre tu caja antes de realizar esta operación.",
    );
  }

  return caja;
}

function calcularDescuento(
  subtotal: number,
  tipoDescuento:
    TipoDescuento,
  valorDescuento: number,
  motivoDescuento: string | null,
): {
  valorDescuento: number;
  montoDescuento: number;
  motivoDescuento: string | null;
  totalCobrado: number;
} {
  if (
    tipoDescuento === "Ninguno"
  ) {
    return {
      valorDescuento: 0,
      montoDescuento: 0,
      motivoDescuento: null,
      totalCobrado: subtotal,
    };
  }

  const motivo =
    normalizarTextoOpcional(
      motivoDescuento,
      200,
      "El motivo del descuento",
    );

  if (
    !motivo ||
    motivo.length < 5
  ) {
    throw new Error(
      "Indica un motivo de descuento de al menos 5 caracteres.",
    );
  }

  if (
    tipoDescuento ===
    "Porcentaje"
  ) {
    if (
      !Number.isFinite(
        valorDescuento,
      ) ||
      valorDescuento <= 0 ||
      valorDescuento >= 100
    ) {
      throw new Error(
        "El porcentaje de descuento debe ser mayor a 0 y menor a 100.",
      );
    }

    const porcentaje =
      redondearMoneda(
        valorDescuento,
      );

    const montoDescuento =
      redondearMoneda(
        subtotal *
          (porcentaje / 100),
      );

    return {
      valorDescuento:
        porcentaje,

      montoDescuento,

      motivoDescuento:
        motivo,

      totalCobrado:
        redondearMoneda(
          subtotal -
            montoDescuento,
        ),
    };
  }

  const montoFijo =
    validarMontoPositivo(
      valorDescuento,
      "El descuento fijo",
    );

  if (
    montoFijo >= subtotal
  ) {
    throw new Error(
      "El descuento fijo debe ser menor al subtotal de la venta.",
    );
  }

  return {
    valorDescuento:
      montoFijo,

    montoDescuento:
      montoFijo,

    motivoDescuento:
      motivo,

    totalCobrado:
      redondearMoneda(
        subtotal -
          montoFijo,
      ),
  };
}

function calcularDistribucionPago(
  saldoPendiente: number,
  metodoPagoIngresado: MetodoPago,
  montoEfectivoIngresado: number,
  montoQrIngresado: number,
  montoRecibidoIngresado: number,
  referenciaQrIngresada:
    string | null,
): {
  totalAplicado: number;
  metodoPago: MetodoPago;
  montoEfectivo: number;
  montoQr: number;
  montoRecibido: number;
  cambio: number;
  referenciaQr: string | null;
} {
  const montoEfectivo =
    validarMontoNoNegativo(
      montoEfectivoIngresado,
      "La parte en efectivo",
    );

  const montoQr =
    validarMontoNoNegativo(
      montoQrIngresado,
      "El monto QR",
    );

  const totalAplicado =
    redondearMoneda(
      montoEfectivo + montoQr,
    );

  if (totalAplicado <= 0) {
    throw new Error(
      "Ingresa un monto mayor a cero para registrar el abono.",
    );
  }

  if (
    totalAplicado >
    redondearMoneda(saldoPendiente)
  ) {
    throw new Error(
      "El abono no puede superar el saldo pendiente de la venta.",
    );
  }

  const metodoPago: MetodoPago =
    montoEfectivo > 0 && montoQr > 0
      ? "Mixto"
      : montoQr > 0
        ? "QR"
        : "Efectivo";

  if (metodoPagoIngresado !== metodoPago) {
    throw new Error(
      "La distribución del pago no coincide con el método detectado.",
    );
  }

  const montoRecibido =
    montoEfectivo > 0
      ? validarMontoPositivo(
          montoRecibidoIngresado,
          "El monto recibido",
        )
      : 0;

  if (
    montoEfectivo > 0 &&
    montoRecibido < montoEfectivo
  ) {
    throw new Error(
      "El monto recibido es menor al efectivo que se aplicará al abono.",
    );
  }

  const referenciaQr =
    montoQr > 0
      ? normalizarTextoOpcional(
          referenciaQrIngresada,
          100,
          "La referencia QR",
        )
      : null;

  return {
    totalAplicado,
    metodoPago,
    montoEfectivo,
    montoQr,
    montoRecibido,
    cambio:
      redondearMoneda(
        Math.max(
          0,
          montoRecibido - montoEfectivo,
        ),
      ),
    referenciaQr,
  };
}

function obtenerMetodoPagoAcumulado(
  pagos: PagoVenta[],
  metodoNuevo: MetodoPago,
): MetodoPago {
  const metodos = new Set<MetodoPago>(
    pagos.map((pago) => pago.metodoPago),
  );

  metodos.add(metodoNuevo);

  if (
    metodos.size === 1 &&
    !metodos.has("Mixto")
  ) {
    return Array.from(metodos)[0];
  }

  return "Mixto";
}

/**
 * Compatibilidad con paneles generales.
 * Devuelve la caja abierta más reciente, sin
 * asumir que sea la del usuario actual.
 */
export async function obtenerCajaAbierta():
  Promise<SesionCaja | null> {
  await esperar(250);

  const caja =
    obtenerCajasAbiertasPersistidas()[0] ??
    null;

  return caja
    ? clonarSesion(caja)
    : null;
}

export async function obtenerCajaAbiertaPorUsuario(
  usuarioId: number,
): Promise<SesionCaja | null> {
  await esperar(250);

  const caja =
    obtenerCajaAbiertaUsuarioPersistida(
      usuarioId,
    );

  return caja
    ? clonarSesion(caja)
    : null;
}

export async function listarCajasAbiertas():
  Promise<SesionCaja[]> {
  await esperar(250);

  return obtenerCajasAbiertasPersistidas()
    .map(clonarSesion);
}

export async function listarSesionesCaja(
  filtros: FiltroSesionesCaja = {},
): Promise<SesionCaja[]> {
  await esperar(300);

  return obtenerSesionesPersistidas()
    .filter(
      (sesion) =>
        (filtros.usuarioId ===
          undefined ||
          sesion.usuarioAperturaId ===
            filtros.usuarioId) &&
        (filtros.estado ===
          undefined ||
          sesion.estado ===
            filtros.estado),
    )
    .sort(
      (sesionA, sesionB) =>
        new Date(
          sesionB.fechaHoraApertura,
        ).getTime() -
        new Date(
          sesionA.fechaHoraApertura,
        ).getTime(),
    )
    .map(clonarSesion);
}

export async function listarMovimientosCaja(
  filtros: FiltroMovimientosCaja | number = {},
): Promise<MovimientoCaja[]> {
  await esperar(300);

  const filtrosNormalizados:
    FiltroMovimientosCaja =
    typeof filtros === "number"
      ? { sesionCajaId: filtros }
      : filtros;

  return obtenerMovimientosPersistidos()
    .filter(
      (movimiento) =>
        (filtrosNormalizados.sesionCajaId ===
          undefined ||
          movimiento.sesionCajaId ===
            filtrosNormalizados.sesionCajaId) &&
        (filtrosNormalizados.usuarioId ===
          undefined ||
          movimiento.usuarioId ===
            filtrosNormalizados.usuarioId),
    )
    .sort(
      (movimientoA, movimientoB) =>
        new Date(
          movimientoB.fechaHoraRegistro,
        ).getTime() -
        new Date(
          movimientoA.fechaHoraRegistro,
        ).getTime(),
    )
    .map(clonarMovimiento);
}

export async function listarPagosVenta():
  Promise<PagoVenta[]> {
  await esperar(300);

  return obtenerPagosPersistidos()
    .sort(
      (pagoA, pagoB) =>
        new Date(
          pagoB.fechaHoraCobro,
        ).getTime() -
        new Date(
          pagoA.fechaHoraCobro,
        ).getTime(),
    )
    .map(clonarPago);
}

export async function obtenerPagoPorVentaId(
  ventaId: number,
): Promise<PagoVenta | null> {
  await esperar(200);

  const pago =
    obtenerPagosPersistidos()
      .filter(
        (pagoActual) =>
          pagoActual.ventaId ===
          ventaId,
      )
      .sort(
        (pagoA, pagoB) =>
          new Date(
            pagoB.fechaHoraCobro,
          ).getTime() -
          new Date(
            pagoA.fechaHoraCobro,
          ).getTime(),
      )[0];

  return pago
    ? clonarPago(pago)
    : null;
}

export async function listarPagosPorVentaId(
  ventaId: number,
): Promise<PagoVenta[]> {
  await esperar(200);

  return obtenerPagosPersistidos()
    .filter(
      (pago) =>
        pago.ventaId === ventaId,
    )
    .sort(
      (pagoA, pagoB) =>
        new Date(
          pagoA.fechaHoraCobro,
        ).getTime() -
        new Date(
          pagoB.fechaHoraCobro,
        ).getTime(),
    )
    .map(clonarPago);
}

export async function calcularResumenSesionCaja(
  sesionCajaId: number,
): Promise<ResumenCaja> {
  await esperar(250);

  const sesion =
    obtenerSesionesPersistidas()
      .find(
        (sesionActual) =>
          sesionActual.id ===
          sesionCajaId,
      );

  if (!sesion) {
    throw new Error(
      "La sesión de caja no existe.",
    );
  }

  const movimientos =
    obtenerMovimientosPersistidos()
      .filter(
        (movimiento) =>
          movimiento.sesionCajaId ===
          sesionCajaId,
      );

  const movimientosVenta =
    movimientos.filter(
      (movimiento) =>
        movimiento.tipo ===
        "Venta",
    );

  const totalVentasEfectivo =
    redondearMoneda(
      movimientosVenta.reduce(
        (acumulado, movimiento) =>
          acumulado +
          movimiento.montoEfectivo,
        0,
      ),
    );

  const totalVentasQr =
    redondearMoneda(
      movimientosVenta.reduce(
        (acumulado, movimiento) =>
          acumulado +
          movimiento.montoQr,
        0,
      ),
    );

  const totalIngresosManuales =
    redondearMoneda(
      movimientos
        .filter(
          (movimiento) =>
            movimiento.tipo ===
            "Ingreso",
        )
        .reduce(
          (
            acumulado,
            movimiento,
          ) =>
            acumulado +
            movimiento.montoEfectivo,
          0,
        ),
    );

  const totalEgresosManuales =
    redondearMoneda(
      movimientos
        .filter(
          (movimiento) =>
            movimiento.tipo ===
            "Egreso",
        )
        .reduce(
          (
            acumulado,
            movimiento,
          ) =>
            acumulado +
            movimiento.montoEfectivo,
          0,
        ),
    );

  const totalVentas =
    redondearMoneda(
      totalVentasEfectivo +
        totalVentasQr,
    );

  const efectivoEsperado =
    redondearMoneda(
      sesion.montoInicial +
        totalVentasEfectivo +
        totalIngresosManuales -
        totalEgresosManuales,
    );

  return {
    sesionCajaId,

    montoInicial:
      sesion.montoInicial,

    cantidadVentas:
      movimientosVenta.length,

    totalVentas,

    totalVentasEfectivo,
    totalVentasQr,

    totalIngresosManuales,
    totalEgresosManuales,

    efectivoEsperado,
  };
}

export async function abrirCaja(
  datos: AbrirCajaDto,
  usuario: UsuarioSesion,
): Promise<SesionCaja> {
  await esperar(500);

  exigirPermiso(
    usuario,
    "CAJA_ABRIR",
    "No tienes permiso para abrir una caja.",
  );

  const cajaAbiertaUsuario =
    obtenerCajaAbiertaUsuarioPersistida(
      usuario.id,
    );

  if (cajaAbiertaUsuario) {
    throw new Error(
      `Ya tienes abierta la caja N.º ${cajaAbiertaUsuario.id}. Debes cerrarla antes de iniciar otra.`,
    );
  }

  const montoInicial =
    validarMontoNoNegativo(
      datos.montoInicial,
      "El monto inicial",
    );

  const observacion =
    normalizarTextoOpcional(
      datos.observacion,
      300,
      "La observación de apertura",
    );

  const sesiones =
    obtenerSesionesPersistidas();

  const nuevaSesion:
    SesionCaja = {
    id:
      obtenerSiguienteId(
        sesiones,
      ),

    estado: "Abierta",

    usuarioAperturaId:
      usuario.id,

    usuarioAperturaNombre:
      usuario.nombreCompleto,

    montoInicial,

    observacionApertura:
      observacion,

    fechaHoraApertura:
      new Date().toISOString(),

    usuarioCierreId: null,
    usuarioCierreNombre: null,

    montoContado: null,
    efectivoEsperado: null,
    diferencia: null,

    observacionCierre: null,
    fechaHoraCierre: null,
  };

  sesiones.push(nuevaSesion);

  guardarArreglo(
    CLAVE_SESIONES_CAJA,
    sesiones,
  );

  return clonarSesion(
    nuevaSesion,
  );
}

export async function registrarMovimientoManual(
  datos:
    RegistrarMovimientoManualDto,
  usuario: UsuarioSesion,
): Promise<MovimientoCaja> {
  await esperar(450);

  exigirPermiso(
    usuario,
    datos.tipo === "Ingreso"
      ? "CAJA_INGRESOS"
      : "CAJA_EGRESOS",
    datos.tipo === "Ingreso"
      ? "No tienes permiso para registrar ingresos de caja."
      : "No tienes permiso para registrar egresos de caja.",
  );

  const caja =
    exigirCajaAbiertaUsuario(
      usuario,
    );

  const concepto =
    datos.concepto.trim();

  if (
    concepto.length < 3
  ) {
    throw new Error(
      "El concepto debe tener al menos 3 caracteres.",
    );
  }

  if (
    concepto.length > 120
  ) {
    throw new Error(
      "El concepto no puede superar los 120 caracteres.",
    );
  }

  const monto =
    validarMontoPositivo(
      datos.monto,
      "El monto",
    );

  const movimientos =
    obtenerMovimientosPersistidos();

  const nuevoMovimiento:
    MovimientoCaja = {
    id:
      obtenerSiguienteId(
        movimientos,
      ),

    sesionCajaId:
      caja.id,

    tipo:
      datos.tipo,

    concepto,

    monto,

    montoEfectivo:
      monto,

    montoQr: 0,

    metodoPago:
      "Efectivo",

    ventaId: null,
    numeroPedido: null,

    usuarioId:
      usuario.id,

    usuarioNombre:
      usuario.nombreCompleto,

    fechaHoraRegistro:
      new Date().toISOString(),
  };

  movimientos.push(
    nuevoMovimiento,
  );

  guardarArreglo(
    CLAVE_MOVIMIENTOS_CAJA,
    movimientos,
  );

  return clonarMovimiento(
    nuevoMovimiento,
  );
}

export async function registrarPagoVenta(
  datos: RegistrarPagoVentaDto,
  usuario: UsuarioSesion,
): Promise<PagoVenta> {
  await esperar(550);

  exigirPermiso(
    usuario,
    "VENTAS_COBRAR",
    "No tienes permiso para registrar cobros de ventas.",
  );

  const caja =
    exigirCajaAbiertaUsuario(
      usuario,
    );

  const venta =
    await obtenerVentaPorId(
      datos.ventaId,
    );

  if (venta.canalVenta === "PedidosYa") {
    throw new Error(
      "Los pedidos de PedidosYa no se cobran en la caja del local. Se controlan mediante liquidaciones administrativas.",
    );
  }

  if (
    venta.estadoCobro ===
    "Cobrada"
  ) {
    throw new Error(
      "La venta ya fue cobrada.",
    );
  }

  if (
    venta.estadoCobro ===
      "Anulada" ||
    venta.estadoPreparacion ===
      "Anulado"
  ) {
    throw new Error(
      "Una venta anulada no puede cobrarse.",
    );
  }

  const pagos =
    obtenerPagosPersistidos();

  const pagosVenta = pagos.filter(
    (pago) => pago.ventaId === venta.id,
  );

  const montoPagadoPrevio =
    redondearMoneda(
      pagosVenta.reduce(
        (acumulado, pago) =>
          acumulado + pago.totalCobrado,
        0,
      ),
    );

  const tienePagosPrevios =
    pagosVenta.length > 0;

  const descuento = tienePagosPrevios
    ? {
        valorDescuento:
          venta.valorDescuento,
        montoDescuento:
          venta.montoDescuento,
        motivoDescuento: null,
        totalCobrado:
          venta.total,
      }
    : calcularDescuento(
        venta.subtotal,
        datos.tipoDescuento,
        datos.valorDescuento,
        datos.motivoDescuento,
      );

  const totalVenta =
    redondearMoneda(
      descuento.totalCobrado,
    );

  const saldoAnterior =
    redondearMoneda(
      Math.max(
        0,
        totalVenta - montoPagadoPrevio,
      ),
    );

  if (saldoAnterior <= 0) {
    throw new Error(
      "La venta ya no tiene saldo pendiente de cobro.",
    );
  }

  const distribucion =
    calcularDistribucionPago(
      saldoAnterior,
      datos.metodoPago,
      datos.montoEfectivo,
      datos.montoQr,
      datos.montoRecibido,
      datos.referenciaQr,
    );

  const montoPagadoAcumulado =
    redondearMoneda(
      montoPagadoPrevio +
        distribucion.totalAplicado,
    );

  const pagoCompleto =
    montoPagadoAcumulado >=
    totalVenta;

  const metodoPagoAcumulado =
    obtenerMetodoPagoAcumulado(
      pagosVenta,
      distribucion.metodoPago,
    );

  const movimientos =
    obtenerMovimientosPersistidos();

  const pagoId =
    obtenerSiguienteId(pagos);

  const movimientoId =
    obtenerSiguienteId(
      movimientos,
    );

  const fechaHoraCobro =
    new Date().toISOString();

  const nuevoPago:
    PagoVenta = {
    id: pagoId,

    sesionCajaId:
      caja.id,

    ventaId:
      venta.id,

    numeroPedido:
      venta.numeroPedido,

    subtotal:
      venta.subtotal,

    tipoDescuento:
      tienePagosPrevios
        ? "Ninguno"
        : datos.tipoDescuento,

    valorDescuento:
      tienePagosPrevios
        ? 0
        : descuento.valorDescuento,

    montoDescuento:
      tienePagosPrevios
        ? 0
        : descuento.montoDescuento,

    motivoDescuento:
      tienePagosPrevios
        ? null
        : descuento.motivoDescuento,

    totalCobrado:
      distribucion.totalAplicado,

    metodoPago:
      distribucion.metodoPago,

    montoEfectivo:
      distribucion.montoEfectivo,

    montoQr:
      distribucion.montoQr,

    montoRecibido:
      distribucion.montoRecibido,

    cambio:
      distribucion.cambio,

    referenciaQr:
      distribucion.referenciaQr,

    usuarioId:
      usuario.id,

    usuarioNombre:
      usuario.nombreCompleto,

    fechaHoraCobro,
  };

  const nuevoMovimiento:
    MovimientoCaja = {
    id: movimientoId,

    sesionCajaId:
      caja.id,

    tipo: "Venta",

    concepto:
      pagoCompleto && montoPagadoPrevio > 0
        ? `Saldo de ${venta.numeroPedido}`
        : pagoCompleto
          ? `Cobro de ${venta.numeroPedido}`
          : `Abono de ${venta.numeroPedido}`,

    monto:
      distribucion.totalAplicado,

    montoEfectivo:
      distribucion.montoEfectivo,

    montoQr:
      distribucion.montoQr,

    metodoPago:
      distribucion.metodoPago,

    ventaId:
      venta.id,

    numeroPedido:
      venta.numeroPedido,

    usuarioId:
      usuario.id,

    usuarioNombre:
      usuario.nombreCompleto,

    fechaHoraRegistro:
      fechaHoraCobro,
  };

  await registrarCobroVenta(
    venta.id,
    {
      pagoId,

      tipoDescuento:
        tienePagosPrevios
          ? venta.tipoDescuento
          : datos.tipoDescuento,

      valorDescuento:
        tienePagosPrevios
          ? venta.valorDescuento
          : descuento.valorDescuento,

      montoDescuento:
        tienePagosPrevios
          ? venta.montoDescuento
          : descuento.montoDescuento,

      totalVenta,
      pagoCompleto,

      metodoPago:
        metodoPagoAcumulado,

      fechaHoraCobro,
    },
  );

  pagos.push(nuevoPago);

  movimientos.push(
    nuevoMovimiento,
  );

  guardarArreglo(
    CLAVE_PAGOS_VENTAS,
    pagos,
  );

  guardarArreglo(
    CLAVE_MOVIMIENTOS_CAJA,
    movimientos,
  );

  return clonarPago(
    nuevoPago,
  );
}

export async function cerrarCaja(
  datos: CerrarCajaDto,
  usuario: UsuarioSesion,
): Promise<SesionCaja> {
  await esperar(600);

  exigirPermiso(
    usuario,
    "CAJA_CERRAR",
    "No tienes permiso para cerrar la caja.",
  );

  const caja =
    exigirCajaAbiertaUsuario(
      usuario,
    );

  const montoContado =
    validarMontoNoNegativo(
      datos.montoContado,
      "El monto contado",
    );

  const observacion =
    normalizarTextoOpcional(
      datos.observacion,
      300,
      "La observación de cierre",
    );

  const resumen =
    await calcularResumenSesionCaja(
      caja.id,
    );

  const diferencia =
    redondearMoneda(
      montoContado -
        resumen.efectivoEsperado,
    );

  const sesiones =
    obtenerSesionesPersistidas();

  const indice =
    sesiones.findIndex(
      (sesion) =>
        sesion.id === caja.id,
    );

  if (indice === -1) {
    throw new Error(
      "No se encontró la sesión de caja.",
    );
  }

  const fechaHoraCierre =
    new Date().toISOString();

  const cajaCerrada:
    SesionCaja = {
    ...caja,

    estado: "Cerrada",

    usuarioCierreId:
      usuario.id,

    usuarioCierreNombre:
      usuario.nombreCompleto,

    montoContado,

    efectivoEsperado:
      resumen.efectivoEsperado,

    diferencia,

    observacionCierre:
      observacion,

    fechaHoraCierre,
  };

  sesiones[indice] =
    cajaCerrada;

  guardarArreglo(
    CLAVE_SESIONES_CAJA,
    sesiones,
  );

  return clonarSesion(
    cajaCerrada,
  );
}