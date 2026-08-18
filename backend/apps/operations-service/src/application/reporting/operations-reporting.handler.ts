import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type {
  CategoryRepositoryPort,
  ClientRepositoryPort,
  ProductRepositoryPort,
} from '../../domain/ports/catalog.ports';
import {
  CATEGORY_REPOSITORY,
  CLIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
} from '../../domain/ports/catalog.ports';
import type { OperationsTransactionRepositoryPort } from '../../domain/ports/operations.ports';
import { OPERATIONS_TRANSACTION_REPOSITORY } from '../../domain/ports/operations.ports';
import { GetOperationsReportingSnapshotQuery } from './operations-reporting.query';
import {
  toCategoryView,
  toClientView,
  toProductView,
  type CategoryView,
  type ClientView,
  type ProductView,
} from '../catalog/catalog.views';
import {
  toCashMovementView,
  toCashSessionView,
  toPaymentView,
  toSaleView,
  type CashMovementView,
  type CashSessionView,
  type SalePaymentView,
  type SaleView,
} from '../transactions/operations.views';

export interface OperationsReportingSnapshotView {
  generatedAt: string;
  categories: CategoryView[];
  products: ProductView[];
  clients: ClientView[];
  sales: SaleView[];
  payments: SalePaymentView[];
  cashSessions: CashSessionView[];
  cashMovements: CashMovementView[];
}

@QueryHandler(GetOperationsReportingSnapshotQuery)
export class GetOperationsReportingSnapshotHandler implements IQueryHandler<
  GetOperationsReportingSnapshotQuery,
  OperationsReportingSnapshotView
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort,
    @Inject(OPERATIONS_TRANSACTION_REPOSITORY)
    private readonly operations: OperationsTransactionRepositoryPort,
  ) {}

  async execute(): Promise<OperationsReportingSnapshotView> {
    const [categories, products, clients, sales, payments, cashSessions, cashMovements] =
      await Promise.all([
        this.categories.list(),
        this.products.list(),
        this.clients.list(),
        this.operations.listSales(),
        this.operations.listPayments(),
        this.operations.listCashSessions(),
        this.operations.listCashMovements(),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      categories: categories.map(toCategoryView),
      products: products.map(toProductView),
      clients: clients.map(toClientView),
      sales: sales.map(toSaleView),
      payments: payments.map(toPaymentView),
      cashSessions: cashSessions.map(toCashSessionView),
      cashMovements: cashMovements.map(toCashMovementView),
    };
  }
}
