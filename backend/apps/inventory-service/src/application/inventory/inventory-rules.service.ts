import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  IngredientSnapshot,
  InventoryProjectionSnapshot,
  ProjectionLevel,
} from '../../domain/inventory/inventory.models';

@Injectable()
export class InventoryRulesService {
  roundQuantity(value: number): number {
    return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
  }

  roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  roundUnitCost(value: number): number {
    return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
  }

  normalizeCode(value: string): string {
    const normalized = value.trim().toUpperCase().replace(/\s+/g, '-');
    if (normalized.length < 2 || normalized.length > 30) {
      throw new BadRequestException('El código del insumo debe contener entre 2 y 30 caracteres.');
    }
    return normalized;
  }

  normalizeText(value: string, field: string, min: number, max: number): string {
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (normalized.length < min || normalized.length > max) {
      throw new BadRequestException(`${field} debe contener entre ${min} y ${max} caracteres.`);
    }
    return normalized;
  }

  requirePositive(value: number, field: string): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser mayor que cero.`);
    }
    return value;
  }

  requireNonNegative(value: number, field: string): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${field} no puede ser negativo.`);
    }
    return value;
  }

  weightedAverageCost(
    previousStock: number,
    previousUnitCost: number | null,
    incomingQuantity: number,
    incomingTotalCost: number,
  ): number {
    this.requirePositive(incomingQuantity, 'La cantidad de entrada');
    this.requirePositive(incomingTotalCost, 'El costo total de entrada');
    const incomingUnitCost = this.roundUnitCost(incomingTotalCost / incomingQuantity);
    if (previousStock <= 0 || previousUnitCost === null) return incomingUnitCost;
    return this.roundUnitCost(
      (previousStock * previousUnitCost + incomingTotalCost) / (previousStock + incomingQuantity),
    );
  }

  projectionLevel(ingredient: IngredientSnapshot, resultingBalance: number): ProjectionLevel {
    if (ingredient.status !== 'Activo') return 'Insumo inactivo';
    if (resultingBalance < 0) {
      return ingredient.shortagePolicy === 'Bloquear' ? 'Bloqueado' : 'Negativo';
    }
    if (ingredient.lowStockControl && resultingBalance <= ingredient.minimumStock) return 'Bajo';
    return 'Normal';
  }

  isBlocked(projections: InventoryProjectionSnapshot[]): boolean {
    return projections.some(
      (projection) => projection.level === 'Bloqueado' || projection.level === 'Insumo inactivo',
    );
  }

  requiresNegativeConfirmation(projections: InventoryProjectionSnapshot[]): boolean {
    return !this.isBlocked(projections) && projections.some((item) => item.level === 'Negativo');
  }
}
