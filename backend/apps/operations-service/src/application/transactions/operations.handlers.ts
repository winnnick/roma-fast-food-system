import {
  BadRequestException,
  ConflictException,
  Inject,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { ClientRepositoryPort, ProductRepositoryPort } from '../../domain/ports/catalog.ports';
import { CLIENT_REPOSITORY, PRODUCT_REPOSITORY } from '../../domain/ports/catalog.ports';
import type {
  InventoryEvaluationResult,
  InventoryIntegrationPort,
} from '../../domain/ports/inventory-integration.ports';
import {
  INVENTORY_INTEGRATION,
  InventoryIntegrationError,
} from '../../domain/ports/inventory-integration.ports';
import type { OperationsTransactionRepositoryPort } from '../../domain/ports/operations.ports';
import { OPERATIONS_TRANSACTION_REPOSITORY } from '../../domain/ports/operations.ports';
import type { PreparedSaleInput } from '../../domain/operations/operations.models';
import {
  CancelSaleCommand,
  ChangePreparationStartModeCommand,
  ChangePreparationStatusCommand,
  CloseCashSessionCommand,
  CreateSaleCommand,
  OpenCashSessionCommand,
  RegisterManualCashMovementCommand,
  RegisterSalePaymentCommand,
} from './operations.commands';
import {
  EvaluateSaleInventoryQuery,
  GetCashSummaryQuery,
  GetOpenCashSessionQuery,
  GetPreparationConfigurationQuery,
  GetSaleByIdQuery,
  ListCashMovementsQuery,
  ListCashSessionsQuery,
  ListSalePaymentsQuery,
  ListSalesQuery,
} from './operations.queries';
import { OperationsRulesService } from './operations-rules.service';
import {
  toCashMovementView,
  toCashSessionView,
  toCashSummaryView,
  toPaymentView,
  toSaleView,
  type CashMovementView,
  type CashSessionView,
  type CashSummaryView,
  type PreparationConfigurationView,
  type SalePaymentView,
  type SaleView,
} from './operations.views';

abstract class OperationsHandlerBase {
  constructor(
    protected readonly operations: OperationsTransactionRepositoryPort,
    protected readonly rules: OperationsRulesService,
  ) {}
}

@CommandHandler(CreateSaleCommand)
export class CreateSaleHandler
  extends OperationsHandlerBase
  implements ICommandHandler<CreateSaleCommand, SaleView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort,
    @Inject(INVENTORY_INTEGRATION) private readonly inventory: InventoryIntegrationPort,
  ) {
    super(operations, rules);
  }

  async execute(command: CreateSaleCommand): Promise<SaleView> {
    const input = command.input;
    const cash = await this.operations.findOpenCashSessionByUser(input.userId);
    if (!cash)
      throw new ConflictException('Debes tener tu propia caja abierta para registrar pedidos.');

    const salesChannel = input.salesChannel ?? 'Local';
    const pedidosYaReference =
      salesChannel === 'PedidosYa'
        ? this.rules.normalizeOptionalText(
            input.pedidosYaReference,
            100,
            'La referencia de PedidosYa',
          )
        : null;
    if (salesChannel === 'PedidosYa' && (!pedidosYaReference || pedidosYaReference.length < 2)) {
      throw new BadRequestException('Ingresa una referencia válida de PedidosYa.');
    }

    let clientId: number | null = null;
    let clientName = 'Consumidor final';
    if (input.clientType === 'Registrado') {
      if (!input.clientId) throw new BadRequestException('Selecciona un cliente registrado.');
      const client = await this.clients.findById(input.clientId);
      if (!client || client.archived || client.status !== 'Activo')
        throw new BadRequestException('El cliente seleccionado no está disponible.');
      clientId = client.id;
      clientName = client.fullName;
    } else if (input.clientType === 'Ocasional') {
      const name = this.rules.normalizeOptionalText(input.clientName, 120, 'El nombre del cliente');
      if (!name || name.length < 2)
        throw new BadRequestException('Ingresa un nombre de cliente válido.');
      clientName = name;
    }

    if (!input.details.length)
      throw new BadRequestException('Agrega al menos un producto al pedido.');
    const details: PreparedSaleInput['details'] = [];
    for (const requested of input.details) {
      if (
        !Number.isInteger(requested.quantity) ||
        requested.quantity <= 0 ||
        requested.quantity > 100
      ) {
        throw new BadRequestException('La cantidad de cada producto debe estar entre 1 y 100.');
      }
      const product = await this.products.findById(requested.productId);
      if (!product || product.status !== 'Activo' || !product.available) {
        throw new BadRequestException(`El producto ${requested.productId} no está disponible.`);
      }
      if (
        salesChannel === 'PedidosYa' &&
        (!product.availablePedidosYa || product.pedidosYaPrice === null)
      ) {
        throw new BadRequestException(`${product.name} no está disponible para PedidosYa.`);
      }
      const unitPrice = salesChannel === 'PedidosYa' ? product.pedidosYaPrice! : product.price;
      const quantity = requested.quantity;
      details.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unitPrice,
        quantity,
        note: this.rules.normalizeOptionalText(requested.note, 300, 'La observación del producto'),
        subtotal: this.rules.roundMoney(unitPrice * quantity),
        requiresPreparation: product.preparationMode === 'Requiere preparación',
      });
    }
    const subtotal = this.rules.roundMoney(
      details.reduce((sum, detail) => sum + detail.subtotal, 0),
    );
    const requiresPreparation = details.some((detail) => detail.requiresPreparation);
    const startMode = await this.operations.getPreparationStartMode();
    const preparationStatus = requiresPreparation ? startMode : 'Entrega directa';
    const inventoryDetails = details.map((detail) => ({
      productId: detail.productId,
      quantity: detail.quantity,
    }));
    let evaluation;
    try {
      evaluation = await this.inventory.evaluate(inventoryDetails);
    } catch (error) {
      throw this.inventoryUnavailable(error);
    }
    if (evaluation.bloqueada) {
      throw new ConflictException({
        code: 'INVENTORY_BLOCKED',
        message: 'El pedido utiliza insumos que bloquean la venta por faltante.',
        evaluacionInventario: evaluation,
      });
    }
    if (evaluation.requiereConfirmacion && !input.authorizeNegativeInventory) {
      throw new ConflictException({
        code: 'INVENTORY_CONFIRMATION_REQUIRED',
        message: 'El pedido dejará existencias negativas y requiere confirmación.',
        evaluacionInventario: evaluation,
      });
    }

    const prepared: PreparedSaleInput = {
      salesChannel,
      pedidosYaReference,
      clientType: input.clientType,
      clientId,
      clientName,
      details,
      observations: this.rules.normalizeOptionalText(input.observations, 500, 'Las observaciones'),
      requiresPreparation,
      subtotal,
      preparationStatus,
      paymentStatus:
        salesChannel === 'PedidosYa' ? 'Pendiente de liquidación' : 'Pendiente de cobro',
      userId: input.userId,
      userName: input.userName,
      cashSessionId: cash.id,
    };
    const sale = await this.operations.createSale(prepared);
    try {
      const consumption = await this.inventory.consume({
        saleId: sale.id,
        orderNumber: sale.orderNumber,
        details: inventoryDetails,
        authorizeNegativeBalance: input.authorizeNegativeInventory,
        userId: input.userId,
        userName: input.userName,
      });
      const synced = await this.operations.updateSaleInventoryState(
        sale.id,
        'Aplicado',
        consumption.id,
        null,
      );
      return toSaleView(synced ?? sale);
    } catch (error) {
      let compensated = false;
      try {
        await this.inventory.treatCancellation({
          saleId: sale.id,
          orderNumber: sale.orderNumber,
          treatment: 'Reintegrar insumos',
          reason: 'Compensación automática por fallo durante el registro del pedido.',
          userId: input.userId,
          userName: input.userName,
        });
        compensated = true;
      } catch (compensationError) {
        if (
          compensationError instanceof InventoryIntegrationError &&
          compensationError.status === 404
        ) {
          compensated = true;
        }
      }
      await this.operations.cancelSale(
        sale.id,
        'Registro revertido automáticamente por fallo de integración con inventario.',
      );
      await this.operations.updateSaleInventoryState(
        sale.id,
        compensated ? 'Reintegrado' : 'Error',
        null,
        error instanceof Error ? error.message : 'Error desconocido de inventario.',
      );
      throw this.inventoryUnavailable(error);
    }
  }

  private inventoryUnavailable(error: unknown): ConflictException | ServiceUnavailableException {
    const message =
      error instanceof InventoryIntegrationError
        ? error.message
        : 'No fue posible completar la operación de inventario.';
    if (error instanceof InventoryIntegrationError && error.status === 409) {
      return new ConflictException({
        code: 'INVENTORY_CHANGED',
        message:
          'El inventario cambió mientras se registraba el pedido. Revisa las existencias e inténtalo nuevamente.',
        detail: message,
      });
    }
    return new ServiceUnavailableException({
      code: 'INVENTORY_SERVICE_UNAVAILABLE',
      message,
    });
  }
}

