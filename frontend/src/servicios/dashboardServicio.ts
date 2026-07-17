import type { ResumenDashboard } from "../tipos/dashboard";

const datosSimulados: ResumenDashboard = {
  ventasDia: 1250,
  pedidosDia: 45,
  ticketPromedio: 27.78,
  saldoCaja: 850,

  cajaAbierta: true,
  horaApertura: "10:05",

  comparacionVentas: 12.4,
  comparacionPedidos: 8.1,
  comparacionTicket: -1.7,

  productosActivos: 28,
  alertasStock: 4,

  ventasSemana: [
    {
      dia: "Lun",
      ventas: 780,
      pedidos: 28,
    },
    {
      dia: "Mar",
      ventas: 920,
      pedidos: 33,
    },
    {
      dia: "Mié",
      ventas: 860,
      pedidos: 31,
    },
    {
      dia: "Jue",
      ventas: 1050,
      pedidos: 38,
    },
    {
      dia: "Vie",
      ventas: 1460,
      pedidos: 52,
    },
    {
      dia: "Sáb",
      ventas: 1840,
      pedidos: 67,
    },
    {
      dia: "Dom",
      ventas: 1250,
      pedidos: 45,
    },
  ],

  metodosPago: [
    {
      nombre: "Efectivo",
      monto: 780,
      porcentaje: 62.4,
    },
    {
      nombre: "QR",
      monto: 470,
      porcentaje: 37.6,
    },
  ],

  pedidosRecientes: [
    {
      id: 1,
      numero: "PED-045",
      hora: "21:36",
      cliente: "Consumidor final",
      total: 42,
      estado: "Preparando",
    },
    {
      id: 2,
      numero: "PED-044",
      hora: "21:28",
      cliente: "María Vargas",
      total: 58,
      estado: "Listo",
    },
    {
      id: 3,
      numero: "PED-043",
      hora: "21:17",
      cliente: "Consumidor final",
      total: 35,
      estado: "Entregado",
    },
    {
      id: 4,
      numero: "PED-042",
      hora: "21:04",
      cliente: "Carlos Méndez",
      total: 74,
      estado: "Entregado",
    },
    {
      id: 5,
      numero: "PED-041",
      hora: "20:52",
      cliente: "Consumidor final",
      total: 29,
      estado: "Anulado",
    },
  ],

  stockCritico: [
    {
      id: 1,
      insumo: "Pan de hamburguesa",
      stockActual: 12,
      stockMinimo: 20,
      unidad: "unidades",
    },
    {
      id: 2,
      insumo: "Carne para hamburguesa",
      stockActual: 8,
      stockMinimo: 15,
      unidad: "unidades",
    },
    {
      id: 3,
      insumo: "Queso cheddar",
      stockActual: 10,
      stockMinimo: 18,
      unidad: "lonjas",
    },
    {
      id: 4,
      insumo: "Papas",
      stockActual: 4.5,
      stockMinimo: 8,
      unidad: "kg",
    },
  ],
};

/*
  Simula una petición al backend.

  Cuando exista la API .NET, esta función será
  reemplazada por una solicitud realizada con Axios.
*/
export function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(datosSimulados);
    }, 700);
  });
}