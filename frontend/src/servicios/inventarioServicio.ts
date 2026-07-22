import type {
  ActualizarInsumoDto,
  ConsumoVentaInventario,
  ConteoFisicoInventario,
  CrearInsumoDto,
  DetalleConsumoVentaInventario,
  EstadoInsumo,
  EvaluacionInventarioVenta,
  FiltroMovimientosInventario,
  GuardarRecetaProductoDto,
  IngredienteReceta,
  InsumoInventario,
  MovimientoInventario,
  NivelStockInventario,
  ProyeccionInsumoVenta,
  RecetaProducto,
  RegistrarAjusteManualInventarioDto,
  RegistrarConsumoVentaDto,
  RegistrarConteoFisicoDto,
  RegistrarEntradaInventarioDto,
  RegistrarTratamientoAnulacionDto,
  ResumenInventario,
} from "../tipos/inventario";

import type {
  UsuarioSesion,
} from "../tipos/auth";

import {
  listarProductos,
} from "./productoServicio";

import {
  insumosInventarioIniciales,
  recetasInventarioIniciales,
} from "./inventarioDatosIniciales";

const CLAVE_INSUMOS =
  "roma-inventario-insumos-v1";

const CLAVE_RECETAS =
  "roma-inventario-recetas-v1";

const CLAVE_MOVIMIENTOS =
  "roma-inventario-movimientos-v1";

const CLAVE_CONSUMOS =
  "roma-inventario-consumos-ventas-v1";

const CLAVE_CONTEOS =
  "roma-inventario-conteos-v1";

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

function redondearCantidad(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) *
      1000,
  ) / 1000;
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) *
      100,
  ) / 100;
}

function redondearCostoUnitario(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) *
      1000000,
  ) / 1000000;
}

function normalizarTexto(
  valor: string,
): string {
  return valor
    .trim()
    .toLocaleLowerCase("es");
}

function normalizarCodigo(
  valor: string,
): string {
  return valor
    .trim()
    .toUpperCase();
}

function obtenerSiguienteId(
  elementos: Array<{
    id: number;
  }>,
): number {
  if (elementos.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...elementos.map(
        (elemento) =>
          elemento.id,
      ),
    ) + 1
  );
}

function clonarInsumo(
  insumo: InsumoInventario,
): InsumoInventario {
  return {
    ...insumo,
  };
}

function clonarReceta(
  receta: RecetaProducto,
): RecetaProducto {
  return {
    ...receta,

    ingredientes:
      receta.ingredientes.map(
        (ingrediente) => ({
          ...ingrediente,
        }),
      ),
  };
}

function clonarMovimiento(
  movimiento:
    MovimientoInventario,
): MovimientoInventario {
  return {
    ...movimiento,

    recetaVersionIds: [
      ...movimiento
        .recetaVersionIds,
    ],
  };
}

function clonarConsumo(
  consumo: ConsumoVentaInventario,
): ConsumoVentaInventario {
  return {
    ...consumo,

    detalles:
      consumo.detalles.map(
        (detalle) => ({
          ...detalle,

          recetaVersionIds: [
            ...detalle
              .recetaVersionIds,
          ],

          productosRelacionados: [
            ...detalle
              .productosRelacionados,
          ],
        }),
      ),
  };
}

function clonarConteo(
  conteo: ConteoFisicoInventario,
): ConteoFisicoInventario {
  return {
    ...conteo,

    detalles:
      conteo.detalles.map(
        (detalle) => ({
          ...detalle,
        }),
      ),
  };
}

function guardarInsumos(
  insumos: InsumoInventario[],
): void {
  localStorage.setItem(
    CLAVE_INSUMOS,
    JSON.stringify(insumos),
  );
}

function guardarRecetas(
  recetas: RecetaProducto[],
): void {
  localStorage.setItem(
    CLAVE_RECETAS,
    JSON.stringify(recetas),
  );
}

function guardarMovimientos(
  movimientos:
    MovimientoInventario[],
): void {
  localStorage.setItem(
    CLAVE_MOVIMIENTOS,
    JSON.stringify(movimientos),
  );
}

function guardarConsumos(
  consumos:
    ConsumoVentaInventario[],
): void {
  localStorage.setItem(
    CLAVE_CONSUMOS,
    JSON.stringify(consumos),
  );
}

function guardarConteos(
  conteos:
    ConteoFisicoInventario[],
): void {
  localStorage.setItem(
    CLAVE_CONTEOS,
    JSON.stringify(conteos),
  );
}

function crearMovimientosIniciales(
  insumos: InsumoInventario[],
): MovimientoInventario[] {
  return insumos
    .filter(
      (insumo) =>
        insumo.stockActual !== 0,
    )
    .map(
      (insumo, indice) => ({
        id: indice + 1,

        insumoId: insumo.id,
        insumoCodigo:
          insumo.codigo,
        insumoNombre:
          insumo.nombre,
        unidadBase:
          insumo.unidadBase,

        tipo: "Stock inicial",
        origen:
          "Configuración inicial",

        cantidad:
          insumo.stockActual,

        cantidadClasificada:
          null,

        stockAnterior: 0,
        stockPosterior:
          insumo.stockActual,

        motivo:
          "Existencia inicial configurada para demostración del sistema.",

        referencia: null,

        ventaId: null,
        numeroPedido: null,

        recetaVersionIds: [],

        costoUnitarioAplicado:
          insumo.controlEconomico
            ? insumo
                .costoPromedioUnidadBase
            : null,

        impactoEconomico:
          insumo.controlEconomico &&
          insumo
            .costoPromedioUnidadBase !==
            null
            ? redondearMoneda(
                insumo.stockActual *
                  insumo
                    .costoPromedioUnidadBase,
              )
            : null,

        fechaHora:
          insumo.fechaRegistro,

        usuarioId:
          insumo
            .usuarioActualizacionId,

        usuarioNombre:
          insumo
            .usuarioActualizacionNombre,
      }),
    );
}

function obtenerInsumosPersistidos():
  InsumoInventario[] {
  const datos =
    localStorage.getItem(
      CLAVE_INSUMOS,
    );

  if (!datos) {
    const iniciales =
      insumosInventarioIniciales.map(
        clonarInsumo,
      );

    guardarInsumos(iniciales);

    return iniciales;
  }

  try {
    const insumos = JSON.parse(
      datos,
    ) as InsumoInventario[];

    if (!Array.isArray(insumos)) {
      throw new Error(
        "Los insumos no son válidos.",
      );
    }

    return insumos.map(
      (insumo) => ({
        ...insumo,

        stockActual:
          redondearCantidad(
            Number(
              insumo.stockActual ??
                0,
            ),
          ),

        controlarStockBajo:
          insumo
            .controlarStockBajo ??
          false,

        stockMinimo:
          redondearCantidad(
            Number(
              insumo.stockMinimo ??
                0,
            ),
          ),

        politicaFaltante:
          insumo
            .politicaFaltante ??
          "Permitir con advertencia",

        controlEconomico:
          insumo
            .controlEconomico ??
          false,

        costoPromedioUnidadBase:
          insumo
            .controlEconomico
            ? (
                insumo
                  .costoPromedioUnidadBase ??
                null
              )
            : null,
      }),
    );
  } catch {
    const iniciales =
      insumosInventarioIniciales.map(
        clonarInsumo,
      );

    guardarInsumos(iniciales);

    return iniciales;
  }
}

