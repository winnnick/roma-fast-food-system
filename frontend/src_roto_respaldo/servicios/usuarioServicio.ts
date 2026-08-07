import {
  rolesUsuario,
  type RolUsuario,
} from "../tipos/auth";

import type {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  EstadoUsuario,
  Usuario,
} from "../tipos/usuario";

interface UsuarioPersistido extends Usuario {
  password: string;
}

interface UsuarioPersistidoLegado
  extends Omit<UsuarioPersistido, "roles"> {
  roles?: RolUsuario[];
}

const CLAVE_USUARIOS = "roma-usuarios";

const usuariosIniciales: UsuarioPersistido[] = [
  {
    id: 1,
    username: "admin",
    password: "Roma2026*",
    nombreCompleto: "Administrador General",
    rol: "Administrador",
    roles: ["Administrador"],
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
    roles: ["Cajero"],
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
    roles: ["Inventario"],
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
    roles: ["Cajero"],
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
    roles: ["Inventario"],
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

function esRolUsuario(
  valor: unknown,
): valor is RolUsuario {
  return (
    typeof valor === "string" &&
    rolesUsuario.includes(
      valor as RolUsuario,
    )
  );
}

/**
 * Administrador se conserva como rol exclusivo porque ya
 * concede todos los permisos. Para empleados se admite la
 * combinación Cajero + Inventario.
 */
export function normalizarRolesUsuario(
  roles: readonly RolUsuario[],
  rolRespaldo: RolUsuario = "Cajero",
): RolUsuario[] {
  const seleccionados = new Set<RolUsuario>(
    roles.filter(esRolUsuario),
  );

  if (seleccionados.size === 0) {
    seleccionados.add(rolRespaldo);
  }

  if (seleccionados.has("Administrador")) {
    return ["Administrador"];
  }

  return rolesUsuario.filter(
    (rol) =>
      rol !== "Administrador" &&
      seleccionados.has(rol),
  );
}

export function obtenerRolPrincipalUsuario(
  roles: readonly RolUsuario[],
): RolUsuario {
  if (roles.includes("Administrador")) {
    return "Administrador";
  }

  if (roles.includes("Cajero")) {
    return "Cajero";
  }

  return "Inventario";
}

function normalizarUsuarioPersistido(
  usuario: UsuarioPersistidoLegado,
): UsuarioPersistido {
  const rolLegado = esRolUsuario(usuario.rol)
    ? usuario.rol
    : "Cajero";

  const roles = normalizarRolesUsuario(
    Array.isArray(usuario.roles)
      ? usuario.roles.filter(esRolUsuario)
      : [rolLegado],
    rolLegado,
  );

  return {
    ...usuario,
    rol: obtenerRolPrincipalUsuario(roles),
    roles,
  };
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

    return usuariosIniciales.map(
      normalizarUsuarioPersistido,
    );
  }

  try {
    const datos = JSON.parse(
      datosGuardados,
    ) as UsuarioPersistidoLegado[];

    if (!Array.isArray(datos)) {
      throw new Error(
        "La información de usuarios no es válida.",
      );
    }

    const usuarios = datos.map(
      normalizarUsuarioPersistido,
    );

    // Persiste la migración para que las cuentas antiguas
    // queden actualizadas con el arreglo `roles`.
    guardarUsuarios(usuarios);

    return usuarios;
  } catch {
    guardarUsuarios(usuariosIniciales);

    return usuariosIniciales.map(
      normalizarUsuarioPersistido,
    );
  }
}

function quitarPassword(
  usuario: UsuarioPersistido,
): Usuario {
  return {
    id: usuario.id,
    username: usuario.username,
    nombreCompleto: usuario.nombreCompleto,
    rol: usuario.rol,
    roles: [...usuario.roles],
    estado: usuario.estado,
    fechaRegistro: usuario.fechaRegistro,
    ultimoAcceso: usuario.ultimoAcceso,
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

function esAdministradorActivo(
  usuario: UsuarioPersistido,
): boolean {
  return (
    usuario.estado === "Activo" &&
    usuario.roles.includes("Administrador")
  );
}

function validarUltimoAdministrador(
  usuarios: UsuarioPersistido[],
  usuarioObjetivo: UsuarioPersistido,
): void {
  if (!esAdministradorActivo(usuarioObjetivo)) {
    return;
  }

  const administradoresActivos =
    usuarios.filter(esAdministradorActivo);

  if (administradoresActivos.length <= 1) {
    throw new Error(
      "No se puede desactivar ni retirar el rol Administrador del único administrador activo.",
    );
  }
}

function resolverRolesDatos(
  datos:
    | CrearUsuarioDto
    | ActualizarUsuarioDto,
): RolUsuario[] {
  const rolesSolicitados =
    Array.isArray(datos.roles) &&
    datos.roles.length > 0
      ? datos.roles
      : [datos.rol];

  return normalizarRolesUsuario(
    rolesSolicitados,
    datos.rol,
  );
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

  const roles = resolverRolesDatos(datos);

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
    rol: obtenerRolPrincipalUsuario(roles),
    roles,
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

  const nuevosRoles =
    resolverRolesDatos(datos);

  const pierdeAdministrador =
    usuarioActual.roles.includes(
      "Administrador",
    ) &&
    !nuevosRoles.includes(
      "Administrador",
    );

  if (pierdeAdministrador) {
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
    rol: obtenerRolPrincipalUsuario(
      nuevosRoles,
    ),
    roles: nuevosRoles,
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
