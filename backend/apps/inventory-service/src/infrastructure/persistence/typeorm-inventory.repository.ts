import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, ILike } from 'typeorm';

import { InventoryRulesService } from '../../application/inventory/inventory-rules.service';
import type {
  CancellationTreatmentInput,
  CreateIngredientInput,
  IngredientSnapshot,
  IngredientStatus,
  InventoryActor,
  InventoryAdjustmentInput,
  InventoryCountInput,
  InventoryCountSnapshot,
  InventoryEntryInput,
  InventoryEvaluationSnapshot,
  InventoryMovementFilter,
  InventoryMovementSnapshot,
  InventoryProjectionSnapshot,
  InventorySummarySnapshot,
  RegisterSaleConsumptionInput,
  RecipeSnapshot,
  SaleConsumptionSnapshot,
  SaleInventoryDetailInput,
  SaveRecipeInput,
  UpsertIngredientInput,
} from '../../domain/inventory/inventory.models';
import type { InventoryRepositoryPort } from '../../domain/ports/inventory.ports';
import { IngredientOrmEntity } from './entities/ingredient.orm-entity';
import { InventoryCountDetailOrmEntity } from './entities/inventory-count-detail.orm-entity';
import { InventoryCountOrmEntity } from './entities/inventory-count.orm-entity';
import { InventoryMovementOrmEntity } from './entities/movement.orm-entity';
import { ProductReferenceOrmEntity } from './entities/product-reference.orm-entity';
import { RecipeItemOrmEntity } from './entities/recipe-item.orm-entity';
import { RecipeOrmEntity } from './entities/recipe.orm-entity';
import { SaleConsumptionDetailOrmEntity } from './entities/sale-consumption-detail.orm-entity';
import { SaleConsumptionOrmEntity } from './entities/sale-consumption.orm-entity';

