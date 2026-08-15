import type {
  CategorySnapshot,
  ClientSnapshot,
  ProductSnapshot,
} from '../../domain/catalog/catalog.models';

export interface CategoryView {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface ProductView {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: number;
  disponiblePedidosYa: boolean;
  precioPedidosYa: number | null;
  estado: string;
  disponible: boolean;
  destacado: boolean;
  modoPreparacion: string;
  controlInventario: string;
  imagenUrl: string | null;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface ClientView {
  id: number;
  nombreCompleto: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  zona: string | null;
  referenciaDireccion: string | null;
  ubicacionUrl: string | null;
  indicacionesEntrega: string | null;
  observaciones: string | null;
  estado: string;
  archivado: boolean;
  fechaArchivado: string | null;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export function toCategoryView(item: CategorySnapshot): CategoryView {
  return {
    id: item.id,
    nombre: item.name,
    descripcion: item.description,
    estado: item.status,
    fechaRegistro: item.registeredAt.toISOString(),
    fechaActualizacion: item.updatedAt.toISOString(),
  };
}

export function toProductView(item: ProductSnapshot): ProductView {
  return {
    id: item.id,
    codigo: item.code,
    nombre: item.name,
    descripcion: item.description,
    categoriaId: item.categoryId,
    precio: item.price,
    disponiblePedidosYa: item.availablePedidosYa,
    precioPedidosYa: item.pedidosYaPrice,
    estado: item.status,
    disponible: item.available,
    destacado: item.featured,
    modoPreparacion: item.preparationMode,
    controlInventario: item.inventoryControl,
    imagenUrl: item.imageUrl,
    fechaRegistro: item.registeredAt.toISOString(),
    fechaActualizacion: item.updatedAt.toISOString(),
  };
}

export function toClientView(item: ClientSnapshot): ClientView {
  return {
    id: item.id,
    nombreCompleto: item.fullName,
    tipoDocumento: item.documentType,
    numeroDocumento: item.documentNumber,
    telefono: item.phone,
    correo: item.email,
    direccion: item.address,
    zona: item.zone,
    referenciaDireccion: item.addressReference,
    ubicacionUrl: item.locationUrl,
    indicacionesEntrega: item.deliveryInstructions,
    observaciones: item.observations,
    estado: item.status,
    archivado: item.archived,
    fechaArchivado: item.archivedAt?.toISOString() ?? null,
    fechaRegistro: item.registeredAt.toISOString(),
    fechaActualizacion: item.updatedAt.toISOString(),
  };
}