function obtenerRecetasPersistidas():
  RecetaProducto[] {
  const datos =
    localStorage.getItem(
      CLAVE_RECETAS,
    );

  if (!datos) {
    const iniciales =
      recetasInventarioIniciales.map(
        clonarReceta,
      );

    guardarRecetas(iniciales);

    return iniciales;
  }

  try {
    const recetas = JSON.parse(
      datos,
    ) as RecetaProducto[];

    if (!Array.isArray(recetas)) {
      throw new Error(
        "Las recetas no son válidas.",
      );
    }

    return recetas.map(clonarReceta);
  } catch {
    const iniciales =
      recetasInventarioIniciales.map(
        clonarReceta,
      );

    guardarRecetas(iniciales);

    return iniciales;
  }
}

function obtenerMovimientosPersistidos():
  MovimientoInventario[] {
  const datos =
    localStorage.getItem(
      CLAVE_MOVIMIENTOS,
    );

  if (!datos) {
    const movimientos =
      crearMovimientosIniciales(
        obtenerInsumosPersistidos(),
      );

    guardarMovimientos(
      movimientos,
    );

    return movimientos;
  }

  try {
    const movimientos =
      JSON.parse(
        datos,
      ) as MovimientoInventario[];

    if (
      !Array.isArray(
        movimientos,
      )
    ) {
      throw new Error(
        "Los movimientos no son válidos.",
      );
    }

    return movimientos.map(
      (movimiento) => ({
        ...movimiento,

        cantidadClasificada:
          movimiento
            .cantidadClasificada ??
          null,

        recetaVersionIds:
          Array.isArray(
            movimiento
              .recetaVersionIds,
          )
            ? [
                ...movimiento
                  .recetaVersionIds,
              ]
            : [],
      }),
    );
  } catch {
    const movimientos =
      crearMovimientosIniciales(
        obtenerInsumosPersistidos(),
      );

    guardarMovimientos(
      movimientos,
    );

    return movimientos;
  }
}

function obtenerConsumosPersistidos():
  ConsumoVentaInventario[] {
  const datos =
    localStorage.getItem(
      CLAVE_CONSUMOS,
    );

  if (!datos) {
    guardarConsumos([]);
    return [];
  }

  try {
    const consumos = JSON.parse(
      datos,
    ) as ConsumoVentaInventario[];

    if (!Array.isArray(consumos)) {
      throw new Error(
        "Los consumos no son válidos.",
      );
    }

    return consumos.map(
      clonarConsumo,
    );
  } catch {
    guardarConsumos([]);
    return [];
  }
}

function obtenerConteosPersistidos():
  ConteoFisicoInventario[] {
  const datos =
    localStorage.getItem(
      CLAVE_CONTEOS,
    );

  if (!datos) {
    guardarConteos([]);
    return [];
  }

  try {
    const conteos = JSON.parse(
      datos,
    ) as ConteoFisicoInventario[];

    if (!Array.isArray(conteos)) {
      throw new Error(
        "Los conteos no son válidos.",
      );
    }

    return conteos.map(
      clonarConteo,
    );
  } catch {
    guardarConteos([]);
    return [];
  }
}

function garantizarDatosIniciales(): void {
  if (
    !localStorage.getItem(
      CLAVE_INSUMOS,
    )
  ) {
    guardarInsumos(
      insumosInventarioIniciales.map(
        clonarInsumo,
      ),
    );
  }

  if (
    !localStorage.getItem(
      CLAVE_RECETAS,
    )
  ) {
    guardarRecetas(
      recetasInventarioIniciales.map(
        clonarReceta,
      ),
    );
  }

  if (
    !localStorage.getItem(
      CLAVE_MOVIMIENTOS,
    )
  ) {
    guardarMovimientos(
      crearMovimientosIniciales(
        obtenerInsumosPersistidos(),
      ),
    );
  }

  if (
    !localStorage.getItem(
      CLAVE_CONSUMOS,
    )
  ) {
    guardarConsumos([]);
  }

  if (
    !localStorage.getItem(
      CLAVE_CONTEOS,
    )
  ) {
    guardarConteos([]);
  }
}

function validarCodigo(
  codigo: string,
): void {
  if (
    codigo.length < 3 ||
    codigo.length > 25
  ) {
    throw new Error(
      "El código del insumo debe contener entre 3 y 25 caracteres.",
    );
  }

  if (
    !/^[A-Z0-9-]+$/.test(codigo)
  ) {
    throw new Error(
      "El código del insumo solo puede contener letras, números y guiones.",
    );
  }
}

function validarDatosComunesInsumo(
  datos: {
    nombre: string;
    categoria: string;
    presentacionCompra: string;
    factorConversionCompra: number;
    controlarStockBajo: boolean;
    stockMinimo: number;
    controlEconomico: boolean;
    costoPorPresentacion:
      number | null;
  },
): void {
  if (
    datos.nombre.length < 3 ||
    datos.nombre.length > 100
  ) {
    throw new Error(
      "El nombre del insumo debe contener entre 3 y 100 caracteres.",
    );
  }

  if (
    datos.categoria.length < 3 ||
    datos.categoria.length > 60
  ) {
    throw new Error(
      "La categoría del insumo debe contener entre 3 y 60 caracteres.",
    );
  }

  if (
    datos.presentacionCompra
      .length < 1 ||
    datos.presentacionCompra
      .length > 40
  ) {
    throw new Error(
      "Indica una presentación de compra válida.",
    );
  }

  if (
    !Number.isFinite(
      datos.factorConversionCompra,
    ) ||
    datos.factorConversionCompra <=
      0
  ) {
    throw new Error(
      "El factor de conversión debe ser mayor que cero.",
    );
  }

  if (
    datos.controlarStockBajo &&
    (
      !Number.isFinite(
        datos.stockMinimo,
      ) ||
      datos.stockMinimo < 0
    )
  ) {
    throw new Error(
      "El nivel mínimo de stock no es válido.",
    );
  }

  if (
    datos.controlEconomico &&
    (
      datos.costoPorPresentacion ===
        null ||
      !Number.isFinite(
        datos.costoPorPresentacion,
      ) ||
      datos.costoPorPresentacion <=
        0
    )
  ) {
    throw new Error(
      "Para activar la valoración económica debes ingresar un costo válido por presentación.",
    );
  }
}

function validarDuplicadosInsumo(
  insumos: InsumoInventario[],
  codigo: string,
  nombre: string,
  idIgnorado?: number,
): void {
  const codigoNormalizado =
    normalizarCodigo(codigo);

  const nombreNormalizado =
    normalizarTexto(nombre);

  const codigoExiste =
    insumos.some(
      (insumo) =>
        insumo.id !== idIgnorado &&
        normalizarCodigo(
          insumo.codigo,
        ) === codigoNormalizado,
    );

  if (codigoExiste) {
    throw new Error(
      "Ya existe un insumo con ese código.",
    );
  }

  const nombreExiste =
    insumos.some(
      (insumo) =>
        insumo.id !== idIgnorado &&
        normalizarTexto(
          insumo.nombre,
        ) === nombreNormalizado,
    );

  if (nombreExiste) {
    throw new Error(
      "Ya existe un insumo con ese nombre.",
    );
  }
}

function crearMovimiento(
  datos: Omit<
    MovimientoInventario,
    "id"
  >,
  movimientos:
    MovimientoInventario[],
): MovimientoInventario {
  return {
    id:
      obtenerSiguienteId(
        movimientos,
      ),

    ...datos,
  };
}

export function calcularNivelStockInsumo(
  insumo: InsumoInventario,
): NivelStockInventario {
  if (insumo.stockActual < 0) {
    return "Negativo";
  }

  if (
    insumo.controlarStockBajo &&
    insumo.stockActual <=
      insumo.stockMinimo
  ) {
    return "Bajo";
  }

  return "Normal";
}

