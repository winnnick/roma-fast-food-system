import type {
  CashMovementSnapshot,
  CashSessionSnapshot,
  CashSummarySnapshot,
  PreparedSaleInput,
  PreparationStartMode,
  PreparationStatus,
  RegisterManualMovementInput,
  RegisterPaymentInput,
  SalePaymentSnapshot,
  SaleSnapshot,
  SaleInventoryStatus,
} from '../operations/operations.models';

export const OPERATIONS_TRANSACTION_REPOSITORY = Symbol('OPERATIONS_TRANSACTION_REPOSITORY');

export interface OperationsTransactionRepositoryPort {
  listSales(): Promise<SaleSnapshot[]>;
  findSaleById(id: number): Promise<SaleSnapshot | null>;
  createSale(input: PreparedSaleInput): Promise<SaleSnapshot>;
  changePreparationStatus(
    saleId: number,
    status: PreparationStatus,
    delivery: { userId: number; userName: string; cashSessionId: number } | null,
  ): Promise<SaleSnapshot | null>;
  cancelSale(saleId: number, reason: string): Promise<SaleSnapshot | null>;
  updateSaleInventoryState(
    saleId: number,
    status: SaleInventoryStatus,
    consumptionId: number | null,
    error: string | null,
  ): Promise<SaleSnapshot | null>;

  getPreparationStartMode(): Promise<PreparationStartMode>;
  setPreparationStartMode(mode: PreparationStartMode): Promise<PreparationStartMode>;
  countQueuedSales(): Promise<number>;

  findOpenCashSessionByUser(userId: number): Promise<CashSessionSnapshot | null>;
  listCashSessions(): Promise<CashSessionSnapshot[]>;
  listCashMovements(cashSessionId?: number): Promise<CashMovementSnapshot[]>;
  listPayments(saleId?: number): Promise<SalePaymentSnapshot[]>;
  openCashSession(
    userId: number,
    userName: string,
    initialAmount: number,
    note: string | null,
  ): Promise<CashSessionSnapshot>;
  registerManualMovement(input: RegisterManualMovementInput): Promise<CashMovementSnapshot>;
  calculateCashSummary(cashSessionId: number): Promise<CashSummarySnapshot>;
  closeCashSession(
    userId: number,
    userName: string,
    countedAmount: number,
    note: string | null,
  ): Promise<CashSessionSnapshot>;
  registerPayment(input: RegisterPaymentInput): Promise<{
    payment: SalePaymentSnapshot;
    sale: SaleSnapshot;
  }>;
}
