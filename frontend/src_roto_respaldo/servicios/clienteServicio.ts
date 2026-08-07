import type {
  ActualizarClienteDto,
  Cliente,
  CrearClienteDto,
  EstadoCliente,
  ResumenUltimoPedidoCliente,
} from "../tipos/cliente";

import type {
  Venta,
} from "../tipos/venta";

const CLAVE_CLIENTES =
  "roma-clientes";

const clientesIniciales: Cliente[] = [
  {
    id: 1,
    nombreCompleto:
      "María Fernanda López",
    tipoDocumento: "CI",
    numeroDocumento: "7123456",
    telefono: "72900101",
    correo:
      "maria.lopez@correo.com",
    direccion:
      "Calle Bolívar N.º 325",
    zona: "Barrio San Martín",
    referenciaDireccion:
      "Portón negro frente a la farmacia.",
    ubicacionUrl: null,
    indicacionesEntrega:
      "Llamar al llegar.",
    observaciones:
      "Cliente frecuente.",
    estado: "Activo",
    archivado: false,
    fechaArchivado: null,
    fechaRegistro:
      "2026-07-10T14:30:00.000Z",
    fechaActualizacion:
      "2026-07-10T14:30:00.000Z",
  },

  {
    id: 2,
    nombreCompleto:
      "Carlos Alberto Rojas",
    tipoDocumento: "CI",
    numeroDocumento: "6987452",
    telefono: "76122334",
    correo: null,
    direccion:
      "Calle Sucre esquina Colón",
    zona: "Zona Central",
    referenciaDireccion: null,
    ubicacionUrl: null,
    indicacionesEntrega: null,
    observaciones: null,
    estado: "Activo",
    archivado: false,
    fechaArchivado: null,
    fechaRegistro:
      "2026-07-11T18:20:00.000Z",
    fechaActualizacion:
      "2026-07-11T18:20:00.000Z",
  },

  {
    id: 3,
    nombreCompleto:
      "Distribuidora San Luis",
    tipoDocumento: "NIT",
    numeroDocumento:
      "1029384756",
    telefono: "46612345",
    correo:
      "contacto@sanluis.com",
    direccion:
      "Av. Las Américas N.º 841",
    zona: "Las Américas",
    referenciaDireccion:
      "Ingreso por el portón lateral.",
    ubicacionUrl: null,
    indicacionesEntrega:
      "Entregar en recepción.",
    observaciones:
      "Solicita factura en sus compras.",
    estado: "Activo",
    archivado: false,
    fechaArchivado: null,
    fechaRegistro:
      "2026-07-12T16:10:00.000Z",
    fechaActualizacion:
      "2026-07-12T16:10:00.000Z",
  },

  {
    id: 4,
    nombreCompleto:
      "Andrea Valdez",
    tipoDocumento: null,
    numeroDocumento: null,
    telefono: "71881122",
    correo: null,
    direccion: null,
    zona: null,
    referenciaDireccion: null,
    ubicacionUrl: null,
    indicacionesEntrega: null,
    observaciones:
      "Prefiere contacto mediante WhatsApp.",
    estado: "Inactivo",
    archivado: true,
    fechaArchivado:
      "2026-07-15T09:45:00.000Z",
    fechaRegistro:
      "2026-07-13T12:00:00.000Z",
    fechaActualizacion:
      "2026-07-15T09:45:00.000Z",
  },
];

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

function normalizarTextoOpcional(
  valor: string | null | undefined,
): string | null {
  const valorLimpio =
    valor?.trim() ?? "";

  return valorLimpio
    ? valorLimpio
    : null;
}

function normalizarDocumento(
  documento: string | null,
): string | null {
  const documentoLimpio =
    documento
      ?.trim()
      .toUpperCase() ?? "";

  return documentoLimpio
    ? documentoLimpio
    : null;
}

function normalizarCorreo(
  correo: string | null,
): string | null {
  const correoLimpio =
    correo
      ?.trim()
      .toLowerCase() ?? "";

  return correoLimpio
    ? correoLimpio
    : null;
}

