import type {
  UsuarioSesion,
} from "../tipos/auth";

import type {
  AbrirCajaDto,
  CerrarCajaDto,
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

function exigirPermisoCaja(
  usuario: UsuarioSesion,
): void {
  if (
    !usuario.permisos.includes(
      "CAJA_GESTIONAR",
    )
  ) {
    throw new Error(
      "No tienes permiso para gestionar la caja.",
    );
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

function obtenerCajaAbiertaPersistida():
  SesionCaja | null {
  const sesiones =
    obtenerSesionesPersistidas();

  const cajasAbiertas =
    sesiones
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

  return cajasAbiertas[0] ?? null;
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
  metodoPago: MetodoPago,
  totalCobrado: number,
  montoEfectivoIngresado: number,
  montoRecibidoIngresado: number,
  referenciaQrIngresada:
    string | null,
): {
  montoEfectivo: number;
  montoQr: number;
  montoRecibido: number;
  cambio: number;
  referenciaQr: string | null;
} {
  const referenciaQr =
    normalizarTextoOpcional(
      referenciaQrIngresada,
      100,
      "La referencia QR",
    );

  if (
    metodoPago === "QR"
  ) {
    return {
      montoEfectivo: 0,
      montoQr: totalCobrado,
      montoRecibido: 0,
      cambio: 0,
      referenciaQr,
    };
  }

  if (
    metodoPago === "Efectivo"
  ) {
    const montoRecibido =
      validarMontoPositivo(
        montoRecibidoIngresado,
        "El monto recibido",
      );

    if (
      montoRecibido <
      totalCobrado
    ) {
      throw new Error(
        "El monto recibido es menor al total por cobrar.",
      );
    }

    return {
      montoEfectivo:
        totalCobrado,

      montoQr: 0,

      montoRecibido,

      cambio:
        redondearMoneda(
          montoRecibido -
            totalCobrado,
        ),

      referenciaQr: null,
    };
  }

  const montoEfectivo =
    validarMontoPositivo(
      montoEfectivoIngresado,
      "La parte en efectivo",
    );

  if (
    montoEfectivo >=
    totalCobrado
  ) {
    throw new Error(
      "En un pago mixto, la parte en efectivo debe ser menor al total.",
    );
  }

  const montoQr =
    redondearMoneda(
      totalCobrado -
        montoEfectivo,
    );

  const montoRecibido =
    validarMontoPositivo(
      montoRecibidoIngresado,
      "El monto recibido",
    );

  if (
    montoRecibido <
    montoEfectivo
  ) {
    throw new Error(
      "El monto recibido es menor a la parte que se pagará en efectivo.",
    );
  }

  return {
    montoEfectivo,
    montoQr,
    montoRecibido,

    cambio:
      redondearMoneda(
        montoRecibido -
          montoEfectivo,
      ),

    referenciaQr,
  };
}

export async function obtenerCajaAbierta():
  Promise<SesionCaja | null> {
  await esperar(250);

  const caja =
    obtenerCajaAbiertaPersistida();

  return caja
    ? clonarSesion(caja)
    : null;
}

export async function listarSesionesCaja():
  Promise<SesionCaja[]> {
  await esperar(300);

  return obtenerSesionesPersistidas()
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
  sesionCajaId?: number,
): Promise<MovimientoCaja[]> {
  await esperar(300);

  return obtenerMovimientosPersistidos()
    .filter(
      (movimiento) =>
        sesionCajaId ===
          undefined ||
        movimiento.sesionCajaId ===
          sesionCajaId,
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
      .find(
        (pagoActual) =>
          pagoActual.ventaId ===
          ventaId,
      );

  return pago
    ? clonarPago(pago)
    : null;
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

  exigirPermisoCaja(usuario);

  const cajaAbierta =
    obtenerCajaAbiertaPersistida();

  if (cajaAbierta) {
    throw new Error(
      `Ya existe una caja abierta por ${cajaAbierta.usuarioAperturaNombre}.`,
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

  exigirPermisoCaja(usuario);

  const caja =
    obtenerCajaAbiertaPersistida();

  if (!caja) {
    throw new Error(
      "No existe una caja abierta.",
    );
  }

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

  exigirPermisoCaja(usuario);

  const caja =
    obtenerCajaAbiertaPersistida();

  if (!caja) {
    throw new Error(
      "No existe una caja abierta. Abre una caja antes de registrar el cobro.",
    );
  }

  const venta =
    await obtenerVentaPorId(
      datos.ventaId,
    );

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

  const descuento =
    calcularDescuento(
      venta.subtotal,
      datos.tipoDescuento,
      datos.valorDescuento,
      datos.motivoDescuento,
    );

  const distribucion =
    calcularDistribucionPago(
      datos.metodoPago,
      descuento.totalCobrado,
      datos.montoEfectivo,
      datos.montoRecibido,
      datos.referenciaQr,
    );

  const pagos =
    obtenerPagosPersistidos();

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
      datos.tipoDescuento,

    valorDescuento:
      descuento.valorDescuento,

    montoDescuento:
      descuento.montoDescuento,

    motivoDescuento:
      descuento.motivoDescuento,

    totalCobrado:
      descuento.totalCobrado,

    metodoPago:
      datos.metodoPago,

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
      `Cobro de ${venta.numeroPedido}`,

    monto:
      descuento.totalCobrado,

    montoEfectivo:
      distribucion.montoEfectivo,

    montoQr:
      distribucion.montoQr,

    metodoPago:
      datos.metodoPago,

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
        datos.tipoDescuento,

      valorDescuento:
        descuento.valorDescuento,

      montoDescuento:
        descuento.montoDescuento,

      totalCobrado:
        descuento.totalCobrado,

      metodoPago:
        datos.metodoPago,

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

  exigirPermisoCaja(usuario);

  const caja =
    obtenerCajaAbiertaPersistida();

  if (!caja) {
    throw new Error(
      "No existe una caja abierta para cerrar.",
    );
  }

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