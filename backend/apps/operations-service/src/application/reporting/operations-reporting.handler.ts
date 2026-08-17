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

export interface OperationsReportingSnapshotView {
  generatedAt: string;
  categories: Awaited<ReturnType<CategoryRepositoryPort['list']>>;
  products: Awaited<ReturnType<ProductRepositoryPort['list']>>;
  clients: Awaited<ReturnType<ClientRepositoryPort['list']>>;
  sales: Awaited<ReturnType<OperationsTransactionRepositoryPort['listSales']>>;
  payments: Awaited<ReturnType<OperationsTransactionRepositoryPort['listPayments']>>;
  cashSessions: Awaited<ReturnType<OperationsTransactionRepositoryPort['listCashSessions']>>;
  cashMovements: Awaited<ReturnType<OperationsTransactionRepositoryPort['listCashMovements']>>;
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
      categories,
      products,
      clients,
      sales,
      payments,
      cashSessions,
      cashMovements,
    };
  }
}
