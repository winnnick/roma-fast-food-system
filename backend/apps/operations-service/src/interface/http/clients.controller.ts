import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiJwtAuthGuard, ApiPermissionsGuard, RequirePermissions } from '@roma/shared';
import type { ClientView } from '../../application/catalog/catalog.views';
import {
  ChangeClientArchivedCommand,
  CreateClientCommand,
  UpdateClientCommand,
} from '../../application/clients/client.commands';
import { GetClientByIdQuery, ListClientsQuery } from '../../application/clients/client.queries';
import { UpsertClientDto } from './dto/client.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('CLIENTES_VER')
@Controller('clientes')
export class ClientsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los clientes registrados.' })
  list(): Promise<ClientView[]> {
    return this.queryBus.execute(new ListClientsQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un cliente por identificador.' })
  getById(@Param('id', ParseIntPipe) id: number): Promise<ClientView> {
    return this.queryBus.execute(new GetClientByIdQuery(id));
  }

  @Post()
  @RequirePermissions('CLIENTES_CREAR')
  create(@Body() dto: UpsertClientDto): Promise<ClientView> {
    return this.commandBus.execute(new CreateClientCommand(this.toInput(dto)));
  }

  @Put(':id')
  @RequirePermissions('CLIENTES_EDITAR')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertClientDto): Promise<ClientView> {
    return this.commandBus.execute(new UpdateClientCommand(id, this.toInput(dto)));
  }

  @Patch(':id/archivar')
  @RequirePermissions('CLIENTES_ARCHIVAR')
  archive(@Param('id', ParseIntPipe) id: number): Promise<ClientView> {
    return this.commandBus.execute(new ChangeClientArchivedCommand(id, true));
  }

  @Patch(':id/restaurar')
  @RequirePermissions('CLIENTES_ARCHIVAR')
  restore(@Param('id', ParseIntPipe) id: number): Promise<ClientView> {
    return this.commandBus.execute(new ChangeClientArchivedCommand(id, false));
  }

  private toInput(dto: UpsertClientDto) {
    return {
      fullName: dto.nombreCompleto,
      documentType: dto.tipoDocumento,
      documentNumber: dto.numeroDocumento,
      phone: dto.telefono,
      email: dto.correo,
      address: dto.direccion,
      zone: dto.zona,
      addressReference: dto.referenciaDireccion,
      locationUrl: dto.ubicacionUrl,
      deliveryInstructions: dto.indicacionesEntrega,
      observations: dto.observaciones,
    };
  }
}
