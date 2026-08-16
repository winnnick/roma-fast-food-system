import { describe, expect, it } from 'vitest';

import { OperationsRulesService } from './operations-rules.service';

describe('OperationsRulesService', () => {
  const rules = new OperationsRulesService();

  it('calcula descuento y total monetario', () => {
    expect(rules.calculateDiscount(60, 'Monto fijo', 10, 'Promoción válida')).toEqual({
      discountValue: 10,
      discountAmount: 10,
      discountReason: 'Promoción válida',
      total: 50,
    });
  });

  it('calcula un abono parcial mixto sin exceder saldo', () => {
    expect(
      rules.calculatePaymentDistribution({
        pendingBalance: 50,
        requestedMethod: 'Mixto',
        cashAmount: 20,
        qrAmount: 10,
        receivedAmount: 20,
        qrReference: 'QR-001',
      }),
    ).toMatchObject({ appliedAmount: 30, paymentMethod: 'Mixto', changeAmount: 0 });
  });

  it('rechaza una transición de preparación inválida', () => {
    expect(() => rules.assertPreparationTransition('En cola', 'Listo')).toThrow();
  });
});
