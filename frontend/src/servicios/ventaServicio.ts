import {
  listarClientes,
} from "./clienteServicio";

import {
  listarProductos,
} from "./productoServicio";

import type {
  CrearVentaDto,
  DetalleVenta,
  EstadoPreparacion,
  RegistrarCobroVentaDto,
  Venta,
} from "../tipos/venta";

const CLAVE_VENTAS =
  "roma-ventas-unificadas-v1";

function esperar(
  milisegundos: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milisegundos,
    );
  });
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function clonarDetalle(
  detalle: DetalleVenta,
): DetalleVenta {
  return {
    ...detalle,
  };
}

function normalizarVenta(
  venta: Venta,
): Venta {
  const subtotal =
    Number.isFinite(
      venta.subtotal,
    )
      ? venta.subtotal
      : venta.total;

  const montoDescuento =
    Number.isFinite(
      venta.montoDescuento,
    )
      ? venta.montoDescuento
      : 0;

  const total =
    Number.isFinite(venta.total)
      ? venta.total
      : redondearMoneda(
          subtotal -
            montoDescuento,
        );

  return {
    ...venta,

    subtotal,

    tipoDescuento:
      venta.tipoDescuento ??
      "Ninguno",

    valorDescuento:
      Number.isFinite(
        venta.valorDescuento,
      )
        ? venta.valorDescuento
        : 0,

    montoDescuento,

    total,

    pagoId:
      venta.pagoId ?? null,

    metodoPago:
      venta.metodoPago ?? null,

    fechaHoraCobro:
      venta.fechaHoraCobro ?? null,

    detalles:
      Array.isArray(
        venta.detalles,
      )
        ? venta.detalles.map(
            clonarDetalle,
          )
        : [],
  };
}

function clonarVenta(
  venta: Venta,
): Venta {
  return normalizarVenta(venta);
}

function guardarVentas(
  ventas: Venta[],
): void {
  localStorage.setItem(
    CLAVE_VENTAS,
    JSON.stringify(
      ventas.map(normalizarVenta),
    ),
  );
}

function obtenerVentasPersistidas():
  Venta[] {
  const datos =
    localStorage.getItem(
      CLAVE_VENTAS,
    );

  if (!datos) {
    guardarVentas([]);
    return [];
  }

  try {
    const ventas = JSON.parse(
      datos,
    ) as Venta[];

    if (!Array.isArray(ventas)) {
      throw new Error(
        "Los datos de ventas no son válidos.",
      );
    }

    return ventas.map(
      normalizarVenta,
    );
  } catch {
    guardarVentas([]);
    return [];
  }
}

function obtenerSiguienteId(
  ventas: Venta[],
): number {
  if (ventas.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...ventas.map(
        (venta) => venta.id,
      ),
    ) + 1
  );
}

function generarNumeroPedido(
  id: number,
): string {
  return `PED-${String(id).padStart(
    4,
    "0",
  )}`;
}

function normalizarTextoOpcional(
  valor: string | null,
  longitudMaxima: number,
  nombreCampo: string,
): string | null {
  const texto =
    valor?.trim() ?? "";

  if (!texto) {
    return null;
  }

  if (
    texto.length >
    longitudMaxima
  ) {
    throw new Error(
      `${nombreCampo} no puede superar los ${longitudMaxima} caracteres.`,
    );
  }

  return texto;
}

async function resolverCliente(
  clienteId: number | null,
): Promise<{
  clienteId: number | null;
  clienteNombre: string;
}> {
  if (clienteId === null) {
    return {
      clienteId: null,
      clienteNombre:
        "Consumidor final",
    };
  }

  const clientes =
    await listarClientes();

  const cliente =
    clientes.find(
      (clienteActual) =>
        clienteActual.id ===
        clienteId,
    );

  if (!cliente) {
    throw new Error(
      "El cliente seleccionado no existe.",
    );
  }

  if (
    cliente.estado !== "Activo"
  ) {
    throw new Error(
      "El cliente seleccionado está inactivo.",
    );
  }

  return {
    clienteId: cliente.id,
    clienteNombre:
      cliente.nombreCompleto,
  };
}

