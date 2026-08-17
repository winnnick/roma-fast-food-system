import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import {
  PRODUCT_REFERENCE_REPOSITORY,
  type ProductReferenceRepositoryPort,
} from '../../domain/ports/product-reference.ports';
import { SyncProductReferenceCommand } from './product-reference.commands';

@CommandHandler(SyncProductReferenceCommand)
export class SyncProductReferenceHandler implements ICommandHandler<
  SyncProductReferenceCommand,
  void
> {
  constructor(
    @Inject(PRODUCT_REFERENCE_REPOSITORY)
    private readonly repository: ProductReferenceRepositoryPort,
  ) {}

  async execute(command: SyncProductReferenceCommand): Promise<void> {
    await this.repository.upsert(command.input);
  }
}
