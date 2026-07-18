import type {
  ActualizarProductoDto,
  CrearProductoDto,
  EstadoCatalogo,
  ProductoMenu,
} from "../tipos/producto";

import {
  obtenerCategoriaPorId,
} from "./categoriaServicio";

const CLAVE_PRODUCTOS =
  "roma-productos";

const productosIniciales:
  ProductoMenu[] = [
  {
    id: 1,
    codigo: "HAMB-001",
    nombre: "Hamburguesa clásica",
    descripcion:
      "Carne, queso, lechuga, tomate y salsa de la casa.",
    categoriaId: 1,
    precio: 25,
    estado: "Activo",
    disponible: true,
    destacado: true,
    imagenUrl: null,
    fechaRegistro:
      "2026-07-02T12:00:00.000Z",
    fechaActualizacion:
      "2026-07-02T12:00:00.000Z",
  },
  {
    id: 2,
    codigo: "HAMB-002",
    nombre: "Hamburguesa doble",
    descripcion:
      "Doble carne, doble queso, vegetales y salsa especial.",
    categoriaId: 1,
    precio: 35,
    estado: "Activo",
    disponible: true,
    destacado: true,
    imagenUrl: null,
    fechaRegistro:
      "2026-07-02T12:05:00.000Z",
    fechaActualizacion:
      "2026-07-02T12:05:00.000Z",
  },
  {
    id: 3,
    codigo: "PIZZ-001",
    nombre: "Pizza familiar",
    descripcion:
      "Pizza familiar con queso, jamón y salsa de tomate.",
    categoriaId: 2,
    precio: 65,
    estado: "Activo",
    disponible: true,
    destacado: false,
    imagenUrl: null,
    fechaRegistro:
      "2026-07-02T12:10:00.000Z",
    fechaActualizacion:
      "2026-07-02T12:10:00.000Z",
  },
  {
    id: 4,
    codigo: "COMB-001",
    nombre: "Combo clásico",
    descripcion:
      "Hamburguesa clásica, papas fritas y bebida personal.",
    categoriaId: 3,
    precio: 38,
    estado: "Activo",
    disponible: true,
    destacado: true,
    imagenUrl: null,
    fechaRegistro:
      "2026-07-02T12:15:00.000Z",
    fechaActualizacion:
      "2026-07-02T12:15:00.000Z",
  },
  {
    id: 5,
    codigo: "BEB-001",
    nombre: "Coca-Cola 500 ml",
    descripcion:
      "Bebida gaseosa personal de 500 mililitros.",
    categoriaId: 4,
    precio: 10,
    estado: "Activo",
    disponible: true,
    destacado: false,
    imagenUrl: null,
    fechaRegistro:
      "2026-07-02T12:20:00.000Z",
    fechaActualizacion:
      "2026-07-02T12:20:00.000Z",
  },
  {
    id: 6,
    codigo: "ACOMP-001",
    nombre: "Papas fritas",
    descripcion:
      "Porción individual de papas fritas.",
    categoriaId: 5,
    precio: 12,
    estado: "Activo",
    disponible: true,
    destacado: false,
    imagenUrl: null,
    fechaRegistro:
      "2026-07-02T12:25:00.000Z",
    fechaActualizacion:
      "2026-07-02T12:25:00.000Z",
  },
];

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

function clonarProducto(
  producto: ProductoMenu,
): ProductoMenu {
  return {
    ...producto,
  };
}

function guardarProductos(
  productos: ProductoMenu[],
): void {
  localStorage.setItem(
    CLAVE_PRODUCTOS,
    JSON.stringify(productos),
  );
}

function obtenerProductosPersistidos():
  ProductoMenu[] {
  const datosGuardados =
    localStorage.getItem(
      CLAVE_PRODUCTOS,
    );

  if (!datosGuardados) {
    guardarProductos(
      productosIniciales,
    );

    return productosIniciales.map(
      clonarProducto,
    );
  }

  try {
    const productos = JSON.parse(
      datosGuardados,
    ) as ProductoMenu[];

    if (!Array.isArray(productos)) {
      throw new Error(
        "La información de productos no es válida.",
      );
    }

    return productos.map(
      clonarProducto,
    );
  } catch {
    guardarProductos(
      productosIniciales,
    );

    return productosIniciales.map(
      clonarProducto,
    );
  }
}

function normalizarTexto(
  texto: string,
): string {
  return texto
    .trim()
    .toLocaleLowerCase("es");
}

function normalizarCodigo(
  codigo: string,
): string {
  return codigo
    .trim()
    .toUpperCase();
}

function validarCodigo(
  codigo: string,
): void {
  if (
    codigo.length < 3 ||
    codigo.length > 20
  ) {
    throw new Error(
      "El código debe contener entre 3 y 20 caracteres.",
    );
  }

  if (
    !/^[A-Z0-9-]+$/.test(codigo)
  ) {
    throw new Error(
      "El código solo puede contener letras, números y guiones.",
    );
  }
}

