import type {
  CancellationTreatment,
  CreateIngredientInput,
  IngredientStatus,
  InventoryActor,
  InventoryAdjustmentInput,
  InventoryCountDetailInput,
  InventoryEntryInput,
  RegisterSaleConsumptionInput,
  SaleInventoryDetailInput,
  SaveRecipeInput,
  UpsertIngredientInput,
} from '../../domain/inventory/inventory.models';

export class CreateIngredientCommand {
  constructor(
    public readonly input: CreateIngredientInput,
    public readonly actor: InventoryActor,
  ) {}
}

export class UpdateIngredientCommand {
  constructor(
    public readonly id: number,
    public readonly input: UpsertIngredientInput,
    public readonly actor: InventoryActor,
  ) {}
}

export class ChangeIngredientStatusCommand {
  constructor(
    public readonly id: number,
    public readonly status: IngredientStatus,
    public readonly actor: InventoryActor,
  ) {}
}

export class RegisterInventoryEntryCommand {
  constructor(public readonly input: InventoryEntryInput) {}
}

export class RegisterInventoryAdjustmentCommand {
  constructor(public readonly input: InventoryAdjustmentInput) {}
}

export class SaveRecipeVersionCommand {
  constructor(public readonly input: SaveRecipeInput) {}
}

export class FinishCurrentRecipeCommand {
  constructor(
    public readonly productId: number,
    public readonly actor: InventoryActor,
  ) {}
}

export class RegisterSaleConsumptionCommand {
  constructor(public readonly input: RegisterSaleConsumptionInput) {}
}

export class TreatCancelledSaleInventoryCommand {
  constructor(
    public readonly saleId: number,
    public readonly orderNumber: string,
    public readonly treatment: CancellationTreatment,
    public readonly reason: string,
    public readonly actor: InventoryActor,
  ) {}
}

export class RegisterInventoryCountCommand {
  constructor(
    public readonly observations: string | null,
    public readonly details: InventoryCountDetailInput[],
    public readonly actor: InventoryActor,
  ) {}
}

export class EvaluateInventoryInput {
  constructor(public readonly details: SaleInventoryDetailInput[]) {}
}
