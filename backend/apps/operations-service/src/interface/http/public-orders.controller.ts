import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  GetPreparationConfigurationQuery,
  ListSalesQuery,
} from '../../application/transactions/operations.queries';
import type {
  PreparationConfigurationView,
  SaleView,
} from '../../application/transactions/operations.views';

interface PublicOrderView {
  id: number;
  numeroPedido: string;
  estadoPreparacion: SaleView['estadoPreparacion'];
  fechaHoraRegistro: string;
  fechaHoraInicioPreparacion: string | null;
  fechaHoraListo: string | null;
}

interface PublicOrdersResponse {
  modoInicioPreparacion: PreparationConfigurationView['modoInicioPreparacion'];
  ventas: PublicOrderView[];
}

@ApiTags('Pantalla pública')
@Controller('public')
export class PublicOrdersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('pedidos')
  @ApiOperation({ summary: 'Pedidos visibles en la pantalla pública del restaurante.' })
  async listOrders(): Promise<PublicOrdersResponse> {
    const [sales, config] = await Promise.all([
      this.queryBus.execute<ListSalesQuery, SaleView[]>(new ListSalesQuery()),
      this.queryBus.execute<GetPreparationConfigurationQuery, PreparationConfigurationView>(
        new GetPreparationConfigurationQuery(),
      ),
    ]);

    return {
      modoInicioPreparacion: config.modoInicioPreparacion,
      ventas: sales
        .filter(
          (sale) =>
            sale.estadoPreparacion === 'En cola' ||
            sale.estadoPreparacion === 'En preparación' ||
            sale.estadoPreparacion === 'Listo',
        )
        .map((sale) => ({
          id: sale.id,
          numeroPedido: sale.numeroPedido,
          estadoPreparacion: sale.estadoPreparacion,
          fechaHoraRegistro: sale.fechaHoraRegistro,
          fechaHoraInicioPreparacion: sale.fechaHoraInicioPreparacion,
          fechaHoraListo: sale.fechaHoraListo,
        })),
    };
  }
}
