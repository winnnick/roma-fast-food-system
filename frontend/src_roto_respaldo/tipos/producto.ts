export type EstadoCatalogo =
  | "Activo"
  | "Inactivo";

export type ControlInventarioProducto =
  | "Con receta"
  | "No controla inventario";

export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: EstadoCatalogo;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface CrearCategoriaDto {
  nombre: string;
  descripcion: string;
}

export interface ActualizarCategoriaDto {
  nombre: string;
  descripcion: string;
}

export interface ProductoMenu {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: number;
  estado: EstadoCatalogo;
  disponible: boolean;
  destacado: boolean;
  controlInventario:
    ControlInventarioProducto;
  imagenUrl: string | null;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface CrearProductoDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: number;
  disponible: boolean;
  destacado: boolean;
  controlInventario?:
    ControlInventarioProducto;
  imagenUrl?: string | null;
}

export interface ActualizarProductoDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: number;
  disponible: boolean;
  destacado: boolean;
  controlInventario?:
    ControlInventarioProducto;
  imagenUrl?: string | null;
}

export interface IngredienteProductoDto {
  insumoId: number;
  cantidadPorProducto: number;
}

export interface CrearProductoConInventarioDto
  extends CrearProductoDto {
  controlInventario:
    ControlInventarioProducto;
  ingredientes:
    IngredienteProductoDto[];
}

export interface ActualizarProductoConInventarioDto
  extends ActualizarProductoDto {
  controlInventario:
    ControlInventarioProducto;
  ingredientes?:
    IngredienteProductoDto[] | null;
}

export type EstadoConfiguracionInventarioProducto =
  | "Receta configurada"
  | "Sin receta"
  | "No controla inventario";


export interface EstadoInventarioProducto {
  productoId: number;
  estado:
    EstadoConfiguracionInventarioProducto;
  recetaVigenteId: number | null;
}