export function formatearCantidadInventario(
  cantidad: number,
  unidad:
    InsumoInventario["unidadBase"],
): string {
  const decimales =
    unidad === "unidad"
      ? 0
      : 3;

  const valor =
    new Intl.NumberFormat(
      "es-BO",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits:
          decimales,
      },
    ).format(cantidad);

  return `${valor} ${unidad}`;
}

export async function listarInsumosInventario():
  Promise<InsumoInventario[]> {
  garantizarDatosIniciales();
  await esperar(350);

  return obtenerInsumosPersistidos()
    .sort((insumoA, insumoB) =>
      insumoA.nombre.localeCompare(
        insumoB.nombre,
        "es",
      ),
    )
    .map(clonarInsumo);
}

export async function obtenerInsumoInventarioPorId(
  id: number,
): Promise<InsumoInventario | null> {
  garantizarDatosIniciales();
  await esperar(150);

  const insumo =
    obtenerInsumosPersistidos()
      .find(
        (item) =>
          item.id === id,
      );

  return insumo
    ? clonarInsumo(insumo)
    : null;
}

export async function crearInsumoInventario(
  datos: CrearInsumoDto,
  usuario: UsuarioSesion,
): Promise<InsumoInventario> {
  garantizarDatosIniciales();
  await esperar(600);

  const insumos =
    obtenerInsumosPersistidos();

  const movimientos =
    obtenerMovimientosPersistidos();

  const codigo =
    normalizarCodigo(
      datos.codigo,
    );

  const nombre =
    datos.nombre.trim();

  const categoria =
    datos.categoria.trim();

  const presentacionCompra =
    datos.presentacionCompra
      .trim();

  validarCodigo(codigo);

  validarDatosComunesInsumo({
    nombre,
    categoria,
    presentacionCompra,
    factorConversionCompra:
      datos.factorConversionCompra,
    controlarStockBajo:
      datos.controlarStockBajo,
    stockMinimo:
      datos.stockMinimo,
    controlEconomico:
      datos.controlEconomico,
    costoPorPresentacion:
      datos
        .costoPorPresentacionInicial,
  });

  validarDuplicadosInsumo(
    insumos,
    codigo,
    nombre,
  );

  if (
    !Number.isFinite(
      datos.stockInicialCompra,
    ) ||
    datos.stockInicialCompra < 0
  ) {
    throw new Error(
      "El stock inicial no puede ser negativo.",
    );
  }

  const fechaActual =
    new Date().toISOString();

  const stockInicial =
    redondearCantidad(
      datos.stockInicialCompra *
        datos.factorConversionCompra,
    );

  const costoUnitario =
    datos.controlEconomico &&
    datos
      .costoPorPresentacionInicial !==
      null
      ? redondearCostoUnitario(
          datos
            .costoPorPresentacionInicial /
            datos
              .factorConversionCompra,
        )
      : null;

  const nuevoInsumo:
    InsumoInventario = {
    id:
      obtenerSiguienteId(
        insumos,
      ),

    codigo,
    nombre,
    categoria,

    unidadBase:
      datos.unidadBase,

    presentacionCompra,

    factorConversionCompra:
      redondearCantidad(
        datos.factorConversionCompra,
      ),

    stockActual:
      stockInicial,

    controlarStockBajo:
      datos.controlarStockBajo,

    stockMinimo:
      datos.controlarStockBajo
        ? redondearCantidad(
            datos.stockMinimo,
          )
        : 0,

    politicaFaltante:
      datos.politicaFaltante,

    controlEconomico:
      datos.controlEconomico,

    costoPromedioUnidadBase:
      costoUnitario,

    estado: "Activo",

    fechaRegistro:
      fechaActual,

    fechaActualizacion:
      fechaActual,

    usuarioActualizacionId:
      usuario.id,

    usuarioActualizacionNombre:
      usuario.nombreCompleto,
  };

  insumos.push(nuevoInsumo);

  if (stockInicial !== 0) {
    movimientos.push(
      crearMovimiento(
        {
          insumoId:
            nuevoInsumo.id,

          insumoCodigo:
            nuevoInsumo.codigo,

          insumoNombre:
            nuevoInsumo.nombre,

          unidadBase:
            nuevoInsumo
              .unidadBase,

          tipo:
            "Stock inicial",

          origen:
            "Configuración inicial",

          cantidad:
            stockInicial,

          cantidadClasificada:
            null,

          stockAnterior: 0,

          stockPosterior:
            stockInicial,

          motivo:
            "Stock inicial registrado al crear el insumo.",

          referencia: null,

          ventaId: null,
          numeroPedido: null,

          recetaVersionIds: [],

          costoUnitarioAplicado:
            costoUnitario,

          impactoEconomico:
            costoUnitario !== null
              ? redondearMoneda(
                  stockInicial *
                    costoUnitario,
                )
              : null,

          fechaHora:
            fechaActual,

          usuarioId:
            usuario.id,

          usuarioNombre:
            usuario
              .nombreCompleto,
        },
        movimientos,
      ),
    );
  }

  guardarInsumos(insumos);
  guardarMovimientos(movimientos);

  return clonarInsumo(
    nuevoInsumo,
  );
}

export async function actualizarInsumoInventario(
  id: number,
  datos: ActualizarInsumoDto,
  usuario: UsuarioSesion,
): Promise<InsumoInventario> {
  garantizarDatosIniciales();
  await esperar(600);

  const insumos =
    obtenerInsumosPersistidos();

  const indice =
    insumos.findIndex(
      (insumo) =>
        insumo.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "El insumo seleccionado no existe.",
    );
  }

  const actual =
    insumos[indice];

  const codigo =
    normalizarCodigo(
      datos.codigo,
    );

  const nombre =
    datos.nombre.trim();

  const categoria =
    datos.categoria.trim();

  const presentacionCompra =
    datos.presentacionCompra
      .trim();

  validarCodigo(codigo);

  const costoInformado =
    datos.controlEconomico
      ? (
          datos
            .costoPorPresentacionActual ??
          (
            actual.controlEconomico &&
            actual
              .costoPromedioUnidadBase !==
              null
              ? actual
                  .costoPromedioUnidadBase *
                datos
                  .factorConversionCompra
              : null
          )
        )
      : null;

  validarDatosComunesInsumo({
    nombre,
    categoria,
    presentacionCompra,
    factorConversionCompra:
      datos.factorConversionCompra,
    controlarStockBajo:
      datos.controlarStockBajo,
    stockMinimo:
      datos.stockMinimo,
    controlEconomico:
      datos.controlEconomico,
    costoPorPresentacion:
      costoInformado,
  });

  validarDuplicadosInsumo(
    insumos,
    codigo,
    nombre,
    id,
  );

  const costoUnitario =
    datos.controlEconomico &&
    costoInformado !== null
      ? redondearCostoUnitario(
          costoInformado /
            datos
              .factorConversionCompra,
        )
      : null;

  const actualizado:
    InsumoInventario = {
    ...actual,

    codigo,
    nombre,
    categoria,

    unidadBase:
      datos.unidadBase,

    presentacionCompra,

    factorConversionCompra:
      redondearCantidad(
        datos.factorConversionCompra,
      ),

    controlarStockBajo:
      datos.controlarStockBajo,

    stockMinimo:
      datos.controlarStockBajo
        ? redondearCantidad(
            datos.stockMinimo,
          )
        : 0,

    politicaFaltante:
      datos.politicaFaltante,

    controlEconomico:
      datos.controlEconomico,

    costoPromedioUnidadBase:
      costoUnitario,

    fechaActualizacion:
      new Date().toISOString(),

    usuarioActualizacionId:
      usuario.id,

    usuarioActualizacionNombre:
      usuario.nombreCompleto,
  };

  insumos[indice] = actualizado;

  guardarInsumos(insumos);

  return clonarInsumo(
    actualizado,
  );
}

