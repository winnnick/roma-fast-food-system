import type {
  UsuarioSesion,
} from "../tipos/auth";

import type {
  EvaluacionInventarioVenta,
  TratamientoAnulacionInventario,
} from "../tipos/inventario";

import type {
  CrearVentaDto,
  Venta,
} from "../tipos/venta";

import {
  anularVenta,
  crearVenta,
} from "./ventaServicio";

import {
  evaluarInventarioParaVenta,
  listarConsumosVentaInventario,
  registrarConsumoInventarioVenta,
  registrarTratamientoAnulacionInventario,
} from "./inventarioServicio";

const CLAVES_TRANSACCION = [
  "roma-ventas-unificadas-v1",
  "roma-inventario-insumos-v1",
  "roma-inventario-movimientos-v1",
  "roma-inventario-consumos-ventas-v1",
] as const;

interface CopiaLocalStorage {
  clave: string;
  valor: string | null;
}

export interface ResultadoVentaInventario {
  venta: Venta;
  evaluacion:
    EvaluacionInventarioVenta;
}

export interface EstadoInventarioAnulacion {
  tieneConsumoAplicado: boolean;
}

function crearCopiaTransaccion():
  CopiaLocalStorage[] {
  return CLAVES_TRANSACCION.map(
    (clave) => ({
      clave,
      valor:
        localStorage.getItem(clave),
    }),
  );
}

function restaurarCopiaTransaccion(
  copia: CopiaLocalStorage[],
): void {
  for (const elemento of copia) {
    if (elemento.valor === null) {
      localStorage.removeItem(
        elemento.clave,
      );
    } else {
      localStorage.setItem(
        elemento.clave,
        elemento.valor,
      );
    }
  }
}

function convertirDetallesInventario(
  datos: CrearVentaDto,
) {
  return datos.detalles.map(
    (detalle) => ({
      productoId:
        detalle.productoId,
      cantidad: detalle.cantidad,
    }),
  );
}

export async function evaluarVentaConInventario(
  datos: CrearVentaDto,
): Promise<EvaluacionInventarioVenta> {
  return evaluarInventarioParaVenta(
    convertirDetallesInventario(
      datos,
    ),
  );
}

export async function registrarVentaConInventario(
  datos: CrearVentaDto,
  usuario: UsuarioSesion,
  autorizaSaldoNegativo: boolean,
): Promise<ResultadoVentaInventario> {
  const evaluacion =
    await evaluarVentaConInventario(
      datos,
    );

  if (evaluacion.bloqueada) {
    throw new Error(
      "La venta contiene insumos inactivos o configurados para bloquear faltantes.",
    );
  }

  if (
    evaluacion.requiereConfirmacion &&
    !autorizaSaldoNegativo
  ) {
    throw new Error(
      "La venta dejará existencias negativas y requiere confirmación.",
    );
  }

  const copia =
    crearCopiaTransaccion();

  try {
    const venta =
      await crearVenta(datos);

    await registrarConsumoInventarioVenta(
      {
        ventaId: venta.id,
        numeroPedido:
          venta.numeroPedido,
        detalles:
          convertirDetallesInventario(
            datos,
          ),
        autorizaSaldoNegativo,
      },
      usuario,
    );

    return {
      venta,
      evaluacion,
    };
  } catch (error: unknown) {
    restaurarCopiaTransaccion(
      copia,
    );

    throw error;
  }
}

export async function obtenerEstadoInventarioAnulacion(
  ventaId: number,
): Promise<EstadoInventarioAnulacion> {
  const consumos =
    await listarConsumosVentaInventario();

  const consumo = consumos.find(
    (item) =>
      item.ventaId === ventaId,
  );

  return {
    tieneConsumoAplicado:
      consumo?.estado === "Aplicado" &&
      consumo.detalles.length > 0,
  };
}

export async function anularVentaConInventario(
  venta: Venta,
  motivo: string,
  tratamiento:
    TratamientoAnulacionInventario | null,
  usuario: UsuarioSesion,
): Promise<Venta> {
  const estadoInventario =
    await obtenerEstadoInventarioAnulacion(
      venta.id,
    );

  if (
    estadoInventario
      .tieneConsumoAplicado &&
    !tratamiento
  ) {
    throw new Error(
      "Selecciona qué ocurrirá con los insumos consumidos.",
    );
  }

  const copia =
    crearCopiaTransaccion();

  try {
    const ventaAnulada =
      await anularVenta(
        venta.id,
        motivo,
      );

    if (
      estadoInventario
        .tieneConsumoAplicado &&
      tratamiento
    ) {
      await registrarTratamientoAnulacionInventario(
        {
          ventaId: venta.id,
          numeroPedido:
            venta.numeroPedido,
          tratamiento,
          motivo,
        },
        usuario,
      );
    }

    return ventaAnulada;
  } catch (error: unknown) {
    restaurarCopiaTransaccion(
      copia,
    );

    throw error;
  }
}
