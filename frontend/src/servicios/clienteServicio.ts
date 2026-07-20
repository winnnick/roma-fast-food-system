import type {
  ActualizarClienteDto,
  Cliente,
  CrearClienteDto,
  EstadoCliente,
} from "../tipos/cliente";

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
      "Barrio San Martín, Tarija",
    observaciones:
      "Cliente frecuente.",
    estado: "Activo",
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
      "Zona Central, Tarija",
    observaciones: null,
    estado: "Activo",
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
      "Av. Las Américas, Tarija",
    observaciones:
      "Solicita factura en sus compras.",
    estado: "Activo",
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
    observaciones:
      "Prefiere contacto mediante WhatsApp.",
    estado: "Inactivo",
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

function clonarCliente(
  cliente: Cliente,
): Cliente {
  return {
    ...cliente,
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
    JSON.stringify(clientes),
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

    return clonarClientes(clientes);
  } catch {
    guardarClientes(
      clientesIniciales,
    );

    return clonarClientes(
      clientesIniciales,
    );
  }
}

function normalizarTextoOpcional(
  valor: string | null,
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

function validarLongitudesOpcionales(
  direccion: string | null,
  observaciones: string | null,
): void {
  if (
    direccion &&
    direccion.length > 200
  ) {
    throw new Error(
      "La dirección no puede superar los 200 caracteres.",
    );
  }

  if (
    observaciones &&
    observaciones.length > 300
  ) {
    throw new Error(
      "Las observaciones no pueden superar los 300 caracteres.",
    );
  }
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
): {
  nombreCompleto: string;
  numeroDocumento: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  observaciones: string | null;
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

  validarLongitudesOpcionales(
    direccion,
    observaciones,
  );

  return {
    nombreCompleto,
    numeroDocumento,
    telefono,
    correo,
    direccion,
    observaciones,
  };
}

export async function listarClientes():
  Promise<Cliente[]> {
  await esperar(450);

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
  await esperar(250);

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
  await esperar(700);

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
    observaciones:
      datosValidados.observaciones,
    estado: "Activo",
    fechaRegistro:
      fechaActual,
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
  await esperar(700);

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

export async function cambiarEstadoCliente(
  id: number,
  nuevoEstado: EstadoCliente,
): Promise<Cliente> {
  await esperar(550);

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
    estado: nuevoEstado,
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