export async function cambiarEstadoInsumoInventario(
  id: number,
  estado: EstadoInsumo,
  usuario: UsuarioSesion,
): Promise<InsumoInventario> {
  garantizarDatosIniciales();
  await esperar(450);

  const insumos =
    obtenerInsumosPersistidos();

  const indice =
    insumos.findIndex(
      (insumo) =>
        insumo.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "El insumo seleccionado no existe.",
    );
  }

  const actualizado:
    InsumoInventario = {
    ...insumos[indice],

    estado,

    fechaActualizacion:
      new Date().toISOString(),

    usuarioActualizacionId:
      usuario.id,

    usuarioActualizacionNombre:
      usuario.nombreCompleto,
  };

  insumos[indice] = actualizado;

  guardarInsumos(insumos);

  return clonarInsumo(
    actualizado,
  );
}

export async function registrarEntradaInventario(
  datos:
    RegistrarEntradaInventarioDto,
  usuario: UsuarioSesion,
): Promise<MovimientoInventario> {
  garantizarDatosIniciales();
  await esperar(550);

  const insumos =
    obtenerInsumosPersistidos();

  const movimientos =
    obtenerMovimientosPersistidos();

  const indice =
    insumos.findIndex(
      (insumo) =>
        insumo.id ===
        datos.insumoId,
    );

  if (indice === -1) {
    throw new Error(
      "El insumo seleccionado no existe.",
    );
  }

  const insumo =
    insumos[indice];

  if (
    insumo.estado !== "Activo"
  ) {
    throw new Error(
      "No se pueden registrar entradas para un insumo inactivo.",
    );
  }

  if (
    !Number.isFinite(
      datos.cantidadPresentaciones,
    ) ||
    datos.cantidadPresentaciones <=
      0
  ) {
    throw new Error(
      "La cantidad de entrada debe ser mayor que cero.",
    );
  }

  const motivo =
    datos.motivo.trim();

  if (
    motivo.length < 5 ||
    motivo.length > 200
  ) {
    throw new Error(
      "El motivo debe contener entre 5 y 200 caracteres.",
    );
  }

  if (
    insumo.controlEconomico &&
    (
      datos.costoTotal === null ||
      !Number.isFinite(
        datos.costoTotal,
      ) ||
      datos.costoTotal <= 0
    )
  ) {
    throw new Error(
      "Ingresa el costo total de la entrada para mantener la valoración económica.",
    );
  }

  const cantidadBase =
    redondearCantidad(
      datos.cantidadPresentaciones *
        insumo
          .factorConversionCompra,
    );

  const stockAnterior =
    insumo.stockActual;

  const stockPosterior =
    redondearCantidad(
      stockAnterior +
        cantidadBase,
    );

  let nuevoCostoUnitario =
    insumo
      .costoPromedioUnidadBase;

  if (
    insumo.controlEconomico &&
    datos.costoTotal !== null
  ) {
    const costoEntradaUnitario =
      redondearCostoUnitario(
        datos.costoTotal /
          cantidadBase,
      );

    if (
      stockAnterior <= 0 ||
      insumo
        .costoPromedioUnidadBase ===
        null
    ) {
      nuevoCostoUnitario =
        costoEntradaUnitario;
    } else {
      const valorAnterior =
        stockAnterior *
        insumo
          .costoPromedioUnidadBase;

      nuevoCostoUnitario =
        redondearCostoUnitario(
          (
            valorAnterior +
            datos.costoTotal
          ) /
          (
            stockAnterior +
            cantidadBase
          ),
        );
    }
  }

  const fechaActual =
    new Date().toISOString();

  const actualizado:
    InsumoInventario = {
    ...insumo,

    stockActual:
      stockPosterior,

    costoPromedioUnidadBase:
      insumo.controlEconomico
        ? nuevoCostoUnitario
        : null,

    fechaActualizacion:
      fechaActual,

    usuarioActualizacionId:
      usuario.id,

    usuarioActualizacionNombre:
      usuario.nombreCompleto,
  };

  insumos[indice] = actualizado;

  const movimiento =
    crearMovimiento(
      {
        insumoId: insumo.id,
        insumoCodigo:
          insumo.codigo,
        insumoNombre:
          insumo.nombre,
        unidadBase:
          insumo.unidadBase,

        tipo: "Entrada",
        origen: "Compra",

        cantidad:
          cantidadBase,

        cantidadClasificada:
          null,

        stockAnterior,
        stockPosterior,

        motivo,

        referencia:
          datos.referencia
            ?.trim() || null,

        ventaId: null,
        numeroPedido: null,

        recetaVersionIds: [],

        costoUnitarioAplicado:
          insumo.controlEconomico
            ? nuevoCostoUnitario
            : null,

        impactoEconomico:
          insumo.controlEconomico
            ? redondearMoneda(
                datos.costoTotal ??
                  0,
              )
            : null,

        fechaHora:
          fechaActual,

        usuarioId:
          usuario.id,

        usuarioNombre:
          usuario.nombreCompleto,
      },
      movimientos,
    );

  movimientos.push(movimiento);

  guardarInsumos(insumos);
  guardarMovimientos(movimientos);

  return clonarMovimiento(
    movimiento,
  );
}

export async function registrarAjusteManualInventario(
  datos:
    RegistrarAjusteManualInventarioDto,
  usuario: UsuarioSesion,
): Promise<MovimientoInventario> {
  garantizarDatosIniciales();
  await esperar(500);

  const insumos =
    obtenerInsumosPersistidos();

  const movimientos =
    obtenerMovimientosPersistidos();

  const indice =
    insumos.findIndex(
      (insumo) =>
        insumo.id ===
        datos.insumoId,
    );

  if (indice === -1) {
    throw new Error(
      "El insumo seleccionado no existe.",
    );
  }

  if (
    !Number.isFinite(
      datos.cantidadAjuste,
    ) ||
    datos.cantidadAjuste === 0
  ) {
    throw new Error(
      "El ajuste debe ser diferente de cero.",
    );
  }

  const motivo =
    datos.motivo.trim();

  if (
    motivo.length < 5 ||
    motivo.length > 200
  ) {
    throw new Error(
      "El motivo debe contener entre 5 y 200 caracteres.",
    );
  }

  const insumo =
    insumos[indice];

  const cantidad =
    redondearCantidad(
      datos.cantidadAjuste,
    );

  const stockAnterior =
    insumo.stockActual;

  const stockPosterior =
    redondearCantidad(
      stockAnterior + cantidad,
    );

  const fechaActual =
    new Date().toISOString();

  const actualizado:
    InsumoInventario = {
    ...insumo,

    stockActual:
      stockPosterior,

    fechaActualizacion:
      fechaActual,

    usuarioActualizacionId:
      usuario.id,

    usuarioActualizacionNombre:
      usuario.nombreCompleto,
  };

  insumos[indice] = actualizado;

  const movimiento =
    crearMovimiento(
      {
        insumoId: insumo.id,
        insumoCodigo:
          insumo.codigo,
        insumoNombre:
          insumo.nombre,
        unidadBase:
          insumo.unidadBase,

        tipo:
          cantidad > 0
            ? "Ajuste positivo"
            : "Ajuste negativo",

        origen:
          "Ajuste manual",

        cantidad,

        cantidadClasificada:
          null,

        stockAnterior,
        stockPosterior,

        motivo,

        referencia: null,

        ventaId: null,
        numeroPedido: null,

        recetaVersionIds: [],

        costoUnitarioAplicado:
          insumo.controlEconomico
            ? insumo
                .costoPromedioUnidadBase
            : null,

        impactoEconomico:
          insumo.controlEconomico &&
          insumo
            .costoPromedioUnidadBase !==
            null
            ? redondearMoneda(
                cantidad *
                  insumo
                    .costoPromedioUnidadBase,
              )
            : null,

        fechaHora:
          fechaActual,

        usuarioId:
          usuario.id,

        usuarioNombre:
          usuario.nombreCompleto,
      },
      movimientos,
    );

  movimientos.push(movimiento);

  guardarInsumos(insumos);
  guardarMovimientos(movimientos);

  return clonarMovimiento(
    movimiento,
  );
}

