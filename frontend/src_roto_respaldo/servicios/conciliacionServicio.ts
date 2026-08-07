import type {
  MovimientoCaja,
  PagoVenta,
  SesionCaja,
} from "../tipos/caja";

import type {
  FiltroPeriodoAnalitica,
} from "../tipos/analitica";

import {
  listarMovimientosCaja,
  listarPagosVenta,
  listarSesionesCaja,
} from "./cajaServicio";

export type EstadoConciliacionCaja =
  | "Conciliada"
  | "Con diferencias"
  | "Abierta";

export interface ArqueoAdministrativo {
  sesionCajaId: number;
  estadoCaja: "Abierta" | "Cerrada";
  estadoConciliacion:
    EstadoConciliacionCaja;

  fechaHoraApertura: string;
  fechaHoraCierre: string | null;
  duracionMinutos: number | null;

  usuarioAperturaId: number;
  usuarioAperturaNombre: string;
  usuarioCierreId: number | null;
  usuarioCierreNombre: string | null;

  montoInicial: number;

  cantidadPagos: number;
  totalPagos: number;
  totalPagosEfectivo: number;
  totalPagosQr: number;

  cantidadMovimientosVenta: number;
  totalMovimientosVenta: number;
  totalMovimientosEfectivo: number;
  totalMovimientosQr: number;

  ingresosManuales: number;
  egresosManuales: number;

  efectivoEsperadoCalculado: number;
  efectivoEsperadoRegistrado: number | null;
  montoContado: number | null;
  diferenciaRegistrada: number | null;

  diferenciaPagosVsMovimientos: number;
  diferenciaEfectivoPagosVsMovimientos: number;
  diferenciaQrPagosVsMovimientos: number;
  diferenciaEsperadoCalculadoVsRegistrado: number | null;

  observacionApertura: string | null;
  observacionCierre: string | null;

  alertas: string[];
}

export interface ResumenConciliacionCaja {
  periodo: FiltroPeriodoAnalitica;

  totalSesiones: number;
  sesionesAbiertas: number;
  sesionesCerradas: number;

  sesionesConciliadas: number;
  sesionesConDiferencias: number;

  diasConFaltante: number;
  diasConSobrante: number;

  totalCobrado: number;
  totalEfectivo: number;
  totalQr: number;

  ingresosManuales: number;
  egresosManuales: number;

  diferenciaAcumulada: number;

