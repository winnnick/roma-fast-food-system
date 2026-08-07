export type EstadoPedido =
  | "Pendiente"
  | "Preparando"
  | "Listo"
  | "Entregado"
  | "Anulado";

export interface VentaSemanal {
  dia: string;
  ventas: number;
  pedidos: number;
}

export interface MetodoPagoResumen {
  nombre: "Efectivo" | "QR";
  monto: number;
  porcentaje: number;
}

export interface PedidoReciente {
  id: number;
  numero: string;
  hora: string;
  cliente: string;
  total: number;
  estado: EstadoPedido;
}

export interface AlertaStock {
  id: number;
  insumo: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
}

export interface ResumenDashboard {
  ventasDia: number;
  pedidosDia: number;
  ticketPromedio: number;
  saldoCaja: number;

  cajaAbierta: boolean;
  horaApertura: string;

  comparacionVentas: number;
  comparacionPedidos: number;
  comparacionTicket: number;

  productosActivos: number;
  alertasStock: number;

  ventasSemana: VentaSemanal[];
  metodosPago: MetodoPagoResumen[];
  pedidosRecientes: PedidoReciente[];
  stockCritico: AlertaStock[];
}