export async function listarRecetasInventario():
  Promise<RecetaProducto[]> {
  garantizarDatosIniciales();
  await esperar(300);

  return obtenerRecetasPersistidas()
    .sort(
      (recetaA, recetaB) =>
        recetaA.productoNombre
          .localeCompare(
            recetaB.productoNombre,
            "es",
          ) ||
        recetaB.version -
          recetaA.version,
    )
    .map(clonarReceta);
}

export async function obtenerRecetaVigenteProducto(
  productoId: number,
): Promise<RecetaProducto | null> {
  garantizarDatosIniciales();
  await esperar(120);

  const receta =
    obtenerRecetasPersistidas()
      .find(
        (item) =>
          item.productoId ===
            productoId &&
          item.estado ===
            "Vigente",
      );

  return receta
    ? clonarReceta(receta)
    : null;
}

export async function guardarNuevaVersionReceta(
  datos:
    GuardarRecetaProductoDto,
  usuario: UsuarioSesion,
): Promise<RecetaProducto> {
  garantizarDatosIniciales();
  await esperar(650);

  if (
    !Array.isArray(
      datos.ingredientes,
    ) ||
    datos.ingredientes.length === 0
  ) {
    throw new Error(
      "La receta debe contener al menos un insumo.",
    );
  }

  const idsInsumos =
    datos.ingredientes.map(
      (ingrediente) =>
        ingrediente.insumoId,
    );

  if (
    new Set(idsInsumos).size !==
    idsInsumos.length
  ) {
    throw new Error(
      "La receta contiene insumos repetidos.",
    );
  }

  const productos =
    await listarProductos();

  const producto =
    productos.find(
      (item) =>
        item.id ===
        datos.productoId,
    );

  if (!producto) {
    throw new Error(
      "El producto seleccionado no existe.",
    );
  }

  const insumos =
    obtenerInsumosPersistidos();

  const ingredientes:
    IngredienteReceta[] =
    datos.ingredientes.map(
      (detalle) => {
        const insumo =
          insumos.find(
            (item) =>
              item.id ===
              detalle.insumoId,
          );

        if (!insumo) {
          throw new Error(
            "Uno de los insumos seleccionados no existe.",
          );
        }

        if (
          insumo.estado !== "Activo"
        ) {
          throw new Error(
            `El insumo “${insumo.nombre}” está inactivo.`,
          );
        }

        if (
          !Number.isFinite(
            detalle.cantidadPorProducto,
          ) ||
          detalle
              .cantidadPorProducto <=
            0
        ) {
          throw new Error(
            `La cantidad de “${insumo.nombre}” debe ser mayor que cero.`,
          );
        }

        return {
          insumoId:
            insumo.id,

          insumoCodigo:
            insumo.codigo,

          insumoNombre:
            insumo.nombre,

          unidadBase:
            insumo.unidadBase,

          cantidadPorProducto:
            redondearCantidad(
              detalle
                .cantidadPorProducto,
            ),
        };
      },
    );

  const recetas =
    obtenerRecetasPersistidas();

  const recetasProducto =
    recetas.filter(
      (receta) =>
        receta.productoId ===
        producto.id,
    );

  const siguienteVersion =
    recetasProducto.length === 0
      ? 1
      : Math.max(
          ...recetasProducto.map(
            (receta) =>
              receta.version,
          ),
        ) + 1;

  const fechaActual =
    new Date().toISOString();

  const recetasActualizadas =
    recetas.map(
      (receta) =>
        receta.productoId ===
          producto.id &&
        receta.estado ===
          "Vigente"
          ? {
              ...receta,

              estado:
                "Histórica" as const,

              fechaVigenciaHasta:
                fechaActual,
            }
          : receta,
    );

  const nuevaReceta:
    RecetaProducto = {
    id:
      obtenerSiguienteId(
        recetasActualizadas,
      ),

    productoId:
      producto.id,

    productoCodigo:
      producto.codigo,

    productoNombre:
      producto.nombre,

    version:
      siguienteVersion,

    estado: "Vigente",

    ingredientes,

    fechaVigenciaDesde:
      fechaActual,

    fechaVigenciaHasta: null,

    usuarioRegistroId:
      usuario.id,

    usuarioRegistroNombre:
      usuario.nombreCompleto,
  };

  recetasActualizadas.push(
    nuevaReceta,
  );

  guardarRecetas(
    recetasActualizadas,
  );

  return clonarReceta(
    nuevaReceta,
  );
}

async function construirEvaluacionInventario(
  detalles:
    RegistrarConsumoVentaDto["detalles"],
): Promise<EvaluacionInventarioVenta> {
  if (
    !Array.isArray(detalles) ||
    detalles.length === 0
  ) {
    throw new Error(
      "No existen productos para evaluar.",
    );
  }

  const productos =
    await listarProductos();

  const recetas =
    obtenerRecetasPersistidas();

  const insumos =
    obtenerInsumosPersistidos();

  interface AcumuladoConsumo {
    insumoId: number;
    cantidadRequerida: number;
    recetaVersionIds: Set<number>;
    productosRelacionados:
      Set<string>;
  }

  const acumulados =
    new Map<
      number,
      AcumuladoConsumo
    >();

  const productosSinReceta:
    string[] = [];

  for (const detalle of detalles) {
    if (
      !Number.isInteger(
        detalle.cantidad,
      ) ||
      detalle.cantidad < 1
    ) {
      throw new Error(
        "La cantidad de producto para inventario no es válida.",
      );
    }

    const producto =
      productos.find(
        (item) =>
          item.id ===
          detalle.productoId,
      );

    if (!producto) {
      throw new Error(
        "Uno de los productos ya no existe.",
      );
    }

    const receta =
      recetas.find(
        (item) =>
          item.productoId ===
            producto.id &&
          item.estado ===
            "Vigente",
      );

    if (!receta) {
      productosSinReceta.push(
        producto.nombre,
      );

      continue;
    }

    for (
      const ingrediente
      of receta.ingredientes
    ) {
      const cantidadRequerida =
        redondearCantidad(
          ingrediente
            .cantidadPorProducto *
            detalle.cantidad,
        );

      const acumulado =
        acumulados.get(
          ingrediente.insumoId,
        );

      if (acumulado) {
        acumulado.cantidadRequerida =
          redondearCantidad(
            acumulado
              .cantidadRequerida +
              cantidadRequerida,
          );

        acumulado.recetaVersionIds.add(
          receta.id,
        );

        acumulado.productosRelacionados.add(
          producto.nombre,
        );
      } else {
        acumulados.set(
          ingrediente.insumoId,
          {
            insumoId:
              ingrediente.insumoId,

            cantidadRequerida,

            recetaVersionIds:
              new Set([receta.id]),

            productosRelacionados:
              new Set([
                producto.nombre,
              ]),
          },
        );
      }
    }
  }

  const proyecciones:
    ProyeccionInsumoVenta[] =
    [];

  for (
    const acumulado
    of acumulados.values()
  ) {
    const insumo =
      insumos.find(
        (item) =>
          item.id ===
          acumulado.insumoId,
      );

    if (!insumo) {
      throw new Error(
        "Una receta utiliza un insumo que ya no existe.",
      );
    }

    const saldoResultante =
      redondearCantidad(
        insumo.stockActual -
          acumulado
            .cantidadRequerida,
      );

    let nivel:
      ProyeccionInsumoVenta["nivel"] =
      "Normal";

    if (
      insumo.estado !== "Activo"
    ) {
      nivel =
        "Insumo inactivo";
    } else if (
      saldoResultante < 0
    ) {
      nivel =
        insumo.politicaFaltante ===
        "Bloquear"
          ? "Bloqueado"
          : "Negativo";
    } else if (
      insumo.controlarStockBajo &&
      saldoResultante <=
        insumo.stockMinimo
    ) {
      nivel = "Bajo";
    }

    proyecciones.push({
      insumoId: insumo.id,
      insumoCodigo:
        insumo.codigo,
      insumoNombre:
        insumo.nombre,
      unidadBase:
        insumo.unidadBase,

      cantidadDisponible:
        insumo.stockActual,

      cantidadRequerida:
        acumulado
          .cantidadRequerida,

      saldoResultante,

      nivel,

      stockMinimo:
        insumo
          .controlarStockBajo
          ? insumo.stockMinimo
          : null,

      politicaFaltante:
        insumo.politicaFaltante,

      recetaVersionIds: [
        ...acumulado
          .recetaVersionIds,
      ],

      productosRelacionados: [
        ...acumulado
          .productosRelacionados,
      ],
    });
  }

  proyecciones.sort(
    (itemA, itemB) =>
      itemA.insumoNombre.localeCompare(
        itemB.insumoNombre,
        "es",
      ),
  );

  const alertas =
    proyecciones.filter(
      (item) =>
        item.nivel !== "Normal",
    );

  const bloqueada =
    alertas.some(
      (item) =>
        item.nivel ===
          "Bloqueado" ||
        item.nivel ===
          "Insumo inactivo",
    );

  const requiereConfirmacion =
    !bloqueada &&
    alertas.some(
      (item) =>
        item.nivel ===
        "Negativo",
    );

  return {
    bloqueada,
    requiereConfirmacion,
    proyecciones,
    alertas,
    productosSinReceta: [
      ...new Set(
        productosSinReceta,
      ),
    ],
  };
}

