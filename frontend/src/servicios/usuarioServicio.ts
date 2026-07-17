import type {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  EstadoUsuario,
  Usuario,
} from "../tipos/usuario";

interface UsuarioPersistido extends Usuario {
  password: string;
}

const CLAVE_USUARIOS = "roma-usuarios";

const usuariosIniciales: UsuarioPersistido[] = [
  {
    id: 1,
    username: "admin",
    password: "Roma2026*",
    nombreCompleto: "Administrador General",
    rol: "Administrador",
    estado: "Activo",
    fechaRegistro: "2026-06-23T10:00:00.000Z",
    ultimoAcceso: null,
  },
  {
    id: 2,
    username: "cajero01",
    password: "Caja2026*",
    nombreCompleto: "Carlos Pérez",
    rol: "Cajero",
    estado: "Activo",
    fechaRegistro: "2026-06-24T11:30:00.000Z",
    ultimoAcceso: null,
  },
  {
    id: 3,
    username: "inventario01",
    password: "Stock2026*",
    nombreCompleto: "Luis Gómez",
    rol: "Inventario",
    estado: "Activo",
    fechaRegistro: "2026-06-25T09:45:00.000Z",
    ultimoAcceso: null,
  },
  {
    id: 4,
    username: "cajero02",
    password: "Caja2026*",
    nombreCompleto: "María Vargas",
    rol: "Cajero",
    estado: "Activo",
    fechaRegistro: "2026-06-26T14:10:00.000Z",
    ultimoAcceso: "2026-07-14T23:20:00.000Z",
  },
  {
    id: 5,
    username: "usuario.inactivo",
    password: "Usuario2026*",
    nombreCompleto: "Pedro Martínez",
    rol: "Inventario",
    estado: "Inactivo",
    fechaRegistro: "2026-06-27T12:00:00.000Z",
    ultimoAcceso: "2026-07-02T20:10:00.000Z",
  },
];

function esperar(
  milisegundos: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milisegundos);
  });
}

function guardarUsuarios(
  usuarios: UsuarioPersistido[],
): void {
  localStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(usuarios),
  );
}

function obtenerUsuariosPersistidos(): UsuarioPersistido[] {
  const datosGuardados =
    localStorage.getItem(CLAVE_USUARIOS);

  if (!datosGuardados) {
    guardarUsuarios(usuariosIniciales);

    return [...usuariosIniciales];
  }

  try {
    const usuarios = JSON.parse(
      datosGuardados,
    ) as UsuarioPersistido[];

    if (!Array.isArray(usuarios)) {
      throw new Error(
        "La información de usuarios no es válida.",
      );
    }

    return usuarios;
  } catch {
    guardarUsuarios(usuariosIniciales);

    return [...usuariosIniciales];
  }
}

function quitarPassword(
  usuario: UsuarioPersistido,
): Usuario {
  return {
    id: usuario.id,
    username: usuario.username,
    nombreCompleto:
      usuario.nombreCompleto,
    rol: usuario.rol,
    estado: usuario.estado,
    fechaRegistro:
      usuario.fechaRegistro,
    ultimoAcceso:
      usuario.ultimoAcceso,
  };
}

function normalizarUsername(
  username: string,
): string {
  return username.trim().toLowerCase();
}

function validarUsernameDuplicado(
  usuarios: UsuarioPersistido[],
  username: string,
  idIgnorado?: number,
): void {
  const usernameNormalizado =
    normalizarUsername(username);

  const existe = usuarios.some(
    (usuario) =>
      usuario.id !== idIgnorado &&
      normalizarUsername(usuario.username) ===
        usernameNormalizado,
  );

  if (existe) {
    throw new Error(
      "El nombre de usuario ya se encuentra registrado.",
    );
  }
}

function validarUltimoAdministrador(
  usuarios: UsuarioPersistido[],
  usuarioObjetivo: UsuarioPersistido,
): void {
  if (
    usuarioObjetivo.rol !== "Administrador" ||
    usuarioObjetivo.estado !== "Activo"
  ) {
    return;
  }

  const administradoresActivos =
    usuarios.filter(
      (usuario) =>
        usuario.rol === "Administrador" &&
        usuario.estado === "Activo",
    );

  if (administradoresActivos.length <= 1) {
    throw new Error(
      "No se puede desactivar o cambiar el rol del único administrador activo.",
    );
  }
}

export async function listarUsuarios(): Promise<
  Usuario[]
> {
  await esperar(500);

  return obtenerUsuariosPersistidos()
    .map(quitarPassword)
    .sort((a, b) => b.id - a.id);
}

