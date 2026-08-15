import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  ClientDocumentType,
  ProductInventoryControl,
  ProductPreparationMode,
  UpsertClientInput,
  UpsertProductInput,
} from '../../domain/catalog/catalog.models';

@Injectable()
export class CatalogValidationService {
  normalizeCategory(name: string, description: string): { name: string; description: string } {
    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (normalizedName.length < 3 || normalizedName.length > 100) {
      throw new BadRequestException(
        'El nombre de la categoría debe contener entre 3 y 100 caracteres.',
      );
    }
    if (normalizedDescription.length < 5 || normalizedDescription.length > 300) {
      throw new BadRequestException('Ingrese una descripción válida para la categoría.');
    }
    return { name: normalizedName, description: normalizedDescription };
  }

  normalizeProduct(input: {
    code: string;
    name: string;
    description: string;
    categoryId: number;
    price: number;
    availablePedidosYa?: boolean;
    pedidosYaPrice?: number | null;
    featured: boolean;
    preparationMode?: ProductPreparationMode;
    inventoryControl?: ProductInventoryControl;
    imageUrl?: string | null;
  }): UpsertProductInput {
    const code = input.code.trim().toUpperCase();
    const name = input.name.trim();
    const description = input.description.trim();

    if (code.length < 3 || code.length > 20 || !/^[A-Z0-9-]+$/.test(code)) {
      throw new BadRequestException(
        'El código debe contener entre 3 y 20 caracteres y solo usar letras, números y guiones.',
      );
    }
    if (name.length < 3 || name.length > 120) {
      throw new BadRequestException(
        'El nombre del producto debe contener entre 3 y 120 caracteres.',
      );
    }
    if (description.length < 5 || description.length > 500) {
      throw new BadRequestException('Ingrese una descripción válida para el producto.');
    }
    if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
      throw new BadRequestException('La categoría seleccionada no es válida.');
    }
    if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 100000) {
      throw new BadRequestException(
        'El precio del producto debe ser mayor que cero y no superar 100000.',
      );
    }

    const availablePedidosYa = input.availablePedidosYa === true;
    let pedidosYaPrice: number | null = null;
    if (availablePedidosYa) {
      const rawPedidosYaPrice = Number(input.pedidosYaPrice);
      if (
        !Number.isFinite(rawPedidosYaPrice) ||
        rawPedidosYaPrice <= 0 ||
        rawPedidosYaPrice > 100000
      ) {
        throw new BadRequestException(
          'Ingresa un precio válido para PedidosYa cuando el producto esté disponible en ese canal.',
        );
      }
      pedidosYaPrice = Number(rawPedidosYaPrice.toFixed(2));
    }

    const imageUrl = this.optionalText(input.imageUrl);
    if (imageUrl && imageUrl.length > 500) {
      throw new BadRequestException('La URL de imagen no puede superar los 500 caracteres.');
    }

    return {
      code,
      name,
      description,
      categoryId: input.categoryId,
      price: Number(input.price.toFixed(2)),
      availablePedidosYa,
      pedidosYaPrice,
      featured: input.featured,
      preparationMode: input.preparationMode ?? 'Requiere preparación',
      inventoryControl: input.inventoryControl ?? 'Con receta',
      imageUrl,
    };
  }

  normalizeClient(input: {
    fullName: string;
    documentType: ClientDocumentType | null;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    zone?: string | null;
    addressReference?: string | null;
    locationUrl?: string | null;
    deliveryInstructions?: string | null;
    observations: string | null;
  }): UpsertClientInput {
    const fullName = input.fullName.trim();
    if (fullName.length < 3 || fullName.length > 120) {
      throw new BadRequestException(
        'El nombre del cliente debe contener entre 3 y 120 caracteres.',
      );
    }

    const documentNumber = this.optionalText(input.documentNumber)?.toUpperCase() ?? null;
    if (input.documentType && !documentNumber) {
      throw new BadRequestException('Ingrese el número de documento.');
    }
    if (!input.documentType && documentNumber) {
      throw new BadRequestException('Seleccione el tipo de documento.');
    }
    if (
      documentNumber &&
      (documentNumber.length < 4 ||
        documentNumber.length > 30 ||
        !/^[A-Z0-9./-]+$/.test(documentNumber))
    ) {
      throw new BadRequestException('El documento debe contener entre 4 y 30 caracteres válidos.');
    }

    const phone = this.optionalText(input.phone);
    if (phone && (phone.length < 7 || phone.length > 20 || !/^[0-9+\-\s()]+$/.test(phone))) {
      throw new BadRequestException('El teléfono contiene un formato no permitido.');
    }

    const email = this.optionalText(input.email)?.toLowerCase() ?? null;
    if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new BadRequestException('Ingrese un correo electrónico válido.');
    }

    const address = this.optionalText(input.address);
    const zone = this.optionalText(input.zone);
    const addressReference = this.optionalText(input.addressReference);
    const deliveryInstructions = this.optionalText(input.deliveryInstructions);
    const observations = this.optionalText(input.observations);
    const locationUrl = this.normalizeUrl(input.locationUrl);

    this.assertMax(address, 220, 'La dirección no puede superar los 220 caracteres.');
    this.assertMax(zone, 100, 'La zona no puede superar los 100 caracteres.');
    this.assertMax(addressReference, 180, 'La referencia no puede superar los 180 caracteres.');
    this.assertMax(
      deliveryInstructions,
      300,
      'Las indicaciones de entrega no pueden superar los 300 caracteres.',
    );
    this.assertMax(observations, 300, 'Las observaciones no pueden superar los 300 caracteres.');
    this.assertMax(locationUrl, 500, 'El enlace de ubicación no puede superar los 500 caracteres.');

    return {
      fullName,
      documentType: input.documentType ?? null,
      documentNumber,
      phone,
      email,
      address,
      zone,
      addressReference,
      locationUrl,
      deliveryInstructions,
      observations,
    };
  }

  private optionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized ? normalized : null;
  }

  private normalizeUrl(value: string | null | undefined): string | null {
    const normalized = this.optionalText(value);
    if (!normalized) return null;
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    try {
      const parsed = new URL(withProtocol);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      throw new BadRequestException('Ingrese un enlace de ubicación válido.');
    }
    return withProtocol;
  }

  private assertMax(value: string | null, max: number, message: string): void {
    if (value && value.length > max) throw new BadRequestException(message);
  }
}
