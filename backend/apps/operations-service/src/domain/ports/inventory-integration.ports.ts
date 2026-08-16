export const INVENTORY_INTEGRATION = Symbol('INVENTORY_INTEGRATION');

export type InventoryCancellationTreatment = 'Reintegrar insumos' | 'Registrar como merma';

export interface InventoryEvaluationProjection {
  insumoId: number;
  insumoCodigo: string;
  insumoNombre: string;
  unidadBase: 'g' | 'ml' | 'unidad';
  cantidadDisponible: number;
  cantidadRequerida: number;
  saldoResultante: number;
  nivel: string;
  politicaFaltante: string;
  productosRelacionados: string[];
}

export interface InventoryEvaluationResult {
  bloqueada: boolean;
  requiereConfirmacion: boolean;
  proyecciones: InventoryEvaluationProjection[];
  alertas: InventoryEvaluationProjection[];
  productosSinReceta: string[];
}

export interface InventoryConsumptionResult {
  id: number;
  ventaId: number;
  numeroPedido: string;
  estado: string;
  detalles: unknown[];
}

export interface InventoryIntegrationPort {
  evaluate(
    details: Array<{ productId: number; quantity: number }>,
  ): Promise<InventoryEvaluationResult>;
  consume(input: {
    saleId: number;
    orderNumber: string;
    details: Array<{ productId: number; quantity: number }>;
    authorizeNegativeBalance: boolean;
    userId: number;
    userName: string;
  }): Promise<InventoryConsumptionResult>;
  treatCancellation(input: {
    saleId: number;
    orderNumber: string;
    treatment: InventoryCancellationTreatment;
    reason: string;
    userId: number;
    userName: string;
  }): Promise<InventoryConsumptionResult>;
}

export class InventoryIntegrationError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly payload: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'InventoryIntegrationError';
  }
}