function normalizarUbicacionUrl(
  valor: string | null | undefined,
): string | null {
  const ubicacion =
    normalizarTextoOpcional(valor);

  if (!ubicacion) {
    return null;
  }

  const tieneProtocolo =
    /^https?:\/\//i.test(
      ubicacion,
    );

  return tieneProtocolo
    ? ubicacion
    : `https://${ubicacion}`;
}

function normalizarCliente(
  cliente: Cliente,
): Cliente {
  const clienteAnterior =
    cliente as Cliente & {
      archivado?: boolean;
      fechaArchivado?: string | null;
      zona?: string | null;
      referenciaDireccion?: string | null;
      ubicacionUrl?: string | null;
      indicacionesEntrega?: string | null;
    };

  const archivado =
    typeof clienteAnterior.archivado ===
    "boolean"
      ? clienteAnterior.archivado
      : clienteAnterior.estado ===
        "Inactivo";

  return {
    ...cliente,
    zona:
      normalizarTextoOpcional(
        clienteAnterior.zona,
      ),
    referenciaDireccion:
      normalizarTextoOpcional(
        clienteAnterior.referenciaDireccion,
      ),
    ubicacionUrl:
      normalizarTextoOpcional(
        clienteAnterior.ubicacionUrl,
      ),
    indicacionesEntrega:
      normalizarTextoOpcional(
        clienteAnterior.indicacionesEntrega,
      ),
    estado: archivado
      ? "Inactivo"
      : "Activo",
    archivado,
    fechaArchivado: archivado
      ? (
          clienteAnterior.fechaArchivado ??
          cliente.fechaActualizacion ??
          null
        )
      : null,
  };
}

function clonarCliente(
  cliente: Cliente,
): Cliente {
  return {
    ...normalizarCliente(cliente),
  };
}

function clonarClientes(
  clientes: Cliente[],
): Cliente[] {
  return clientes.map(
    clonarCliente,
  );
}

function guardarClientes(
  clientes: Cliente[],
): void {
  localStorage.setItem(
    CLAVE_CLIENTES,
    JSON.stringify(
      clientes.map(
        normalizarCliente,
      ),
    ),
  );
}

function obtenerClientesPersistidos():
  Cliente[] {
  const datosGuardados =
    localStorage.getItem(
      CLAVE_CLIENTES,
    );

  if (!datosGuardados) {
    guardarClientes(
      clientesIniciales,
    );

    return clonarClientes(
      clientesIniciales,
    );
  }

  try {
    const clientes = JSON.parse(
      datosGuardados,
    ) as Cliente[];

    if (!Array.isArray(clientes)) {
      throw new Error(
        "Los datos de clientes no son válidos.",
      );
    }

    const normalizados =
      clientes.map(
        normalizarCliente,
      );

    guardarClientes(normalizados);

    return clonarClientes(
      normalizados,
    );
  } catch {
    guardarClientes(
      clientesIniciales,
    );

    return clonarClientes(
      clientesIniciales,
    );
  }
}

function validarNombre(
  nombreCompleto: string,
): void {
  const nombre =
    nombreCompleto.trim();

  if (!nombre) {
    throw new Error(
      "El nombre del cliente es obligatorio.",
    );
  }

  if (nombre.length < 3) {
    throw new Error(
      "El nombre debe contener al menos 3 caracteres.",
    );
  }

  if (nombre.length > 120) {
    throw new Error(
      "El nombre no puede superar los 120 caracteres.",
    );
  }
}

function validarDocumento(
  tipoDocumento:
    CrearClienteDto["tipoDocumento"],
  numeroDocumento: string | null,
): void {
  if (
    tipoDocumento &&
    !numeroDocumento
  ) {
    throw new Error(
      "Ingrese el número de documento.",
    );
  }

  if (
    !tipoDocumento &&
    numeroDocumento
  ) {
    throw new Error(
      "Seleccione el tipo de documento.",
    );
  }

  if (
    numeroDocumento &&
    (
      numeroDocumento.length < 4 ||
      numeroDocumento.length > 30
    )
  ) {
    throw new Error(
      "El documento debe contener entre 4 y 30 caracteres.",
    );
  }

  if (
    numeroDocumento &&
    !/^[A-Z0-9./-]+$/.test(
      numeroDocumento,
    )
  ) {
    throw new Error(
      "El documento contiene caracteres no permitidos.",
    );
  }
}

