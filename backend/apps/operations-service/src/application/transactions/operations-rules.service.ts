import { BadRequestException, Injectable } from '@nestjs/common';

import type {
  DiscountType,
  PaymentMethod,
  PreparationStatus,
  SalePaymentSnapshot,
} from '../../domain/operations/operations.models';

@Injectable()
export class OperationsRulesService {
  roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  normalizeOptionalText(
    value: string | null | undefined,
    max: number,
    label: string,
  ): string | null {
    const normalized = value?.trim() ?? '';
    if (!normalized) return null;
    if (normalized.length > max)
      throw new BadRequestException(`${label} no puede superar ${max} caracteres.`);
    return normalized;
  }

  requirePositive(value: number, label: string): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${label} debe ser mayor a cero.`);
    }
    return this.roundMoney(value);
  }

  requireNonNegative(value: number, label: string): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${label} no puede ser negativo.`);
    }
    return this.roundMoney(value);
  }

  calculateDiscount(
    subtotal: number,
    type: DiscountType,
    value: number,
    reason: string | null,
  ): {
    discountValue: number;
    discountAmount: number;
    discountReason: string | null;
    total: number;
  } {
    if (type === 'Ninguno') {
      return { discountValue: 0, discountAmount: 0, discountReason: null, total: subtotal };
    }
    const normalizedReason = this.normalizeOptionalText(reason, 200, 'El motivo del descuento');
    if (!normalizedReason || normalizedReason.length < 5) {
      throw new BadRequestException('Indica un motivo de descuento de al menos 5 caracteres.');
    }
    if (type === 'Porcentaje') {
      if (!Number.isFinite(value) || value <= 0 || value >= 100) {
        throw new BadRequestException(
          'El porcentaje de descuento debe ser mayor a 0 y menor a 100.',
        );
      }
      const discountValue = this.roundMoney(value);
      const discountAmount = this.roundMoney(subtotal * (discountValue / 100));
      return {
        discountValue,
        discountAmount,
        discountReason: normalizedReason,
        total: this.roundMoney(subtotal - discountAmount),
      };
    }
    const fixed = this.requirePositive(value, 'El descuento fijo');
    if (fixed >= subtotal) {
      throw new BadRequestException('El descuento fijo debe ser menor al subtotal de la venta.');
    }
    return {
      discountValue: fixed,
      discountAmount: fixed,
      discountReason: normalizedReason,
      total: this.roundMoney(subtotal - fixed),
    };
  }

  calculatePaymentDistribution(input: {
    pendingBalance: number;
    requestedMethod: PaymentMethod;
    cashAmount: number;
    qrAmount: number;
    receivedAmount: number;
    qrReference: string | null;
  }): {
    appliedAmount: number;
    paymentMethod: PaymentMethod;
    cashAmount: number;
    qrAmount: number;
    receivedAmount: number;
    changeAmount: number;
    qrReference: string | null;
  } {
    const cashAmount = this.requireNonNegative(input.cashAmount, 'La parte en efectivo');
    const qrAmount = this.requireNonNegative(input.qrAmount, 'El monto QR');
    const appliedAmount = this.roundMoney(cashAmount + qrAmount);
    if (appliedAmount <= 0)
      throw new BadRequestException('Ingresa un monto mayor a cero para registrar el abono.');
    if (appliedAmount > this.roundMoney(input.pendingBalance)) {
      throw new BadRequestException('El abono no puede superar el saldo pendiente de la venta.');
    }
    const paymentMethod: PaymentMethod =
      cashAmount > 0 && qrAmount > 0 ? 'Mixto' : qrAmount > 0 ? 'QR' : 'Efectivo';
    if (paymentMethod !== input.requestedMethod) {
      throw new BadRequestException(
        'La distribución del pago no coincide con el método detectado.',
      );
    }
    const receivedAmount =
      cashAmount > 0 ? this.requirePositive(input.receivedAmount, 'El monto recibido') : 0;
    if (cashAmount > 0 && receivedAmount < cashAmount) {
      throw new BadRequestException(
        'El monto recibido es menor al efectivo que se aplicará al abono.',
      );
    }
    const qrReference =
      qrAmount > 0 ? this.normalizeOptionalText(input.qrReference, 100, 'La referencia QR') : null;
    return {
      appliedAmount,
      paymentMethod,
      cashAmount,
      qrAmount,
      receivedAmount,
      changeAmount: this.roundMoney(Math.max(0, receivedAmount - cashAmount)),
      qrReference,
    };
  }

  accumulatedPaymentMethod(
    payments: SalePaymentSnapshot[],
    newMethod: PaymentMethod,
  ): PaymentMethod {
    const methods = new Set<PaymentMethod>(payments.map((payment) => payment.paymentMethod));
    methods.add(newMethod);
    if (methods.size === 1 && !methods.has('Mixto')) return [...methods][0];
    return 'Mixto';
  }

  assertPreparationTransition(current: PreparationStatus, next: PreparationStatus): void {
    const allowed: Record<PreparationStatus, PreparationStatus[]> = {
      'En cola': ['En preparación'],
      'En preparación': ['Listo'],
      'Entrega directa': ['Entregado'],
      Listo: ['Entregado'],
      Entregado: [],
      Anulado: [],
    };
    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`No se puede cambiar un pedido “${current}” a “${next}”.`);
    }
  }
}
