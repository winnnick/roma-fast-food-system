import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CatalogValidationService } from '../catalog/catalog-validation.service';
import { toClientView, type ClientView } from '../catalog/catalog.views';
import { CLIENT_REPOSITORY, type ClientRepositoryPort } from '../../domain/ports/catalog.ports';
import {
  ChangeClientArchivedCommand,
  CreateClientCommand,
  UpdateClientCommand,
} from './client.commands';
import { GetClientByIdQuery, ListClientsQuery } from './client.queries';

@CommandHandler(CreateClientCommand)
export class CreateClientHandler implements ICommandHandler<CreateClientCommand, ClientView> {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort,
    private readonly validation: CatalogValidationService,
  ) {}

  async execute(command: CreateClientCommand): Promise<ClientView> {
    const input = this.validation.normalizeClient(command.input);
    if (input.documentNumber && (await this.clients.documentExists(input.documentNumber))) {
      throw new ConflictException('Ya existe un cliente registrado con ese número de documento.');
    }
    return toClientView(await this.clients.create(input));
  }
}

@CommandHandler(UpdateClientCommand)
export class UpdateClientHandler implements ICommandHandler<UpdateClientCommand, ClientView> {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort,
    private readonly validation: CatalogValidationService,
  ) {}

  async execute(command: UpdateClientCommand): Promise<ClientView> {
    if (!(await this.clients.findById(command.id))) {
      throw new NotFoundException('El cliente seleccionado no existe.');
    }
    const input = this.validation.normalizeClient(command.input);
    if (
      input.documentNumber &&
      (await this.clients.documentExists(input.documentNumber, command.id))
    ) {
      throw new ConflictException('Ya existe un cliente registrado con ese número de documento.');
    }
    const updated = await this.clients.update(command.id, input);
    if (!updated) throw new NotFoundException('El cliente seleccionado no existe.');
    return toClientView(updated);
  }
}

@CommandHandler(ChangeClientArchivedCommand)
export class ChangeClientArchivedHandler implements ICommandHandler<
  ChangeClientArchivedCommand,
  ClientView
> {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort) {}

  async execute(command: ChangeClientArchivedCommand): Promise<ClientView> {
    const updated = await this.clients.changeArchived(command.id, command.archived);
    if (!updated) throw new NotFoundException('El cliente seleccionado no existe.');
    return toClientView(updated);
  }
}

@QueryHandler(ListClientsQuery)
export class ListClientsHandler implements IQueryHandler<ListClientsQuery, ClientView[]> {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort) {}
  async execute(): Promise<ClientView[]> {
    return (await this.clients.list()).map(toClientView);
  }
}

@QueryHandler(GetClientByIdQuery)
export class GetClientByIdHandler implements IQueryHandler<GetClientByIdQuery, ClientView> {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly clients: ClientRepositoryPort) {}
  async execute(query: GetClientByIdQuery): Promise<ClientView> {
    const client = await this.clients.findById(query.id);
    if (!client) throw new NotFoundException('El cliente seleccionado no existe.');
    return toClientView(client);
  }
}
