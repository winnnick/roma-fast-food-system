import type {
  CreateSaleInput,
  DiscountType,
  PaymentMethod,
  PreparationStartMode,
  PreparationStatus,
} from '../../domain/operations/operations.models';

export class CreateSaleCommand {
  constructor(public readonly input: CreateSaleInput) {}
}
export class ChangePreparationStatusCommand {
  constructor(
    public readonly saleId: number,
    public readonly status: PreparationStatus,
    public readonly userId: number,
    public readonly userName: string,
  ) {}
}
export class CancelSaleCommand {
  constructor(
    public readonly saleId: number,
    public readonly reason: string,
    public readonly inventoryTreatment: 'Reintegrar insumos' | 'Registrar como merma',
    public readonly userId: number,
    public readonly userName: string,
  ) {}
}
export class ChangePreparationStartModeCommand {
  constructor(public readonly mode: PreparationStartMode) {}
}
export class OpenCashSessionCommand {
  constructor(
    public readonly userId: number,
    public readonly userName: string,
    public readonly initialAmount: number,
    public readonly note: string | null,
  ) {}
}
export class RegisterManualCashMovementCommand {
  constructor(
    public readonly type: 'Ingreso' | 'Egreso',
    public readonly concept: string,
    public readonly amount: number,
    public readonly userId: number,
    public readonly userName: string,
  ) {}
}
export class CloseCashSessionCommand {
  constructor(
    public readonly userId: number,
    public readonly userName: string,
    public readonly countedAmount: number,
    public readonly note: string | null,
  ) {}
}
export class RegisterSalePaymentCommand {
  constructor(
    public readonly saleId: number,
    public readonly discountType: DiscountType,
    public readonly discountValue: number,
    public readonly discountReason: string | null,
    public readonly paymentMethod: PaymentMethod,
    public readonly qrAmount: number,
    public readonly cashAmount: number,
    public readonly receivedAmount: number,
    public readonly qrReference: string | null,
    public readonly userId: number,
    public readonly userName: string,
  ) {}
}
