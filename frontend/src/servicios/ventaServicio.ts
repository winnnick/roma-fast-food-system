import type { UsuarioSesion } from "../tipos/auth";
import type {
  EvaluacionInventarioVenta,
  TratamientoAnulacionInventario,
} from "../tipos/inventario";
import type {
  CrearVentaDto,
  EstadoPreparacion,
  LiquidacionPedidosYa,
  ModoInicioPreparacion,
  PedidoPantallaPublica,
  RegistrarCobroVentaDto,
  RegistrarLiquidacionPedidosYaDto,
  RespuestaPantallaPedidosPublica,
  ResumenPedidosYaPeriodo,
  Venta,
} from "../tipos/venta";

import {
  apiOperations,
  apiOperationsPublic,
  crearErrorApi,
} from "./apiCliente";

export const CLAVE_FLUJO_PREPARACION = "roma-ventas-flujo-preparacion-v1";
const CLAVE_LIQUIDACIONES_PEDIDOSYA = "roma-pedidosya-liquidaciones-v1";
const MODO_PREDETERMINADO: ModoInicioPreparacion = "En preparación";

function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function guardarModoLocal(modo: ModoInicioPreparacion): void {
  localStorage.setItem(CLAVE_FLUJO_PREPARACION, modo);
  window.dispatchEvent(
    new CustomEvent("roma-flujo-preparacion-actualizado", { detail: modo }),
  );
}

export function obtenerModoInicioPreparacion(): ModoInicioPreparacion {
  const valor = localStorage.getItem(CLAVE_FLUJO_PREPARACION);
  return valor === "En cola" || valor === "En preparación" ? valor : MODO_PREDETERMINADO;
}

export async function actualizarModoInicioPreparacion(
  nuevoModo: ModoInicioPreparacion,
): Promise<ModoInicioPreparacion> {
  try {
    const respuesta = await apiOperations.put<{ modoInicioPreparacion: ModoInicioPreparacion }>(
      "/ventas/configuracion/preparacion",
      { modo: nuevoModo },
    );
    guardarModoLocal(respuesta.data.modoInicioPreparacion);
    return respuesta.data.modoInicioPreparacion;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible actualizar el flujo de preparación.");
  }
}

async function sincronizarConfiguracionPreparacion(): Promise<void> {
  try {
    const respuesta = await apiOperations.get<{ modoInicioPreparacion: ModoInicioPreparacion }>(
      "/ventas/configuracion/preparacion",
    );
    if (respuesta.data.modoInicioPreparacion !== obtenerModoInicioPreparacion()) {
      guardarModoLocal(respuesta.data.modoInicioPreparacion);
    }
  } catch {
    // La carga de ventas no debe fallar solamente porque no se pudo refrescar esta preferencia.
  }
}

export async function listarVentas(): Promise<Venta[]> {
  try {
    const [respuesta] = await Promise.all([
      apiOperations.get<Venta[]>("/ventas"),
      sincronizarConfiguracionPreparacion(),
    ]);
    return [...respuesta.data].sort(
      (a, b) => new Date(b.fechaHoraRegistro).getTime() - new Date(a.fechaHoraRegistro).getTime(),
    );
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cargar los pedidos y ventas.");
  }
}

export async function obtenerVentaPorId(id: number): Promise<Venta> {
  try {
    const respuesta = await apiOperations.get<Venta>(`/ventas/${id}`);
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cargar la venta seleccionada.");
  }
}

export async function evaluarInventarioVentaDesdeOperations(
  datos: CrearVentaDto,
): Promise<EvaluacionInventarioVenta> {
  try {
    const respuesta = await apiOperations.post<EvaluacionInventarioVenta>(
      "/ventas/evaluar-inventario",
      {
        detalles: datos.detalles.map((detalle) => ({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          observacion: detalle.observacion,
        })),
      },
    );
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible evaluar el inventario del pedido.");
  }
}

export async function crearVenta(
  datos: CrearVentaDto,
  usuario: UsuarioSesion,
  sesionCajaId: number,
  autorizaSaldoNegativo = false,
): Promise<Venta> {
  void usuario;
  void sesionCajaId;
  try {
    const respuesta = await apiOperations.post<Venta>("/ventas", {
      ...datos,
      autorizaSaldoNegativo,
    });
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible registrar el pedido.");
  }
}

