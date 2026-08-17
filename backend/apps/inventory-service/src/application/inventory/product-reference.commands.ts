import type { ProductReferenceInput } from '../../domain/ports/product-reference.ports';

export class SyncProductReferenceCommand {
  constructor(public readonly input: ProductReferenceInput) {}
}