export async function evaluarInventarioParaVenta(
  detalles:
    RegistrarConsumoVentaDto["detalles"],
): Promise<EvaluacionInventarioVenta> {
  garantizarDatosIniciales();
  await esperar(180);

  return construirEvaluacionInventario(
    detalles,
  );
}

export async function registrarConsumoInventarioVenta(
  datos: RegistrarConsumoVentaDto,
  usuario: UsuarioSesion,
): Promise<ConsumoVentaInventario> {
  garantizarDatosIniciales();
  await esperar(450);

  const consumos =
    obtenerConsumosPersistidos();

  const consumoExistente =
    consumos.find(
      (consumo) =>
        consumo.ventaId ===
        datos.ventaId,
    );

  if (consumoExistente) {
    throw new Error(
      "El inventario de esta venta ya fue procesado.",
    );
  }

  const evaluacion =
    await construirEvaluacionInventario(
      datos.detalles,
    );

  if (evaluacion.bloqueada) {
    throw new Error(
      "La venta utiliza un insumo inactivo o configurado para bloquear faltantes.",
    );
  }

  if (
    evaluacion
      .requiereConfirmacion &&
    !datos.autorizaSaldoNegativo
  ) {
    throw new Error(
      "La venta dejará existencias negativas y requiere confirmación.",
    );
  }

  const insumos =
    obtenerInsumosPersistidos();

  const movimientos =
    obtenerMovimientosPersistidos();

  const fechaActual =
    new Date().toISOString();

  const detallesConsumo:
    DetalleConsumoVentaInventario[] =
    [];

  for (
    const proyeccion
    of evaluacion.proyecciones
  ) {
    const indice =
      insumos.findIndex(
        (insumo) =>
          insumo.id ===
          proyeccion.insumoId,
      );

    if (indice === -1) {
      throw new Error(
        "No se encontró uno de los insumos requeridos.",
      );
    }

    const insumo =
      insumos[indice];

    const stockAnterior =
      insumo.stockActual;

    const stockPosterior =
      redondearCantidad(
        stockAnterior -
          proyeccion
            .cantidadRequerida,
      );

    const costoUnitario =
      insumo.controlEconomico
        ? insumo
            .costoPromedioUnidadBase
        : null;

    const costoTotal =
      costoUnitario !== null
        ? redondearMoneda(
            proyeccion
              .cantidadRequerida *
              costoUnitario,
          )
        : null;

    insumos[indice] = {
      ...insumo,

      stockActual:
        stockPosterior,

      fechaActualizacion:
        fechaActual,

      usuarioActualizacionId:
        usuario.id,

      usuarioActualizacionNombre:
        usuario.nombreCompleto,
    };

    const movimiento =
      crearMovimiento(
        {
          insumoId:
            insumo.id,

          insumoCodigo:
            insumo.codigo,

          insumoNombre:
            insumo.nombre,

          unidadBase:
            insumo.unidadBase,

          tipo:
            "Consumo automático",

          origen: "Venta",

          cantidad:
            -proyeccion
              .cantidadRequerida,

          cantidadClasificada:
            null,

          stockAnterior,
          stockPosterior,

          motivo:
            `Consumo automático por ${datos.numeroPedido}.`,

          referencia:
            datos.numeroPedido,

          ventaId:
            datos.ventaId,

          numeroPedido:
            datos.numeroPedido,

          recetaVersionIds: [
            ...proyeccion
              .recetaVersionIds,
          ],

          costoUnitarioAplicado:
            costoUnitario,

          impactoEconomico:
            costoTotal !== null
              ? -costoTotal
              : null,

          fechaHora:
            fechaActual,

          usuarioId:
            usuario.id,

          usuarioNombre:
            usuario.nombreCompleto,
        },
        movimientos,
      );

    movimientos.push(movimiento);

    detallesConsumo.push({
      insumoId:
        insumo.id,

      insumoCodigo:
        insumo.codigo,

      insumoNombre:
        insumo.nombre,

      unidadBase:
        insumo.unidadBase,

      cantidadConsumida:
        proyeccion
          .cantidadRequerida,

      stockAnterior,
      stockPosterior,

      costoUnitarioAplicado:
        costoUnitario,

      costoTotalAplicado:
        costoTotal,

      recetaVersionIds: [
        ...proyeccion
          .recetaVersionIds,
      ],

      productosRelacionados: [
        ...proyeccion
          .productosRelacionados,
      ],
    });
  }

  const nuevoConsumo:
    ConsumoVentaInventario = {
    id:
      obtenerSiguienteId(
        consumos,
      ),

    ventaId:
      datos.ventaId,

    numeroPedido:
      datos.numeroPedido,

    estado: "Aplicado",

    autorizoSaldoNegativo:
      evaluacion
        .requiereConfirmacion &&
      datos.autorizaSaldoNegativo,

    detalles:
      detallesConsumo,

    fechaHoraRegistro:
      fechaActual,

    fechaHoraTratamiento:
      null,

    tratamientoAnulacion:
      null,

    usuarioRegistroId:
      usuario.id,

    usuarioRegistroNombre:
      usuario.nombreCompleto,

    usuarioTratamientoId:
      null,

    usuarioTratamientoNombre:
      null,
  };

  consumos.push(nuevoConsumo);

  guardarInsumos(insumos);
  guardarMovimientos(movimientos);
  guardarConsumos(consumos);

  return clonarConsumo(
    nuevoConsumo,
  );
}

