import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  InventoryCancellationTreatment,
  InventoryConsumptionResult,
  InventoryEvaluationResult,
  InventoryIntegrationPort,
} from '../../domain/ports/inventory-integration.ports';
import { InventoryIntegrationError } from '../../domain/ports/inventory-integration.ports';

@Injectable()
export class HttpInventoryIntegration implements InventoryIntegrationPort {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('INVENTORY_INTERNAL_BASE_URL').replace(/\/$/, '');
    this.token = config.getOrThrow<string>('INTERNAL_SERVICE_TOKEN');
    this.timeoutMs = Number(config.get<string>('INTERNAL_HTTP_TIMEOUT_MS', '5000'));
  }

  evaluate(
    details: Array<{ productId: number; quantity: number }>,
  ): Promise<InventoryEvaluationResult> {
    return this.request<InventoryEvaluationResult>('evaluaciones-venta', {
      detalles: details.map((item) => ({ productoId: item.productId, cantidad: item.quantity })),
    });
  }

  consume(input: {
    saleId: number;
    orderNumber: string;
    details: Array<{ productId: number; quantity: number }>;
    authorizeNegativeBalance: boolean;
    userId: number;
    userName: string;
  }): Promise<InventoryConsumptionResult> {
    return this.request<InventoryConsumptionResult>('consumos-venta', {
      ventaId: input.saleId,
      numeroPedido: input.orderNumber,
      detalles: input.details.map((item) => ({
        productoId: item.productId,
        cantidad: item.quantity,
      })),
      autorizaSaldoNegativo: input.authorizeNegativeBalance,
      usuarioId: input.userId,
      usuarioNombre: input.userName,
    });
  }

  treatCancellation(input: {
    saleId: number;
    orderNumber: string;
    treatment: InventoryCancellationTreatment;
    reason: string;
    userId: number;
    userName: string;
  }): Promise<InventoryConsumptionResult> {
    return this.request<InventoryConsumptionResult>('anulaciones-venta', {
      ventaId: input.saleId,
      numeroPedido: input.orderNumber,
      tratamiento: input.treatment,
      motivo: input.reason,
      usuarioId: input.userId,
      usuarioNombre: input.userName,
    });
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-roma-internal-token': this.token,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new InventoryIntegrationError(
        'Inventory Service no está disponible para completar la operación.',
        null,
        null,
        { cause: error },
      );
    }

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String(payload.message)
          : `Inventory Service respondió HTTP ${response.status}.`;
      throw new InventoryIntegrationError(message, response.status, payload);
    }

    return payload as T;
  }
}
