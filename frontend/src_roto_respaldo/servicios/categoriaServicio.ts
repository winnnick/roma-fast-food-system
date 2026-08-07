import type {
  ActualizarCategoriaDto,
  CategoriaProducto,
  CrearCategoriaDto,
  EstadoCatalogo,
} from "../tipos/producto";

interface ProductoPersistidoMinimo {
  categoriaId: number;
  estado: EstadoCatalogo;
}

const CLAVE_CATEGORIAS =
  "roma-categorias";

const CLAVE_PRODUCTOS =
  "roma-productos";

const categoriasIniciales:
  CategoriaProducto[] = [
  {
    id: 1,
    nombre: "Hamburguesas",
    descripcion:
      "Hamburguesas tradicionales, especiales y dobles.",
    estado: "Activo",
    fechaRegistro:
      "2026-07-01T12:00:00.000Z",
    fechaActualizacion:
      "2026-07-01T12:00:00.000Z",
  },
  {
    id: 2,
    nombre: "Pizzas",
    descripcion:
      "Pizzas personales, medianas y familiares.",
    estado: "Activo",
    fechaRegistro:
      "2026-07-01T12:05:00.000Z",
    fechaActualizacion:
      "2026-07-01T12:05:00.000Z",
  },
  {
    id: 3,
    nombre: "Combos",
    descripcion:
      "Combinaciones de productos con bebidas y acompañamientos.",
    estado: "Activo",
    fechaRegistro:
      "2026-07-01T12:10:00.000Z",
    fechaActualizacion:
      "2026-07-01T12:10:00.000Z",
  },
  {
    id: 4,
    nombre: "Bebidas",
    descripcion:
      "Bebidas gaseosas, jugos y agua.",
    estado: "Activo",
    fechaRegistro:
      "2026-07-01T12:15:00.000Z",
    fechaActualizacion:
      "2026-07-01T12:15:00.000Z",
  },
  {
    id: 5,
    nombre: "Acompañamientos",
    descripcion:
      "Papas fritas, aros de cebolla y porciones adicionales.",
    estado: "Activo",
    fechaRegistro:
      "2026-07-01T12:20:00.000Z",
    fechaActualizacion:
      "2026-07-01T12:20:00.000Z",
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

function clonarCategoria(
  categoria: CategoriaProducto,
): CategoriaProducto {
  return {
    ...categoria,
  };
}

function guardarCategorias(
  categorias: CategoriaProducto[],
): void {
  localStorage.setItem(
    CLAVE_CATEGORIAS,
    JSON.stringify(categorias),
  );
}

function obtenerCategoriasPersistidas():
  CategoriaProducto[] {
  const datosGuardados =
    localStorage.getItem(
      CLAVE_CATEGORIAS,
    );

  if (!datosGuardados) {
    guardarCategorias(
      categoriasIniciales,
    );

    return categoriasIniciales.map(
      clonarCategoria,
    );
  }

  try {
    const categorias = JSON.parse(
      datosGuardados,
    ) as CategoriaProducto[];

    if (!Array.isArray(categorias)) {
      throw new Error(
        "La información de categorías no es válida.",
      );
    }

    return categorias.map(
      clonarCategoria,
    );
  } catch {
    guardarCategorias(
      categoriasIniciales,
    );

    return categoriasIniciales.map(
      clonarCategoria,
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

function validarNombreDuplicado(
  categorias: CategoriaProducto[],
  nombre: string,
  idIgnorado?: number,
): void {
  const nombreNormalizado =
    normalizarTexto(nombre);

  const existe = categorias.some(
    (categoria) =>
      categoria.id !== idIgnorado &&
      normalizarTexto(
        categoria.nombre,
      ) === nombreNormalizado,
  );

  if (existe) {
    throw new Error(
      "Ya existe una categoría con ese nombre.",
    );
  }
}

function contarProductosActivosAsociados(
  categoriaId: number,
): number {
  const datosGuardados =
    localStorage.getItem(
      CLAVE_PRODUCTOS,
    );

  if (!datosGuardados) {
    return 0;
  }

  try {
    const productos = JSON.parse(
      datosGuardados,
    ) as ProductoPersistidoMinimo[];

    if (!Array.isArray(productos)) {
      return 0;
    }

    return productos.filter(
      (producto) =>
        producto.categoriaId ===
          categoriaId &&
        producto.estado === "Activo",
    ).length;
  } catch {
    return 0;
  }
}

export async function listarCategorias():
  Promise<CategoriaProducto[]> {
  await esperar(350);

  return obtenerCategoriasPersistidas()
    .sort((categoriaA, categoriaB) =>
      categoriaA.nombre.localeCompare(
        categoriaB.nombre,
        "es",
      ),
    )
    .map(clonarCategoria);
}

export async function obtenerCategoriaPorId(
  id: number,
): Promise<CategoriaProducto | null> {
  await esperar(100);

  const categoria =
    obtenerCategoriasPersistidas().find(
      (item) => item.id === id,
    );

  return categoria
    ? clonarCategoria(categoria)
    : null;
}

export async function crearCategoria(
  datos: CrearCategoriaDto,
): Promise<CategoriaProducto> {
  await esperar(600);

  const categorias =
    obtenerCategoriasPersistidas();

  const nombre =
    datos.nombre.trim();

  const descripcion =
    datos.descripcion.trim();

  if (nombre.length < 3) {
    throw new Error(
      "El nombre de la categoría debe contener al menos 3 caracteres.",
    );
  }

  if (descripcion.length < 5) {
    throw new Error(
      "Ingrese una descripción válida para la categoría.",
    );
  }

  validarNombreDuplicado(
    categorias,
    nombre,
  );

  const nuevoId =
    categorias.length === 0
      ? 1
      : Math.max(
          ...categorias.map(
            (categoria) =>
              categoria.id,
          ),
        ) + 1;

  const fechaActual =
    new Date().toISOString();

  const nuevaCategoria:
    CategoriaProducto = {
    id: nuevoId,
    nombre,
    descripcion,
    estado: "Activo",
    fechaRegistro: fechaActual,
    fechaActualizacion:
      fechaActual,
  };

  guardarCategorias([
    ...categorias,
    nuevaCategoria,
  ]);

  return clonarCategoria(
    nuevaCategoria,
  );
}

export async function actualizarCategoria(
  id: number,
  datos: ActualizarCategoriaDto,
): Promise<CategoriaProducto> {
  await esperar(600);

  const categorias =
    obtenerCategoriasPersistidas();

  const indiceCategoria =
    categorias.findIndex(
      (categoria) =>
        categoria.id === id,
    );

  if (indiceCategoria === -1) {
    throw new Error(
      "La categoría seleccionada no existe.",
    );
  }

  const nombre =
    datos.nombre.trim();

  const descripcion =
    datos.descripcion.trim();

  if (nombre.length < 3) {
    throw new Error(
      "El nombre de la categoría debe contener al menos 3 caracteres.",
    );
  }

  if (descripcion.length < 5) {
    throw new Error(
      "Ingrese una descripción válida para la categoría.",
    );
  }

  validarNombreDuplicado(
    categorias,
    nombre,
    id,
  );

  const categoriaActualizada:
    CategoriaProducto = {
    ...categorias[indiceCategoria],
    nombre,
    descripcion,
    fechaActualizacion:
      new Date().toISOString(),
  };

  categorias[indiceCategoria] =
    categoriaActualizada;

  guardarCategorias(categorias);

  return clonarCategoria(
    categoriaActualizada,
  );
}

export async function cambiarEstadoCategoria(
  id: number,
  nuevoEstado: EstadoCatalogo,
): Promise<CategoriaProducto> {
  await esperar(550);

  const categorias =
    obtenerCategoriasPersistidas();

  const indiceCategoria =
    categorias.findIndex(
      (categoria) =>
        categoria.id === id,
    );

  if (indiceCategoria === -1) {
    throw new Error(
      "La categoría seleccionada no existe.",
    );
  }

  const categoriaActual =
    categorias[indiceCategoria];

  if (
    nuevoEstado === "Inactivo"
  ) {
    const productosActivos =
      contarProductosActivosAsociados(
        categoriaActual.id,
      );

    if (productosActivos > 0) {
      throw new Error(
        `No se puede desactivar la categoría porque tiene ${productosActivos} producto(s) activo(s) asociado(s).`,
      );
    }
  }

  const categoriaActualizada:
    CategoriaProducto = {
    ...categoriaActual,
    estado: nuevoEstado,
    fechaActualizacion:
      new Date().toISOString(),
  };

  categorias[indiceCategoria] =
    categoriaActualizada;

  guardarCategorias(categorias);

  return clonarCategoria(
    categoriaActualizada,
  );
}