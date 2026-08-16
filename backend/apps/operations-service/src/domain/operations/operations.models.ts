export type SalesChannel = 'Local' | 'PedidosYa';
export type SaleClientType = 'Consumidor final' | 'Registrado' | 'Ocasional';
export type PreparationStatus =
  'En cola' | 'En preparación' | 'Entrega directa' | 'Listo' | 'Entregado' | 'Anulado';
export type PreparationStartMode = 'En cola' | 'En preparación';
export type PaymentStatus =
  'Pendiente de cobro' | 'Cobrada' | 'Pendiente de liquidación' | 'Liquidada' | 'Anulada';
export type DiscountType = 'Ninguno' | 'Porcentaje' | 'Monto fijo';
export type PaymentMethod = 'Efectivo' | 'QR' | 'Mixto';
export type CashSessionStatus = 'Abierta' | 'Cerrada';
export type CashMovementType = 'Venta' | 'Ingreso' | 'Egreso';

export interface SaleDetailSnapshot {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  note: string | null;
  subtotal: number;
  requiresPreparation: boolean;
}

export interface SaleSnapshot {
  id: number;
  orderNumber: string;
  salesChannel: SalesChannel;
  pedidosYaReference: string | null;
  pedidosYaSettlementId: number | null;
  pedidosYaSettledAt: Date | null;
  clientType: SaleClientType;
  clientId: number | null;
  clientName: string;
  registeredByUserId: number;
  registeredByUserName: string;
  registrationCashSessionId: number;
  details: SaleDetailSnapshot[];
  observations: string | null;
  requiresPreparation: boolean;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  discountReason: string | null;
  total: number;
  preparationStatus: PreparationStatus;
  paymentStatus: PaymentStatus;
  lastPaymentId: number | null;
  accumulatedPaymentMethod: PaymentMethod | null;
  cancellationReason: string | null;
  registeredAt: Date;
  preparationStartedAt: Date | null;
  readyAt: Date | null;
  deliveredAt: Date | null;
  deliveredByUserId: number | null;
  deliveredByUserName: string | null;
  deliveryCashSessionId: number | null;
  fullyPaidAt: Date | null;
  cancelledAt: Date | null;
  updatedAt: Date;
}

export interface CreateSaleDetailInput {
  productId: number;
  quantity: number;
  note: string | null;
}

export interface CreateSaleInput {
  salesChannel: SalesChannel;
  pedidosYaReference: string | null;
  clientType: SaleClientType;
  clientId: number | null;
  clientName: string | null;
  details: CreateSaleDetailInput[];
  observations: string | null;
  userId: number;
  userName: string;
}

export interface PreparedSaleInput {
  salesChannel: SalesChannel;
  pedidosYaReference: string | null;
  clientType: SaleClientType;
  clientId: number | null;
  clientName: string;
  details: Array<{
    productId: number;
    productCode: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    note: string | null;
    subtotal: number;
    requiresPreparation: boolean;
  }>;
  observations: string | null;
  requiresPreparation: boolean;
  subtotal: number;
  preparationStatus: PreparationStatus;
  paymentStatus: PaymentStatus;
  userId: number;
  userName: string;
  cashSessionId: number;
}

export interface CashSessionSnapshot {
  id: number;
  status: CashSessionStatus;
  openingUserId: number;
  openingUserName: string;
  initialAmount: number;
  openingNote: string | null;
  openedAt: Date;
  closingUserId: number | null;
  closingUserName: string | null;
  countedAmount: number | null;
  expectedCash: number | null;
  difference: number | null;
  closingNote: string | null;
  closedAt: Date | null;
}

export interface CashMovementSnapshot {
  id: number;
  cashSessionId: number;
  type: CashMovementType;
  concept: string;
  amount: number;
  cashAmount: number;
  qrAmount: number;
  paymentMethod: PaymentMethod | null;
  saleId: number | null;
  orderNumber: string | null;
  userId: number;
  userName: string;
  registeredAt: Date;
}

export interface SalePaymentSnapshot {
  id: number;
  cashSessionId: number;
  saleId: number;
  orderNumber: string;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  discountReason: string | null;
  saleTotal: number;
  appliedAmount: number;
  paymentMethod: PaymentMethod;
  cashAmount: number;
  qrAmount: number;
  receivedAmount: number;
  changeAmount: number;
  qrReference: string | null;
  userId: number;
  userName: string;
  paidAt: Date;
}

export interface CashSummarySnapshot {
  cashSessionId: number;
  initialAmount: number;
  salesCount: number;
  totalSales: number;
  totalCashSales: number;
  totalQrSales: number;
  manualIncomeTotal: number;
  manualExpenseTotal: number;
  expectedCash: number;
}

export interface RegisterPaymentInput {
  saleId: number;
  discountType: DiscountType;
  discountValue: number;
  discountReason: string | null;
  paymentMethod: PaymentMethod;
  qrAmount: number;
  cashAmount: number;
  receivedAmount: number;
  qrReference: string | null;
  userId: number;
  userName: string;
}

export interface RegisterManualMovementInput {
  type: 'Ingreso' | 'Egreso';
  concept: string;
  amount: number;
  userId: number;
  userName: string;
}
