import type {
  InsumoInventario,
  RecetaProducto,
} from "../tipos/inventario";

const FECHA_INICIAL =
  "2026-07-21T08:00:00.000Z";

export const insumosInventarioIniciales:
  InsumoInventario[] = [
  {
    id: 1,
    codigo: "CARNE-HAMB",
    nombre: "Carne de hamburguesa",
    categoria: "Carnes",
    unidadBase: "g",
    presentacionCompra: "kg",
    factorConversionCompra: 1000,
    stockActual: 5000,
    controlarStockBajo: true,
    stockMinimo: 500,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.045,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 2,
    codigo: "PAN-HAMB",
    nombre: "Pan de hamburguesa",
    categoria: "Panadería",
    unidadBase: "unidad",
    presentacionCompra: "paquete",
    factorConversionCompra: 12,
    stockActual: 72,
    controlarStockBajo: true,
    stockMinimo: 20,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      1.5,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 3,
    codigo: "QUESO-LAM",
    nombre: "Queso en láminas",
    categoria: "Lácteos",
    unidadBase: "unidad",
    presentacionCompra: "paquete",
    factorConversionCompra: 20,
    stockActual: 120,
    controlarStockBajo: true,
    stockMinimo: 20,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      1.2,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 4,
    codigo: "TOMATE",
    nombre: "Tomate",
    categoria: "Vegetales",
    unidadBase: "g",
    presentacionCompra: "kg",
    factorConversionCompra: 1000,
    stockActual: 3000,
    controlarStockBajo: true,
    stockMinimo: 500,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.008,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 5,
    codigo: "LECHUGA",
    nombre: "Lechuga",
    categoria: "Vegetales",
    unidadBase: "g",
    presentacionCompra: "kg",
    factorConversionCompra: 1000,
    stockActual: 2000,
    controlarStockBajo: true,
    stockMinimo: 300,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: false,
    costoPromedioUnidadBase: null,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 6,
    codigo: "SALSA-CASA",
    nombre: "Salsa de la casa",
    categoria: "Salsas",
    unidadBase: "ml",
    presentacionCompra: "litro",
    factorConversionCompra: 1000,
    stockActual: 5000,
    controlarStockBajo: true,
    stockMinimo: 500,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: false,
    costoPromedioUnidadBase: null,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 7,
    codigo: "PAPA",
    nombre: "Papa",
    categoria: "Vegetales",
    unidadBase: "g",
    presentacionCompra: "kg",
    factorConversionCompra: 1000,
    stockActual: 10000,
    controlarStockBajo: true,
    stockMinimo: 2000,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.008,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 8,
    codigo: "ACEITE",
    nombre: "Aceite de cocina",
    categoria: "Aceites",
    unidadBase: "ml",
    presentacionCompra: "litro",
    factorConversionCompra: 1000,
    stockActual: 5000,
    controlarStockBajo: true,
    stockMinimo: 1000,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.014,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 9,
    codigo: "COCA500",
    nombre: "Coca-Cola 500 ml",
    categoria: "Bebidas",
    unidadBase: "unidad",
    presentacionCompra: "caja",
    factorConversionCompra: 12,
    stockActual: 48,
    controlarStockBajo: true,
    stockMinimo: 12,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      6.5,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 10,
    codigo: "BASE-PIZZA",
    nombre: "Base de pizza familiar",
    categoria: "Panadería",
    unidadBase: "unidad",
    presentacionCompra: "unidad",
    factorConversionCompra: 1,
    stockActual: 20,
    controlarStockBajo: true,
    stockMinimo: 5,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      10,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 11,
    codigo: "MOZZARELLA",
    nombre: "Queso mozzarella",
    categoria: "Lácteos",
    unidadBase: "g",
    presentacionCompra: "kg",
    factorConversionCompra: 1000,
    stockActual: 4000,
    controlarStockBajo: true,
    stockMinimo: 800,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.05,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 12,
    codigo: "JAMON",
    nombre: "Jamón",
    categoria: "Carnes",
    unidadBase: "g",
    presentacionCompra: "kg",
    factorConversionCompra: 1000,
    stockActual: 3000,
    controlarStockBajo: true,
    stockMinimo: 500,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.04,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
  {
    id: 13,
    codigo: "SALSA-TOMATE",
    nombre: "Salsa de tomate",
    categoria: "Salsas",
    unidadBase: "ml",
    presentacionCompra: "litro",
    factorConversionCompra: 1000,
    stockActual: 4000,
    controlarStockBajo: true,
    stockMinimo: 700,
    politicaFaltante:
      "Permitir con advertencia",
    controlEconomico: true,
    costoPromedioUnidadBase:
      0.018,
    estado: "Activo",
    fechaRegistro: FECHA_INICIAL,
    fechaActualizacion:
      FECHA_INICIAL,
    usuarioActualizacionId: 1,
    usuarioActualizacionNombre:
      "Administrador General",
  },
];

export const recetasInventarioIniciales:
  RecetaProducto[] = [
  {
    id: 1,
    productoId: 1,
    productoCodigo: "HAMB-001",
    productoNombre:
      "Hamburguesa clásica",
    version: 1,
    estado: "Vigente",
    ingredientes: [
      {
        insumoId: 1,
        insumoCodigo:
          "CARNE-HAMB",
        insumoNombre:
          "Carne de hamburguesa",
        unidadBase: "g",
        cantidadPorProducto: 110,
      },
      {
        insumoId: 2,
        insumoCodigo: "PAN-HAMB",
        insumoNombre:
          "Pan de hamburguesa",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
      {
        insumoId: 3,
        insumoCodigo: "QUESO-LAM",
        insumoNombre:
          "Queso en láminas",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
      {
        insumoId: 4,
        insumoCodigo: "TOMATE",
        insumoNombre: "Tomate",
        unidadBase: "g",
        cantidadPorProducto: 30,
      },
      {
        insumoId: 5,
        insumoCodigo: "LECHUGA",
        insumoNombre: "Lechuga",
        unidadBase: "g",
        cantidadPorProducto: 20,
      },
      {
        insumoId: 6,
        insumoCodigo: "SALSA-CASA",
        insumoNombre:
          "Salsa de la casa",
        unidadBase: "ml",
        cantidadPorProducto: 15,
      },
    ],
    fechaVigenciaDesde:
      FECHA_INICIAL,
    fechaVigenciaHasta: null,
    usuarioRegistroId: 1,
    usuarioRegistroNombre:
      "Administrador General",
  },
  {
    id: 2,
    productoId: 2,
    productoCodigo: "HAMB-002",
    productoNombre:
      "Hamburguesa doble",
    version: 1,
    estado: "Vigente",
    ingredientes: [
      {
        insumoId: 1,
        insumoCodigo:
          "CARNE-HAMB",
        insumoNombre:
          "Carne de hamburguesa",
        unidadBase: "g",
        cantidadPorProducto: 220,
      },
      {
        insumoId: 2,
        insumoCodigo: "PAN-HAMB",
        insumoNombre:
          "Pan de hamburguesa",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
      {
        insumoId: 3,
        insumoCodigo: "QUESO-LAM",
        insumoNombre:
          "Queso en láminas",
        unidadBase: "unidad",
        cantidadPorProducto: 2,
      },
      {
        insumoId: 4,
        insumoCodigo: "TOMATE",
        insumoNombre: "Tomate",
        unidadBase: "g",
        cantidadPorProducto: 30,
      },
      {
        insumoId: 5,
        insumoCodigo: "LECHUGA",
        insumoNombre: "Lechuga",
        unidadBase: "g",
        cantidadPorProducto: 20,
      },
      {
        insumoId: 6,
        insumoCodigo: "SALSA-CASA",
        insumoNombre:
          "Salsa de la casa",
        unidadBase: "ml",
        cantidadPorProducto: 20,
      },
    ],
    fechaVigenciaDesde:
      FECHA_INICIAL,
    fechaVigenciaHasta: null,
    usuarioRegistroId: 1,
    usuarioRegistroNombre:
      "Administrador General",
  },
  {
    id: 3,
    productoId: 3,
    productoCodigo: "PIZZ-001",
    productoNombre: "Pizza familiar",
    version: 1,
    estado: "Vigente",
    ingredientes: [
      {
        insumoId: 10,
        insumoCodigo: "BASE-PIZZA",
        insumoNombre:
          "Base de pizza familiar",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
      {
        insumoId: 11,
        insumoCodigo: "MOZZARELLA",
        insumoNombre:
          "Queso mozzarella",
        unidadBase: "g",
        cantidadPorProducto: 300,
      },
      {
        insumoId: 12,
        insumoCodigo: "JAMON",
        insumoNombre: "Jamón",
        unidadBase: "g",
        cantidadPorProducto: 150,
      },
      {
        insumoId: 13,
        insumoCodigo:
          "SALSA-TOMATE",
        insumoNombre:
          "Salsa de tomate",
        unidadBase: "ml",
        cantidadPorProducto: 100,
      },
    ],
    fechaVigenciaDesde:
      FECHA_INICIAL,
    fechaVigenciaHasta: null,
    usuarioRegistroId: 1,
    usuarioRegistroNombre:
      "Administrador General",
  },
  {
    id: 4,
    productoId: 4,
    productoCodigo: "COMB-001",
    productoNombre: "Combo clásico",
    version: 1,
    estado: "Vigente",
    ingredientes: [
      {
        insumoId: 1,
        insumoCodigo:
          "CARNE-HAMB",
        insumoNombre:
          "Carne de hamburguesa",
        unidadBase: "g",
        cantidadPorProducto: 110,
      },
      {
        insumoId: 2,
        insumoCodigo: "PAN-HAMB",
        insumoNombre:
          "Pan de hamburguesa",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
      {
        insumoId: 3,
        insumoCodigo: "QUESO-LAM",
        insumoNombre:
          "Queso en láminas",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
      {
        insumoId: 4,
        insumoCodigo: "TOMATE",
        insumoNombre: "Tomate",
        unidadBase: "g",
        cantidadPorProducto: 30,
      },
      {
        insumoId: 5,
        insumoCodigo: "LECHUGA",
        insumoNombre: "Lechuga",
        unidadBase: "g",
        cantidadPorProducto: 20,
      },
      {
        insumoId: 6,
        insumoCodigo: "SALSA-CASA",
        insumoNombre:
          "Salsa de la casa",
        unidadBase: "ml",
        cantidadPorProducto: 15,
      },
      {
        insumoId: 7,
        insumoCodigo: "PAPA",
        insumoNombre: "Papa",
        unidadBase: "g",
        cantidadPorProducto: 180,
      },
      {
        insumoId: 8,
        insumoCodigo: "ACEITE",
        insumoNombre:
          "Aceite de cocina",
        unidadBase: "ml",
        cantidadPorProducto: 20,
      },
      {
        insumoId: 9,
        insumoCodigo: "COCA500",
        insumoNombre:
          "Coca-Cola 500 ml",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
    ],
    fechaVigenciaDesde:
      FECHA_INICIAL,
    fechaVigenciaHasta: null,
    usuarioRegistroId: 1,
    usuarioRegistroNombre:
      "Administrador General",
  },
  {
    id: 5,
    productoId: 5,
    productoCodigo: "BEB-001",
    productoNombre:
      "Coca-Cola 500 ml",
    version: 1,
    estado: "Vigente",
    ingredientes: [
      {
        insumoId: 9,
        insumoCodigo: "COCA500",
        insumoNombre:
          "Coca-Cola 500 ml",
        unidadBase: "unidad",
        cantidadPorProducto: 1,
      },
    ],
    fechaVigenciaDesde:
      FECHA_INICIAL,
    fechaVigenciaHasta: null,
    usuarioRegistroId: 1,
    usuarioRegistroNombre:
      "Administrador General",
  },
  {
    id: 6,
    productoId: 6,
    productoCodigo: "ACOMP-001",
    productoNombre: "Papas fritas",
    version: 1,
    estado: "Vigente",
    ingredientes: [
      {
        insumoId: 7,
        insumoCodigo: "PAPA",
        insumoNombre: "Papa",
        unidadBase: "g",
        cantidadPorProducto: 180,
      },
      {
        insumoId: 8,
        insumoCodigo: "ACEITE",
        insumoNombre:
          "Aceite de cocina",
        unidadBase: "ml",
        cantidadPorProducto: 20,
      },
    ],
    fechaVigenciaDesde:
      FECHA_INICIAL,
    fechaVigenciaHasta: null,
    usuarioRegistroId: 1,
    usuarioRegistroNombre:
      "Administrador General",
  },
];