export async function registrarTratamientoAnulacionInventario(
  datos:
    RegistrarTratamientoAnulacionDto,
  usuario: UsuarioSesion,
): Promise<ConsumoVentaInventario> {
  garantizarDatosIniciales();
  await esperar(500);

  const motivo =
    datos.motivo.trim();

  if (
    motivo.length < 5 ||
    motivo.length > 200
  ) {
    throw new Error(
      "El motivo debe contener entre 5 y 200 caracteres.",
    );
  }

  const consumos =
    obtenerConsumosPersistidos();

  const indiceConsumo =
    consumos.findIndex(
      (consumo) =>
        consumo.ventaId ===
        datos.ventaId,
    );

  if (indiceConsumo === -1) {
    throw new Error(
      "La venta no tiene un consumo de inventario registrado.",
    );
  }

  const consumo =
    consumos[indiceConsumo];

  if (
    consumo.estado !== "Aplicado"
  ) {
    throw new Error(
      "El inventario de esta venta ya recibió un tratamiento de anulación.",
    );
  }

  const insumos =
    obtenerInsumosPersistidos();

  const movimientos =
    obtenerMovimientosPersistidos();

  const fechaActual =
    new Date().toISOString();

  for (
    const detalle
    of consumo.detalles
  ) {
    const indiceInsumo =
      insumos.findIndex(
        (insumo) =>
          insumo.id ===
          detalle.insumoId,
      );

    if (indiceInsumo === -1) {
      throw new Error(
        "No se encontró uno de los insumos consumidos.",
      );
    }

    const insumo =
      insumos[indiceInsumo];

    if (
      datos.tratamiento ===
      "Reintegrar insumos"
    ) {
      const stockAnterior =
        insumo.stockActual;

      const stockPosterior =
        redondearCantidad(
          stockAnterior +
            detalle
              .cantidadConsumida,
        );

      insumos[indiceInsumo] = {
        ...insumo,

        stockActual:
          stockPosterior,

        fechaActualizacion:
          fechaActual,

        usuarioActualizacionId:
          usuario.id,

        usuarioActualizacionNombre:
          usuario.nombreCompleto,
      };

      movimientos.push(
        crearMovimiento(
          {
            insumoId:
              insumo.id,

            insumoCodigo:
              insumo.codigo,

            insumoNombre:
              insumo.nombre,

            unidadBase:
              insumo.unidadBase,

            tipo:
              "Reversión por anulación",

            origen:
              "Anulación",

            cantidad:
              detalle
                .cantidadConsumida,

            cantidadClasificada:
              null,

            stockAnterior,
            stockPosterior,

            motivo,

            referencia:
              datos.numeroPedido,

            ventaId:
              datos.ventaId,

            numeroPedido:
              datos.numeroPedido,

            recetaVersionIds: [
              ...detalle
                .recetaVersionIds,
            ],

            costoUnitarioAplicado:
              detalle
                .costoUnitarioAplicado,

            impactoEconomico:
              detalle
                .costoTotalAplicado,

            fechaHora:
              fechaActual,

            usuarioId:
              usuario.id,

            usuarioNombre:
              usuario
                .nombreCompleto,
          },
          movimientos,
        ),
      );
    } else {
      movimientos.push(
        crearMovimiento(
          {
            insumoId:
              insumo.id,

            insumoCodigo:
              insumo.codigo,

            insumoNombre:
              insumo.nombre,

            unidadBase:
              insumo.unidadBase,

            tipo:
              "Merma por anulación",

            origen:
              "Anulación",

            cantidad: 0,

            cantidadClasificada:
              detalle
                .cantidadConsumida,

            stockAnterior:
              insumo.stockActual,

            stockPosterior:
              insumo.stockActual,

            motivo,

            referencia:
              datos.numeroPedido,

            ventaId:
              datos.ventaId,

            numeroPedido:
              datos.numeroPedido,

            recetaVersionIds: [
              ...detalle
                .recetaVersionIds,
            ],

            costoUnitarioAplicado:
              detalle
                .costoUnitarioAplicado,

            impactoEconomico:
              detalle
                  .costoTotalAplicado !==
                null
                ? -detalle
                    .costoTotalAplicado
                : null,

            fechaHora:
              fechaActual,

            usuarioId:
              usuario.id,

            usuarioNombre:
              usuario
                .nombreCompleto,
          },
          movimientos,
        ),
      );
    }
  }

  const consumoActualizado:
    ConsumoVentaInventario = {
    ...consumo,

    estado:
      datos.tratamiento ===
      "Reintegrar insumos"
        ? "Reintegrado"
        : "Clasificado como merma",

    fechaHoraTratamiento:
      fechaActual,

    tratamientoAnulacion:
      datos.tratamiento,

    usuarioTratamientoId:
      usuario.id,

    usuarioTratamientoNombre:
      usuario.nombreCompleto,
  };

  consumos[indiceConsumo] =
    consumoActualizado;

  guardarInsumos(insumos);
  guardarMovimientos(movimientos);
  guardarConsumos(consumos);

  return clonarConsumo(
    consumoActualizado,
  );
}

export async function listarConsumosVentaInventario():
  Promise<
    ConsumoVentaInventario[]
  > {
  garantizarDatosIniciales();
  await esperar(280);

  return obtenerConsumosPersistidos()
    .sort(
      (consumoA, consumoB) =>
        new Date(
          consumoB
            .fechaHoraRegistro,
        ).getTime() -
        new Date(
          consumoA
            .fechaHoraRegistro,
        ).getTime(),
    )
    .map(clonarConsumo);
}

export async function registrarConteoFisicoInventario(
  datos: RegistrarConteoFisicoDto,
  usuario: UsuarioSesion,
): Promise<ConteoFisicoInventario> {
  garantizarDatosIniciales();
  await esperar(650);

  if (
    !Array.isArray(
      datos.detalles,
    ) ||
    datos.detalles.length === 0
  ) {
    throw new Error(
      "El conteo debe contener al menos un insumo.",
    );
  }

  const ids =
    datos.detalles.map(
      (detalle) =>
        detalle.insumoId,
    );

  if (
    new Set(ids).size !==
    ids.length
  ) {
    throw new Error(
      "El conteo contiene insumos repetidos.",
    );
  }

  const observaciones =
    datos.observaciones
      ?.trim() || null;

  if (
    observaciones &&
    observaciones.length > 300
  ) {
    throw new Error(
      "Las observaciones no pueden superar los 300 caracteres.",
    );
  }

  const insumos =
    obtenerInsumosPersistidos();

  const movimientos =
    obtenerMovimientosPersistidos();

  const conteos =
    obtenerConteosPersistidos();

  const fechaActual =
    new Date().toISOString();

  const detallesConteo:
    ConteoFisicoInventario["detalles"] =
    [];

  for (
    const detalle
    of datos.detalles
  ) {
    const indice =
      insumos.findIndex(
        (insumo) =>
          insumo.id ===
          detalle.insumoId,
      );

    if (indice === -1) {
      throw new Error(
        "Uno de los insumos seleccionados no existe.",
      );
    }

    if (
      !Number.isFinite(
        detalle.stockFisico,
      ) ||
      detalle.stockFisico < 0
    ) {
      throw new Error(
        "La cantidad física no puede ser negativa.",
      );
    }

    const motivo =
      detalle.motivo.trim();

    if (
      motivo.length < 5 ||
      motivo.length > 200
    ) {
      throw new Error(
        "Cada diferencia debe incluir un motivo de entre 5 y 200 caracteres.",
      );
    }

    const insumo =
      insumos[indice];

    const stockTeorico =
      insumo.stockActual;

    const stockFisico =
      redondearCantidad(
        detalle.stockFisico,
      );

    const variacion =
      redondearCantidad(
        stockFisico -
          stockTeorico,
      );

    const costoUnitario =
      insumo.controlEconomico
        ? insumo
            .costoPromedioUnidadBase
        : null;

    const impactoEconomico =
      costoUnitario !== null
        ? redondearMoneda(
            variacion *
              costoUnitario,
          )
        : null;

    detallesConteo.push({
      insumoId:
        insumo.id,

      insumoCodigo:
        insumo.codigo,

      insumoNombre:
        insumo.nombre,

      unidadBase:
        insumo.unidadBase,

      stockTeorico,
      stockFisico,
      variacion,

      motivo,

      costoUnitarioAplicado:
        costoUnitario,

      impactoEconomico,
    });

    if (variacion !== 0) {
      insumos[indice] = {
        ...insumo,

        stockActual:
          stockFisico,

        fechaActualizacion:
          fechaActual,

        usuarioActualizacionId:
          usuario.id,

        usuarioActualizacionNombre:
          usuario.nombreCompleto,
      };

      movimientos.push(
        crearMovimiento(
          {
            insumoId:
              insumo.id,

            insumoCodigo:
              insumo.codigo,

            insumoNombre:
              insumo.nombre,

            unidadBase:
              insumo.unidadBase,

            tipo:
              "Conteo físico",

            origen:
              "Conteo físico",

            cantidad:
              variacion,

            cantidadClasificada:
              null,

            stockAnterior:
              stockTeorico,

            stockPosterior:
              stockFisico,

            motivo,

            referencia: null,

            ventaId: null,
            numeroPedido: null,

            recetaVersionIds: [],

            costoUnitarioAplicado:
              costoUnitario,

            impactoEconomico,

            fechaHora:
              fechaActual,

            usuarioId:
              usuario.id,

            usuarioNombre:
              usuario
                .nombreCompleto,
          },
          movimientos,
        ),
      );
    }
  }

  const nuevoConteo:
    ConteoFisicoInventario = {
    id:
      obtenerSiguienteId(
        conteos,
      ),

    observaciones,

    detalles:
      detallesConteo,

    fechaHora:
      fechaActual,

    usuarioId:
      usuario.id,

    usuarioNombre:
      usuario.nombreCompleto,
  };

  conteos.push(nuevoConteo);

  guardarInsumos(insumos);
  guardarMovimientos(movimientos);
  guardarConteos(conteos);

  return clonarConteo(
    nuevoConteo,
  );
}