function validarCodigoDuplicado(
  productos: ProductoMenu[],
  codigo: string,
  idIgnorado?: number,
): void {
  const codigoNormalizado =
    normalizarCodigo(codigo);

  const existe = productos.some(
    (producto) =>
      producto.id !== idIgnorado &&
      normalizarCodigo(
        producto.codigo,
      ) === codigoNormalizado,
  );

  if (existe) {
    throw new Error(
      "Ya existe un producto con ese código.",
    );
  }
}

function validarNombreDuplicado(
  productos: ProductoMenu[],
  nombre: string,
  categoriaId: number,
  idIgnorado?: number,
): void {
  const nombreNormalizado =
    normalizarTexto(nombre);

  const existe = productos.some(
    (producto) =>
      producto.id !== idIgnorado &&
      producto.categoriaId ===
        categoriaId &&
      normalizarTexto(
        producto.nombre,
      ) === nombreNormalizado,
  );

  if (existe) {
    throw new Error(
      "Ya existe un producto con ese nombre dentro de la categoría seleccionada.",
    );
  }
}

function validarDatosProducto(
  nombre: string,
  descripcion: string,
  precio: number,
): void {
  if (nombre.length < 3) {
    throw new Error(
      "El nombre del producto debe contener al menos 3 caracteres.",
    );
  }

  if (descripcion.length < 5) {
    throw new Error(
      "Ingrese una descripción válida para el producto.",
    );
  }

  if (
    !Number.isFinite(precio) ||
    precio <= 0
  ) {
    throw new Error(
      "El precio del producto debe ser mayor que cero.",
    );
  }

  if (precio > 100000) {
    throw new Error(
      "El precio ingresado supera el límite permitido.",
    );
  }
}

async function validarCategoriaActiva(
  categoriaId: number,
): Promise<void> {
  const categoria =
    await obtenerCategoriaPorId(
      categoriaId,
    );

  if (!categoria) {
    throw new Error(
      "La categoría seleccionada no existe.",
    );
  }

  if (
    categoria.estado === "Inactivo"
  ) {
    throw new Error(
      "No se puede asignar el producto a una categoría inactiva.",
    );
  }
}

export async function listarProductos():
  Promise<ProductoMenu[]> {
  await esperar(450);

  return obtenerProductosPersistidos()
    .sort((productoA, productoB) =>
      productoB.id - productoA.id,
    )
    .map(clonarProducto);
}

export async function obtenerProductoPorId(
  id: number,
): Promise<ProductoMenu | null> {
  await esperar(100);

  const producto =
    obtenerProductosPersistidos().find(
      (item) => item.id === id,
    );

  return producto
    ? clonarProducto(producto)
    : null;
}

export async function crearProducto(
  datos: CrearProductoDto,
): Promise<ProductoMenu> {
  await esperar(700);

  const productos =
    obtenerProductosPersistidos();

  const codigo =
    normalizarCodigo(datos.codigo);

  const nombre =
    datos.nombre.trim();

  const descripcion =
    datos.descripcion.trim();

  validarCodigo(codigo);

  validarDatosProducto(
    nombre,
    descripcion,
    datos.precio,
  );

  await validarCategoriaActiva(
    datos.categoriaId,
  );

  validarCodigoDuplicado(
    productos,
    codigo,
  );

  validarNombreDuplicado(
    productos,
    nombre,
    datos.categoriaId,
  );

  const nuevoId =
    productos.length === 0
      ? 1
      : Math.max(
          ...productos.map(
            (producto) =>
              producto.id,
          ),
        ) + 1;

  const fechaActual =
    new Date().toISOString();

  const nuevoProducto:
    ProductoMenu = {
    id: nuevoId,
    codigo,
    nombre,
    descripcion,
    categoriaId:
      datos.categoriaId,
    precio: Number(
      datos.precio.toFixed(2),
    ),
    estado: "Activo",
    disponible:
      datos.disponible,
    destacado:
      datos.destacado,
    imagenUrl:
      datos.imagenUrl?.trim()
        ? datos.imagenUrl.trim()
        : null,
    fechaRegistro: fechaActual,
    fechaActualizacion:
      fechaActual,
  };

  guardarProductos([
    ...productos,
    nuevoProducto,
  ]);

  return clonarProducto(
    nuevoProducto,
  );
}

