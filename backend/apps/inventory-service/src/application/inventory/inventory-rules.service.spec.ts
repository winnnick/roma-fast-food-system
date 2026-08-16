import { describe, expect, it } from 'vitest';

import type { IngredientSnapshot } from '../../domain/inventory/inventory.models';
import { InventoryRulesService } from './inventory-rules.service';

const ingredient: IngredientSnapshot = {
  id: 1,
  code: 'CARNE-HAMB',
  name: 'Carne',
  category: 'Carnes',
  baseUnit: 'g',
  purchasePresentation: 'kg',
  purchaseConversionFactor: 1000,
  stock: 500,
  lowStockControl: true,
  minimumStock: 100,
  shortagePolicy: 'Permitir con advertencia',
  economicControl: true,
  averageBaseUnitCost: 0.04,
  status: 'Activo',
  registeredAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  updatedByUserId: 1,
  updatedByUserName: 'Admin',
};

describe('InventoryRulesService', () => {
  const rules = new InventoryRulesService();

  it('calcula costo promedio ponderado', () => {
    expect(rules.weightedAverageCost(100, 2, 100, 400)).toBe(3);
  });

  it('clasifica saldo negativo con advertencia', () => {
    expect(rules.projectionLevel(ingredient, -1)).toBe('Negativo');
  });

  it('bloquea saldo negativo cuando la política lo exige', () => {
    expect(rules.projectionLevel({ ...ingredient, shortagePolicy: 'Bloquear' }, -1)).toBe(
      'Bloqueado',
    );
  });
});