@CommandHandler(ChangePreparationStatusCommand)
export class ChangePreparationStatusHandler
  extends OperationsHandlerBase
  implements ICommandHandler<ChangePreparationStatusCommand, SaleView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(command: ChangePreparationStatusCommand): Promise<SaleView> {
    const sale = await this.operations.findSaleById(command.saleId);
    if (!sale) throw new NotFoundException('El pedido seleccionado no existe.');
    this.rules.assertPreparationTransition(sale.preparationStatus, command.status);
    let delivery: { userId: number; userName: string; cashSessionId: number } | null = null;
    if (command.status === 'Entregado' && sale.salesChannel === 'PedidosYa') {
      const cash = await this.operations.findOpenCashSessionByUser(command.userId);
      if (!cash)
        throw new ConflictException(
          'Abre tu propia caja antes de entregar un pedido de PedidosYa.',
        );
      delivery = { userId: command.userId, userName: command.userName, cashSessionId: cash.id };
    }
    const updated = await this.operations.changePreparationStatus(
      command.saleId,
      command.status,
      delivery,
    );
    if (!updated) throw new NotFoundException('El pedido seleccionado no existe.');
    return toSaleView(updated);
  }
}

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler
  extends OperationsHandlerBase
  implements ICommandHandler<CancelSaleCommand, SaleView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
    @Inject(INVENTORY_INTEGRATION) private readonly inventory: InventoryIntegrationPort,
  ) {
    super(operations, rules);
  }

  async execute(command: CancelSaleCommand): Promise<SaleView> {
    const sale = await this.operations.findSaleById(command.saleId);
    if (!sale) throw new NotFoundException('El pedido seleccionado no existe.');
    const retryInventory = sale.preparationStatus === 'Anulado' && sale.inventoryStatus === 'Error';
    if (sale.preparationStatus === 'Anulado' && !retryInventory)
      throw new ConflictException('El pedido ya se encuentra anulado.');
    if (sale.preparationStatus === 'Entregado')
      throw new ConflictException('Un pedido entregado no puede anularse desde este módulo.');
    const payments = await this.operations.listPayments(command.saleId);
    if (payments.length > 0) {
      throw new ConflictException(
        'Una venta con abonos registrados requiere un proceso de devolución y no puede anularse directamente.',
      );
    }
    const reason = command.reason.trim();
    if (reason.length < 5 || reason.length > 200)
      throw new BadRequestException('Indica un motivo de anulación de 5 a 200 caracteres.');

    let cancelled = sale;
    if (sale.preparationStatus !== 'Anulado') {
      const result = await this.operations.cancelSale(command.saleId, reason);
      if (!result) throw new NotFoundException('El pedido seleccionado no existe.');
      cancelled = result;
    }

    if (sale.inventoryStatus === 'No integrado') {
      return toSaleView(cancelled);
    }

    try {
      const consumption = await this.inventory.treatCancellation({
        saleId: sale.id,
        orderNumber: sale.orderNumber,
        treatment: command.inventoryTreatment,
        reason,
        userId: command.userId,
        userName: command.userName,
      });
      const status = command.inventoryTreatment === 'Reintegrar insumos' ? 'Reintegrado' : 'Merma';
      const synced = await this.operations.updateSaleInventoryState(
        sale.id,
        status,
        consumption.id,
        null,
      );
      return toSaleView(synced ?? cancelled);
    } catch (error) {
      await this.operations.updateSaleInventoryState(
        sale.id,
        'Error',
        sale.inventoryConsumptionId,
        error instanceof Error ? error.message : 'Error desconocido de inventario.',
      );
      throw new ServiceUnavailableException({
        code: 'INVENTORY_CANCELLATION_PENDING',
        message:
          'El pedido quedó anulado, pero el tratamiento de inventario quedó pendiente. Reintenta la anulación para conciliarlo.',
      });
    }
  }
}

