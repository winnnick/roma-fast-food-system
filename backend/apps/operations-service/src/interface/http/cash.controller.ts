import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  ApiJwtAuthGuard,
  ApiPermissionsGuard,
  RequirePermissions,
  type AuthenticatedApiRequest,
} from '@roma/shared';
import {
  CloseCashSessionCommand,
  OpenCashSessionCommand,
  RegisterManualCashMovementCommand,
} from '../../application/transactions/operations.commands';
import {
  GetCashSummaryQuery,
  GetOpenCashSessionQuery,
  ListCashMovementsQuery,
  ListCashSessionsQuery,
  ListSalePaymentsQuery,
} from '../../application/transactions/operations.queries';
import type {
  CashMovementView,
  CashSessionView,
  CashSummaryView,
  SalePaymentView,
} from '../../application/transactions/operations.views';
import { CloseCashDto, ManualCashMovementDto, OpenCashDto } from './dto/operations.dto';

function auth(request: AuthenticatedApiRequest) {
  if (!request.authUser) throw new Error('El guard JWT no cargó el usuario autenticado.');
  return {
    id: Number(request.authUser.sub),
    name: request.authUser.nombreCompleto,
    permissions: request.authUser.permissions,
  };
}

@ApiTags('Caja')
@ApiBearerAuth()
@UseGuards(ApiJwtAuthGuard, ApiPermissionsGuard)
@RequirePermissions('CAJA_VER')
@Controller('caja')
export class CashController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('actual')
  getCurrent(@Req() request: AuthenticatedApiRequest): Promise<CashSessionView | null> {
    return this.queryBus.execute(new GetOpenCashSessionQuery(auth(request).id));
  }

  @Get('sesiones')
  @RequirePermissions('CAJA_HISTORIAL')
  listSessions(): Promise<CashSessionView[]> {
    return this.queryBus.execute(new ListCashSessionsQuery());
  }

  @Post('aperturas')
  @RequirePermissions('CAJA_ABRIR')
  open(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: OpenCashDto,
  ): Promise<CashSessionView> {
    const user = auth(request);
    return this.commandBus.execute(
      new OpenCashSessionCommand(user.id, user.name, dto.montoInicial, dto.observacion ?? null),
    );
  }

  @Post('movimientos')
  registerMovement(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: ManualCashMovementDto,
  ): Promise<CashMovementView> {
    const user = auth(request);
    const required = dto.tipo === 'Ingreso' ? 'CAJA_INGRESOS' : 'CAJA_EGRESOS';
    if (!user.permissions.includes(required)) {
      throw new ForbiddenException('No tienes permiso para registrar este movimiento de caja.');
    }
    return this.commandBus.execute(
      new RegisterManualCashMovementCommand(dto.tipo, dto.concepto, dto.monto, user.id, user.name),
    );
  }

  @Get('movimientos')
  @RequirePermissions('CAJA_HISTORIAL')
  listMovements(@Query('sesionCajaId') cashSessionId?: string): Promise<CashMovementView[]> {
    const parsed = cashSessionId ? Number(cashSessionId) : undefined;
    return this.queryBus.execute(new ListCashMovementsQuery(parsed));
  }

  @Get('pagos')
  @RequirePermissions('CAJA_HISTORIAL')
  listPayments(@Query('ventaId') saleId?: string): Promise<SalePaymentView[]> {
    return this.queryBus.execute(new ListSalePaymentsQuery(saleId ? Number(saleId) : undefined));
  }

  @Get('sesiones/:id/resumen')
  @RequirePermissions('CAJA_HISTORIAL')
  summary(@Param('id', ParseIntPipe) id: number): Promise<CashSummaryView> {
    return this.queryBus.execute(new GetCashSummaryQuery(id));
  }

  @Post('cierre')
  @RequirePermissions('CAJA_CERRAR')
  close(
    @Req() request: AuthenticatedApiRequest,
    @Body() dto: CloseCashDto,
  ): Promise<CashSessionView> {
    const user = auth(request);
    return this.commandBus.execute(
      new CloseCashSessionCommand(user.id, user.name, dto.montoContado, dto.observacion ?? null),
    );
  }
}