function validarTelefono(
  telefono: string | null,
): void {
  if (!telefono) {
    return;
  }

  if (
    telefono.length < 7 ||
    telefono.length > 20
  ) {
    throw new Error(
      "El teléfono debe contener entre 7 y 20 caracteres.",
    );
  }

  if (
    !/^[0-9+\-\s()]+$/.test(
      telefono,
    )
  ) {
    throw new Error(
      "El teléfono contiene caracteres no permitidos.",
    );
  }
}

function validarCorreo(
  correo: string | null,
): void {
  if (!correo) {
    return;
  }

  if (correo.length > 120) {
    throw new Error(
      "El correo no puede superar los 120 caracteres.",
    );
  }

  const expresionCorreo =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !expresionCorreo.test(correo)
  ) {
    throw new Error(
      "Ingrese un correo electrónico válido.",
    );
  }
}

function validarUbicacionUrl(
  ubicacionUrl: string | null,
): void {
  if (!ubicacionUrl) {
    return;
  }

  if (ubicacionUrl.length > 500) {
    throw new Error(
      "El enlace de ubicación no puede superar los 500 caracteres.",
    );
  }

  try {
    const url =
      new URL(ubicacionUrl);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "Ingrese un enlace de ubicación válido.",
    );
  }
}

function validarLongitudesOpcionales(
  datos: {
    direccion: string | null;
    zona: string | null;
    referenciaDireccion: string | null;
    ubicacionUrl: string | null;
    indicacionesEntrega: string | null;
    observaciones: string | null;
  },
): void {
  if (
    datos.direccion &&
    datos.direccion.length > 220
  ) {
    throw new Error(
      "La dirección no puede superar los 220 caracteres.",
    );
  }

  if (
    datos.zona &&
    datos.zona.length > 100
  ) {
    throw new Error(
      "La zona no puede superar los 100 caracteres.",
    );
  }

  if (
    datos.referenciaDireccion &&
    datos.referenciaDireccion.length >
      180
  ) {
    throw new Error(
      "La referencia no puede superar los 180 caracteres.",
    );
  }

  if (
    datos.indicacionesEntrega &&
    datos.indicacionesEntrega.length >
      300
  ) {
    throw new Error(
      "Las indicaciones de entrega no pueden superar los 300 caracteres.",
    );
  }

  if (
    datos.observaciones &&
    datos.observaciones.length > 300
  ) {
    throw new Error(
      "Las observaciones no pueden superar los 300 caracteres.",
    );
  }

  validarUbicacionUrl(
    datos.ubicacionUrl,
  );
}

function validarDocumentoDuplicado(
  clientes: Cliente[],
  numeroDocumento: string | null,
  clienteIdExcluir?: number,
): void {
  if (!numeroDocumento) {
    return;
  }

  const existeDuplicado =
    clientes.some(
      (cliente) =>
        cliente.id !==
          clienteIdExcluir &&
        cliente.numeroDocumento
          ?.toUpperCase() ===
          numeroDocumento.toUpperCase(),
    );

  if (existeDuplicado) {
    throw new Error(
      "Ya existe un cliente registrado con ese número de documento.",
    );
  }
}

function validarDatosCliente(
  datos:
    | CrearClienteDto
    | ActualizarClienteDto,
): Omit<
  CrearClienteDto,
  | "tipoDocumento"
  | "zona"
  | "referenciaDireccion"
  | "ubicacionUrl"
  | "indicacionesEntrega"
