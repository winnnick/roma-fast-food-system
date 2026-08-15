export class ListCategoriesQuery {}

export class GetCategoryByIdQuery {
  constructor(public readonly id: number) {}
}