@CommandHandler(ChangePreparationStartModeCommand)
export class ChangePreparationStartModeHandler
  extends OperationsHandlerBase
  implements ICommandHandler<ChangePreparationStartModeCommand, PreparationConfigurationView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(command: ChangePreparationStartModeCommand): Promise<PreparationConfigurationView> {
    if (command.mode === 'En preparación' && (await this.operations.countQueuedSales()) > 0) {
      throw new ConflictException(
        'No se puede desactivar la cola mientras existan pedidos esperando preparación.',
      );
    }
    return { modoInicioPreparacion: await this.operations.setPreparationStartMode(command.mode) };
  }
}

@CommandHandler(OpenCashSessionCommand)
export class OpenCashSessionHandler
  extends OperationsHandlerBase
  implements ICommandHandler<OpenCashSessionCommand, CashSessionView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(command: OpenCashSessionCommand): Promise<CashSessionView> {
    const amount = this.rules.requireNonNegative(command.initialAmount, 'El monto inicial');
    const note = this.rules.normalizeOptionalText(command.note, 300, 'La observación de apertura');
    return toCashSessionView(
      await this.operations.openCashSession(command.userId, command.userName, amount, note),
    );
  }
}

@CommandHandler(RegisterManualCashMovementCommand)
export class RegisterManualCashMovementHandler
  extends OperationsHandlerBase
  implements ICommandHandler<RegisterManualCashMovementCommand, CashMovementView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(command: RegisterManualCashMovementCommand): Promise<CashMovementView> {
    const concept = command.concept.trim();
    if (concept.length < 3 || concept.length > 120)
      throw new BadRequestException('El concepto debe tener entre 3 y 120 caracteres.');
    const amount = this.rules.requirePositive(command.amount, 'El monto');
    return toCashMovementView(
      await this.operations.registerManualMovement({
        type: command.type,
        concept,
        amount,
        userId: command.userId,
        userName: command.userName,
      }),
    );
  }
}

