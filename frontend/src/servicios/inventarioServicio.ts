import type {
  ActualizarInsumoDto,
  ConsumoVentaInventario,
  ConteoFisicoInventario,
  CrearInsumoDto,
  EstadoInsumo,
  EvaluacionInventarioVenta,
  FiltroMovimientosInventario,
  GuardarRecetaProductoDto,
  InsumoInventario,
  MovimientoInventario,
  NivelStockInventario,
  RecetaProducto,
  RegistrarAjusteManualInventarioDto,
  RegistrarConsumoVentaDto,
  RegistrarConteoFisicoDto,
  RegistrarEntradaInventarioDto,
  RegistrarTratamientoAnulacionDto,
  ResumenInventario,
} from "../tipos/inventario";

import type { UsuarioSesion } from "../tipos/auth";

import type {
  ActualizarProductoConInventarioDto,
  CrearProductoConInventarioDto,
  EstadoInventarioProducto,
  ProductoMenu,
} from "../tipos/producto";

import {
  actualizarProducto,
  crearProducto,
  listarProductos,
} from "./productoServicio";

import { apiInventory, crearErrorApi, esEstadoErrorApi } from "./apiCliente";

function envolverError(error: unknown, mensaje: string): never {
  throw crearErrorApi(error, mensaje);
}

async function sincronizarReferenciaProducto(
  producto: ProductoMenu,
): Promise<void> {
  try {
    await apiInventory.put(`/inventario/productos/${producto.id}/referencia`, {
      codigo: producto.codigo,
      nombre: producto.nombre,
      controlInventario: producto.controlInventario,
      estado: producto.estado,
    });
  } catch (error) {
    envolverError(
      error,
      "El producto fue guardado, pero no fue posible sincronizar su referencia con Inventario.",
    );
  }
}

export function calcularNivelStockInsumo(
  insumo: InsumoInventario,
): NivelStockInventario {
  if (insumo.stockActual < 0) {
    return "Negativo";
  }

  if (insumo.controlarStockBajo && insumo.stockActual <= insumo.stockMinimo) {
    return "Bajo";
  }

  return "Normal";
}

export function formatearCantidadInventario(
  cantidad: number,
  unidad: InsumoInventario["unidadBase"],
): string {
  const decimales = unidad === "unidad" ? 0 : 3;

  const valor = new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(cantidad);

  return `${valor} ${unidad}`;
}

export async function listarInsumosInventario(): Promise<InsumoInventario[]> {
  try {
    const respuesta = await apiInventory.get<InsumoInventario[]>(
      "/inventario/insumos",
    );

    return [...respuesta.data].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    );
  } catch (error) {
    envolverError(error, "No fue posible cargar los insumos de inventario.");
  }
}

export async function crearInsumoInventario(
  datos: CrearInsumoDto,
  usuario: UsuarioSesion,
): Promise<InsumoInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<InsumoInventario>(
      "/inventario/insumos",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible registrar el insumo.");
  }
}

export async function actualizarInsumoInventario(
  id: number,
  datos: ActualizarInsumoDto,
  usuario: UsuarioSesion,
): Promise<InsumoInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.put<InsumoInventario>(
      `/inventario/insumos/${id}`,
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible actualizar el insumo.");
  }
}

export async function cambiarEstadoInsumoInventario(
  id: number,
  estado: EstadoInsumo,
  usuario: UsuarioSesion,
): Promise<InsumoInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.patch<InsumoInventario>(
      `/inventario/insumos/${id}/estado`,
      {
        estado,
      },
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible cambiar el estado del insumo.");
  }
}

export async function registrarEntradaInventario(
  datos: RegistrarEntradaInventarioDto,
  usuario: UsuarioSesion,
): Promise<MovimientoInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<MovimientoInventario>(
      "/inventario/entradas",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible registrar la entrada de inventario.");
  }
}

export async function registrarAjusteManualInventario(
  datos: RegistrarAjusteManualInventarioDto,
  usuario: UsuarioSesion,
): Promise<MovimientoInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<MovimientoInventario>(
      "/inventario/ajustes",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible registrar el ajuste de inventario.");
  }
}

