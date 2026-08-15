import type { ClientDocumentType } from '../../domain/catalog/catalog.models';

export interface ClientCommandInput {
  fullName: string;
  documentType: ClientDocumentType | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  zone?: string | null;
  addressReference?: string | null;
  locationUrl?: string | null;
  deliveryInstructions?: string | null;
  observations: string | null;
}

export class CreateClientCommand {
  constructor(public readonly input: ClientCommandInput) {}
}

export class UpdateClientCommand {
  constructor(
    public readonly id: number,
    public readonly input: ClientCommandInput,
  ) {}
}

export class ChangeClientArchivedCommand {
  constructor(
    public readonly id: number,
    public readonly archived: boolean,
  ) {}
}
