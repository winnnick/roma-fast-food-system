import type {
  ActualizarClienteDto,
  Cliente,
  CrearClienteDto,
  ResumenUltimoPedidoCliente,
} from "../tipos/cliente";

import type {
  Venta,
} from "../tipos/venta";

import {
  apiOperations,
  crearErrorApi,
} from "./apiCliente";

export function clienteTieneDatosEntrega(
  cliente: Cliente,
): boolean {
  return Boolean(
    cliente.direccion ||
      cliente.ubicacionUrl,
  );
}

export function clienteTieneDatosEntregaCompletos(
  cliente: Cliente,
): boolean {
  return Boolean(
    cliente.telefono &&
      (
        cliente.direccion ||
        cliente.ubicacionUrl
      ),
  );
}

export function construirTextoEntregaCliente(
  cliente: Cliente,
): string {
  const lineas = [
    "DATOS DE ENTREGA",
    "",
    `Cliente: ${cliente.nombreCompleto}`,
    `Teléfono: ${cliente.telefono ?? "No registrado"}`,
  ];

  if (cliente.direccion) {
    lineas.push(
      `Dirección: ${cliente.direccion}`,
    );
  }

  if (cliente.zona) {
    lineas.push(`Zona: ${cliente.zona}`);
  }

  if (cliente.referenciaDireccion) {
    lineas.push(
      `Referencia: ${cliente.referenciaDireccion}`,
    );
  }

  if (cliente.ubicacionUrl) {
    lineas.push(
      `Ubicación: ${cliente.ubicacionUrl}`,
    );
  }

  if (cliente.indicacionesEntrega) {
    lineas.push(
      `Indicaciones: ${cliente.indicacionesEntrega}`,
    );
  }

  return lineas.join("\n");
}

export function generarUrlWhatsappEntregaCliente(
  cliente: Cliente,
  telefonoDestino?: string | null,
): string {
  const mensaje =
    construirTextoEntregaCliente(cliente);

  const destino =
    telefonoDestino?.replace(
      /\D/g,
      "",
    ) ?? "";

  const base = destino
    ? `https://wa.me/${destino}`
    : "https://wa.me/";

  return `${base}?text=${encodeURIComponent(
    mensaje,
  )}`;
}

function formatearMonedaEntrega(
  valor: number,
): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

export function construirTextoEntregaPedido(
  venta: Venta,
  cliente: Cliente,
): string {
  const lineas = [
    "PEDIDO PARA ENTREGA",
    "",
    `Pedido: ${venta.numeroPedido}`,
    `Cliente: ${venta.clienteNombre}`,
    `Teléfono: ${cliente.telefono ?? "No registrado"}`,
  ];

  if (cliente.direccion) {
    lineas.push(
      `Dirección: ${cliente.direccion}`,
    );
  }

  if (cliente.zona) {
    lineas.push(`Zona: ${cliente.zona}`);
  }

  if (cliente.referenciaDireccion) {
    lineas.push(
      `Referencia: ${cliente.referenciaDireccion}`,
    );
  }

  if (cliente.ubicacionUrl) {
    lineas.push(
      `Ubicación: ${cliente.ubicacionUrl}`,
    );
  }

  if (cliente.indicacionesEntrega) {
    lineas.push(
      `Indicaciones: ${cliente.indicacionesEntrega}`,
    );
  }

  lineas.push("", "DETALLE DEL PEDIDO");

  venta.detalles.forEach((detalle) => {
    lineas.push(
      `${detalle.cantidad}× ${detalle.nombreProducto} — ${formatearMonedaEntrega(detalle.subtotal)}`,
    );

    if (detalle.observacion) {
      lineas.push(
        `  Observación: ${detalle.observacion}`,
      );
    }
  });

  if (venta.observaciones) {
    lineas.push(
      "",
      `Observaciones generales: ${venta.observaciones}`,
    );
  }

  lineas.push(
    "",
    `Total: ${formatearMonedaEntrega(venta.total)}`,
    `Pago: ${venta.estadoCobro}`,
    `Atendido por: ${venta.usuarioRegistroNombre}`,
  );

  return lineas.join("\n");
}

