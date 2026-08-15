import type {
  ActualizarProductoDto,
  ControlInventarioProducto,
  CrearProductoDto,
  EstadoCatalogo,
  ProductoMenu,
} from "../tipos/producto";

import {
  apiOperations,
  crearErrorApi,
} from "./apiCliente";

function construirPayloadProducto(
  datos:
    | CrearProductoDto
    | ActualizarProductoDto,
) {
  return {
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    categoriaId: datos.categoriaId,
    precio: datos.precio,
    disponiblePedidosYa:
      datos.disponiblePedidosYa === true,
    precioPedidosYa:
      datos.disponiblePedidosYa === true
        ? (datos.precioPedidosYa ?? null)
        : null,
    destacado: datos.destacado,
    modoPreparacion:
      datos.modoPreparacion ??
      "Requiere preparación",
    controlInventario:
      datos.controlInventario ??
      "Con receta",
    imagenUrl:
      datos.imagenUrl?.trim() || null,
  };
}

export async function listarProductos():
  Promise<ProductoMenu[]> {
  try {
    const respuesta =
      await apiOperations.get<ProductoMenu[]>(
        "/productos",
      );

    return [...respuesta.data].sort(
      (productoA, productoB) =>
        productoB.id - productoA.id,
    );
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cargar los productos.",
    );
  }
}

export async function crearProducto(
  datos: CrearProductoDto,
): Promise<ProductoMenu> {
  try {
    const respuesta =
      await apiOperations.post<ProductoMenu>(
        "/productos",
        construirPayloadProducto(datos),
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible registrar el producto.",
    );
  }
}

export async function actualizarProducto(
  id: number,
  datos: ActualizarProductoDto,
): Promise<ProductoMenu> {
  try {
    const respuesta =
      await apiOperations.put<ProductoMenu>(
        `/productos/${id}`,
        construirPayloadProducto(datos),
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar el producto.",
    );
  }
}

export async function cambiarEstadoProducto(
  id: number,
  nuevoEstado: EstadoCatalogo,
): Promise<ProductoMenu> {
  try {
    const respuesta =
      await apiOperations.patch<ProductoMenu>(
        `/productos/${id}/estado`,
        { estado: nuevoEstado },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cambiar el estado del producto.",
    );
  }
}

export async function cambiarProductoDestacado(
  id: number,
  destacado: boolean,
): Promise<ProductoMenu> {
  try {
    const respuesta =
      await apiOperations.patch<ProductoMenu>(
        `/productos/${id}/destacado`,
        { destacado },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar el producto destacado.",
    );
  }
}

export async function cambiarControlInventarioProducto(
  id: number,
  controlInventario:
    ControlInventarioProducto,
): Promise<ProductoMenu> {
  try {
    const respuesta =
      await apiOperations.patch<ProductoMenu>(
        `/productos/${id}/control-inventario`,
        { controlInventario },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cambiar el control de inventario del producto.",
    );
  }
}
