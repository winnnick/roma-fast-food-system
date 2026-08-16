import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController } from '@nestjs/swagger';

import { InternalServiceGuard } from '@roma/shared';
import {
  RegisterSaleConsumptionCommand,
  TreatCancelledSaleInventoryCommand,
} from '../../application/inventory/inventory.commands';
import { EvaluateSaleInventoryQuery } from '../../application/inventory/inventory.queries';
import type {
  InventoryEvaluationView,
  SaleConsumptionView,
} from '../../application/inventory/inventory.views';
import {
  InternalCancellationTreatmentDto,
  InternalEvaluateSaleInventoryDto,
  InternalRegisterSaleConsumptionDto,
} from './dto/internal-inventory.dto';

@ApiExcludeController()
@UseGuards(InternalServiceGuard)
@Controller('internal/inventario')
export class InventoryInternalController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('evaluaciones-venta')
  evaluateSale(@Body() dto: InternalEvaluateSaleInventoryDto): Promise<InventoryEvaluationView> {
    return this.queryBus.execute(
      new EvaluateSaleInventoryQuery(
        dto.detalles.map((item) => ({ productId: item.productoId, quantity: item.cantidad })),
      ),
    );
  }

  @Post('consumos-venta')
  registerConsumption(
    @Body() dto: InternalRegisterSaleConsumptionDto,
  ): Promise<SaleConsumptionView> {
    return this.commandBus.execute(
      new RegisterSaleConsumptionCommand({
        saleId: dto.ventaId,
        orderNumber: dto.numeroPedido,
        details: dto.detalles.map((item) => ({
          productId: item.productoId,
          quantity: item.cantidad,
        })),
        authorizeNegativeBalance: dto.autorizaSaldoNegativo,
        userId: dto.usuarioId,
        userName: dto.usuarioNombre,
      }),
    );
  }

  @Post('anulaciones-venta')
  treatCancellation(@Body() dto: InternalCancellationTreatmentDto): Promise<SaleConsumptionView> {
    return this.commandBus.execute(
      new TreatCancelledSaleInventoryCommand(
        dto.ventaId,
        dto.numeroPedido,
        dto.tratamiento,
        dto.motivo,
        { userId: dto.usuarioId, userName: dto.usuarioNombre },
      ),
    );
  }
}