export async function listarConteosFisicosInventario():
  Promise<
    ConteoFisicoInventario[]
  > {
  garantizarDatosIniciales();
  await esperar(280);

  return obtenerConteosPersistidos()
    .sort(
      (conteoA, conteoB) =>
        new Date(
          conteoB.fechaHora,
        ).getTime() -
        new Date(
          conteoA.fechaHora,
        ).getTime(),
    )
    .map(clonarConteo);
}

export async function listarMovimientosInventario(
  filtro:
    FiltroMovimientosInventario = {},
): Promise<MovimientoInventario[]> {
  garantizarDatosIniciales();
  await esperar(300);

  const texto =
    filtro.texto
      ?.trim()
      .toLocaleLowerCase("es") ??
    "";

  const fechaDesde =
    filtro.fechaDesde
      ? new Date(
          `${filtro.fechaDesde}T00:00:00`,
        ).getTime()
      : null;

  const fechaHasta =
    filtro.fechaHasta
      ? new Date(
          `${filtro.fechaHasta}T23:59:59.999`,
        ).getTime()
      : null;

  return obtenerMovimientosPersistidos()
    .filter((movimiento) => {
      const coincideInsumo =
        filtro.insumoId ===
          undefined ||
        movimiento.insumoId ===
          filtro.insumoId;

      const coincideTipo =
        filtro.tipo === undefined ||
        movimiento.tipo ===
          filtro.tipo;

      const textoMovimiento =
        [
          movimiento.insumoCodigo,
          movimiento.insumoNombre,
          movimiento.motivo,
          movimiento.numeroPedido ??
            "",
          movimiento.referencia ??
            "",
          movimiento.usuarioNombre,
        ]
          .join(" ")
          .toLocaleLowerCase("es");

      const coincideTexto =
        !texto ||
        textoMovimiento.includes(
          texto,
        );

      const fechaMovimiento =
        new Date(
          movimiento.fechaHora,
        ).getTime();

      const coincideFechaDesde =
        fechaDesde === null ||
        fechaMovimiento >=
          fechaDesde;

      const coincideFechaHasta =
        fechaHasta === null ||
        fechaMovimiento <=
          fechaHasta;

      return (
        coincideInsumo &&
        coincideTipo &&
        coincideTexto &&
        coincideFechaDesde &&
        coincideFechaHasta
      );
    })
    .sort(
      (movimientoA, movimientoB) =>
        new Date(
          movimientoB.fechaHora,
        ).getTime() -
        new Date(
          movimientoA.fechaHora,
        ).getTime(),
    )
    .map(clonarMovimiento);
}

export async function obtenerResumenInventario():
  Promise<ResumenInventario> {
  garantizarDatosIniciales();
  await esperar(320);

  const insumos =
    obtenerInsumosPersistidos()
      .filter(
        (insumo) =>
          insumo.estado ===
          "Activo",
      );

  const movimientos =
    obtenerMovimientosPersistidos()
      .sort(
        (movimientoA, movimientoB) =>
          new Date(
            movimientoB.fechaHora,
          ).getTime() -
          new Date(
            movimientoA.fechaHora,
          ).getTime(),
      );

  const niveles =
    insumos.map(
      calcularNivelStockInsumo,
    );

  const valorInventarioPositivo =
    redondearMoneda(
      insumos.reduce(
        (acumulado, insumo) => {
          if (
            !insumo.controlEconomico ||
            insumo
              .costoPromedioUnidadBase ===
              null ||
            insumo.stockActual <= 0
          ) {
            return acumulado;
          }

          return (
            acumulado +
            insumo.stockActual *
              insumo
                .costoPromedioUnidadBase
          );
        },
        0,
      ),
    );

  const valorDeficitInventario =
    redondearMoneda(
      insumos.reduce(
        (acumulado, insumo) => {
          if (
            !insumo.controlEconomico ||
            insumo
              .costoPromedioUnidadBase ===
              null ||
            insumo.stockActual >= 0
          ) {
            return acumulado;
          }

          return (
            acumulado +
            Math.abs(
              insumo.stockActual,
            ) *
              insumo
                .costoPromedioUnidadBase
          );
        },
        0,
      ),
    );

  const alertas =
    insumos
      .filter(
        (insumo) =>
          calcularNivelStockInsumo(
            insumo,
          ) !== "Normal",
      )
      .sort((insumoA, insumoB) => {
        const nivelA =
          calcularNivelStockInsumo(
            insumoA,
          );

        const nivelB =
          calcularNivelStockInsumo(
            insumoB,
          );

        if (
          nivelA === "Negativo" &&
          nivelB !== "Negativo"
        ) {
          return -1;
        }

        if (
          nivelB === "Negativo" &&
          nivelA !== "Negativo"
        ) {
          return 1;
        }

        return (
          insumoA.stockActual -
          insumoB.stockActual
        );
      })
      .map(clonarInsumo);

  return {
    totalInsumosActivos:
      insumos.length,

    insumosNormales:
      niveles.filter(
        (nivel) =>
          nivel === "Normal",
      ).length,

    insumosBajos:
      niveles.filter(
        (nivel) =>
          nivel === "Bajo",
      ).length,

    insumosNegativos:
      niveles.filter(
        (nivel) =>
          nivel === "Negativo",
      ).length,

    valorInventarioPositivo,

    valorDeficitInventario,

    alertas,

    movimientosRecientes:
      movimientos
        .slice(0, 8)
        .map(clonarMovimiento),
  };
}