@CommandHandler(CloseCashSessionCommand)
export class CloseCashSessionHandler
  extends OperationsHandlerBase
  implements ICommandHandler<CloseCashSessionCommand, CashSessionView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(command: CloseCashSessionCommand): Promise<CashSessionView> {
    const amount = this.rules.requireNonNegative(command.countedAmount, 'El monto contado');
    const note = this.rules.normalizeOptionalText(command.note, 300, 'La observación de cierre');
    return toCashSessionView(
      await this.operations.closeCashSession(command.userId, command.userName, amount, note),
    );
  }
}

@CommandHandler(RegisterSalePaymentCommand)
export class RegisterSalePaymentHandler
  extends OperationsHandlerBase
  implements ICommandHandler<RegisterSalePaymentCommand, { pago: SalePaymentView; venta: SaleView }>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(
    command: RegisterSalePaymentCommand,
  ): Promise<{ pago: SalePaymentView; venta: SaleView }> {
    const result = await this.operations.registerPayment({
      saleId: command.saleId,
      discountType: command.discountType,
      discountValue: command.discountValue,
      discountReason: command.discountReason,
      paymentMethod: command.paymentMethod,
      qrAmount: command.qrAmount,
      cashAmount: command.cashAmount,
      receivedAmount: command.receivedAmount,
      qrReference: command.qrReference,
      userId: command.userId,
      userName: command.userName,
    });
    return { pago: toPaymentView(result.payment), venta: toSaleView(result.sale) };
  }
}