export async function listarRecetasInventario(): Promise<RecetaProducto[]> {
  try {
    const respuesta = await apiInventory.get<RecetaProducto[]>(
      "/inventario/recetas",
    );

    return [...respuesta.data].sort(
      (a, b) =>
        a.productoNombre.localeCompare(b.productoNombre, "es") ||
        b.version - a.version,
    );
  } catch (error) {
    envolverError(error, "No fue posible cargar las recetas de inventario.");
  }
}

export async function obtenerRecetaVigenteProducto(
  productoId: number,
): Promise<RecetaProducto | null> {
  try {
    const respuesta = await apiInventory.get<RecetaProducto | null>(
      `/inventario/recetas/productos/${productoId}/vigente`,
    );

    return respuesta.data;
  } catch (error) {
    if (esEstadoErrorApi(error, 404)) {
      return null;
    }

    envolverError(
      error,
      "No fue posible consultar la receta vigente del producto.",
    );
  }
}

export async function guardarNuevaVersionReceta(
  datos: GuardarRecetaProductoDto,
  usuario: UsuarioSesion,
): Promise<RecetaProducto> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<RecetaProducto>(
      "/inventario/recetas/versiones",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible crear la nueva versión de la receta.");
  }
}

export async function guardarNuevaVersionRecetaInventario(
  datos: GuardarRecetaProductoDto,
  usuario: UsuarioSesion,
): Promise<RecetaProducto> {
  return guardarNuevaVersionReceta(datos, usuario);
}

export async function finalizarRecetaVigenteProducto(
  productoId: number,
): Promise<RecetaProducto | null> {
  try {
    const respuesta = await apiInventory.post<RecetaProducto>(
      `/inventario/recetas/productos/${productoId}/finalizar`,
    );

    return respuesta.data;
  } catch (error) {
    if (esEstadoErrorApi(error, 404)) {
      return null;
    }

    envolverError(error, "No fue posible finalizar la receta vigente.");
  }
}

export async function crearProductoConInventario(
  datos: CrearProductoConInventarioDto,
  usuario: UsuarioSesion,
): Promise<{
  producto: ProductoMenu;
  receta: RecetaProducto | null;
}> {
  if (
    datos.controlInventario === "Con receta" &&
    datos.ingredientes.length === 0
  ) {
    throw new Error(
      "Agrega al menos un insumo o selecciona ‘No controla inventario’.",
    );
  }

  const { ingredientes, ...datosProducto } = datos;
  const producto = await crearProducto(datosProducto);

  await sincronizarReferenciaProducto(producto);

  if (datos.controlInventario === "No controla inventario") {
    return { producto, receta: null };
  }

  const receta = await guardarNuevaVersionReceta(
    {
      productoId: producto.id,
      ingredientes,
    },
    usuario,
  );

  return { producto, receta };
}

export async function actualizarProductoConInventario(
  id: number,
  datos: ActualizarProductoConInventarioDto,
  usuario: UsuarioSesion,
): Promise<{
  producto: ProductoMenu;
  receta: RecetaProducto | null;
}> {
  let recetaExistente: RecetaProducto | null = null;

  if (datos.controlInventario === "Con receta") {
    if (datos.ingredientes && datos.ingredientes.length === 0) {
      throw new Error("La receta debe contener al menos un insumo.");
    }

    if (!datos.ingredientes) {
      recetaExistente = await obtenerRecetaVigenteProducto(id);

      if (!recetaExistente) {
        throw new Error(
          "Configura una receta o selecciona ‘No controla inventario’.",
        );
      }
    }
  }

  const { ingredientes, ...datosProducto } = datos;
  const producto = await actualizarProducto(id, datosProducto);

  await sincronizarReferenciaProducto(producto);

  if (datos.controlInventario === "No controla inventario") {
    await finalizarRecetaVigenteProducto(id);
    return { producto, receta: null };
  }

  if (ingredientes) {
    const receta = await guardarNuevaVersionReceta(
      {
        productoId: id,
        ingredientes,
      },
      usuario,
    );

    return { producto, receta };
  }

  return {
    producto,
    receta: recetaExistente,
  };
}