  arqueos: ArqueoAdministrativo[];
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function estaEnPeriodo(
  fecha: string,
  periodo: FiltroPeriodoAnalitica,
): boolean {
  const tiempo = new Date(fecha).getTime();

  const desde = new Date(
    `${periodo.fechaDesde}T00:00:00`,
  ).getTime();

  const hasta = new Date(
    `${periodo.fechaHasta}T23:59:59.999`,
  ).getTime();

  return (
    tiempo >= desde &&
    tiempo <= hasta
  );
}

function sumar(
  valores: number[],
): number {
  return redondearMoneda(
    valores.reduce(
      (acumulado, valor) =>
        acumulado + valor,
      0,
    ),
  );
}

function obtenerMovimientosSesion(
  movimientos: MovimientoCaja[],
  sesionCajaId: number,
): MovimientoCaja[] {
  return movimientos.filter(
    (movimiento) =>
      movimiento.sesionCajaId ===
      sesionCajaId,
  );
}

function obtenerPagosSesion(
  pagos: PagoVenta[],
  sesionCajaId: number,
): PagoVenta[] {
  return pagos.filter(
    (pago) =>
      pago.sesionCajaId ===
      sesionCajaId,
  );
}

function calcularDuracionMinutos(
  sesion: SesionCaja,
): number | null {
  if (!sesion.fechaHoraCierre) {
    return null;
  }

  const diferencia =
    new Date(
      sesion.fechaHoraCierre,
    ).getTime() -
    new Date(
      sesion.fechaHoraApertura,
    ).getTime();

  return Math.max(
    0,
    Math.round(
      diferencia / 60000,
    ),
  );
}

function construirArqueo(
  sesion: SesionCaja,
  movimientos: MovimientoCaja[],
  pagos: PagoVenta[],
): ArqueoAdministrativo {
  const movimientosSesion =
    obtenerMovimientosSesion(
      movimientos,
      sesion.id,
    );

  const pagosSesion =
    obtenerPagosSesion(
      pagos,
      sesion.id,
    );

  const movimientosVenta =
    movimientosSesion.filter(
      (movimiento) =>
        movimiento.tipo === "Venta",
    );

  const movimientosIngreso =
    movimientosSesion.filter(
      (movimiento) =>
        movimiento.tipo === "Ingreso",
    );

  const movimientosEgreso =
    movimientosSesion.filter(
      (movimiento) =>
        movimiento.tipo === "Egreso",
    );

  const totalPagos = sumar(
    pagosSesion.map(
      (pago) => pago.totalCobrado,
    ),
  );

  const totalPagosEfectivo = sumar(
    pagosSesion.map(
      (pago) => pago.montoEfectivo,
    ),
  );

  const totalPagosQr = sumar(
    pagosSesion.map(
      (pago) => pago.montoQr,
    ),
  );

  const totalMovimientosVenta = sumar(
    movimientosVenta.map(
      (movimiento) =>
        movimiento.monto,
    ),
  );

  const totalMovimientosEfectivo = sumar(
    movimientosVenta.map(
      (movimiento) =>
        movimiento.montoEfectivo,
    ),
  );

  const totalMovimientosQr = sumar(
    movimientosVenta.map(
      (movimiento) =>
        movimiento.montoQr,
    ),
  );

  const ingresosManuales = sumar(
    movimientosIngreso.map(
      (movimiento) =>
        movimiento.montoEfectivo,
    ),
  );

  const egresosManuales = sumar(
    movimientosEgreso.map(
      (movimiento) =>
        movimiento.montoEfectivo,
    ),
  );

  const efectivoEsperadoCalculado =
    redondearMoneda(
      sesion.montoInicial +
        totalMovimientosEfectivo +
        ingresosManuales -
        egresosManuales,
    );

  const diferenciaPagosVsMovimientos =
    redondearMoneda(
      totalPagos -
        totalMovimientosVenta,
    );

  const diferenciaEfectivo =
    redondearMoneda(
      totalPagosEfectivo -
        totalMovimientosEfectivo,
    );

  const diferenciaQr =
    redondearMoneda(
      totalPagosQr -
        totalMovimientosQr,
    );

  const diferenciaEsperado =
    sesion.efectivoEsperado === null
      ? null
      : redondearMoneda(
          efectivoEsperadoCalculado -
            sesion.efectivoEsperado,
        );

  const alertas: string[] = [];

  if (
    Math.abs(
      diferenciaPagosVsMovimientos,
    ) > 0.01
  ) {
    alertas.push(
      "El total de pagos no coincide con los movimientos de venta.",
    );
  }

  if (
    Math.abs(diferenciaEfectivo) >
    0.01
  ) {
    alertas.push(
      "La parte en efectivo de los pagos no coincide con caja.",
    );
  }

  if (
    Math.abs(diferenciaQr) > 0.01
  ) {
    alertas.push(
      "La parte QR de los pagos no coincide con caja.",
    );
  }

  if (
    diferenciaEsperado !== null &&
    Math.abs(diferenciaEsperado) >
      0.01
  ) {
    alertas.push(
      "El efectivo esperado guardado no coincide con el recálculo administrativo.",
    );
  }

  if (
    sesion.diferencia !== null &&
    Math.abs(sesion.diferencia) >
      0.01
  ) {
    alertas.push(
      sesion.diferencia < 0
        ? "La sesión cerró con faltante de efectivo."
        : "La sesión cerró con sobrante de efectivo.",
    );
  }

  const estadoConciliacion:
    EstadoConciliacionCaja =
    sesion.estado === "Abierta"
      ? "Abierta"
      : alertas.length === 0
        ? "Conciliada"
        : "Con diferencias";

  return {
    sesionCajaId: sesion.id,
    estadoCaja: sesion.estado,
    estadoConciliacion,

    fechaHoraApertura:
      sesion.fechaHoraApertura,
    fechaHoraCierre:
      sesion.fechaHoraCierre,
    duracionMinutos:
      calcularDuracionMinutos(
        sesion,
      ),

    usuarioAperturaId:
      sesion.usuarioAperturaId,
    usuarioAperturaNombre:
      sesion.usuarioAperturaNombre,
    usuarioCierreId:
      sesion.usuarioCierreId,
    usuarioCierreNombre:
      sesion.usuarioCierreNombre,

    montoInicial:
      sesion.montoInicial,

    cantidadPagos:
      pagosSesion.length,
    totalPagos,
    totalPagosEfectivo,
    totalPagosQr,

    cantidadMovimientosVenta:
      movimientosVenta.length,
    totalMovimientosVenta,
    totalMovimientosEfectivo,
    totalMovimientosQr,

    ingresosManuales,
    egresosManuales,

    efectivoEsperadoCalculado,
    efectivoEsperadoRegistrado:
      sesion.efectivoEsperado,
    montoContado:
      sesion.montoContado,
    diferenciaRegistrada:
      sesion.diferencia,

    diferenciaPagosVsMovimientos,
    diferenciaEfectivoPagosVsMovimientos:
      diferenciaEfectivo,
    diferenciaQrPagosVsMovimientos:
      diferenciaQr,
    diferenciaEsperadoCalculadoVsRegistrado:
      diferenciaEsperado,

    observacionApertura:
      sesion.observacionApertura,
    observacionCierre:
      sesion.observacionCierre,

    alertas,
  };
}

export async function obtenerConciliacionCaja(
  periodo: FiltroPeriodoAnalitica,
): Promise<ResumenConciliacionCaja> {
  const [
    sesiones,
    movimientos,
    pagos,
  ] = await Promise.all([
    listarSesionesCaja(),
    listarMovimientosCaja(),
    listarPagosVenta(),
  ]);

  const sesionesPeriodo =
    sesiones.filter((sesion) => {
      const fechaReferencia =
        sesion.fechaHoraCierre ??
        sesion.fechaHoraApertura;

      return estaEnPeriodo(
        fechaReferencia,
        periodo,
      );
    });

  const arqueos = sesionesPeriodo
    .map((sesion) =>
      construirArqueo(
        sesion,
        movimientos,
        pagos,
      ),
    )
    .sort(
      (arqueoA, arqueoB) =>
        new Date(
          arqueoB.fechaHoraApertura,
        ).getTime() -
        new Date(
          arqueoA.fechaHoraApertura,
        ).getTime(),
    );

  return {
    periodo,

    totalSesiones: arqueos.length,

    sesionesAbiertas:
      arqueos.filter(
        (arqueo) =>
          arqueo.estadoCaja ===
          "Abierta",
      ).length,

    sesionesCerradas:
      arqueos.filter(
        (arqueo) =>
          arqueo.estadoCaja ===
          "Cerrada",
      ).length,

    sesionesConciliadas:
      arqueos.filter(
        (arqueo) =>
          arqueo.estadoConciliacion ===
          "Conciliada",
      ).length,

    sesionesConDiferencias:
      arqueos.filter(
        (arqueo) =>
          arqueo.estadoConciliacion ===
          "Con diferencias",
      ).length,

    diasConFaltante:
      arqueos.filter(
        (arqueo) =>
          (arqueo.diferenciaRegistrada ??
            0) < -0.01,
      ).length,

    diasConSobrante:
      arqueos.filter(
        (arqueo) =>
          (arqueo.diferenciaRegistrada ??
            0) > 0.01,
      ).length,

    totalCobrado: sumar(
      arqueos.map(
        (arqueo) =>
          arqueo.totalPagos,
      ),
    ),

    totalEfectivo: sumar(
      arqueos.map(
        (arqueo) =>
          arqueo.totalPagosEfectivo,
      ),
    ),

    totalQr: sumar(
      arqueos.map(
        (arqueo) =>
          arqueo.totalPagosQr,
      ),
    ),

    ingresosManuales: sumar(
      arqueos.map(
        (arqueo) =>
          arqueo.ingresosManuales,
      ),
    ),

    egresosManuales: sumar(
      arqueos.map(
        (arqueo) =>
          arqueo.egresosManuales,
      ),
    ),

    diferenciaAcumulada: sumar(
      arqueos.map(
        (arqueo) =>
          arqueo.diferenciaRegistrada ??
          0,
      ),
    ),

    arqueos,
  };
}