export async function crearUsuario(
  datos: CrearUsuarioDto,
): Promise<Usuario> {
  await esperar(700);

  const usuarios =
    obtenerUsuariosPersistidos();

  validarUsernameDuplicado(
    usuarios,
    datos.username,
  );

  const nuevoId =
    usuarios.length === 0
      ? 1
      : Math.max(
          ...usuarios.map(
            (usuario) => usuario.id,
          ),
        ) + 1;

  const nuevoUsuario: UsuarioPersistido = {
    id: nuevoId,
    username: datos.username.trim(),
    password: datos.password,
    nombreCompleto:
      datos.nombreCompleto.trim(),
    rol: datos.rol,
    estado: "Activo",
    fechaRegistro: new Date().toISOString(),
    ultimoAcceso: null,
  };

  guardarUsuarios([
    ...usuarios,
    nuevoUsuario,
  ]);

  return quitarPassword(nuevoUsuario);
}

export async function actualizarUsuario(
  id: number,
  datos: ActualizarUsuarioDto,
): Promise<Usuario> {
  await esperar(700);

  const usuarios =
    obtenerUsuariosPersistidos();

  const indiceUsuario =
    usuarios.findIndex(
      (usuario) => usuario.id === id,
    );

  if (indiceUsuario === -1) {
    throw new Error(
      "El usuario seleccionado no existe.",
    );
  }

  const usuarioActual =
    usuarios[indiceUsuario];

  validarUsernameDuplicado(
    usuarios,
    datos.username,
    id,
  );

  if (
    usuarioActual.rol === "Administrador" &&
    datos.rol !== "Administrador"
  ) {
    validarUltimoAdministrador(
      usuarios,
      usuarioActual,
    );
  }

  const usuarioActualizado: UsuarioPersistido = {
    ...usuarioActual,
    username: datos.username.trim(),
    nombreCompleto:
      datos.nombreCompleto.trim(),
    rol: datos.rol,
    password:
      datos.password?.trim()
        ? datos.password
        : usuarioActual.password,
  };

  usuarios[indiceUsuario] =
    usuarioActualizado;

  guardarUsuarios(usuarios);

  return quitarPassword(
    usuarioActualizado,
  );
}

export async function cambiarEstadoUsuario(
  id: number,
  nuevoEstado: EstadoUsuario,
): Promise<Usuario> {
  await esperar(600);

  const usuarios =
    obtenerUsuariosPersistidos();

  const indiceUsuario =
    usuarios.findIndex(
      (usuario) => usuario.id === id,
    );

  if (indiceUsuario === -1) {
    throw new Error(
      "El usuario seleccionado no existe.",
    );
  }

  const usuarioActual =
    usuarios[indiceUsuario];

  if (nuevoEstado === "Inactivo") {
    validarUltimoAdministrador(
      usuarios,
      usuarioActual,
    );
  }

  const usuarioActualizado: UsuarioPersistido = {
    ...usuarioActual,
    estado: nuevoEstado,
  };

  usuarios[indiceUsuario] =
    usuarioActualizado;

  guardarUsuarios(usuarios);

  return quitarPassword(
    usuarioActualizado,
  );
}

export async function validarCredencialesUsuario(
  username: string,
  password: string,
): Promise<Usuario> {
  await esperar(750);

  const usuarios =
    obtenerUsuariosPersistidos();

  const usernameNormalizado =
    normalizarUsername(username);

  const usuarioEncontrado =
    usuarios.find(
      (usuario) =>
        normalizarUsername(
          usuario.username,
        ) === usernameNormalizado,
    );

  if (
    !usuarioEncontrado ||
    usuarioEncontrado.password !== password
  ) {
    throw new Error(
      "El usuario o la contraseña son incorrectos.",
    );
  }

  if (
    usuarioEncontrado.estado === "Inactivo"
  ) {
    throw new Error(
      "La cuenta se encuentra inactiva. Comuníquese con el administrador.",
    );
  }

  return quitarPassword(
    usuarioEncontrado,
  );
}

export async function registrarUltimoAccesoUsuario(
  id: number,
): Promise<void> {
  const usuarios =
    obtenerUsuariosPersistidos();

  const indiceUsuario =
    usuarios.findIndex(
      (usuario) => usuario.id === id,
    );

  if (indiceUsuario === -1) {
    return;
  }

  usuarios[indiceUsuario] = {
    ...usuarios[indiceUsuario],
    ultimoAcceso: new Date().toISOString(),
  };

  guardarUsuarios(usuarios);
}