async function construirDetalles(
  datos: CrearVentaDto,
): Promise<DetalleVenta[]> {
  if (
    !Array.isArray(
      datos.detalles,
    ) ||
    datos.detalles.length === 0
  ) {
    throw new Error(
      "Agrega al menos un producto.",
    );
  }

  if (
    datos.detalles.length > 30
  ) {
    throw new Error(
      "El pedido no puede contener más de 30 productos diferentes.",
    );
  }

  const idsProductos =
    datos.detalles.map(
      (detalle) =>
        detalle.productoId,
    );

  if (
    new Set(idsProductos).size !==
    idsProductos.length
  ) {
    throw new Error(
      "Existen productos repetidos en el pedido.",
    );
  }

  const productos =
    await listarProductos();

  return datos.detalles.map(
    (detalle) => {
      const producto =
        productos.find(
          (productoActual) =>
            productoActual.id ===
            detalle.productoId,
        );

      if (!producto) {
        throw new Error(
          "Uno de los productos seleccionados ya no existe.",
        );
      }

      if (
        producto.estado !==
          "Activo" ||
        !producto.disponible
      ) {
        throw new Error(
          `El producto “${producto.nombre}” ya no se encuentra disponible.`,
        );
      }

      if (
        !Number.isInteger(
          detalle.cantidad,
        ) ||
        detalle.cantidad < 1 ||
        detalle.cantidad > 50
      ) {
        throw new Error(
          `La cantidad de “${producto.nombre}” debe estar entre 1 y 50.`,
        );
      }

      const observacion =
        normalizarTextoOpcional(
          detalle.observacion,
          120,
          `La observación de “${producto.nombre}”`,
        );

      return {
        productoId:
          producto.id,

        codigoProducto:
          producto.codigo,

        nombreProducto:
          producto.nombre,

        precioUnitario:
          producto.precio,

        cantidad:
          detalle.cantidad,

        observacion,

        subtotal:
          redondearMoneda(
            producto.precio *
              detalle.cantidad,
          ),
      };
    },
  );
}

async function validarVenta(
  datos: CrearVentaDto,
): Promise<{
  clienteId: number | null;
  clienteNombre: string;
  detalles: DetalleVenta[];
  observaciones: string | null;
  subtotal: number;
}> {
  const [
    cliente,
    detalles,
  ] = await Promise.all([
    resolverCliente(
      datos.clienteId,
    ),

    construirDetalles(datos),
  ]);

  const observaciones =
    normalizarTextoOpcional(
      datos.observaciones,
      300,
      "Las observaciones generales",
    );

  const subtotal =
    redondearMoneda(
      detalles.reduce(
        (acumulado, detalle) =>
          acumulado +
          detalle.subtotal,
        0,
      ),
    );

  return {
    ...cliente,
    detalles,
    observaciones,
    subtotal,
  };
}

export async function listarVentas():
  Promise<Venta[]> {
  await esperar(350);

  return obtenerVentasPersistidas()
    .sort(
      (ventaA, ventaB) =>
        new Date(
          ventaB.fechaHoraRegistro,
        ).getTime() -
        new Date(
          ventaA.fechaHoraRegistro,
        ).getTime(),
    )
    .map(clonarVenta);
}

export async function obtenerVentaPorId(
  id: number,
): Promise<Venta> {
  await esperar(200);

  const venta =
    obtenerVentasPersistidas()
      .find(
        (ventaActual) =>
          ventaActual.id === id,
      );

  if (!venta) {
    throw new Error(
      "La venta seleccionada no existe.",
    );
  }

  return clonarVenta(venta);
}

export async function crearVenta(
  datos: CrearVentaDto,
): Promise<Venta> {
  await esperar(600);

  const ventas =
    obtenerVentasPersistidas();

  const datosValidados =
    await validarVenta(datos);

  const id =
    obtenerSiguienteId(ventas);

  const fechaHoraActual =
    new Date().toISOString();

  const nuevaVenta: Venta = {
    id,

    numeroPedido:
      generarNumeroPedido(id),

    clienteId:
      datosValidados.clienteId,

    clienteNombre:
      datosValidados.clienteNombre,

    detalles:
      datosValidados.detalles,

    observaciones:
      datosValidados.observaciones,

    subtotal:
      datosValidados.subtotal,

    tipoDescuento:
      "Ninguno",

    valorDescuento: 0,
    montoDescuento: 0,

    total:
      datosValidados.subtotal,

    estadoPreparacion:
      "En preparación",

    estadoCobro:
      "Pendiente de cobro",

    pagoId: null,
    metodoPago: null,

    motivoAnulacion: null,

    fechaHoraRegistro:
      fechaHoraActual,

    fechaHoraInicioPreparacion:
      fechaHoraActual,

    fechaHoraListo: null,
    fechaHoraEntregado: null,
    fechaHoraCobro: null,
    fechaHoraAnulacion: null,

    fechaHoraActualizacion:
      fechaHoraActual,
  };

  ventas.push(nuevaVenta);

  guardarVentas(ventas);

  return clonarVenta(
    nuevaVenta,
  );
}