@Injectable()
export class TypeOrmInventoryRepository implements InventoryRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rules: InventoryRulesService,
  ) {}

  async listIngredients(): Promise<IngredientSnapshot[]> {
    const rows = await this.dataSource.getRepository(IngredientOrmEntity).find({
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toIngredient(row));
  }

  async findIngredientById(id: number): Promise<IngredientSnapshot | null> {
    const row = await this.dataSource.getRepository(IngredientOrmEntity).findOneBy({ id });
    return row ? this.toIngredient(row) : null;
  }

  async createIngredient(
    input: CreateIngredientInput,
    actor: InventoryActor,
  ): Promise<IngredientSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      const prepared = this.prepareIngredientInput(input);
      await this.ensureIngredientUnique(manager, prepared.code, prepared.name);
      const initialPurchaseQuantity = this.rules.requireNonNegative(
        input.initialPurchaseQuantity,
        'El stock inicial',
      );
      const initialStock = this.rules.roundQuantity(
        initialPurchaseQuantity * prepared.purchaseConversionFactor,
      );
      let unitCost: number | null = null;
      let totalCost: number | null = null;
      if (prepared.economicControl) {
        if (input.initialPresentationCost === null) {
          throw new BadRequestException(
            'Debes indicar el costo por presentación inicial para un insumo valorado.',
          );
        }
        this.rules.requirePositive(input.initialPresentationCost, 'El costo por presentación');
        unitCost = this.rules.roundUnitCost(
          input.initialPresentationCost / prepared.purchaseConversionFactor,
        );
        totalCost = this.rules.roundMoney(input.initialPresentationCost * initialPurchaseQuantity);
      }
      const repo = manager.getRepository(IngredientOrmEntity);
      const row = repo.create({
        ...prepared,
        stock: initialStock,
        averageBaseUnitCost: unitCost,
        status: 'Activo',
        updatedByUserId: actor.userId,
        updatedByUserName: actor.userName,
      });
      const saved = await repo.save(row);
      if (initialStock > 0) {
        await this.saveMovement(manager, {
          ingredient: saved,
          type: 'Stock inicial',
          origin: 'Configuración inicial',
          quantity: initialStock,
          classifiedQuantity: null,
          previousStock: 0,
          resultingStock: initialStock,
          reason: 'Stock inicial del insumo.',
          reference: null,
          saleId: null,
          orderNumber: null,
          recipeVersionIds: [],
          appliedUnitCost: unitCost,
          economicImpact: totalCost,
          actor,
        });
      }
      return this.toIngredient(saved);
    });
  }

  async updateIngredient(
    id: number,
    input: UpsertIngredientInput,
    actor: InventoryActor,
  ): Promise<IngredientSnapshot | null> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(IngredientOrmEntity);
      const row = await repo
        .createQueryBuilder('ingredient')
        .setLock('pessimistic_write')
        .where('ingredient.id = :id', { id })
        .getOne();
      if (!row) return null;
      const prepared = this.prepareIngredientInput(input);
      await this.ensureIngredientUnique(manager, prepared.code, prepared.name, id);
      let cost: number | null = null;
      if (prepared.economicControl) {
        const presentationCost =
          input.currentPresentationCost ??
          (row.economicControl && row.averageBaseUnitCost !== null
            ? row.averageBaseUnitCost * prepared.purchaseConversionFactor
            : null);
        if (presentationCost === null) {
          throw new BadRequestException(
            'Debes indicar el costo actual por presentación para activar la valoración económica.',
          );
        }
        this.rules.requirePositive(presentationCost, 'El costo actual por presentación');
        cost = this.rules.roundUnitCost(presentationCost / prepared.purchaseConversionFactor);
      }
      Object.assign(row, prepared, {
        averageBaseUnitCost: cost,
        updatedByUserId: actor.userId,
        updatedByUserName: actor.userName,
      });
      return this.toIngredient(await repo.save(row));
    });
  }

  async changeIngredientStatus(
    id: number,
    status: IngredientStatus,
    actor: InventoryActor,
  ): Promise<IngredientSnapshot | null> {
    const repo = this.dataSource.getRepository(IngredientOrmEntity);
    const row = await repo.findOneBy({ id });
    if (!row) return null;
    row.status = status;
    row.updatedByUserId = actor.userId;
    row.updatedByUserName = actor.userName;
    return this.toIngredient(await repo.save(row));
  }

  async registerEntry(input: InventoryEntryInput): Promise<InventoryMovementSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      const ingredient = await this.findIngredientForUpdate(manager, input.ingredientId);
      if (!ingredient) throw new NotFoundException('El insumo seleccionado no existe.');
      if (ingredient.status !== 'Activo') {
        throw new ConflictException('No se pueden registrar entradas para un insumo inactivo.');
      }
      const purchaseQuantity = this.rules.requirePositive(
        input.purchaseQuantity,
        'La cantidad de entrada',
      );
      const reason = this.rules.normalizeText(input.reason, 'El motivo', 5, 200);
      const baseQuantity = this.rules.roundQuantity(
        purchaseQuantity * ingredient.purchaseConversionFactor,
      );
      const previousStock = ingredient.stock;
      const resultingStock = this.rules.roundQuantity(previousStock + baseQuantity);
      let newUnitCost = ingredient.averageBaseUnitCost;
      let economicImpact: number | null = null;
      if (ingredient.economicControl) {
        if (input.totalCost === null) {
          throw new BadRequestException(
            'Ingresa el costo total de la entrada para mantener la valoración económica.',
          );
        }
        newUnitCost = this.rules.weightedAverageCost(
          previousStock,
          ingredient.averageBaseUnitCost,
          baseQuantity,
          input.totalCost,
        );
        economicImpact = this.rules.roundMoney(input.totalCost);
      }
      ingredient.stock = resultingStock;
      ingredient.averageBaseUnitCost = ingredient.economicControl ? newUnitCost : null;
      ingredient.updatedByUserId = input.userId;
      ingredient.updatedByUserName = input.userName;
      await manager.getRepository(IngredientOrmEntity).save(ingredient);
      const movement = await this.saveMovement(manager, {
        ingredient,
        type: 'Entrada',
        origin: 'Compra',
        quantity: baseQuantity,
        classifiedQuantity: null,
        previousStock,
        resultingStock,
        reason,
        reference: input.reference?.trim() || null,
        saleId: null,
        orderNumber: null,
        recipeVersionIds: [],
        appliedUnitCost: ingredient.economicControl ? newUnitCost : null,
        economicImpact,
        actor: input,
      });
      return this.toMovement(movement);
    });
  }

  async registerAdjustment(input: InventoryAdjustmentInput): Promise<InventoryMovementSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      const ingredient = await this.findIngredientForUpdate(manager, input.ingredientId);
      if (!ingredient) throw new NotFoundException('El insumo seleccionado no existe.');
      if (!Number.isFinite(input.adjustmentQuantity) || input.adjustmentQuantity === 0) {
        throw new BadRequestException('La cantidad del ajuste debe ser distinta de cero.');
      }
      const reason = this.rules.normalizeText(input.reason, 'El motivo', 5, 200);
      const quantity = this.rules.roundQuantity(input.adjustmentQuantity);
      const previousStock = ingredient.stock;
      const resultingStock = this.rules.roundQuantity(previousStock + quantity);
      ingredient.stock = resultingStock;
      ingredient.updatedByUserId = input.userId;
      ingredient.updatedByUserName = input.userName;
      await manager.getRepository(IngredientOrmEntity).save(ingredient);
      const unitCost = ingredient.economicControl ? ingredient.averageBaseUnitCost : null;
      const economicImpact = unitCost === null ? null : this.rules.roundMoney(quantity * unitCost);
      const movement = await this.saveMovement(manager, {
        ingredient,
        type: quantity > 0 ? 'Ajuste positivo' : 'Ajuste negativo',
        origin: 'Ajuste manual',
        quantity,
        classifiedQuantity: null,
        previousStock,
        resultingStock,
        reason,
        reference: null,
        saleId: null,
        orderNumber: null,
        recipeVersionIds: [],
        appliedUnitCost: unitCost,
        economicImpact,
        actor: input,
      });
      return this.toMovement(movement);
    });
  }

  async listRecipes(): Promise<RecipeSnapshot[]> {
    const rows = await this.dataSource.getRepository(RecipeOrmEntity).find({
      relations: { items: true },
      order: { productId: 'ASC', version: 'DESC' },
    });
    return this.mapRecipes(rows);
  }

  async findCurrentRecipeByProduct(productId: number): Promise<RecipeSnapshot | null> {
    const row = await this.dataSource.getRepository(RecipeOrmEntity).findOne({
      where: { productId, status: 'Vigente' },
      relations: { items: true },
    });
    return row ? ((await this.mapRecipes([row]))[0] ?? null) : null;
  }

  async saveRecipeVersion(input: SaveRecipeInput): Promise<RecipeSnapshot> {
    if (input.ingredients.length === 0) {
      throw new BadRequestException('La receta debe contener al menos un insumo.');
    }
    const uniqueIds = new Set(input.ingredients.map((item) => item.ingredientId));
    if (uniqueIds.size !== input.ingredients.length) {
      throw new BadRequestException('No puedes repetir un insumo dentro de la misma receta.');
    }
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [10_000_000 + input.productId]);
      const product = await manager
        .getRepository(ProductReferenceOrmEntity)
        .findOneBy({ productId: input.productId });
      if (!product) {
        throw new NotFoundException('El producto no existe en la proyección de Inventory.');
      }
      if (product.inventoryControl !== 'Con receta') {
        throw new ConflictException('El producto está configurado para no controlar inventario.');
      }
      const ingredientRepo = manager.getRepository(IngredientOrmEntity);
      const ingredients = await ingredientRepo
        .createQueryBuilder('ingredient')
        .where('ingredient.id IN (:...ids)', { ids: [...uniqueIds] })
        .getMany();
      if (ingredients.length !== uniqueIds.size) {
        throw new NotFoundException('Uno o más insumos de la receta no existen.');
      }
      for (const item of input.ingredients) {
        this.rules.requirePositive(item.quantityPerProduct, 'La cantidad por producto');
      }
      const recipeRepo = manager.getRepository(RecipeOrmEntity);
      const current = await recipeRepo.findOneBy({
        productId: input.productId,
        status: 'Vigente',
      });
      const previousMax = await recipeRepo
        .createQueryBuilder('recipe')
        .select('MAX(recipe.version)', 'max')
        .where('recipe.productId = :productId', { productId: input.productId })
        .getRawOne<{ max: string | null }>();
      const now = new Date();
      if (current) {
        current.status = 'Histórica';
        current.validUntil = now;
        await recipeRepo.save(current);
      }
      const recipe = await recipeRepo.save(
        recipeRepo.create({
          productId: product.productId,
          productCode: product.code,
          productName: product.name,
          version: Number(previousMax?.max ?? 0) + 1,
          status: 'Vigente',
          validFrom: now,
          validUntil: null,
          registeredByUserId: input.userId,
          registeredByUserName: input.userName,
        }),
      );
      const itemRepo = manager.getRepository(RecipeItemOrmEntity);
      await itemRepo.save(
        input.ingredients.map((item) =>
          itemRepo.create({
            recipeId: recipe.id,
            ingredientId: item.ingredientId,
            quantityPerProduct: this.rules.roundQuantity(item.quantityPerProduct),
          }),
        ),
      );
      const loaded = await recipeRepo.findOne({
        where: { id: recipe.id },
        relations: { items: true },
      });
      if (!loaded) throw new Error('No fue posible recargar la nueva versión de receta.');
      return (await this.mapRecipes([loaded]))[0];
    });
  }

  async finishCurrentRecipe(
    productId: number,
    actor: InventoryActor,
  ): Promise<RecipeSnapshot | null> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RecipeOrmEntity);
      const row = await repo.findOne({
        where: { productId, status: 'Vigente' },
        relations: { items: true },
      });
      if (!row) return null;
      row.status = 'Histórica';
      row.validUntil = new Date();
      row.registeredByUserId = actor.userId;
      row.registeredByUserName = actor.userName;
      const saved = await repo.save(row);
      return (await this.mapRecipes([saved]))[0];
    });
  }

  async evaluateSale(details: SaleInventoryDetailInput[]): Promise<InventoryEvaluationSnapshot> {
    return this.evaluateWithManager(this.dataSource.manager, details, false);
  }

  async registerSaleConsumption(
    input: RegisterSaleConsumptionInput,
  ): Promise<SaleConsumptionSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [input.saleId]);
      const consumptionRepo = manager.getRepository(SaleConsumptionOrmEntity);
      const existing = await consumptionRepo.findOne({
        where: { saleId: input.saleId },
        relations: { details: true },
      });
      if (existing) return this.toConsumption(existing);

      const evaluation = await this.evaluateWithManager(manager, input.details, true);
      if (evaluation.blocked) {
        throw new ConflictException(
          'La venta utiliza un insumo inactivo o configurado para bloquear faltantes.',
        );
      }
      if (evaluation.requiresConfirmation && !input.authorizeNegativeBalance) {
        throw new ConflictException(
          'La venta dejará existencias negativas y requiere confirmación.',
        );
      }
      const now = new Date();
      const consumption = await consumptionRepo.save(
        consumptionRepo.create({
          saleId: input.saleId,
          orderNumber: input.orderNumber,
          status: 'Aplicado',
          authorizedNegativeBalance:
            evaluation.requiresConfirmation && input.authorizeNegativeBalance,
          registeredAt: now,
          treatmentAt: null,
          cancellationTreatment: null,
          treatmentReason: null,
          registeredByUserId: input.userId,
          registeredByUserName: input.userName,
          treatmentByUserId: null,
          treatmentByUserName: null,
        }),
      );
      const detailRepo = manager.getRepository(SaleConsumptionDetailOrmEntity);
      const ingredientRepo = manager.getRepository(IngredientOrmEntity);
      const savedDetails: SaleConsumptionDetailOrmEntity[] = [];
      for (const projection of evaluation.projections) {
        const ingredient = await ingredientRepo
          .createQueryBuilder('ingredient')
          .setLock('pessimistic_write')
          .where('ingredient.id = :id', { id: projection.ingredientId })
          .getOne();
        if (!ingredient)
          throw new NotFoundException('No se encontró uno de los insumos requeridos.');
        const previousStock = ingredient.stock;
        const resultingStock = this.rules.roundQuantity(
          previousStock - projection.requiredQuantity,
        );
        const unitCost = ingredient.economicControl ? ingredient.averageBaseUnitCost : null;
        const totalCost =
          unitCost === null ? null : this.rules.roundMoney(projection.requiredQuantity * unitCost);
        ingredient.stock = resultingStock;
        ingredient.updatedByUserId = input.userId;
        ingredient.updatedByUserName = input.userName;
        await ingredientRepo.save(ingredient);
        await this.saveMovement(manager, {
          ingredient,
          type: 'Consumo automático',
          origin: 'Venta',
          quantity: -projection.requiredQuantity,
          classifiedQuantity: null,
          previousStock,
          resultingStock,
          reason: `Consumo automático por ${input.orderNumber}.`,
          reference: input.orderNumber,
          saleId: input.saleId,
          orderNumber: input.orderNumber,
          recipeVersionIds: projection.recipeVersionIds,
          appliedUnitCost: unitCost,
          economicImpact: totalCost === null ? null : -totalCost,
          actor: input,
        });
        savedDetails.push(
          await detailRepo.save(
            detailRepo.create({
              consumptionId: consumption.id,
              ingredientId: ingredient.id,
              ingredientCode: ingredient.code,
              ingredientName: ingredient.name,
              baseUnit: ingredient.baseUnit,
              consumedQuantity: projection.requiredQuantity,
              previousStock,
              resultingStock,
              appliedUnitCost: unitCost,
              appliedTotalCost: totalCost,
              recipeVersionIds: projection.recipeVersionIds,
              relatedProducts: projection.relatedProducts,
            }),
          ),
        );
      }
      consumption.details = savedDetails;
      return this.toConsumption(consumption);
    });
  }

  async applyCancellationTreatment(
    input: CancellationTreatmentInput,
  ): Promise<SaleConsumptionSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [input.saleId]);
      const repo = manager.getRepository(SaleConsumptionOrmEntity);
      const consumption = await repo.findOne({
        where: { saleId: input.saleId },
        relations: { details: true },
      });
      if (!consumption) {
        throw new NotFoundException('La venta no tiene un consumo de inventario registrado.');
      }
      if (consumption.status !== 'Aplicado') {
        return this.toConsumption(consumption);
      }
      const reason = this.rules.normalizeText(input.reason, 'El motivo', 5, 200);
      const ingredientRepo = manager.getRepository(IngredientOrmEntity);
      for (const detail of consumption.details) {
        const ingredient = await ingredientRepo
          .createQueryBuilder('ingredient')
          .setLock('pessimistic_write')
          .where('ingredient.id = :id', { id: detail.ingredientId })
          .getOne();
        if (!ingredient)
          throw new NotFoundException('No se encontró uno de los insumos consumidos.');
        if (input.treatment === 'Reintegrar insumos') {
          const previousStock = ingredient.stock;
          const resultingStock = this.rules.roundQuantity(previousStock + detail.consumedQuantity);
          ingredient.stock = resultingStock;
          ingredient.updatedByUserId = input.userId;
          ingredient.updatedByUserName = input.userName;
          await ingredientRepo.save(ingredient);
          await this.saveMovement(manager, {
            ingredient,
            type: 'Reversión por anulación',
            origin: 'Anulación',
            quantity: detail.consumedQuantity,
            classifiedQuantity: null,
            previousStock,
            resultingStock,
            reason,
            reference: input.orderNumber,
            saleId: input.saleId,
            orderNumber: input.orderNumber,
            recipeVersionIds: detail.recipeVersionIds,
            appliedUnitCost: detail.appliedUnitCost,
            economicImpact: detail.appliedTotalCost,
            actor: input,
          });
        } else {
          await this.saveMovement(manager, {
            ingredient,
            type: 'Merma por anulación',
            origin: 'Anulación',
            quantity: 0,
            classifiedQuantity: detail.consumedQuantity,
            previousStock: ingredient.stock,
            resultingStock: ingredient.stock,
            reason,
            reference: input.orderNumber,
            saleId: input.saleId,
            orderNumber: input.orderNumber,
            recipeVersionIds: detail.recipeVersionIds,
            appliedUnitCost: detail.appliedUnitCost,
            economicImpact: detail.appliedTotalCost === null ? null : -detail.appliedTotalCost,
            actor: input,
          });
        }
      }
      consumption.status =
        input.treatment === 'Reintegrar insumos' ? 'Reintegrado' : 'Clasificado como merma';
      consumption.treatmentAt = new Date();
      consumption.cancellationTreatment = input.treatment;
      consumption.treatmentReason = reason;
      consumption.treatmentByUserId = input.userId;
      consumption.treatmentByUserName = input.userName;
      return this.toConsumption(await repo.save(consumption));
    });
  }

  async listSaleConsumptions(): Promise<SaleConsumptionSnapshot[]> {
    const rows = await this.dataSource.getRepository(SaleConsumptionOrmEntity).find({
      relations: { details: true },
      order: { id: 'DESC' },
    });
    return rows.map((row) => this.toConsumption(row));
  }

  async listMovements(filter: InventoryMovementFilter): Promise<InventoryMovementSnapshot[]> {
    const qb = this.dataSource
      .getRepository(InventoryMovementOrmEntity)
      .createQueryBuilder('movement')
      .orderBy('movement.registeredAt', 'DESC');
    if (filter.ingredientId !== undefined) {
      qb.andWhere('movement.ingredientId = :ingredientId', { ingredientId: filter.ingredientId });
    }
    if (filter.type) qb.andWhere('movement.type = :type', { type: filter.type });
    if (filter.text?.trim()) {
      qb.andWhere(
        "(LOWER(movement.ingredientName) LIKE :text OR LOWER(movement.ingredientCode) LIKE :text OR LOWER(COALESCE(movement.reference, '')) LIKE :text)",
        { text: `%${filter.text.trim().toLowerCase()}%` },
      );
    }
    if (filter.from) qb.andWhere('movement.registeredAt >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('movement.registeredAt <= :to', { to: filter.to });
    return (await qb.getMany()).map((row) => this.toMovement(row));
  }

  async registerCount(input: InventoryCountInput): Promise<InventoryCountSnapshot> {
    if (input.details.length === 0) {
      throw new BadRequestException('El conteo debe incluir al menos un insumo.');
    }
    const uniqueIds = new Set(input.details.map((item) => item.ingredientId));
    if (uniqueIds.size !== input.details.length) {
      throw new BadRequestException('No puedes repetir un insumo dentro del mismo conteo.');
    }
    return this.dataSource.transaction(async (manager) => {
      const countRepo = manager.getRepository(InventoryCountOrmEntity);
      const count = await countRepo.save(
        countRepo.create({
          observations: input.observations?.trim() || null,
          registeredAt: new Date(),
          userId: input.userId,
          userName: input.userName,
        }),
      );
      const detailRepo = manager.getRepository(InventoryCountDetailOrmEntity);
      const savedDetails: InventoryCountDetailOrmEntity[] = [];
      for (const detail of input.details) {
        this.rules.requireNonNegative(detail.physicalStock, 'El stock físico');
        const reason = this.rules.normalizeText(detail.reason, 'El motivo', 3, 200);
        const ingredient = await this.findIngredientForUpdate(manager, detail.ingredientId);
        if (!ingredient) throw new NotFoundException('Uno de los insumos del conteo no existe.');
        const theoreticalStock = ingredient.stock;
        const physicalStock = this.rules.roundQuantity(detail.physicalStock);
        const variation = this.rules.roundQuantity(physicalStock - theoreticalStock);
        const unitCost = ingredient.economicControl ? ingredient.averageBaseUnitCost : null;
        const economicImpact =
          unitCost === null ? null : this.rules.roundMoney(variation * unitCost);
        ingredient.stock = physicalStock;
        ingredient.updatedByUserId = input.userId;
        ingredient.updatedByUserName = input.userName;
        await manager.getRepository(IngredientOrmEntity).save(ingredient);
        const savedDetail = await detailRepo.save(
          detailRepo.create({
            countId: count.id,
            ingredientId: ingredient.id,
            ingredientCode: ingredient.code,
            ingredientName: ingredient.name,
            baseUnit: ingredient.baseUnit,
            theoreticalStock,
            physicalStock,
            variation,
            reason,
            appliedUnitCost: unitCost,
            economicImpact,
          }),
        );
        savedDetails.push(savedDetail);
        if (variation !== 0) {
          await this.saveMovement(manager, {
            ingredient,
            type: 'Conteo físico',
            origin: 'Conteo físico',
            quantity: variation,
            classifiedQuantity: null,
            previousStock: theoreticalStock,
            resultingStock: physicalStock,
            reason,
            reference: `CONTEO-${count.id}`,
            saleId: null,
            orderNumber: null,
            recipeVersionIds: [],
            appliedUnitCost: unitCost,
            economicImpact,
            actor: input,
          });
        }
      }
      count.details = savedDetails;
      return this.toCount(count);
    });
  }

  async listCounts(): Promise<InventoryCountSnapshot[]> {
    const rows = await this.dataSource.getRepository(InventoryCountOrmEntity).find({
      relations: { details: true },
      order: { id: 'DESC' },
    });
    return rows.map((row) => this.toCount(row));
  }

  async getSummary(): Promise<InventorySummarySnapshot> {
    const ingredients = await this.listIngredients();
    const movements = await this.listMovements({});
    let normalIngredients = 0;
    let lowIngredients = 0;
    let negativeIngredients = 0;
    let positiveInventoryValue = 0;
    let inventoryDeficitValue = 0;
    const alerts: IngredientSnapshot[] = [];
    for (const ingredient of ingredients.filter((item) => item.status === 'Activo')) {
      if (ingredient.stock < 0) {
        negativeIngredients += 1;
        alerts.push(ingredient);
      } else if (ingredient.lowStockControl && ingredient.stock <= ingredient.minimumStock) {
        lowIngredients += 1;
        alerts.push(ingredient);
      } else {
        normalIngredients += 1;
      }
      if (ingredient.economicControl && ingredient.averageBaseUnitCost !== null) {
        const value = this.rules.roundMoney(ingredient.stock * ingredient.averageBaseUnitCost);
        if (value >= 0) positiveInventoryValue += value;
        else inventoryDeficitValue += Math.abs(value);
      }
    }
    return {
      activeIngredients: ingredients.filter((item) => item.status === 'Activo').length,
      normalIngredients,
      lowIngredients,
      negativeIngredients,
      positiveInventoryValue: this.rules.roundMoney(positiveInventoryValue),
      inventoryDeficitValue: this.rules.roundMoney(inventoryDeficitValue),
      alerts,
      recentMovements: movements.slice(0, 10),
    };
  }

  private prepareIngredientInput(input: UpsertIngredientInput) {
    const code = this.rules.normalizeCode(input.code);
    const name = this.rules.normalizeText(input.name, 'El nombre', 2, 120);
    const category = this.rules.normalizeText(input.category, 'La categoría', 2, 80);
    const purchasePresentation = this.rules.normalizeText(
      input.purchasePresentation,
      'La presentación de compra',
      1,
      60,
    );
    const purchaseConversionFactor = this.rules.roundQuantity(
      this.rules.requirePositive(input.purchaseConversionFactor, 'El factor de conversión'),
    );
    const minimumStock = input.lowStockControl
      ? this.rules.roundQuantity(
          this.rules.requireNonNegative(input.minimumStock, 'El stock mínimo'),
        )
      : 0;
    return {
      code,
      name,
      category,
      baseUnit: input.baseUnit,
      purchasePresentation,
      purchaseConversionFactor,
      lowStockControl: input.lowStockControl,
      minimumStock,
      shortagePolicy: input.shortagePolicy,
      economicControl: input.economicControl,
    };
  }

  private async ensureIngredientUnique(
    manager: EntityManager,
    code: string,
    name: string,
    excludedId?: number,
  ): Promise<void> {
    const repo = manager.getRepository(IngredientOrmEntity);
    const codeRow = await repo.findOne({ where: { code: ILike(code) } });
    if (codeRow && codeRow.id !== excludedId) {
      throw new ConflictException('Ya existe un insumo con ese código.');
    }
    const nameRow = await repo.findOne({ where: { name: ILike(name) } });
    if (nameRow && nameRow.id !== excludedId) {
      throw new ConflictException('Ya existe un insumo con ese nombre.');
    }
  }

  private async findIngredientForUpdate(
    manager: EntityManager,
    id: number,
  ): Promise<IngredientOrmEntity | null> {
    return manager
      .getRepository(IngredientOrmEntity)
      .createQueryBuilder('ingredient')
      .setLock('pessimistic_write')
      .where('ingredient.id = :id', { id })
      .getOne();
  }

  private async evaluateWithManager(
    manager: EntityManager,
    details: SaleInventoryDetailInput[],
    lockIngredients: boolean,
  ): Promise<InventoryEvaluationSnapshot> {
    if (details.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto.');
    }
    const productIds = [...new Set(details.map((detail) => detail.productId))];
    for (const detail of details) {
      if (!Number.isInteger(detail.quantity) || detail.quantity <= 0) {
        throw new BadRequestException('Las cantidades de productos deben ser enteros positivos.');
      }
    }
    const productRefs = await manager
      .getRepository(ProductReferenceOrmEntity)
      .createQueryBuilder('product')
      .where('product.productId IN (:...ids)', { ids: productIds })
      .getMany();
    const productMap = new Map(productRefs.map((product) => [product.productId, product]));
    const recipeRows = await manager
      .getRepository(RecipeOrmEntity)
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.items', 'items')
      .where('recipe.productId IN (:...ids)', { ids: productIds })
      .andWhere('recipe.status = :status', { status: 'Vigente' })
      .getMany();
    const recipeMap = new Map(recipeRows.map((recipe) => [recipe.productId, recipe]));
    const productsWithoutRecipe: string[] = [];
    const aggregate = new Map<
      number,
      { required: number; recipeIds: Set<number>; productNames: Set<string> }
    >();
    for (const detail of details) {
      const product = productMap.get(detail.productId);
      const productName = product?.name ?? `Producto #${detail.productId}`;
      if (product?.inventoryControl === 'No controla inventario') continue;
      const recipe = recipeMap.get(detail.productId);
      if (!recipe) {
        productsWithoutRecipe.push(productName);
        continue;
      }
      for (const item of recipe.items) {
        const required = this.rules.roundQuantity(item.quantityPerProduct * detail.quantity);
        const current = aggregate.get(item.ingredientId);
        if (current) {
          current.required = this.rules.roundQuantity(current.required + required);
          current.recipeIds.add(recipe.id);
          current.productNames.add(productName);
        } else {
          aggregate.set(item.ingredientId, {
            required,
            recipeIds: new Set([recipe.id]),
            productNames: new Set([productName]),
          });
        }
      }
    }
    if (aggregate.size === 0) {
      return {
        blocked: false,
        requiresConfirmation: false,
        projections: [],
        alerts: [],
        productsWithoutRecipe: [...new Set(productsWithoutRecipe)],
      };
    }
    const ingredientIds = [...aggregate.keys()];
    let qb = manager
      .getRepository(IngredientOrmEntity)
      .createQueryBuilder('ingredient')
      .where('ingredient.id IN (:...ids)', { ids: ingredientIds });
    if (lockIngredients) qb = qb.setLock('pessimistic_write');
    const ingredients = await qb.getMany();
    if (ingredients.length !== ingredientIds.length) {
      throw new ConflictException('Una receta utiliza un insumo que ya no existe.');
    }
    const projections: InventoryProjectionSnapshot[] = ingredients.map((row) => {
      const ingredient = this.toIngredient(row);
      const accumulated = aggregate.get(row.id);
      if (!accumulated) throw new Error('No se pudo reconstruir la evaluación de inventario.');
      const resultingBalance = this.rules.roundQuantity(ingredient.stock - accumulated.required);
      return {
        ingredientId: ingredient.id,
        ingredientCode: ingredient.code,
        ingredientName: ingredient.name,
        baseUnit: ingredient.baseUnit,
        availableQuantity: ingredient.stock,
        requiredQuantity: accumulated.required,
        resultingBalance,
        level: this.rules.projectionLevel(ingredient, resultingBalance),
        minimumStock: ingredient.lowStockControl ? ingredient.minimumStock : null,
        shortagePolicy: ingredient.shortagePolicy,
        recipeVersionIds: [...accumulated.recipeIds],
        relatedProducts: [...accumulated.productNames],
      };
    });
    projections.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, 'es'));
    const alerts = projections.filter((projection) => projection.level !== 'Normal');
    return {
      blocked: this.rules.isBlocked(projections),
      requiresConfirmation: this.rules.requiresNegativeConfirmation(projections),
      projections,
      alerts,
      productsWithoutRecipe: [...new Set(productsWithoutRecipe)],
    };
  }

  private async saveMovement(
    manager: EntityManager,
    input: {
      ingredient: IngredientOrmEntity;
      type: InventoryMovementSnapshot['type'];
      origin: InventoryMovementSnapshot['origin'];
      quantity: number;
      classifiedQuantity: number | null;
      previousStock: number;
      resultingStock: number;
      reason: string;
      reference: string | null;
      saleId: number | null;
      orderNumber: string | null;
      recipeVersionIds: number[];
      appliedUnitCost: number | null;
      economicImpact: number | null;
      actor: InventoryActor;
    },
  ): Promise<InventoryMovementOrmEntity> {
    const repo = manager.getRepository(InventoryMovementOrmEntity);
    return repo.save(
      repo.create({
        ingredientId: input.ingredient.id,
        ingredientCode: input.ingredient.code,
        ingredientName: input.ingredient.name,
        baseUnit: input.ingredient.baseUnit,
        type: input.type,
        origin: input.origin,
        quantity: input.quantity,
        classifiedQuantity: input.classifiedQuantity,
        previousStock: input.previousStock,
        resultingStock: input.resultingStock,
        reason: input.reason,
        reference: input.reference,
        saleId: input.saleId,
        orderNumber: input.orderNumber,
        recipeVersionIds: input.recipeVersionIds,
        appliedUnitCost: input.appliedUnitCost,
        economicImpact: input.economicImpact,
        registeredAt: new Date(),
        userId: input.actor.userId,
        userName: input.actor.userName,
      }),
    );
  }

  private toIngredient(row: IngredientOrmEntity): IngredientSnapshot {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      baseUnit: row.baseUnit,
      purchasePresentation: row.purchasePresentation,
      purchaseConversionFactor: row.purchaseConversionFactor,
      stock: row.stock,
      lowStockControl: row.lowStockControl,
      minimumStock: row.minimumStock,
      shortagePolicy: row.shortagePolicy,
      economicControl: row.economicControl,
      averageBaseUnitCost: row.averageBaseUnitCost,
      status: row.status,
      registeredAt: row.registeredAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      updatedByUserId: row.updatedByUserId,
      updatedByUserName: row.updatedByUserName,
    };
  }

  private async mapRecipes(rows: RecipeOrmEntity[]): Promise<RecipeSnapshot[]> {
    if (rows.length === 0) return [];
    const ingredientIds = [
      ...new Set(rows.flatMap((row) => row.items.map((item) => item.ingredientId))),
    ];
    const ingredients = ingredientIds.length
      ? await this.dataSource
          .getRepository(IngredientOrmEntity)
          .createQueryBuilder('ingredient')
          .where('ingredient.id IN (:...ids)', { ids: ingredientIds })
          .getMany()
      : [];
    const ingredientMap = new Map(ingredients.map((item) => [item.id, item]));
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      productCode: row.productCode,
      productName: row.productName,
      version: row.version,
      status: row.status,
      ingredients: row.items
        .map((item) => {
          const ingredient = ingredientMap.get(item.ingredientId);
          if (!ingredient) return null;
          return {
            ingredientId: ingredient.id,
            ingredientCode: ingredient.code,
            ingredientName: ingredient.name,
            baseUnit: ingredient.baseUnit,
            quantityPerProduct: item.quantityPerProduct,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
      validFrom: row.validFrom.toISOString(),
      validUntil: row.validUntil?.toISOString() ?? null,
      registeredByUserId: row.registeredByUserId,
      registeredByUserName: row.registeredByUserName,
    }));
  }

  private toMovement(row: InventoryMovementOrmEntity): InventoryMovementSnapshot {
    return {
      id: row.id,
      ingredientId: row.ingredientId,
      ingredientCode: row.ingredientCode,
      ingredientName: row.ingredientName,
      baseUnit: row.baseUnit,
      type: row.type,
      origin: row.origin,
      quantity: row.quantity,
      classifiedQuantity: row.classifiedQuantity,
      previousStock: row.previousStock,
      resultingStock: row.resultingStock,
      reason: row.reason,
      reference: row.reference,
      saleId: row.saleId,
      orderNumber: row.orderNumber,
      recipeVersionIds: row.recipeVersionIds,
      appliedUnitCost: row.appliedUnitCost,
      economicImpact: row.economicImpact,
      registeredAt: row.registeredAt.toISOString(),
      userId: row.userId,
      userName: row.userName,
    };
  }

  private toConsumption(row: SaleConsumptionOrmEntity): SaleConsumptionSnapshot {
    return {
      id: row.id,
      saleId: row.saleId,
      orderNumber: row.orderNumber,
      status: row.status,
      authorizedNegativeBalance: row.authorizedNegativeBalance,
      details: (row.details ?? []).map((detail) => ({
        ingredientId: detail.ingredientId,
        ingredientCode: detail.ingredientCode,
        ingredientName: detail.ingredientName,
        baseUnit: detail.baseUnit,
        consumedQuantity: detail.consumedQuantity,
        previousStock: detail.previousStock,
        resultingStock: detail.resultingStock,
        appliedUnitCost: detail.appliedUnitCost,
        appliedTotalCost: detail.appliedTotalCost,
        recipeVersionIds: detail.recipeVersionIds,
        relatedProducts: detail.relatedProducts,
      })),
      registeredAt: row.registeredAt.toISOString(),
      treatmentAt: row.treatmentAt?.toISOString() ?? null,
      cancellationTreatment: row.cancellationTreatment,
      treatmentReason: row.treatmentReason,
      registeredByUserId: row.registeredByUserId,
      registeredByUserName: row.registeredByUserName,
      treatmentByUserId: row.treatmentByUserId,
      treatmentByUserName: row.treatmentByUserName,
    };
  }

  private toCount(row: InventoryCountOrmEntity): InventoryCountSnapshot {
    return {
      id: row.id,
      observations: row.observations,
      details: (row.details ?? []).map((detail) => ({
        ingredientId: detail.ingredientId,
        ingredientCode: detail.ingredientCode,
        ingredientName: detail.ingredientName,
        baseUnit: detail.baseUnit,
        theoreticalStock: detail.theoreticalStock,
        physicalStock: detail.physicalStock,
        variation: detail.variation,
        reason: detail.reason,
        appliedUnitCost: detail.appliedUnitCost,
        economicImpact: detail.economicImpact,
      })),
      registeredAt: row.registeredAt.toISOString(),
      userId: row.userId,
      userName: row.userName,
    };
  }
}