export async function listarEstadosInventarioProductos(): Promise<
  EstadoInventarioProducto[]
> {
  const [productos, recetas] = await Promise.all([
    listarProductos(),
    listarRecetasInventario(),
  ]);

  const recetasVigentes = new Map(
    recetas
      .filter((receta) => receta.estado === "Vigente")
      .map((receta) => [receta.productoId, receta.id]),
  );

  return productos.map((producto) => {
    if (producto.controlInventario === "No controla inventario") {
      return {
        productoId: producto.id,
        estado: "No controla inventario",
        recetaVigenteId: null,
      };
    }

    const recetaVigenteId = recetasVigentes.get(producto.id) ?? null;

    return {
      productoId: producto.id,
      estado: recetaVigenteId ? "Receta configurada" : "Sin receta",
      recetaVigenteId,
    };
  });
}

export async function evaluarInventarioParaVenta(
  detalles: RegistrarConsumoVentaDto["detalles"],
): Promise<EvaluacionInventarioVenta> {
  try {
    const respuesta = await apiInventory.post<EvaluacionInventarioVenta>(
      "/inventario/evaluaciones-venta",
      {
        detalles,
      },
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible evaluar el inventario para la venta.");
  }
}

export async function registrarConsumoInventarioVenta(
  datos: RegistrarConsumoVentaDto,
  usuario: UsuarioSesion,
): Promise<ConsumoVentaInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<ConsumoVentaInventario>(
      "/inventario/consumos-venta",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible registrar el consumo de inventario.");
  }
}

export async function registrarTratamientoAnulacionInventario(
  datos: RegistrarTratamientoAnulacionDto,
  usuario: UsuarioSesion,
): Promise<ConsumoVentaInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<ConsumoVentaInventario>(
      "/inventario/anulaciones-venta",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(
      error,
      "No fue posible registrar el tratamiento de inventario de la anulación.",
    );
  }
}

export async function listarConsumosVentaInventario(): Promise<
  ConsumoVentaInventario[]
> {
  try {
    const respuesta = await apiInventory.get<ConsumoVentaInventario[]>(
      "/inventario/consumos-venta",
    );

    return [...respuesta.data].sort(
      (a, b) =>
        new Date(b.fechaHoraRegistro).getTime() -
        new Date(a.fechaHoraRegistro).getTime(),
    );
  } catch (error) {
    envolverError(error, "No fue posible cargar los consumos de inventario.");
  }
}

export async function registrarConteoFisicoInventario(
  datos: RegistrarConteoFisicoDto,
  usuario: UsuarioSesion,
): Promise<ConteoFisicoInventario> {
  void usuario;

  try {
    const respuesta = await apiInventory.post<ConteoFisicoInventario>(
      "/inventario/conteos",
      datos,
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible registrar el conteo físico.");
  }
}

export async function listarConteosFisicosInventario(): Promise<
  ConteoFisicoInventario[]
> {
  try {
    const respuesta = await apiInventory.get<ConteoFisicoInventario[]>(
      "/inventario/conteos",
    );

    return [...respuesta.data].sort(
      (a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
    );
  } catch (error) {
    envolverError(error, "No fue posible cargar los conteos físicos.");
  }
}

export async function listarMovimientosInventario(
  filtro: FiltroMovimientosInventario = {},
): Promise<MovimientoInventario[]> {
  try {
    const respuesta = await apiInventory.get<MovimientoInventario[]>(
      "/inventario/movimientos",
      {
        params: {
          insumoId: filtro.insumoId,
          tipo: filtro.tipo,
          texto: filtro.texto?.trim() || undefined,
          fechaDesde: filtro.fechaDesde,
          fechaHasta: filtro.fechaHasta,
        },
      },
    );

    return respuesta.data;
  } catch (error) {
    envolverError(
      error,
      "No fue posible cargar los movimientos de inventario.",
    );
  }
}

export async function obtenerResumenInventario(): Promise<ResumenInventario> {
  try {
    const respuesta = await apiInventory.get<ResumenInventario>(
      "/inventario/resumen",
    );

    return respuesta.data;
  } catch (error) {
    envolverError(error, "No fue posible cargar el resumen de inventario.");
  }
}
