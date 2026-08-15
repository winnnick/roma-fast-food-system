import { describe, expect, it } from 'vitest';

import { CatalogValidationService } from './catalog-validation.service';

describe('CatalogValidationService', () => {
  const service = new CatalogValidationService();

  it('normalizes product code and monetary values', () => {
    const result = service.normalizeProduct({
      code: ' hamb-010 ',
      name: ' Hamburguesa especial ',
      description: ' Producto preparado al momento. ',
      categoryId: 1,
      price: 25.456,
      availablePedidosYa: true,
      pedidosYaPrice: 30.129,
      featured: true,
    });

    expect(result.code).toBe('HAMB-010');
    expect(result.price).toBe(25.46);
    expect(result.pedidosYaPrice).toBe(30.13);
  });

  it('normalizes optional client fields and location URL', () => {
    const result = service.normalizeClient({
      fullName: ' María Pérez ',
      documentType: 'CI',
      documentNumber: ' ab-1234 ',
      phone: ' 72900101 ',
      email: ' MARIA@CORREO.COM ',
      address: ' Calle Bolívar ',
      locationUrl: 'maps.google.com/example',
      observations: null,
    });

    expect(result.documentNumber).toBe('AB-1234');
    expect(result.email).toBe('maria@correo.com');
    expect(result.locationUrl).toBe('https://maps.google.com/example');
  });
});
