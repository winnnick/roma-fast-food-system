import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiJwtAuthGuard,
  ApiPermissionsGuard,
  RequirePermissions,
  type AuthenticatedApiRequest,
} from '@roma/shared';
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
} from '../../application/inventory/inventory.commands';
import { SyncProductReferenceCommand } from '../../application/inventory/product-reference.commands';
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
} from '../../application/inventory/inventory.queries';
import type { InventoryMovementSnapshot } from '../../domain/inventory/inventory.models';
import type {
  IngredientView,
  InventoryCountView,
  InventoryEvaluationView,
  InventoryMovementView,
  InventorySummaryView,
  RecipeView,
  SaleConsumptionView,
} from '../../application/inventory/inventory.views';
import {
  CancellationTreatmentDto,
  CreateIngredientDto,
  EvaluateSaleInventoryDto,
  IngredientStatusDto,
  InventoryAdjustmentDto,
  InventoryEntryDto,
  RegisterInventoryCountDto,
  RegisterSaleConsumptionDto,
  SaveRecipeDto,
  SyncProductReferenceDto,
  UpsertIngredientDto,
} from './dto/inventory.dto';

function actor(request: AuthenticatedApiRequest) {
  if (!request.authUser) throw new Error('El guard JWT no cargó el usuario autenticado.');
  return {
    userId: Number(request.authUser.sub),
    userName: request.authUser.nombreCompleto,
  };
}

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('INVENTARIO_VER')
@Controller('inventario')
export class InventoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('insumos')
  @ApiOperation({ summary: 'Lista los insumos del inventario.' })
  listIngredients(): Promise<IngredientView[]> {
    return this.queryBus.execute(new ListIngredientsQuery());
  }

  @Get('insumos/:id')
  getIngredient(@Param('id', ParseIntPipe) id: number): Promise<IngredientView> {
    return this.queryBus.execute(new GetIngredientByIdQuery(id));
  }

  @Post('insumos')
  @RequirePermissions('INVENTARIO_INSUMOS_CREAR')
  createIngredient(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: CreateIngredientDto,
  ): Promise<IngredientView> {
    return this.commandBus.execute(
      new CreateIngredientCommand(
        {
          code: dto.codigo,
          name: dto.nombre,
          category: dto.categoria,
          baseUnit: dto.unidadBase,
          purchasePresentation: dto.presentacionCompra,
          purchaseConversionFactor: dto.factorConversionCompra,
          lowStockControl: dto.controlarStockBajo,
          minimumStock: dto.stockMinimo,
          shortagePolicy: dto.politicaFaltante,
          economicControl: dto.controlEconomico,
          currentPresentationCost: dto.costoPorPresentacionActual ?? null,
          initialPurchaseQuantity: dto.stockInicialCompra,
          initialPresentationCost: dto.costoPorPresentacionInicial ?? null,
        },
        actor(request),
      ),
    );
  }

  @Put('insumos/:id')
  @RequirePermissions('INVENTARIO_INSUMOS_EDITAR')
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: UpsertIngredientDto,
  ): Promise<IngredientView> {
    return this.commandBus.execute(
      new UpdateIngredientCommand(
        id,
        {
          code: dto.codigo,
          name: dto.nombre,
          category: dto.categoria,
          baseUnit: dto.unidadBase,
          purchasePresentation: dto.presentacionCompra,
          purchaseConversionFactor: dto.factorConversionCompra,
          lowStockControl: dto.controlarStockBajo,
          minimumStock: dto.stockMinimo,
          shortagePolicy: dto.politicaFaltante,
          economicControl: dto.controlEconomico,
          currentPresentationCost: dto.costoPorPresentacionActual ?? null,
        },
        actor(request),
      ),
    );
  }

  @Patch('insumos/:id/estado')
  @RequirePermissions('INVENTARIO_ESTADO_INSUMO')
  changeIngredientStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: IngredientStatusDto,
  ): Promise<IngredientView> {
    return this.commandBus.execute(
      new ChangeIngredientStatusCommand(id, dto.estado, actor(request)),
    );
  }

  @Post('entradas')
  @RequirePermissions('INVENTARIO_ENTRADAS')
  registerEntry(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: InventoryEntryDto,
  ): Promise<InventoryMovementView> {
    return this.commandBus.execute(
      new RegisterInventoryEntryCommand({
        ingredientId: dto.insumoId,
        purchaseQuantity: dto.cantidadPresentaciones,
        totalCost: dto.costoTotal ?? null,
        reference: dto.referencia ?? null,
        reason: dto.motivo,
        ...actor(request),
      }),
    );
  }

  @Post('ajustes')
  registerAdjustment(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: InventoryAdjustmentDto,
  ): Promise<InventoryMovementView> {
    const userPermissions = request.authUser?.permissions ?? [];
    const required =
      dto.cantidadAjuste > 0 ? 'INVENTARIO_AJUSTES_AUMENTAR' : 'INVENTARIO_AJUSTES_DISMINUIR';
    if (!userPermissions.includes(required)) {
      throw new ForbiddenException('No tienes permiso para registrar este tipo de ajuste.');
    }
    return this.commandBus.execute(
      new RegisterInventoryAdjustmentCommand({
        ingredientId: dto.insumoId,
        adjustmentQuantity: dto.cantidadAjuste,
        reason: dto.motivo,
        ...actor(request),
      }),
    );
  }

  @Put('productos/:id/referencia')
  @RequirePermissions('INVENTARIO_RECETAS_GESTIONAR')
  async syncProductReference(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: SyncProductReferenceDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new SyncProductReferenceCommand({
        productId,
        code: dto.codigo,
        name: dto.nombre,
        inventoryControl: dto.controlInventario,
        status: dto.estado,
      }),
    );
  }

  @Get('recetas')
  @RequirePermissions('INVENTARIO_RECETAS_VER')
  listRecipes(): Promise<RecipeView[]> {
    return this.queryBus.execute(new ListRecipesQuery());
  }

  @Get('recetas/productos/:productoId/vigente')
  @RequirePermissions('INVENTARIO_RECETAS_VER')
  currentRecipe(@Param('productoId', ParseIntPipe) productId: number): Promise<RecipeView | null> {
    return this.queryBus.execute(new GetCurrentRecipeByProductQuery(productId));
  }

  @Post('recetas/versiones')
  @RequirePermissions('INVENTARIO_RECETAS_GESTIONAR')
  saveRecipe(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: SaveRecipeDto,
  ): Promise<RecipeView> {
    return this.commandBus.execute(
      new SaveRecipeVersionCommand({
        productId: dto.productoId,
        ingredients: dto.ingredientes.map((item) => ({
          ingredientId: item.insumoId,
          quantityPerProduct: item.cantidadPorProducto,
        })),
        ...actor(request),
      }),
    );
  }

  @Post('recetas/productos/:productoId/finalizar')
  @RequirePermissions('INVENTARIO_RECETAS_GESTIONAR')
  finishRecipe(
    @Param('productoId', ParseIntPipe) productId: number,
    @Req() request: AuthenticatedApiRequest,
  ): Promise<RecipeView> {
    return this.commandBus.execute(new FinishCurrentRecipeCommand(productId, actor(request)));
  }

  @Post('evaluaciones-venta')
  evaluateSale(@Body() dto: EvaluateSaleInventoryDto): Promise<InventoryEvaluationView> {
    return this.queryBus.execute(
      new EvaluateSaleInventoryQuery(
        dto.detalles.map((item) => ({ productId: item.productoId, quantity: item.cantidad })),
      ),
    );
  }

  @Post('consumos-venta')
  registerConsumption(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: RegisterSaleConsumptionDto,
  ): Promise<SaleConsumptionView> {
    return this.commandBus.execute(
      new RegisterSaleConsumptionCommand({
        saleId: dto.ventaId,
        orderNumber: dto.numeroPedido,
        details: dto.detalles.map((item) => ({
          productId: item.productoId,
          quantity: item.cantidad,
        })),
        authorizeNegativeBalance: dto.autorizaSaldoNegativo,
        ...actor(request),
      }),
    );
  }

  @Post('anulaciones-venta')
  treatCancellation(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: CancellationTreatmentDto,
  ): Promise<SaleConsumptionView> {
    return this.commandBus.execute(
      new TreatCancelledSaleInventoryCommand(
        dto.ventaId,
        dto.numeroPedido,
        dto.tratamiento,
        dto.motivo,
        actor(request),
      ),
    );
  }

  @Get('consumos-venta')
  @RequirePermissions('INVENTARIO_MOVIMIENTOS_VER')
  listConsumptions(): Promise<SaleConsumptionView[]> {
    return this.queryBus.execute(new ListSaleConsumptionsQuery());
  }

  @Get('movimientos')
  @RequirePermissions('INVENTARIO_MOVIMIENTOS_VER')
  listMovements(
    @Query('insumoId') ingredientId?: string,
    @Query('tipo') type?: InventoryMovementSnapshot['type'],
    @Query('texto') text?: string,
    @Query('fechaDesde') from?: string,
    @Query('fechaHasta') to?: string,
  ): Promise<InventoryMovementView[]> {
    return this.queryBus.execute(
      new ListInventoryMovementsQuery({
        ingredientId: ingredientId ? Number(ingredientId) : undefined,
        type,
        text,
        from,
        to,
      }),
    );
  }

  @Post('conteos')
  @RequirePermissions('INVENTARIO_CONTEOS_REGISTRAR')
  registerCount(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: RegisterInventoryCountDto,
  ): Promise<InventoryCountView> {
    return this.commandBus.execute(
      new RegisterInventoryCountCommand(
        dto.observaciones ?? null,
        dto.detalles.map((item) => ({
          ingredientId: item.insumoId,
          physicalStock: item.stockFisico,
          reason: item.motivo,
        })),
        actor(request),
      ),
    );
  }

  @Get('conteos')
  @RequirePermissions('INVENTARIO_CONTEOS_VER')
  listCounts(): Promise<InventoryCountView[]> {
    return this.queryBus.execute(new ListInventoryCountsQuery());
  }

  @Get('resumen')
  getSummary(): Promise<InventorySummaryView> {
    return this.queryBus.execute(new GetInventorySummaryQuery());
  }
}
