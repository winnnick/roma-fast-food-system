import type {
  ActualizarCategoriaDto,
  CategoriaProducto,
  CrearCategoriaDto,
  EstadoCatalogo,
} from "../tipos/producto";

import {
  apiOperations,
  esEstadoErrorApi,
  crearErrorApi,
} from "./apiCliente";

export async function listarCategorias():
  Promise<CategoriaProducto[]> {
  try {
    const respuesta =
      await apiOperations.get<
        CategoriaProducto[]
      >("/categorias");

    return [...respuesta.data].sort(
      (categoriaA, categoriaB) =>
        categoriaA.nombre.localeCompare(
          categoriaB.nombre,
          "es",
        ),
    );
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cargar las categorías.",
    );
  }
}

export async function obtenerCategoriaPorId(
  id: number,
): Promise<CategoriaProducto | null> {
  try {
    const respuesta =
      await apiOperations.get<CategoriaProducto>(
        `/categorias/${id}`,
      );

    return respuesta.data;
  } catch (error) {
    if (esEstadoErrorApi(error, 404)) {
      return null;
    }

    throw crearErrorApi(
      error,
      "No fue posible consultar la categoría.",
    );
  }
}

export async function crearCategoria(
  datos: CrearCategoriaDto,
): Promise<CategoriaProducto> {
  try {
    const respuesta =
      await apiOperations.post<CategoriaProducto>(
        "/categorias",
        {
          nombre: datos.nombre.trim(),
          descripcion:
            datos.descripcion.trim(),
        },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible registrar la categoría.",
    );
  }
}

export async function actualizarCategoria(
  id: number,
  datos: ActualizarCategoriaDto,
): Promise<CategoriaProducto> {
  try {
    const respuesta =
      await apiOperations.put<CategoriaProducto>(
        `/categorias/${id}`,
        {
          nombre: datos.nombre.trim(),
          descripcion:
            datos.descripcion.trim(),
        },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar la categoría.",
    );
  }
}

export async function cambiarEstadoCategoria(
  id: number,
  nuevoEstado: EstadoCatalogo,
): Promise<CategoriaProducto> {
  try {
    const respuesta =
      await apiOperations.patch<CategoriaProducto>(
        `/categorias/${id}/estado`,
        { estado: nuevoEstado },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cambiar el estado de la categoría.",
    );
  }
}
