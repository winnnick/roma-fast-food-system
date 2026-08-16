import { Inject, NotFoundException } from '@nestjs/common';
import {
  CommandHandler,
  type ICommandHandler,
  QueryHandler,
  type IQueryHandler,
} from '@nestjs/cqrs';

import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
} from '../../domain/ports/inventory.ports';
import {
  ChangeIngredientStatusCommand,
  CreateIngredientCommand,
  FinishCurrentRecipeCommand,
  RegisterInventoryAdjustmentCommand,
  RegisterInventoryCountCommand,
  RegisterInventoryEntryCommand,
  RegisterSaleConsumptionCommand,
  SaveRecipeVersionCommand,
  TreatCancelledSaleInventoryCommand,
  UpdateIngredientCommand,
} from './inventory.commands';
import {
  type IngredientView,
  type InventoryCountView,
  type InventoryEvaluationView,
  type InventoryMovementView,
  type InventorySummaryView,
  type RecipeView,
  type SaleConsumptionView,
  toConsumptionView,
  toCountView,
  toEvaluationView,
  toIngredientView,
  toMovementView,
  toRecipeView,
  toSummaryView,
} from './inventory.views';
import {
  EvaluateSaleInventoryQuery,
  GetCurrentRecipeByProductQuery,
  GetIngredientByIdQuery,
  GetInventorySummaryQuery,
  ListIngredientsQuery,
  ListInventoryCountsQuery,
  ListInventoryMovementsQuery,
  ListRecipesQuery,
  ListSaleConsumptionsQuery,
} from './inventory.queries';

@CommandHandler(CreateIngredientCommand)
export class CreateIngredientHandler implements ICommandHandler<
  CreateIngredientCommand,
  IngredientView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: CreateIngredientCommand): Promise<IngredientView> {
    return toIngredientView(await this.repository.createIngredient(command.input, command.actor));
  }
}

@CommandHandler(UpdateIngredientCommand)
export class UpdateIngredientHandler implements ICommandHandler<
  UpdateIngredientCommand,
  IngredientView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: UpdateIngredientCommand): Promise<IngredientView> {
    const result = await this.repository.updateIngredient(command.id, command.input, command.actor);
    if (!result) throw new NotFoundException('El insumo seleccionado no existe.');
    return toIngredientView(result);
  }
}

@CommandHandler(ChangeIngredientStatusCommand)
export class ChangeIngredientStatusHandler implements ICommandHandler<
  ChangeIngredientStatusCommand,
  IngredientView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: ChangeIngredientStatusCommand): Promise<IngredientView> {
    const result = await this.repository.changeIngredientStatus(
      command.id,
      command.status,
      command.actor,
    );
    if (!result) throw new NotFoundException('El insumo seleccionado no existe.');
    return toIngredientView(result);
  }
}

@CommandHandler(RegisterInventoryEntryCommand)
export class RegisterInventoryEntryHandler implements ICommandHandler<
  RegisterInventoryEntryCommand,
  InventoryMovementView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: RegisterInventoryEntryCommand): Promise<InventoryMovementView> {
    return toMovementView(await this.repository.registerEntry(command.input));
  }
}

@CommandHandler(RegisterInventoryAdjustmentCommand)
export class RegisterInventoryAdjustmentHandler implements ICommandHandler<
  RegisterInventoryAdjustmentCommand,
  InventoryMovementView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: RegisterInventoryAdjustmentCommand): Promise<InventoryMovementView> {
    return toMovementView(await this.repository.registerAdjustment(command.input));
  }
}

@CommandHandler(SaveRecipeVersionCommand)
export class SaveRecipeVersionHandler implements ICommandHandler<
  SaveRecipeVersionCommand,
  RecipeView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: SaveRecipeVersionCommand): Promise<RecipeView> {
    return toRecipeView(await this.repository.saveRecipeVersion(command.input));
  }
}

@CommandHandler(FinishCurrentRecipeCommand)
export class FinishCurrentRecipeHandler implements ICommandHandler<
  FinishCurrentRecipeCommand,
  RecipeView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: FinishCurrentRecipeCommand): Promise<RecipeView> {
    const result = await this.repository.finishCurrentRecipe(command.productId, command.actor);
    if (!result) throw new NotFoundException('El producto no tiene una receta vigente.');
    return toRecipeView(result);
  }
}

