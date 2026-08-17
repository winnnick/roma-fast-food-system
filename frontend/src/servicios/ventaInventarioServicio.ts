import type { UsuarioSesion } from "../tipos/auth";
import type {
  EvaluacionInventarioVenta,
  TratamientoAnulacionInventario,
} from "../tipos/inventario";
import type { CrearVentaDto, Venta } from "../tipos/venta";

import { obtenerCajaAbiertaPorUsuario } from "./cajaServicio";
import {
  anularVenta,
  crearVenta,
  evaluarInventarioVentaDesdeOperations,
  obtenerVentaPorId,
} from "./ventaServicio";

export interface ResultadoVentaInventario {
  venta: Venta;
  evaluacion: EvaluacionInventarioVenta;
}

export interface EstadoInventarioAnulacion {
  tieneConsumoAplicado: boolean;
}

export async function evaluarVentaConInventario(
  datos: CrearVentaDto,
): Promise<EvaluacionInventarioVenta> {
  return evaluarInventarioVentaDesdeOperations(datos);
}

export async function registrarVentaConInventario(
  datos: CrearVentaDto,
  usuario: UsuarioSesion,
  autorizaSaldoNegativo: boolean,
): Promise<ResultadoVentaInventario> {
  const caja = await obtenerCajaAbiertaPorUsuario(usuario.id);
  if (!caja) {
    throw new Error("Debes abrir tu propia caja antes de registrar una venta.");
  }

  const evaluacion = await evaluarVentaConInventario(datos);
  if (evaluacion.bloqueada) {
    throw new Error(
      "La venta contiene insumos inactivos o configurados para bloquear faltantes.",
    );
  }
  if (evaluacion.requiereConfirmacion && !autorizaSaldoNegativo) {
    throw new Error("La venta dejará existencias negativas y requiere confirmación.");
  }

  // Operations crea el pedido y consume Inventory. El frontend ya no escribe stock.
  const venta = await crearVenta(datos, usuario, caja.id, autorizaSaldoNegativo);
  return { venta, evaluacion };
}

export async function obtenerEstadoInventarioAnulacion(
  ventaId: number,
): Promise<EstadoInventarioAnulacion> {
  const venta = await obtenerVentaPorId(ventaId);
  return {
    tieneConsumoAplicado:
      venta.estadoInventario === "Aplicado" &&
      venta.consumoInventarioId !== null,
  };
}

export async function anularVentaConInventario(
  venta: Venta,
  motivo: string,
  tratamiento: TratamientoAnulacionInventario | null,
  usuario: UsuarioSesion,
): Promise<Venta> {
  void usuario;
  const estado = await obtenerEstadoInventarioAnulacion(venta.id);
  if (estado.tieneConsumoAplicado && !tratamiento) {
    throw new Error("Selecciona qué ocurrirá con los insumos consumidos.");
  }

  return anularVenta(
    venta.id,
    motivo,
    tratamiento ?? "Reintegrar insumos",
  );
}