> & {
  zona: string | null;
  referenciaDireccion: string | null;
  ubicacionUrl: string | null;
  indicacionesEntrega: string | null;
} {
  const nombreCompleto =
    datos.nombreCompleto.trim();

  const numeroDocumento =
    normalizarDocumento(
      datos.numeroDocumento,
    );

  const telefono =
    normalizarTextoOpcional(
      datos.telefono,
    );

  const correo =
    normalizarCorreo(
      datos.correo,
    );

  const direccion =
    normalizarTextoOpcional(
      datos.direccion,
    );

  const zona =
    normalizarTextoOpcional(
      datos.zona,
    );

  const referenciaDireccion =
    normalizarTextoOpcional(
      datos.referenciaDireccion,
    );

  const ubicacionUrl =
    normalizarUbicacionUrl(
      datos.ubicacionUrl,
    );

  const indicacionesEntrega =
    normalizarTextoOpcional(
      datos.indicacionesEntrega,
    );

  const observaciones =
    normalizarTextoOpcional(
      datos.observaciones,
    );

  validarNombre(nombreCompleto);

  validarDocumento(
    datos.tipoDocumento,
    numeroDocumento,
  );

  validarTelefono(telefono);
  validarCorreo(correo);

  validarLongitudesOpcionales({
    direccion,
    zona,
    referenciaDireccion,
    ubicacionUrl,
    indicacionesEntrega,
    observaciones,
  });

  return {
    nombreCompleto,
    numeroDocumento,
    telefono,
    correo,
    direccion,
    zona,
    referenciaDireccion,
    ubicacionUrl,
    indicacionesEntrega,
    observaciones,
  };
}

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
    lineas.push(
      `Zona: ${cliente.zona}`,
    );
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
    construirTextoEntregaCliente(
      cliente,
    );

  const destino =
    telefonoDestino
      ?.replace(/\D/g, "") ?? "";

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
    lineas.push(
      `Zona: ${cliente.zona}`,
    );
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

  lineas.push(
    "",
    "DETALLE DEL PEDIDO",
  );

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
    telefonoDestino
      ?.replace(/\D/g, "") ?? "";

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
        venta.clienteId ===
          clienteId &&
        venta.estadoPreparacion !==
          "Anulado" &&
        venta.estadoCobro !==
          "Anulada",
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
    estadoCobro:
      ultimaVenta.estadoCobro,
  };
}

export async function listarClientes():
  Promise<Cliente[]> {
  await esperar(320);

  const clientes =
    obtenerClientesPersistidos();

  return clientes
    .sort((clienteA, clienteB) =>
      clienteA.nombreCompleto
        .localeCompare(
          clienteB.nombreCompleto,
          "es",
        ),
    )
    .map(clonarCliente);
}

export async function obtenerClientePorId(
  id: number,
): Promise<Cliente | null> {
  await esperar(180);

  const cliente =
    obtenerClientesPersistidos()
      .find(
        (clienteActual) =>
          clienteActual.id === id,
      );

  return cliente
    ? clonarCliente(cliente)
    : null;
}

export async function crearCliente(
  datos: CrearClienteDto,
): Promise<Cliente> {
  await esperar(420);

  const clientes =
    obtenerClientesPersistidos();

  const datosValidados =
    validarDatosCliente(datos);

  validarDocumentoDuplicado(
    clientes,
    datosValidados.numeroDocumento,
  );

  const nuevoId =
    clientes.length === 0
      ? 1
      : Math.max(
          ...clientes.map(
            (cliente) => cliente.id,
          ),
        ) + 1;

  const fechaActual =
    new Date().toISOString();

  const nuevoCliente: Cliente = {
    id: nuevoId,
    nombreCompleto:
      datosValidados.nombreCompleto,
    tipoDocumento:
      datos.tipoDocumento,
    numeroDocumento:
      datosValidados.numeroDocumento,
    telefono:
      datosValidados.telefono,
    correo:
      datosValidados.correo,
    direccion:
      datosValidados.direccion,
    zona:
      datosValidados.zona,
    referenciaDireccion:
      datosValidados.referenciaDireccion,
    ubicacionUrl:
      datosValidados.ubicacionUrl,
    indicacionesEntrega:
      datosValidados.indicacionesEntrega,
    observaciones:
      datosValidados.observaciones,
    estado: "Activo",
    archivado: false,
    fechaArchivado: null,
    fechaRegistro: fechaActual,
    fechaActualizacion:
      fechaActual,
  };

  clientes.push(nuevoCliente);
  guardarClientes(clientes);

  return clonarCliente(
    nuevoCliente,
  );
}