@CommandHandler(RegisterSaleConsumptionCommand)
export class RegisterSaleConsumptionHandler implements ICommandHandler<
  RegisterSaleConsumptionCommand,
  SaleConsumptionView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: RegisterSaleConsumptionCommand): Promise<SaleConsumptionView> {
    return toConsumptionView(await this.repository.registerSaleConsumption(command.input));
  }
}

@CommandHandler(TreatCancelledSaleInventoryCommand)
export class TreatCancelledSaleInventoryHandler implements ICommandHandler<
  TreatCancelledSaleInventoryCommand,
  SaleConsumptionView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: TreatCancelledSaleInventoryCommand): Promise<SaleConsumptionView> {
    return toConsumptionView(
      await this.repository.applyCancellationTreatment({
        saleId: command.saleId,
        orderNumber: command.orderNumber,
        treatment: command.treatment,
        reason: command.reason,
        userId: command.actor.userId,
        userName: command.actor.userName,
      }),
    );
  }
}

@CommandHandler(RegisterInventoryCountCommand)
export class RegisterInventoryCountHandler implements ICommandHandler<
  RegisterInventoryCountCommand,
  InventoryCountView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(command: RegisterInventoryCountCommand): Promise<InventoryCountView> {
    return toCountView(
      await this.repository.registerCount({
        observations: command.observations,
        details: command.details,
        userId: command.actor.userId,
        userName: command.actor.userName,
      }),
    );
  }
}

@QueryHandler(ListIngredientsQuery)
export class ListIngredientsHandler implements IQueryHandler<
  ListIngredientsQuery,
  IngredientView[]
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(): Promise<IngredientView[]> {
    return (await this.repository.listIngredients()).map(toIngredientView);
  }
}

@QueryHandler(GetIngredientByIdQuery)
export class GetIngredientByIdHandler implements IQueryHandler<
  GetIngredientByIdQuery,
  IngredientView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(query: GetIngredientByIdQuery): Promise<IngredientView> {
    const result = await this.repository.findIngredientById(query.id);
    if (!result) throw new NotFoundException('El insumo seleccionado no existe.');
    return toIngredientView(result);
  }
}

@QueryHandler(ListRecipesQuery)
export class ListRecipesHandler implements IQueryHandler<ListRecipesQuery, RecipeView[]> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(): Promise<RecipeView[]> {
    return (await this.repository.listRecipes()).map(toRecipeView);
  }
}

@QueryHandler(GetCurrentRecipeByProductQuery)
export class GetCurrentRecipeByProductHandler implements IQueryHandler<
  GetCurrentRecipeByProductQuery,
  RecipeView | null
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(query: GetCurrentRecipeByProductQuery): Promise<RecipeView | null> {
    const result = await this.repository.findCurrentRecipeByProduct(query.productId);
    return result ? toRecipeView(result) : null;
  }
}

@QueryHandler(EvaluateSaleInventoryQuery)
export class EvaluateSaleInventoryHandler implements IQueryHandler<
  EvaluateSaleInventoryQuery,
  InventoryEvaluationView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(query: EvaluateSaleInventoryQuery): Promise<InventoryEvaluationView> {
    return toEvaluationView(await this.repository.evaluateSale(query.details));
  }
}

@QueryHandler(ListSaleConsumptionsQuery)
export class ListSaleConsumptionsHandler implements IQueryHandler<
  ListSaleConsumptionsQuery,
  SaleConsumptionView[]
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(): Promise<SaleConsumptionView[]> {
    return (await this.repository.listSaleConsumptions()).map(toConsumptionView);
  }
}

@QueryHandler(ListInventoryMovementsQuery)
export class ListInventoryMovementsHandler implements IQueryHandler<
  ListInventoryMovementsQuery,
  InventoryMovementView[]
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(query: ListInventoryMovementsQuery): Promise<InventoryMovementView[]> {
    return (await this.repository.listMovements(query.filter)).map(toMovementView);
  }
}

@QueryHandler(ListInventoryCountsQuery)
export class ListInventoryCountsHandler implements IQueryHandler<
  ListInventoryCountsQuery,
  InventoryCountView[]
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(): Promise<InventoryCountView[]> {
    return (await this.repository.listCounts()).map(toCountView);
  }
}

@QueryHandler(GetInventorySummaryQuery)
export class GetInventorySummaryHandler implements IQueryHandler<
  GetInventorySummaryQuery,
  InventorySummaryView
> {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepositoryPort) {}
  async execute(): Promise<InventorySummaryView> {
    return toSummaryView(await this.repository.getSummary());
  }
}
