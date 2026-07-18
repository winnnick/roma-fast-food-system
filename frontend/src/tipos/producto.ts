export type EstadoCatalogo =
  | "Activo"
  | "Inactivo";

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
  imagenUrl?: string | null;
}