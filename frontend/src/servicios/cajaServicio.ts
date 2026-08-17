import type { UsuarioSesion } from "../tipos/auth";
import type {
  AbrirCajaDto,
  CerrarCajaDto,
  FiltroMovimientosCaja,
  FiltroSesionesCaja,
  MovimientoCaja,
  PagoVenta,
  RegistrarMovimientoManualDto,
  RegistrarPagoVentaDto,
  ResumenCaja,
  SesionCaja,
} from "../tipos/caja";

import {
  apiOperations,
  crearErrorApi,
  esEstadoErrorApi,
} from "./apiCliente";

export async function obtenerCajaAbierta(): Promise<SesionCaja | null> {
  try {
    const sesiones = await listarSesionesCaja({ estado: "Abierta" });
    return sesiones[0] ?? null;
  } catch (error) {
    if (esEstadoErrorApi(error, 403)) return null;
    throw error;
  }
}

export async function obtenerCajaAbiertaPorUsuario(
  usuarioId: number,
): Promise<SesionCaja | null> {
  void usuarioId;
  try {
    const respuesta = await apiOperations.get<SesionCaja | null>("/caja/actual");
    return respuesta.data;
  } catch (error) {
    // Usuarios sin acceso a Caja igualmente deben poder cerrar sesión.
    if (esEstadoErrorApi(error, 403)) return null;
    throw crearErrorApi(error, "No fue posible consultar la caja abierta.");
  }
}

export async function listarSesionesCaja(
  filtros: FiltroSesionesCaja = {},
): Promise<SesionCaja[]> {
  try {
    const respuesta = await apiOperations.get<SesionCaja[]>("/caja/sesiones");
    return respuesta.data
      .filter((sesion) =>
        (filtros.usuarioId === undefined || sesion.usuarioAperturaId === filtros.usuarioId) &&
        (filtros.estado === undefined || sesion.estado === filtros.estado),
      )
      .sort(
        (a, b) =>
          new Date(b.fechaHoraApertura).getTime() -
          new Date(a.fechaHoraApertura).getTime(),
      );
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cargar las sesiones de caja.");
  }
}

export async function listarMovimientosCaja(
  filtros: FiltroMovimientosCaja | number = {},
): Promise<MovimientoCaja[]> {
  const normalizados: FiltroMovimientosCaja =
    typeof filtros === "number" ? { sesionCajaId: filtros } : filtros;

  try {
    const respuesta = await apiOperations.get<MovimientoCaja[]>("/caja/movimientos", {
      params: { sesionCajaId: normalizados.sesionCajaId },
    });

    return respuesta.data
      .filter(
        (movimiento) =>
          normalizados.usuarioId === undefined ||
          movimiento.usuarioId === normalizados.usuarioId,
      )
      .sort(
        (a, b) =>
          new Date(b.fechaHoraRegistro).getTime() -
          new Date(a.fechaHoraRegistro).getTime(),
      );
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cargar los movimientos de caja.");
  }
}

export async function listarPagosVenta(): Promise<PagoVenta[]> {
  try {
    const respuesta = await apiOperations.get<PagoVenta[]>("/caja/pagos");
    return [...respuesta.data].sort(
      (a, b) => new Date(b.fechaHoraCobro).getTime() - new Date(a.fechaHoraCobro).getTime(),
    );
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cargar los pagos registrados.");
  }
}

export async function obtenerPagoPorVentaId(ventaId: number): Promise<PagoVenta | null> {
  const pagos = await listarPagosPorVentaId(ventaId);
  return pagos[pagos.length - 1] ?? null;
}

export async function listarPagosPorVentaId(ventaId: number): Promise<PagoVenta[]> {
  try {
    const respuesta = await apiOperations.get<PagoVenta[]>(`/ventas/${ventaId}/pagos`);
    return [...respuesta.data].sort(
      (a, b) => new Date(a.fechaHoraCobro).getTime() - new Date(b.fechaHoraCobro).getTime(),
    );
  } catch (error) {
    throw crearErrorApi(error, "No fue posible consultar los abonos del pedido.");
  }
}

export async function calcularResumenSesionCaja(sesionCajaId: number): Promise<ResumenCaja> {
  try {
    const respuesta = await apiOperations.get<ResumenCaja>(
      `/caja/sesiones/${sesionCajaId}/resumen`,
    );
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible calcular el resumen de caja.");
  }
}

export async function abrirCaja(
  datos: AbrirCajaDto,
  usuario: UsuarioSesion,
): Promise<SesionCaja> {
  void usuario;
  try {
    const respuesta = await apiOperations.post<SesionCaja>("/caja/aperturas", datos);
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible abrir la caja.");
  }
}

export async function registrarMovimientoManual(
  datos: RegistrarMovimientoManualDto,
  usuario: UsuarioSesion,
): Promise<MovimientoCaja> {
  void usuario;
  try {
    const respuesta = await apiOperations.post<MovimientoCaja>("/caja/movimientos", datos);
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible registrar el movimiento de caja.");
  }
}

export async function registrarPagoVenta(
  datos: RegistrarPagoVentaDto,
  usuario: UsuarioSesion,
): Promise<PagoVenta> {
  void usuario;
  try {
    const respuesta = await apiOperations.post<{ pago: PagoVenta }>(
      `/ventas/${datos.ventaId}/pagos`,
      {
        tipoDescuento: datos.tipoDescuento,
        valorDescuento: datos.valorDescuento,
        motivoDescuento: datos.motivoDescuento,
        metodoPago: datos.metodoPago,
        montoQr: datos.montoQr,
        montoEfectivo: datos.montoEfectivo,
        montoRecibido: datos.montoRecibido,
        referenciaQr: datos.referenciaQr,
      },
    );
    return respuesta.data.pago;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible registrar el cobro o abono.");
  }
}

export async function cerrarCaja(
  datos: CerrarCajaDto,
  usuario: UsuarioSesion,
): Promise<SesionCaja> {
  void usuario;
  try {
    const respuesta = await apiOperations.post<SesionCaja>("/caja/cierre", datos);
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cerrar la caja.");
  }
}
