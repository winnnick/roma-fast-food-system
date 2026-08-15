export class ListProductsQuery {}

export class GetProductByIdQuery {
  constructor(public readonly id: number) {}
}