export async function actualizarCliente(
  id: number,
  datos: ActualizarClienteDto,
): Promise<Cliente> {
  await esperar(420);

  const clientes =
    obtenerClientesPersistidos();

  const indiceCliente =
    clientes.findIndex(
      (cliente) =>
        cliente.id === id,
    );

  if (indiceCliente === -1) {
    throw new Error(
      "El cliente seleccionado no existe.",
    );
  }

  const datosValidados =
    validarDatosCliente(datos);

  validarDocumentoDuplicado(
    clientes,
    datosValidados.numeroDocumento,
    id,
  );

  const clienteActual =
    clientes[indiceCliente];

  const clienteActualizado:
    Cliente = {
    ...clienteActual,
    nombreCompleto:
      datosValidados.nombreCompleto,
    tipoDocumento:
      datos.tipoDocumento,
    numeroDocumento:
      datosValidados.numeroDocumento,
    telefono:
      datosValidados.telefono,
    correo:
      datosValidados.correo,
    direccion:
      datosValidados.direccion,
    zona:
      datosValidados.zona,
    referenciaDireccion:
      datosValidados.referenciaDireccion,
    ubicacionUrl:
      datosValidados.ubicacionUrl,
    indicacionesEntrega:
      datosValidados.indicacionesEntrega,
    observaciones:
      datosValidados.observaciones,
    fechaActualizacion:
      new Date().toISOString(),
  };

  clientes[indiceCliente] =
    clienteActualizado;

  guardarClientes(clientes);

  return clonarCliente(
    clienteActualizado,
  );
}

export async function archivarCliente(
  id: number,
): Promise<Cliente> {
  await esperar(300);

  const clientes =
    obtenerClientesPersistidos();

  const indiceCliente =
    clientes.findIndex(
      (cliente) =>
        cliente.id === id,
    );

  if (indiceCliente === -1) {
    throw new Error(
      "El cliente seleccionado no existe.",
    );
  }

  const fechaActual =
    new Date().toISOString();

  const clienteActualizado:
    Cliente = {
    ...clientes[indiceCliente],
    estado: "Inactivo",
    archivado: true,
    fechaArchivado: fechaActual,
    fechaActualizacion:
      fechaActual,
  };

  clientes[indiceCliente] =
    clienteActualizado;

  guardarClientes(clientes);

  return clonarCliente(
    clienteActualizado,
  );
}

export async function restaurarCliente(
  id: number,
): Promise<Cliente> {
  await esperar(300);

  const clientes =
    obtenerClientesPersistidos();

  const indiceCliente =
    clientes.findIndex(
      (cliente) =>
        cliente.id === id,
    );

  if (indiceCliente === -1) {
    throw new Error(
      "El cliente seleccionado no existe.",
    );
  }

  const clienteActualizado:
    Cliente = {
    ...clientes[indiceCliente],
    estado: "Activo",
    archivado: false,
    fechaArchivado: null,
    fechaActualizacion:
      new Date().toISOString(),
  };

  clientes[indiceCliente] =
    clienteActualizado;

  guardarClientes(clientes);

  return clonarCliente(
    clienteActualizado,
  );
}

/**
 * Compatibilidad temporal con la interfaz anterior.
 * En la pantalla rediseñada se usarán archivarCliente
 * y restaurarCliente.
 */
export async function cambiarEstadoCliente(
  id: number,
  nuevoEstado: EstadoCliente,
): Promise<Cliente> {
  return nuevoEstado === "Activo"
    ? restaurarCliente(id)
    : archivarCliente(id);
}
