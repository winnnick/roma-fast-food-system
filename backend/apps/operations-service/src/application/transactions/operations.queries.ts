export class ListSalesQuery {}
export class GetSaleByIdQuery {
  constructor(public readonly id: number) {}
}
export class GetPreparationConfigurationQuery {}
export class GetOpenCashSessionQuery {
  constructor(public readonly userId: number) {}
}
export class ListCashSessionsQuery {}
export class ListCashMovementsQuery {
  constructor(public readonly cashSessionId?: number) {}
}
export class ListSalePaymentsQuery {
  constructor(public readonly saleId?: number) {}
}
export class GetCashSummaryQuery {
  constructor(public readonly cashSessionId: number) {}
}