export async function cambiarEstadoPreparacion(
  id: number,
  nuevoEstado: EstadoPreparacion,
  entrega?: { usuarioId: number; usuarioNombre: string; sesionCajaId: number },
): Promise<Venta> {
  void entrega;
  try {
    const respuesta = await apiOperations.patch<Venta>(`/ventas/${id}/preparacion`, {
      estado: nuevoEstado,
    });
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible cambiar el estado de preparación.");
  }
}

/**
 * Compatibilidad temporal. El cobro real ya actualiza la venta dentro de
 * Operations en la misma transacción; por eso aquí solo se vuelve a leer.
 */
export async function registrarCobroVenta(
  id: number,
  datos: RegistrarCobroVentaDto,
): Promise<Venta> {
  void datos;
  return obtenerVentaPorId(id);
}

export async function anularVenta(
  id: number,
  motivo: string,
  tratamientoInventario: TratamientoAnulacionInventario = "Reintegrar insumos",
): Promise<Venta> {
  try {
    const respuesta = await apiOperations.post<Venta>(`/ventas/${id}/anulacion`, {
      motivo,
      tratamientoInventario,
    });
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(error, "No fue posible anular el pedido.");
  }
}

export async function listarPedidosPantallaPublica(): Promise<RespuestaPantallaPedidosPublica> {
  try {
    const respuesta = await apiOperationsPublic.get<RespuestaPantallaPedidosPublica>(
      "/public/pedidos",
    );
    return {
      modoInicioPreparacion: respuesta.data.modoInicioPreparacion,
      ventas: [...respuesta.data.ventas],
    };
  } catch (error) {
    throw crearErrorApi(error, "No fue posible actualizar la pantalla pública de pedidos.");
  }
}

function fechaEnRango(fecha: string, desde: string, hasta: string): boolean {
  const tiempo = new Date(fecha).getTime();
  return (
    tiempo >= new Date(`${desde}T00:00:00`).getTime() &&
    tiempo <= new Date(`${hasta}T23:59:59.999`).getTime()
  );
}

function leerLiquidacionesLocales(): LiquidacionPedidosYa[] {
  const valor = localStorage.getItem(CLAVE_LIQUIDACIONES_PEDIDOSYA);
  if (!valor) return [];
  try {
    const datos = JSON.parse(valor) as LiquidacionPedidosYa[];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export async function obtenerResumenPedidosYa(
  fechaDesde: string,
  fechaHasta: string,
): Promise<ResumenPedidosYaPeriodo> {
  const ventas = (await listarVentas()).filter(
    (venta) =>
      venta.canalVenta === "PedidosYa" &&
      venta.estadoCobro !== "Anulada" &&
      fechaEnRango(venta.fechaHoraRegistro, fechaDesde, fechaHasta),
  );
  const pedidosEnCurso = ventas.filter(
    (venta) =>
      venta.estadoCobro === "Pendiente de liquidación" &&
      venta.estadoPreparacion !== "Entregado",
  );
  const pedidosPendientes = ventas.filter(
    (venta) =>
      venta.estadoCobro === "Pendiente de liquidación" &&
      venta.estadoPreparacion === "Entregado",
  );
  const pedidosLiquidados = ventas.filter((venta) => venta.estadoCobro === "Liquidada");
  const liquidaciones = leerLiquidacionesLocales().filter(
    (item) => item.fechaHasta >= fechaDesde && item.fechaDesde <= fechaHasta,
  );
  return {
    fechaDesde,
    fechaHasta,
    pedidosEnCurso,
    cantidadEnCurso: pedidosEnCurso.length,
    montoEnCurso: redondearMoneda(pedidosEnCurso.reduce((s, v) => s + v.total, 0)),
    pedidosPendientes,
    cantidadPendiente: pedidosPendientes.length,
    montoPendiente: redondearMoneda(pedidosPendientes.reduce((s, v) => s + v.total, 0)),
    pedidosLiquidados,
    cantidadLiquidada: pedidosLiquidados.length,
    montoLiquidado: redondearMoneda(pedidosLiquidados.reduce((s, v) => s + v.total, 0)),
    liquidaciones,
  };
}

export async function registrarLiquidacionPedidosYa(
  datos: RegistrarLiquidacionPedidosYaDto,
  usuario: UsuarioSesion,
): Promise<LiquidacionPedidosYa> {
  void datos;
  void usuario;
  throw new Error(
    "La liquidación administrativa de PedidosYa está siendo trasladada al Reporting Service. No se registró ningún cambio.",
  );
}

export type { PedidoPantallaPublica };