export function generarUrlWhatsappEntregaPedido(
  venta: Venta,
  cliente: Cliente,
  telefonoDestino?: string | null,
): string {
  const mensaje =
    construirTextoEntregaPedido(
      venta,
      cliente,
    );

  const destino =
    telefonoDestino?.replace(
      /\D/g,
      "",
    ) ?? "";

  const base = destino
    ? `https://wa.me/${destino}`
    : "https://wa.me/";

  return `${base}?text=${encodeURIComponent(
    mensaje,
  )}`;
}

export function obtenerUltimoPedidoCliente(
  clienteId: number,
  ventas: Venta[],
): ResumenUltimoPedidoCliente | null {
  const ultimaVenta = ventas
    .filter(
      (venta) =>
        venta.clienteId === clienteId &&
        venta.estadoPreparacion !==
          "Anulado" &&
        venta.estadoCobro !== "Anulada",
    )
    .sort(
      (ventaA, ventaB) =>
        new Date(
          ventaB.fechaHoraRegistro,
        ).getTime() -
        new Date(
          ventaA.fechaHoraRegistro,
        ).getTime(),
    )[0];

  if (!ultimaVenta) {
    return null;
  }

  return {
    ventaId: ultimaVenta.id,
    numeroPedido:
      ultimaVenta.numeroPedido,
    total: ultimaVenta.total,
    fechaHoraRegistro:
      ultimaVenta.fechaHoraRegistro,
    estadoPreparacion:
      ultimaVenta.estadoPreparacion,
    estadoCobro: ultimaVenta.estadoCobro,
  };
}

function construirPayloadCliente(
  datos:
    | CrearClienteDto
    | ActualizarClienteDto,
) {
  return {
    nombreCompleto:
      datos.nombreCompleto.trim(),
    tipoDocumento:
      datos.tipoDocumento ?? null,
    numeroDocumento:
      datos.numeroDocumento?.trim() ||
      null,
    telefono:
      datos.telefono?.trim() || null,
    correo:
      datos.correo
        ?.trim()
        .toLowerCase() || null,
    direccion:
      datos.direccion?.trim() || null,
    zona: datos.zona?.trim() || null,
    referenciaDireccion:
      datos.referenciaDireccion?.trim() ||
      null,
    ubicacionUrl:
      datos.ubicacionUrl?.trim() || null,
    indicacionesEntrega:
      datos.indicacionesEntrega?.trim() ||
      null,
    observaciones:
      datos.observaciones?.trim() || null,
  };
}

export async function listarClientes():
  Promise<Cliente[]> {
  try {
    const respuesta =
      await apiOperations.get<Cliente[]>(
        "/clientes",
      );

    return [...respuesta.data].sort(
      (clienteA, clienteB) =>
        clienteA.nombreCompleto.localeCompare(
          clienteB.nombreCompleto,
          "es",
        ),
    );
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cargar los clientes.",
    );
  }
}

export async function crearCliente(
  datos: CrearClienteDto,
): Promise<Cliente> {
  try {
    const respuesta =
      await apiOperations.post<Cliente>(
        "/clientes",
        construirPayloadCliente(datos),
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible registrar el cliente.",
    );
  }
}

export async function actualizarCliente(
  id: number,
  datos: ActualizarClienteDto,
): Promise<Cliente> {
  try {
    const respuesta =
      await apiOperations.put<Cliente>(
        `/clientes/${id}`,
        construirPayloadCliente(datos),
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar el cliente.",
    );
  }
}

export async function archivarCliente(
  id: number,
): Promise<Cliente> {
  try {
    const respuesta =
      await apiOperations.patch<Cliente>(
        `/clientes/${id}/archivar`,
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible archivar el cliente.",
    );
  }
}

export async function restaurarCliente(
  id: number,
): Promise<Cliente> {
  try {
    const respuesta =
      await apiOperations.patch<Cliente>(
        `/clientes/${id}/restaurar`,
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible restaurar el cliente.",
    );
  }
}
