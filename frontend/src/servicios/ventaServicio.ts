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

function clonarVenta(
  venta: Venta,
): Venta {
  return {
    ...venta,
    detalles:
      venta.detalles.map(
        clonarDetalle,
      ),
  };
}

function guardarVentas(
  ventas: Venta[],
): void {
  localStorage.setItem(
    CLAVE_VENTAS,
    JSON.stringify(ventas),
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
      clonarVenta,
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
  total: number;
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

  const total =
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
    total,
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

    total:
      datosValidados.total,

    estadoPreparacion:
      "En preparación",

    estadoCobro:
      "Pendiente de cobro",

    motivoAnulacion: null,

    fechaHoraRegistro:
      fechaHoraActual,

    fechaHoraInicioPreparacion:
      fechaHoraActual,

    fechaHoraListo: null,
    fechaHoraEntregado: null,
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
      "Una venta cobrada deberá anularse desde el módulo de caja.",
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