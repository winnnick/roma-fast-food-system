import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { OperationsRulesService } from '../../application/transactions/operations-rules.service';
import type {
  CashMovementSnapshot,
  CashSessionSnapshot,
  CashSummarySnapshot,
  PreparedSaleInput,
  PreparationStartMode,
  PreparationStatus,
  RegisterManualMovementInput,
  RegisterPaymentInput,
  SaleDetailSnapshot,
  SalePaymentSnapshot,
  SaleSnapshot,
  SaleInventoryStatus,
} from '../../domain/operations/operations.models';
import type { OperationsTransactionRepositoryPort } from '../../domain/ports/operations.ports';
import { CashMovementOrmEntity } from './entities/cash-movement.orm-entity';
import { CashSessionOrmEntity } from './entities/cash-session.orm-entity';
import { OperationsSettingOrmEntity } from './entities/operations-setting.orm-entity';
import { SaleDetailOrmEntity } from './entities/sale-detail.orm-entity';
import { SalePaymentOrmEntity } from './entities/sale-payment.orm-entity';
import { SaleOrmEntity } from './entities/sale.orm-entity';

@Injectable()
export class TypeOrmOperationsTransactionRepository implements OperationsTransactionRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rules: OperationsRulesService,
  ) {}

  async listSales(): Promise<SaleSnapshot[]> {
    const rows = await this.dataSource.getRepository(SaleOrmEntity).find({
      relations: { details: true },
      order: { id: 'DESC' },
    });
    return rows.map((row) => this.toSaleSnapshot(row));
  }

  async findSaleById(id: number): Promise<SaleSnapshot | null> {
    const row = await this.dataSource.getRepository(SaleOrmEntity).findOne({
      where: { id },
      relations: { details: true },
    });
    return row ? this.toSaleSnapshot(row) : null;
  }

  async createSale(input: PreparedSaleInput): Promise<SaleSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      const cash = await this.findOpenCashForUpdate(manager, input.userId, input.cashSessionId);
      if (!cash)
        throw new ConflictException(
          'La caja utilizada para registrar el pedido ya no está abierta.',
        );

      const sequenceResult = await manager.query<Array<{ value: string | number }>>(
        `SELECT nextval('ops_order_number_seq') AS value`,
      );
      const sequenceValue = Number(sequenceResult[0]?.value);
      const now = new Date();
      const orderNumber = `PED-${String(sequenceValue).padStart(4, '0')}`;

      const saleRepo = manager.getRepository(SaleOrmEntity);
      const sale = saleRepo.create({
        orderNumber,
        salesChannel: input.salesChannel,
        pedidosYaReference: input.pedidosYaReference,
        pedidosYaSettlementId: null,
        pedidosYaSettledAt: null,
        clientType: input.clientType,
        clientId: input.clientId,
        clientName: input.clientName,
        registeredByUserId: input.userId,
        registeredByUserName: input.userName,
        registrationCashSessionId: input.cashSessionId,
        observations: input.observations,
        requiresPreparation: input.requiresPreparation,
        subtotal: input.subtotal,
        discountType: 'Ninguno',
        discountValue: 0,
        discountAmount: 0,
        discountReason: null,
        total: input.subtotal,
        preparationStatus: input.preparationStatus,
        paymentStatus: input.paymentStatus,
        lastPaymentId: null,
        accumulatedPaymentMethod: null,
        cancellationReason: null,
        inventoryStatus: 'Pendiente',
        inventoryConsumptionId: null,
        inventoryLastError: null,
        inventoryUpdatedAt: now,
        registeredAt: now,
        preparationStartedAt: input.preparationStatus === 'En preparación' ? now : null,
        readyAt: null,
        deliveredAt: null,
        deliveredByUserId: null,
        deliveredByUserName: null,
        deliveryCashSessionId: null,
        fullyPaidAt: null,
        cancelledAt: null,
        updatedAt: now,
      });
      const saved = await saleRepo.save(sale);

      const detailRepo = manager.getRepository(SaleDetailOrmEntity);
      const details = input.details.map((detail) =>
        detailRepo.create({ saleId: saved.id, ...detail }),
      );
      const savedDetails = await detailRepo.save(details);
      saved.details = savedDetails;
      return this.toSaleSnapshot(saved);
    });
  }

  async changePreparationStatus(
    saleId: number,
    status: PreparationStatus,
    delivery: { userId: number; userName: string; cashSessionId: number } | null,
  ): Promise<SaleSnapshot | null> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SaleOrmEntity);
      const sale = await repo.findOne({ where: { id: saleId }, relations: { details: true } });
      if (!sale) return null;
      const now = new Date();
      sale.preparationStatus = status;
      if (status === 'En preparación') sale.preparationStartedAt = now;
      if (status === 'Listo') sale.readyAt = now;
      if (status === 'Entregado') {
        sale.deliveredAt = now;
        if (delivery) {
          sale.deliveredByUserId = delivery.userId;
          sale.deliveredByUserName = delivery.userName;
          sale.deliveryCashSessionId = delivery.cashSessionId;
        }
      }
      sale.updatedAt = now;
      return this.toSaleSnapshot(await repo.save(sale));
    });
  }

  async cancelSale(saleId: number, reason: string): Promise<SaleSnapshot | null> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SaleOrmEntity);
      const sale = await repo.findOne({ where: { id: saleId }, relations: { details: true } });
      if (!sale) return null;
      const now = new Date();
      sale.preparationStatus = 'Anulado';
      sale.paymentStatus = 'Anulada';
      sale.cancellationReason = reason;
      sale.cancelledAt = now;
      sale.updatedAt = now;
      return this.toSaleSnapshot(await repo.save(sale));
    });
  }

  async updateSaleInventoryState(
    saleId: number,
    status: SaleInventoryStatus,
    consumptionId: number | null,
    error: string | null,
  ): Promise<SaleSnapshot | null> {
    const repo = this.dataSource.getRepository(SaleOrmEntity);
    const sale = await repo.findOne({ where: { id: saleId }, relations: { details: true } });
    if (!sale) return null;
    sale.inventoryStatus = status;
    sale.inventoryConsumptionId = consumptionId;
    sale.inventoryLastError = error?.slice(0, 500) ?? null;
    sale.inventoryUpdatedAt = new Date();
    sale.updatedAt = sale.inventoryUpdatedAt;
    return this.toSaleSnapshot(await repo.save(sale));
  }

  async getPreparationStartMode(): Promise<PreparationStartMode> {
    const setting = await this.dataSource
      .getRepository(OperationsSettingOrmEntity)
      .findOneBy({ key: 'preparation_start_mode' });
    return setting?.value === 'En cola' ? 'En cola' : 'En preparación';
  }

  async setPreparationStartMode(mode: PreparationStartMode): Promise<PreparationStartMode> {
    const repo = this.dataSource.getRepository(OperationsSettingOrmEntity);
    await repo.save(repo.create({ key: 'preparation_start_mode', value: mode }));
    return mode;
  }

  countQueuedSales(): Promise<number> {
    return this.dataSource.getRepository(SaleOrmEntity).countBy({
      preparationStatus: 'En cola',
    });
  }

  async findOpenCashSessionByUser(userId: number): Promise<CashSessionSnapshot | null> {
    const row = await this.dataSource.getRepository(CashSessionOrmEntity).findOne({
      where: { openingUserId: userId, status: 'Abierta' },
      order: { id: 'DESC' },
    });
    return row ? this.toCashSnapshot(row) : null;
  }

  async listCashSessions(): Promise<CashSessionSnapshot[]> {
    return (
      await this.dataSource.getRepository(CashSessionOrmEntity).find({ order: { id: 'DESC' } })
    ).map((row) => this.toCashSnapshot(row));
  }

  async listCashMovements(cashSessionId?: number): Promise<CashMovementSnapshot[]> {
    const repo = this.dataSource.getRepository(CashMovementOrmEntity);
    const rows =
      cashSessionId === undefined
        ? await repo.find({ order: { id: 'DESC' } })
        : await repo.find({ where: { cashSessionId }, order: { id: 'DESC' } });
    return rows.map((row) => this.toMovementSnapshot(row));
  }

  async listPayments(saleId?: number): Promise<SalePaymentSnapshot[]> {
    const repo = this.dataSource.getRepository(SalePaymentOrmEntity);
    const rows =
      saleId === undefined
        ? await repo.find({ order: { id: 'DESC' } })
        : await repo.find({ where: { saleId }, order: { id: 'ASC' } });
    return rows.map((row) => this.toPaymentSnapshot(row));
  }

  async openCashSession(
    userId: number,
    userName: string,
    initialAmount: number,
    note: string | null,
  ): Promise<CashSessionSnapshot> {
    const repo = this.dataSource.getRepository(CashSessionOrmEntity);
    const current = await repo.findOneBy({ openingUserId: userId, status: 'Abierta' });
    if (current)
      throw new ConflictException(
        `Ya tienes abierta la caja N.º ${current.id}. Debes cerrarla antes de iniciar otra.`,
      );
    const row = repo.create({
      status: 'Abierta',
      openingUserId: userId,
      openingUserName: userName,
      initialAmount,
      openingNote: note,
      openedAt: new Date(),
      closingUserId: null,
      closingUserName: null,
      countedAmount: null,
      expectedCash: null,
      difference: null,
      closingNote: null,
      closedAt: null,
    });
    return this.toCashSnapshot(await repo.save(row));
  }

  async registerManualMovement(input: RegisterManualMovementInput): Promise<CashMovementSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      const cash = await manager
        .getRepository(CashSessionOrmEntity)
        .findOneBy({ openingUserId: input.userId, status: 'Abierta' });
      if (!cash)
        throw new ConflictException(
          'No tienes una caja abierta. Abre tu caja antes de realizar esta operación.',
        );
      const repo = manager.getRepository(CashMovementOrmEntity);
      const row = repo.create({
        cashSessionId: cash.id,
        type: input.type,
        concept: input.concept,
        amount: input.amount,
        cashAmount: input.amount,
        qrAmount: 0,
        paymentMethod: 'Efectivo',
        saleId: null,
        orderNumber: null,
        userId: input.userId,
        userName: input.userName,
        registeredAt: new Date(),
      });
      return this.toMovementSnapshot(await repo.save(row));
    });
  }

  async calculateCashSummary(cashSessionId: number): Promise<CashSummarySnapshot> {
    const session = await this.dataSource
      .getRepository(CashSessionOrmEntity)
      .findOneBy({ id: cashSessionId });
    if (!session) throw new NotFoundException('No se encontró la sesión de caja.');
    return this.calculateSummaryWithManager(this.dataSource.manager, session);
  }

  async closeCashSession(
    userId: number,
    userName: string,
    countedAmount: number,
    note: string | null,
  ): Promise<CashSessionSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CashSessionOrmEntity);
      const session = await this.findOpenCashForUpdate(manager, userId);
      if (!session) throw new ConflictException('No tienes una caja abierta para cerrar.');
      const summary = await this.calculateSummaryWithManager(manager, session);
      const now = new Date();
      session.status = 'Cerrada';
      session.closingUserId = userId;
      session.closingUserName = userName;
      session.countedAmount = countedAmount;
      session.expectedCash = summary.expectedCash;
      session.difference = this.rules.roundMoney(countedAmount - summary.expectedCash);
      session.closingNote = note;
      session.closedAt = now;
      return this.toCashSnapshot(await repo.save(session));
    });
  }

  async registerPayment(
    input: RegisterPaymentInput,
  ): Promise<{ payment: SalePaymentSnapshot; sale: SaleSnapshot }> {
    return this.dataSource.transaction(async (manager) => {
      const cash = await manager
        .getRepository(CashSessionOrmEntity)
        .findOneBy({ openingUserId: input.userId, status: 'Abierta' });
      if (!cash)
        throw new ConflictException('No tienes una caja abierta. Abre tu caja antes de cobrar.');

      const saleRepo = manager.getRepository(SaleOrmEntity);
      const sale = await saleRepo
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.id = :id', { id: input.saleId })
        .getOne();
      if (!sale) throw new NotFoundException('La venta seleccionada no existe.');
      if (sale.salesChannel === 'PedidosYa')
        throw new ConflictException('Los pedidos de PedidosYa no se cobran en la caja del local.');
      if (sale.paymentStatus === 'Cobrada') throw new ConflictException('La venta ya fue cobrada.');
      if (sale.paymentStatus === 'Anulada' || sale.preparationStatus === 'Anulado')
        throw new ConflictException('Una venta anulada no puede cobrarse.');

      const paymentRepo = manager.getRepository(SalePaymentOrmEntity);
      const previousRows = await paymentRepo.find({
        where: { saleId: sale.id },
        order: { id: 'ASC' },
      });
      const previous = previousRows.map((row) => this.toPaymentSnapshot(row));
      const previousPaid = this.rules.roundMoney(
        previous.reduce((sum, payment) => sum + payment.appliedAmount, 0),
      );
      const hasPrevious = previous.length > 0;
      const discount = hasPrevious
        ? {
            discountValue: sale.discountValue,
            discountAmount: sale.discountAmount,
            discountReason: sale.discountReason,
            total: sale.total,
          }
        : this.rules.calculateDiscount(
            sale.subtotal,
            input.discountType,
            input.discountValue,
            input.discountReason,
          );
      const pending = this.rules.roundMoney(discount.total - previousPaid);
      if (pending <= 0)
        throw new ConflictException('La venta ya no tiene saldo pendiente de cobro.');
      const distribution = this.rules.calculatePaymentDistribution({
        pendingBalance: pending,
        requestedMethod: input.paymentMethod,
        cashAmount: input.cashAmount,
        qrAmount: input.qrAmount,
        receivedAmount: input.receivedAmount,
        qrReference: input.qrReference,
      });
      const accumulatedPaid = this.rules.roundMoney(previousPaid + distribution.appliedAmount);
      const complete = accumulatedPaid >= discount.total;
      const accumulatedMethod = this.rules.accumulatedPaymentMethod(
        previous,
        distribution.paymentMethod,
      );
      const now = new Date();

      const payment = paymentRepo.create({
        cashSessionId: cash.id,
        saleId: sale.id,
        orderNumber: sale.orderNumber,
        subtotal: sale.subtotal,
        discountType: hasPrevious ? 'Ninguno' : input.discountType,
        discountValue: hasPrevious ? 0 : discount.discountValue,
        discountAmount: hasPrevious ? 0 : discount.discountAmount,
        discountReason: hasPrevious ? null : discount.discountReason,
        saleTotal: discount.total,
        appliedAmount: distribution.appliedAmount,
        paymentMethod: distribution.paymentMethod,
        cashAmount: distribution.cashAmount,
        qrAmount: distribution.qrAmount,
        receivedAmount: distribution.receivedAmount,
        changeAmount: distribution.changeAmount,
        qrReference: distribution.qrReference,
        userId: input.userId,
        userName: input.userName,
        paidAt: now,
      });
      const savedPayment = await paymentRepo.save(payment);

      const movementRepo = manager.getRepository(CashMovementOrmEntity);
      const concept =
        complete && previousPaid > 0
          ? `Saldo de ${sale.orderNumber}`
          : complete
            ? `Cobro de ${sale.orderNumber}`
            : `Abono de ${sale.orderNumber}`;
      await movementRepo.save(
        movementRepo.create({
          cashSessionId: cash.id,
          type: 'Venta',
          concept,
          amount: distribution.appliedAmount,
          cashAmount: distribution.cashAmount,
          qrAmount: distribution.qrAmount,
          paymentMethod: distribution.paymentMethod,
          saleId: sale.id,
          orderNumber: sale.orderNumber,
          userId: input.userId,
          userName: input.userName,
          registeredAt: now,
        }),
      );

      sale.discountType = hasPrevious ? sale.discountType : input.discountType;
      sale.discountValue = hasPrevious ? sale.discountValue : discount.discountValue;
      sale.discountAmount = hasPrevious ? sale.discountAmount : discount.discountAmount;
      sale.discountReason = hasPrevious ? sale.discountReason : discount.discountReason;
      sale.total = discount.total;
      sale.paymentStatus = complete ? 'Cobrada' : 'Pendiente de cobro';
      sale.lastPaymentId = savedPayment.id;
      sale.accumulatedPaymentMethod = accumulatedMethod;
      sale.fullyPaidAt = complete ? now : null;
      sale.updatedAt = now;
      const savedSale = await saleRepo.save(sale);
      savedSale.details = await manager.getRepository(SaleDetailOrmEntity).find({
        where: { saleId: sale.id },
        order: { id: 'ASC' },
      });
      return {
        payment: this.toPaymentSnapshot(savedPayment),
        sale: this.toSaleSnapshot(savedSale),
      };
    });
  }

  private findOpenCashForUpdate(
    manager: EntityManager,
    userId: number,
    expectedId?: number,
  ): Promise<CashSessionOrmEntity | null> {
    const query = manager
      .getRepository(CashSessionOrmEntity)
      .createQueryBuilder('cash')
      .setLock('pessimistic_write')
      .where('cash.openingUserId = :userId', { userId })
      .andWhere('cash.status = :status', { status: 'Abierta' });
    if (expectedId !== undefined) query.andWhere('cash.id = :expectedId', { expectedId });
    return query.getOne();
  }

  private async calculateSummaryWithManager(
    manager: EntityManager,
    session: CashSessionOrmEntity,
  ): Promise<CashSummarySnapshot> {
    const movements = await manager
      .getRepository(CashMovementOrmEntity)
      .find({ where: { cashSessionId: session.id } });
    const saleMovements = movements.filter((movement) => movement.type === 'Venta');
    const totalCashSales = this.rules.roundMoney(
      saleMovements.reduce((sum, movement) => sum + movement.cashAmount, 0),
    );
    const totalQrSales = this.rules.roundMoney(
      saleMovements.reduce((sum, movement) => sum + movement.qrAmount, 0),
    );
    const manualIncomeTotal = this.rules.roundMoney(
      movements
        .filter((movement) => movement.type === 'Ingreso')
        .reduce((sum, movement) => sum + movement.amount, 0),
    );
    const manualExpenseTotal = this.rules.roundMoney(
      movements
        .filter((movement) => movement.type === 'Egreso')
        .reduce((sum, movement) => sum + movement.amount, 0),
    );
    return {
      cashSessionId: session.id,
      initialAmount: session.initialAmount,
      salesCount: saleMovements.length,
      totalSales: this.rules.roundMoney(totalCashSales + totalQrSales),
      totalCashSales,
      totalQrSales,
      manualIncomeTotal,
      manualExpenseTotal,
      expectedCash: this.rules.roundMoney(
        session.initialAmount + totalCashSales + manualIncomeTotal - manualExpenseTotal,
      ),
    };
  }

  private toCashSnapshot(row: CashSessionOrmEntity): CashSessionSnapshot {
    return {
      id: row.id,
      status: row.status,
      openingUserId: row.openingUserId,
      openingUserName: row.openingUserName,
      initialAmount: row.initialAmount,
      openingNote: row.openingNote,
      openedAt: row.openedAt,
      closingUserId: row.closingUserId,
      closingUserName: row.closingUserName,
      countedAmount: row.countedAmount,
      expectedCash: row.expectedCash,
      difference: row.difference,
      closingNote: row.closingNote,
      closedAt: row.closedAt,
    };
  }

  private toMovementSnapshot(row: CashMovementOrmEntity): CashMovementSnapshot {
    return {
      id: row.id,
      cashSessionId: row.cashSessionId,
      type: row.type,
      concept: row.concept,
      amount: row.amount,
      cashAmount: row.cashAmount,
      qrAmount: row.qrAmount,
      paymentMethod: row.paymentMethod,
      saleId: row.saleId,
      orderNumber: row.orderNumber,
      userId: row.userId,
      userName: row.userName,
      registeredAt: row.registeredAt,
    };
  }

  private toPaymentSnapshot(row: SalePaymentOrmEntity): SalePaymentSnapshot {
    return {
      id: row.id,
      cashSessionId: row.cashSessionId,
      saleId: row.saleId,
      orderNumber: row.orderNumber,
      subtotal: row.subtotal,
      discountType: row.discountType,
      discountValue: row.discountValue,
      discountAmount: row.discountAmount,
      discountReason: row.discountReason,
      saleTotal: row.saleTotal,
      appliedAmount: row.appliedAmount,
      paymentMethod: row.paymentMethod,
      cashAmount: row.cashAmount,
      qrAmount: row.qrAmount,
      receivedAmount: row.receivedAmount,
      changeAmount: row.changeAmount,
      qrReference: row.qrReference,
      userId: row.userId,
      userName: row.userName,
      paidAt: row.paidAt,
    };
  }

  private toSaleSnapshot(row: SaleOrmEntity): SaleSnapshot {
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      salesChannel: row.salesChannel,
      pedidosYaReference: row.pedidosYaReference,
      pedidosYaSettlementId: row.pedidosYaSettlementId,
      pedidosYaSettledAt: row.pedidosYaSettledAt,
      clientType: row.clientType,
      clientId: row.clientId,
      clientName: row.clientName,
      registeredByUserId: row.registeredByUserId,
      registeredByUserName: row.registeredByUserName,
      registrationCashSessionId: row.registrationCashSessionId,
      details: (row.details ?? []).map((detail) => this.toDetailSnapshot(detail)),
      observations: row.observations,
      requiresPreparation: row.requiresPreparation,
      subtotal: row.subtotal,
      discountType: row.discountType,
      discountValue: row.discountValue,
      discountAmount: row.discountAmount,
      discountReason: row.discountReason,
      total: row.total,
      preparationStatus: row.preparationStatus,
      paymentStatus: row.paymentStatus,
      lastPaymentId: row.lastPaymentId,
      accumulatedPaymentMethod: row.accumulatedPaymentMethod,
      cancellationReason: row.cancellationReason,
      inventoryStatus: row.inventoryStatus,
      inventoryConsumptionId: row.inventoryConsumptionId,
      inventoryLastError: row.inventoryLastError,
      inventoryUpdatedAt: row.inventoryUpdatedAt,
      registeredAt: row.registeredAt,
      preparationStartedAt: row.preparationStartedAt,
      readyAt: row.readyAt,
      deliveredAt: row.deliveredAt,
      deliveredByUserId: row.deliveredByUserId,
      deliveredByUserName: row.deliveredByUserName,
      deliveryCashSessionId: row.deliveryCashSessionId,
      fullyPaidAt: row.fullyPaidAt,
      cancelledAt: row.cancelledAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDetailSnapshot(row: SaleDetailOrmEntity): SaleDetailSnapshot {
    return {
      id: row.id,
      productId: row.productId,
      productCode: row.productCode,
      productName: row.productName,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      note: row.note,
      subtotal: row.subtotal,
      requiresPreparation: row.requiresPreparation,
    };
  }
}