export async function actualizarProducto(
  id: number,
  datos: ActualizarProductoDto,
): Promise<ProductoMenu> {
  await esperar(700);

  const productos =
    obtenerProductosPersistidos();

  const indiceProducto =
    productos.findIndex(
      (producto) =>
        producto.id === id,
    );

  if (indiceProducto === -1) {
    throw new Error(
      "El producto seleccionado no existe.",
    );
  }

  const productoActual =
    productos[indiceProducto];

  const codigo =
    normalizarCodigo(datos.codigo);

  const nombre =
    datos.nombre.trim();

  const descripcion =
    datos.descripcion.trim();

  validarCodigo(codigo);

  validarDatosProducto(
    nombre,
    descripcion,
    datos.precio,
  );

  const categoriaSeleccionada =
    await obtenerCategoriaPorId(
      datos.categoriaId,
    );

  if (!categoriaSeleccionada) {
    throw new Error(
      "La categoría seleccionada no existe.",
    );
  }

  const cambioCategoria =
    productoActual.categoriaId !==
    datos.categoriaId;

  if (
    categoriaSeleccionada.estado ===
      "Inactivo" &&
    (
      cambioCategoria ||
      productoActual.estado === "Activo"
    )
  ) {
    throw new Error(
      "No se puede asignar el producto a una categoría inactiva.",
    );
  }

  validarCodigoDuplicado(
    productos,
    codigo,
    id,
  );

  validarNombreDuplicado(
    productos,
    nombre,
    datos.categoriaId,
    id,
  );

  const productoActualizado:
    ProductoMenu = {
    ...productoActual,
    codigo,
    nombre,
    descripcion,
    categoriaId:
      datos.categoriaId,
    precio: Number(
      datos.precio.toFixed(2),
    ),
    disponible:
      productoActual.estado ===
      "Activo"
        ? datos.disponible
        : false,
    destacado:
      productoActual.estado ===
      "Activo"
        ? datos.destacado
        : false,
    imagenUrl:
      datos.imagenUrl?.trim()
        ? datos.imagenUrl.trim()
        : null,
    fechaActualizacion:
      new Date().toISOString(),
  };

  productos[indiceProducto] =
    productoActualizado;

  guardarProductos(productos);

  return clonarProducto(
    productoActualizado,
  );
}

export async function cambiarEstadoProducto(
  id: number,
  nuevoEstado: EstadoCatalogo,
): Promise<ProductoMenu> {
  await esperar(550);

  const productos =
    obtenerProductosPersistidos();

  const indiceProducto =
    productos.findIndex(
      (producto) =>
        producto.id === id,
    );

  if (indiceProducto === -1) {
    throw new Error(
      "El producto seleccionado no existe.",
    );
  }

  const productoActual =
    productos[indiceProducto];

  if (nuevoEstado === "Activo") {
    await validarCategoriaActiva(
      productoActual.categoriaId,
    );
  }

  const productoActualizado:
    ProductoMenu = {
    ...productoActual,
    estado: nuevoEstado,
    disponible:
      nuevoEstado === "Activo"
        ? productoActual.disponible
        : false,
    destacado:
      nuevoEstado === "Activo"
        ? productoActual.destacado
        : false,
    fechaActualizacion:
      new Date().toISOString(),
  };

  productos[indiceProducto] =
    productoActualizado;

  guardarProductos(productos);

  return clonarProducto(
    productoActualizado,
  );
}

export async function cambiarDisponibilidadProducto(
  id: number,
  disponible: boolean,
): Promise<ProductoMenu> {
  await esperar(400);

  const productos =
    obtenerProductosPersistidos();

  const indiceProducto =
    productos.findIndex(
      (producto) =>
        producto.id === id,
    );

  if (indiceProducto === -1) {
    throw new Error(
      "El producto seleccionado no existe.",
    );
  }

  const productoActual =
    productos[indiceProducto];

  if (
    productoActual.estado ===
    "Inactivo"
  ) {
    throw new Error(
      "No se puede cambiar la disponibilidad de un producto inactivo.",
    );
  }

  const productoActualizado:
    ProductoMenu = {
    ...productoActual,
    disponible,
    fechaActualizacion:
      new Date().toISOString(),
  };

  productos[indiceProducto] =
    productoActualizado;

  guardarProductos(productos);

  return clonarProducto(
    productoActualizado,
  );
}

export async function cambiarProductoDestacado(
  id: number,
  destacado: boolean,
): Promise<ProductoMenu> {
  await esperar(400);

  const productos =
    obtenerProductosPersistidos();

  const indiceProducto =
    productos.findIndex(
      (producto) =>
        producto.id === id,
    );

  if (indiceProducto === -1) {
    throw new Error(
      "El producto seleccionado no existe.",
    );
  }

  const productoActual =
    productos[indiceProducto];

  if (
    productoActual.estado ===
    "Inactivo"
  ) {
    throw new Error(
      "No se puede destacar un producto inactivo.",
    );
  }

  const productoActualizado:
    ProductoMenu = {
    ...productoActual,
    destacado,
    fechaActualizacion:
      new Date().toISOString(),
  };

  productos[indiceProducto] =
    productoActualizado;

  guardarProductos(productos);

  return clonarProducto(
    productoActualizado,
  );
}