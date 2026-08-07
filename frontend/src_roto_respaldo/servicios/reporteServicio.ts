import type {
  FiltroPeriodoAnalitica,
  PanelAdministrativo,
} from "../tipos/analitica";

import type {
  FilaReporteInventario,
  FilaReporteUsuario,
  FilaReporteVenta,
} from "../tipos/reportes";

import type {
  RegistroAuditoria,
} from "../tipos/auditoria";

import type {
  ArqueoAdministrativo,
  ResumenConciliacionCaja,
} from "./conciliacionServicio";

import {
  obtenerPanelAdministrativo,
} from "./analiticaServicio";

import {
  listarAuditoria,
} from "./auditoriaServicio";

import {
  obtenerConciliacionCaja,
} from "./conciliacionServicio";

import {
  listarMovimientosInventario,
} from "./inventarioServicio";

import {
  listarVentas,
} from "./ventaServicio";

export interface DatosReportesAdministrativos {
  periodo: FiltroPeriodoAnalitica;
  generadoEn: string;

  panel: PanelAdministrativo;
  conciliacion: ResumenConciliacionCaja;

  ventas: FilaReporteVenta[];
  inventario: FilaReporteInventario[];
  usuarios: FilaReporteUsuario[];
  auditoria: RegistroAuditoria[];
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

  return tiempo >= desde && tiempo <= hasta;
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

export async function obtenerDatosReportesAdministrativos(
  periodo: FiltroPeriodoAnalitica,
): Promise<DatosReportesAdministrativos> {
  const [
    panel,
    conciliacion,
    ventasPersistidas,
    movimientosInventario,
    auditoria,
  ] = await Promise.all([
    obtenerPanelAdministrativo(periodo),
    obtenerConciliacionCaja(periodo),
    listarVentas(),
    listarMovimientosInventario({
      fechaDesde: periodo.fechaDesde,
      fechaHasta: periodo.fechaHasta,
    }),
    listarAuditoria({
      fechaDesde: periodo.fechaDesde,
      fechaHasta: periodo.fechaHasta,
    }),
  ]);

  const ventas: FilaReporteVenta[] =
    ventasPersistidas
      .filter((venta) =>
        estaEnPeriodo(
          venta.fechaHoraRegistro,
          periodo,
        ),
      )
      .map((venta) => ({
        ventaId: venta.id,
        numeroPedido: venta.numeroPedido,

        fechaHoraRegistro:
          venta.fechaHoraRegistro,
        fechaHoraCobro:
          venta.fechaHoraCobro,

        cliente: venta.clienteNombre,

        productos: venta.detalles
          .map(
            (detalle) =>
              `${detalle.cantidad} × ${detalle.nombreProducto}`,
          )
          .join(" · "),

        subtotal:
          redondearMoneda(
            venta.subtotal,
          ),

        descuento:
          redondearMoneda(
            venta.montoDescuento,
          ),

        total:
          redondearMoneda(
            venta.total,
          ),

        metodoPago:
          venta.metodoPago,

        estadoCobro:
          venta.estadoCobro,

        estadoPreparacion:
          venta.estadoPreparacion,
      }))
      .sort(
        (ventaA, ventaB) =>
          new Date(
            ventaB.fechaHoraRegistro,
          ).getTime() -
          new Date(
            ventaA.fechaHoraRegistro,
          ).getTime(),
      );

  const inventario:
    FilaReporteInventario[] =
    movimientosInventario.map(
      (movimiento) => ({
        movimientoId: movimiento.id,
        fechaHora: movimiento.fechaHora,

        insumo:
          movimiento.insumoNombre,

        tipoMovimiento:
          movimiento.tipo,

        cantidad:
          movimiento.cantidad,

        unidad:
          movimiento.unidadBase,

        stockAnterior:
          movimiento.stockAnterior,

        stockPosterior:
          movimiento.stockPosterior,

        usuario:
          movimiento.usuarioNombre,

        referencia:
          movimiento.numeroPedido ??
          movimiento.referencia,

        motivo:
          movimiento.motivo,

        impactoEconomico:
          movimiento.impactoEconomico,
      }),
    );

  const usuarios: FilaReporteUsuario[] =
    panel.actividadPorUsuario.map(
      (usuario) => ({
        usuarioId: usuario.usuarioId,
        usuario: usuario.usuarioNombre,

        ventasRegistradas:
          usuario.ventasRegistradas,

        montoVentasRegistradas:
          usuario.montoVentasRegistradas,

        cobrosRealizados:
          usuario.cobrosRealizados,

        montoCobrado:
          usuario.montoCobrado,

        movimientosInventario:
          usuario.movimientosInventario,

        movimientosCaja:
          usuario.movimientosCajaManuales,

        aperturasCaja:
          usuario.aperturasCaja,

        cierresCaja:
          usuario.cierresCaja,

        totalAcciones:
          usuario.totalAcciones,
      }),
    );

  return {
    periodo,
    generadoEn: new Date().toISOString(),

    panel,
    conciliacion,

    ventas,
    inventario,
    usuarios,
    auditoria,
  };
}

export function filtrarArqueosPorTexto(
  arqueos: ArqueoAdministrativo[],
  texto: string,
): ArqueoAdministrativo[] {
  const busqueda = texto
    .trim()
    .toLocaleLowerCase("es");

  if (!busqueda) {
    return arqueos;
  }

  return arqueos.filter((arqueo) =>
    [
      arqueo.sesionCajaId,
      arqueo.usuarioAperturaNombre,
      arqueo.usuarioCierreNombre ?? "",
      arqueo.estadoCaja,
      arqueo.estadoConciliacion,
      arqueo.observacionApertura ?? "",
      arqueo.observacionCierre ?? "",
      ...arqueo.alertas,
    ]
      .join(" ")
      .toLocaleLowerCase("es")
      .includes(busqueda),
  );
}
