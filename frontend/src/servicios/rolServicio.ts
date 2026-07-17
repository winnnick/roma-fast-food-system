import type { RolUsuario } from "../tipos/auth";

import {
  permisosSistema,
  type PermisoSistema,
  type RolConfiguracion,
} from "../tipos/rol";

const CLAVE_ROLES = "roma-roles";

const rolesIniciales: RolConfiguracion[] = [
  {
    rol: "Administrador",
    nombre: "Administrador",
    descripcion:
      "Posee acceso completo a todos los módulos y operaciones del sistema.",
    editable: false,
    permisos: [...permisosSistema],
  },

  {
    rol: "Cajero",
    nombre: "Cajero",
    descripcion:
      "Registra pedidos, ventas y operaciones relacionadas con la caja.",
    editable: true,
    permisos: [
      "DASHBOARD_VER",
      "PRODUCTOS_VER",
      "VENTAS_VER",
      "VENTAS_CREAR",
      "CAJA_VER",
      "CAJA_GESTIONAR",
    ],
  },

  {
    rol: "Inventario",
    nombre: "Encargado de inventario",
    descripcion:
      "Controla insumos, existencias y movimientos de inventario.",
    editable: true,
    permisos: [
      "DASHBOARD_VER",
      "PRODUCTOS_VER",
      "INVENTARIO_VER",
      "INVENTARIO_GESTIONAR",
    ],
  },
];

export const dependenciasPermisos: Partial<
  Record<PermisoSistema, PermisoSistema>
> = {
  USUARIOS_CREAR: "USUARIOS_VER",
  USUARIOS_EDITAR: "USUARIOS_VER",
  USUARIOS_DESACTIVAR: "USUARIOS_VER",
  ROLES_GESTIONAR: "USUARIOS_VER",

  PRODUCTOS_GESTIONAR: "PRODUCTOS_VER",

  VENTAS_CREAR: "VENTAS_VER",

  CAJA_GESTIONAR: "CAJA_VER",

  INVENTARIO_GESTIONAR: "INVENTARIO_VER",
};

function esperar(
  milisegundos: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milisegundos);
  });
}

function clonarRoles(
  roles: RolConfiguracion[],
): RolConfiguracion[] {
  return roles.map((rol) => ({
    ...rol,
    permisos: [...rol.permisos],
  }));
}

function guardarRoles(
  roles: RolConfiguracion[],
): void {
  localStorage.setItem(
    CLAVE_ROLES,
    JSON.stringify(roles),
  );
}

function obtenerRolesPersistidos(): RolConfiguracion[] {
  const datosGuardados =
    localStorage.getItem(CLAVE_ROLES);

  if (!datosGuardados) {
    guardarRoles(rolesIniciales);

    return clonarRoles(rolesIniciales);
  }

  try {
    const roles = JSON.parse(
      datosGuardados,
    ) as RolConfiguracion[];

    if (!Array.isArray(roles)) {
      throw new Error(
        "La configuración de roles no es válida.",
      );
    }

    return clonarRoles(roles);
  } catch {
    guardarRoles(rolesIniciales);

    return clonarRoles(rolesIniciales);
  }
}

function normalizarPermisos(
  permisos: PermisoSistema[],
): PermisoSistema[] {
  const permisosNormalizados =
    new Set<PermisoSistema>([
      "DASHBOARD_VER",
      ...permisos,
      ]);

  permisos.forEach((permiso) => {
    const dependencia =
      dependenciasPermisos[permiso];

    if (dependencia) {
      permisosNormalizados.add(
        dependencia,
      );
    }
  });

  return permisosSistema.filter(
    (permiso) =>
      permisosNormalizados.has(permiso),
  );
}

export async function listarRoles(): Promise<
  RolConfiguracion[]
> {
  await esperar(350);

  return obtenerRolesPersistidos();
}

export async function obtenerPermisosRol(
  rol: RolUsuario,
): Promise<PermisoSistema[]> {
  const roles =
    obtenerRolesPersistidos();

  const rolEncontrado = roles.find(
    (configuracion) =>
      configuracion.rol === rol,
  );

  if (!rolEncontrado) {
    return [];
  }

  return [...rolEncontrado.permisos];
}

export async function actualizarPermisosRol(
  rol: RolUsuario,
  permisos: PermisoSistema[],
): Promise<RolConfiguracion> {
  await esperar(650);

  const roles =
    obtenerRolesPersistidos();

  const indiceRol = roles.findIndex(
    (configuracion) =>
      configuracion.rol === rol,
  );

  if (indiceRol === -1) {
    throw new Error(
      "El rol seleccionado no existe.",
    );
  }

  const rolActual = roles[indiceRol];

  if (!rolActual.editable) {
    throw new Error(
      "Los permisos del rol Administrador no pueden modificarse.",
    );
  }

  const permisosPermitidos =
    permisos.filter(
      (permiso) =>
        permiso !== "ROLES_GESTIONAR",
    );

  const rolActualizado: RolConfiguracion = {
    ...rolActual,
    permisos:
      normalizarPermisos(
        permisosPermitidos,
      ),
  };

  roles[indiceRol] = rolActualizado;

  guardarRoles(roles);

  return {
    ...rolActualizado,
    permisos: [
      ...rolActualizado.permisos,
    ],
  };
}

export async function restablecerPermisosRol(
  rol: RolUsuario,
): Promise<RolConfiguracion> {
  await esperar(500);

  const rolInicial =
    rolesIniciales.find(
      (configuracion) =>
        configuracion.rol === rol,
    );

  if (!rolInicial) {
    throw new Error(
      "No existe una configuración inicial para el rol.",
    );
  }

  const roles =
    obtenerRolesPersistidos();

  const indiceRol = roles.findIndex(
    (configuracion) =>
      configuracion.rol === rol,
  );

  if (indiceRol === -1) {
    throw new Error(
      "El rol seleccionado no existe.",
    );
  }

  if (!roles[indiceRol].editable) {
    throw new Error(
      "El rol Administrador no puede restablecerse.",
    );
  }

  const rolRestablecido: RolConfiguracion = {
    ...rolInicial,
    permisos: [...rolInicial.permisos],
  };

  roles[indiceRol] = rolRestablecido;

  guardarRoles(roles);

  return {
    ...rolRestablecido,
    permisos: [
      ...rolRestablecido.permisos,
    ],
  };
}