@QueryHandler(EvaluateSaleInventoryQuery)
export class EvaluateSaleInventoryHandler implements IQueryHandler<
  EvaluateSaleInventoryQuery,
  InventoryEvaluationResult
> {
  constructor(
    @Inject(INVENTORY_INTEGRATION) private readonly inventory: InventoryIntegrationPort,
  ) {}

  async execute(query: EvaluateSaleInventoryQuery): Promise<InventoryEvaluationResult> {
    try {
      return await this.inventory.evaluate(query.details);
    } catch (error) {
      const message =
        error instanceof InventoryIntegrationError
          ? error.message
          : 'No fue posible evaluar las existencias del pedido.';

      throw new ServiceUnavailableException({
        code: 'INVENTORY_SERVICE_UNAVAILABLE',
        message,
      });
    }
  }
}

@QueryHandler(ListSalesQuery)
export class ListSalesHandler
  extends OperationsHandlerBase
  implements IQueryHandler<ListSalesQuery, SaleView[]>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(): Promise<SaleView[]> {
    return (await this.operations.listSales()).map(toSaleView);
  }
}
@QueryHandler(GetSaleByIdQuery)
export class GetSaleByIdHandler
  extends OperationsHandlerBase
  implements IQueryHandler<GetSaleByIdQuery, SaleView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(query: GetSaleByIdQuery): Promise<SaleView> {
    const sale = await this.operations.findSaleById(query.id);
    if (!sale) throw new NotFoundException('La venta seleccionada no existe.');
    return toSaleView(sale);
  }
}
@QueryHandler(GetPreparationConfigurationQuery)
export class GetPreparationConfigurationHandler
  extends OperationsHandlerBase
  implements IQueryHandler<GetPreparationConfigurationQuery, PreparationConfigurationView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(): Promise<PreparationConfigurationView> {
    return { modoInicioPreparacion: await this.operations.getPreparationStartMode() };
  }
}
@QueryHandler(GetOpenCashSessionQuery)
export class GetOpenCashSessionHandler
  extends OperationsHandlerBase
  implements IQueryHandler<GetOpenCashSessionQuery, CashSessionView | null>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(query: GetOpenCashSessionQuery): Promise<CashSessionView | null> {
    const session = await this.operations.findOpenCashSessionByUser(query.userId);
    return session ? toCashSessionView(session) : null;
  }
}
@QueryHandler(ListCashSessionsQuery)
export class ListCashSessionsHandler
  extends OperationsHandlerBase
  implements IQueryHandler<ListCashSessionsQuery, CashSessionView[]>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(): Promise<CashSessionView[]> {
    return (await this.operations.listCashSessions()).map(toCashSessionView);
  }
}
@QueryHandler(ListCashMovementsQuery)
export class ListCashMovementsHandler
  extends OperationsHandlerBase
  implements IQueryHandler<ListCashMovementsQuery, CashMovementView[]>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(query: ListCashMovementsQuery): Promise<CashMovementView[]> {
    return (await this.operations.listCashMovements(query.cashSessionId)).map(toCashMovementView);
  }
}
@QueryHandler(ListSalePaymentsQuery)
export class ListSalePaymentsHandler
  extends OperationsHandlerBase
  implements IQueryHandler<ListSalePaymentsQuery, SalePaymentView[]>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(query: ListSalePaymentsQuery): Promise<SalePaymentView[]> {
    return (await this.operations.listPayments(query.saleId)).map(toPaymentView);
  }
}
@QueryHandler(GetCashSummaryQuery)
export class GetCashSummaryHandler
  extends OperationsHandlerBase
  implements IQueryHandler<GetCashSummaryQuery, CashSummaryView>
{
  constructor(
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY) operations: OperationsTransactionRepositoryPort,
    rules: OperationsRulesService,
  ) {
    super(operations, rules);
  }

  async execute(query: GetCashSummaryQuery): Promise<CashSummaryView> {
    return toCashSummaryView(await this.operations.calculateCashSummary(query.cashSessionId));
  }
}