export async function cambiarEstadoPreparacion(
  id: number,
  nuevoEstado:
    EstadoPreparacion,
): Promise<Venta> {
  await esperar(450);

  const ventas =
    obtenerVentasPersistidas();

  const indice =
    ventas.findIndex(
      (venta) => venta.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "El pedido seleccionado no existe.",
    );
  }

  const ventaActual =
    ventas[indice];

  const transicionesPermitidas:
    Record<
      EstadoPreparacion,
      EstadoPreparacion[]
    > = {
    "En preparación": [
      "Listo",
    ],

    Listo: [
      "Entregado",
    ],

    Entregado: [],
    Anulado: [],
  };

  if (
    !transicionesPermitidas[
      ventaActual.estadoPreparacion
    ].includes(nuevoEstado)
  ) {
    throw new Error(
      `No se puede cambiar un pedido “${ventaActual.estadoPreparacion}” a “${nuevoEstado}”.`,
    );
  }

  const fechaHoraActual =
    new Date().toISOString();

  const ventaActualizada:
    Venta = {
    ...ventaActual,

    estadoPreparacion:
      nuevoEstado,

    fechaHoraListo:
      nuevoEstado === "Listo"
        ? fechaHoraActual
        : ventaActual.fechaHoraListo,

    fechaHoraEntregado:
      nuevoEstado === "Entregado"
        ? fechaHoraActual
        : ventaActual
            .fechaHoraEntregado,

    fechaHoraActualizacion:
      fechaHoraActual,
  };

  ventas[indice] =
    ventaActualizada;

  guardarVentas(ventas);

  return clonarVenta(
    ventaActualizada,
  );
}

export async function registrarCobroVenta(
  id: number,
  datos:
    RegistrarCobroVentaDto,
): Promise<Venta> {
  await esperar(400);

  const ventas =
    obtenerVentasPersistidas();

  const indice =
    ventas.findIndex(
      (venta) => venta.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "La venta seleccionada no existe.",
    );
  }

  const ventaActual =
    ventas[indice];

  if (
    ventaActual.estadoCobro ===
    "Cobrada"
  ) {
    throw new Error(
      "La venta ya fue cobrada.",
    );
  }

  if (
    ventaActual.estadoCobro ===
      "Anulada" ||
    ventaActual.estadoPreparacion ===
      "Anulado"
  ) {
    throw new Error(
      "Una venta anulada no puede cobrarse.",
    );
  }

  if (
    !Number.isFinite(
      datos.totalCobrado,
    ) ||
    datos.totalCobrado <= 0
  ) {
    throw new Error(
      "El total cobrado no es válido.",
    );
  }

  const ventaActualizada:
    Venta = {
    ...ventaActual,

    subtotal:
      ventaActual.subtotal,

    tipoDescuento:
      datos.tipoDescuento,

    valorDescuento:
      datos.valorDescuento,

    montoDescuento:
      datos.montoDescuento,

    total:
      datos.totalCobrado,

    estadoCobro:
      "Cobrada",

    pagoId:
      datos.pagoId,

    metodoPago:
      datos.metodoPago,

    fechaHoraCobro:
      datos.fechaHoraCobro,

    fechaHoraActualizacion:
      datos.fechaHoraCobro,
  };

  ventas[indice] =
    ventaActualizada;

  guardarVentas(ventas);

  return clonarVenta(
    ventaActualizada,
  );
}

export async function anularVenta(
  id: number,
  motivo: string,
): Promise<Venta> {
  await esperar(550);

  const ventas =
    obtenerVentasPersistidas();

  const indice =
    ventas.findIndex(
      (venta) => venta.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "El pedido seleccionado no existe.",
    );
  }

  const ventaActual =
    ventas[indice];

  if (
    ventaActual.estadoPreparacion ===
    "Anulado"
  ) {
    throw new Error(
      "El pedido ya se encuentra anulado.",
    );
  }

  if (
    ventaActual.estadoPreparacion ===
    "Entregado"
  ) {
    throw new Error(
      "Un pedido entregado no puede anularse desde este módulo.",
    );
  }

  if (
    ventaActual.estadoCobro ===
    "Cobrada"
  ) {
    throw new Error(
      "Una venta cobrada deberá anularse mediante un proceso de devolución.",
    );
  }

  const motivoLimpio =
    motivo.trim();

  if (
    motivoLimpio.length < 5
  ) {
    throw new Error(
      "Indica un motivo de anulación de al menos 5 caracteres.",
    );
  }

  if (
    motivoLimpio.length > 200
  ) {
    throw new Error(
      "El motivo de anulación no puede superar los 200 caracteres.",
    );
  }

  const fechaHoraActual =
    new Date().toISOString();

  const ventaActualizada:
    Venta = {
    ...ventaActual,

    estadoPreparacion:
      "Anulado",

    estadoCobro:
      "Anulada",

    motivoAnulacion:
      motivoLimpio,

    fechaHoraAnulacion:
      fechaHoraActual,

    fechaHoraActualizacion:
      fechaHoraActual,
  };

  ventas[indice] =
    ventaActualizada;

  guardarVentas(ventas);

  return clonarVenta(
    ventaActualizada,
  );
}