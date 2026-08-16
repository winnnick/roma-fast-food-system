import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiJwtAuthGuard,
  ApiPermissionsGuard,
  RequirePermissions,
  type AuthenticatedApiRequest,
} from '@roma/shared';
import {
  CancelSaleCommand,
  ChangePreparationStartModeCommand,
  ChangePreparationStatusCommand,
  CreateSaleCommand,
  RegisterSalePaymentCommand,
} from '../../application/transactions/operations.commands';
import {
  GetPreparationConfigurationQuery,
  GetSaleByIdQuery,
  ListSalePaymentsQuery,
  ListSalesQuery,
} from '../../application/transactions/operations.queries';
import type {
  PreparationConfigurationView,
  SalePaymentView,
  SaleView,
} from '../../application/transactions/operations.views';
import {
  CancelSaleDto,
  CreateSaleDto,
  PreparationModeDto,
  PreparationStatusDto,
  RegisterPaymentDto,
} from './dto/operations.dto';

function auth(request: AuthenticatedApiRequest) {
  if (!request.authUser) throw new Error('El guard JWT no cargó el usuario autenticado.');
  return { id: Number(request.authUser.sub), name: request.authUser.nombreCompleto };
}

@ApiTags('Ventas y pedidos')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('VENTAS_VER')
@Controller('ventas')
export class SalesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista pedidos y ventas.' })
  list(): Promise<SaleView[]> {
    return this.queryBus.execute(new ListSalesQuery());
  }

  @Get('configuracion/preparacion')
  getPreparationConfig(): Promise<PreparationConfigurationView> {
    return this.queryBus.execute(new GetPreparationConfigurationQuery());
  }

  @Put('configuracion/preparacion')
  @RequirePermissions('VENTAS_CONFIGURAR_FLUJO')
  changePreparationConfig(@Body() dto: PreparationModeDto): Promise<PreparationConfigurationView> {
    return this.commandBus.execute(new ChangePreparationStartModeCommand(dto.modo));
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<SaleView> {
    return this.queryBus.execute(new GetSaleByIdQuery(id));
  }

  @Post()
  @RequirePermissions('VENTAS_CREAR')
  create(@Req() request: AuthenticatedApiRequest, @Body() dto: CreateSaleDto): Promise<SaleView> {
    const user = auth(request);
    return this.commandBus.execute(
      new CreateSaleCommand({
        salesChannel: dto.canalVenta ?? 'Local',
        pedidosYaReference: dto.referenciaPedidosYa ?? null,
        clientType: dto.tipoCliente ?? 'Consumidor final',
        clientId: dto.clienteId ?? null,
        clientName: dto.clienteNombre ?? null,
        details: dto.detalles.map((detail) => ({
          productId: detail.productoId,
          quantity: detail.cantidad,
          note: detail.observacion ?? null,
        })),
        observations: dto.observaciones ?? null,
        authorizeNegativeInventory: dto.autorizaSaldoNegativo ?? false,
        userId: user.id,
        userName: user.name,
      }),
    );
  }

  @Patch(':id/preparacion')
  @RequirePermissions('VENTAS_PREPARAR')
  changePreparation(
    @Req() request: AuthenticatedApiRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PreparationStatusDto,
  ): Promise<SaleView> {
    const user = auth(request);
    return this.commandBus.execute(
      new ChangePreparationStatusCommand(id, dto.estado, user.id, user.name),
    );
  }

  @Post(':id/anulacion')
  @RequirePermissions('VENTAS_ANULAR')
  cancel(
    @Req() request: AuthenticatedApiRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelSaleDto,
  ): Promise<SaleView> {
    const user = auth(request);
    return this.commandBus.execute(
      new CancelSaleCommand(
        id,
        dto.motivo,
        dto.tratamientoInventario ?? 'Reintegrar insumos',
        user.id,
        user.name,
      ),
    );
  }

  @Post(':id/pagos')
  @RequirePermissions('VENTAS_COBRAR')
  registerPayment(
    @Req() request: AuthenticatedApiRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterPaymentDto,
  ): Promise<{ pago: SalePaymentView; venta: SaleView }> {
    const user = auth(request);
    return this.commandBus.execute(
      new RegisterSalePaymentCommand(
        id,
        dto.tipoDescuento,
        dto.valorDescuento,
        dto.motivoDescuento ?? null,
        dto.metodoPago,
        dto.montoQr,
        dto.montoEfectivo,
        dto.montoRecibido,
        dto.referenciaQr ?? null,
        user.id,
        user.name,
      ),
    );
  }

  @Get(':id/pagos')
  @RequirePermissions('VENTAS_COBRAR')
  listPayments(@Param('id', ParseIntPipe) id: number): Promise<SalePaymentView[]> {
    return this.queryBus.execute(new ListSalePaymentsQuery(id));
  }
}
