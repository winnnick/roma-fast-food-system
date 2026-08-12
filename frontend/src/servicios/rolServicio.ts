import {
  rolesUsuario,
  type RolUsuario,
} from "../tipos/auth";

import {
  permisosSistema,
  type PermisoSistema,
  type RolConfiguracion,
} from "../tipos/rol";

const CLAVE_ROLES = "roma-roles";
const CLAVE_VERSION_PERMISOS =
  "roma-permisos-granulares-version";
const VERSION_PERMISOS = 11;

/**
 * Nombres históricos que pudieron quedar persistidos en localStorage
 * durante la migración gradual. Ya no forman parte de PermisoSistema.
 * Solo se leen para convertir configuraciones antiguas y se eliminan
 * al guardar la versión 9.
 */
const permisosLegados = {
  productosGestionar: "PRODUCTOS_GESTIONAR",
  cajaGestionar: "CAJA_GESTIONAR",
  inventarioGestionar: "INVENTARIO_GESTIONAR",
  inventarioRecetas: "INVENTARIO_RECETAS",
  inventarioConteos: "INVENTARIO_CONTEOS",
} as const;

const permisosGranularesDashboard: PermisoSistema[] = [
  "DASHBOARD_INDICADORES_VER",
  "DASHBOARD_GRAFICOS_VER",
  "DASHBOARD_ALERTAS_VER",
  "DASHBOARD_ACTIVIDAD_VER",
];

const permisosGranularesProductos: PermisoSistema[] = [
  "PRODUCTOS_CREAR",
  "PRODUCTOS_EDITAR",
  "PRODUCTOS_DESACTIVAR",
  "CATEGORIAS_GESTIONAR",
];

const permisosGranularesClientes: PermisoSistema[] = [
  "CLIENTES_CREAR",
  "CLIENTES_EDITAR",
  "CLIENTES_ARCHIVAR",
  "CLIENTES_COMPARTIR",
];

const permisosGranularesVentas: PermisoSistema[] = [
  "VENTAS_PREPARAR",
  "VENTAS_CONFIGURAR_FLUJO",
  "VENTAS_COBRAR",
  "VENTAS_ANULAR",
  "VENTAS_HISTORIAL",
  "VENTAS_COMPARTIR_ENTREGA",
];

const permisosGranularesCaja: PermisoSistema[] = [
  "CAJA_ABRIR",
  "CAJA_INGRESOS",
  "CAJA_EGRESOS",
  "CAJA_CERRAR",
  "CAJA_HISTORIAL",
];

const permisosGranularesInventario: PermisoSistema[] = [
  "INVENTARIO_INSUMOS_CREAR",
  "INVENTARIO_INSUMOS_EDITAR",
  "INVENTARIO_ESTADO_INSUMO",
  "INVENTARIO_ENTRADAS",
  "INVENTARIO_AJUSTES_AUMENTAR",
  "INVENTARIO_AJUSTES_DISMINUIR",
  "INVENTARIO_RECETAS_VER",
  "INVENTARIO_RECETAS_GESTIONAR",
  "INVENTARIO_MOVIMIENTOS_VER",
  "INVENTARIO_CONTEOS_VER",
  "INVENTARIO_CONTEOS_REGISTRAR",
];

const permisosGranularesReportes: PermisoSistema[] = [
  "REPORTES_RESUMEN",
  "REPORTES_VENTAS",
  "REPORTES_ARQUEOS",
  "REPORTES_INVENTARIO",
  "REPORTES_USUARIOS",
  "REPORTES_BITACORA",
  "REPORTES_PEDIDOSYA",
  "REPORTES_PEDIDOSYA_LIQUIDAR",
  "REPORTES_EXPORTAR",
  "REPORTES_IMPRIMIR",
];

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
      ...permisosGranularesDashboard,
      "PRODUCTOS_VER",
      "CLIENTES_VER",
      ...permisosGranularesClientes,
      "VENTAS_VER",
      "VENTAS_CREAR",
      ...permisosGranularesVentas,
      "CAJA_VER",
      ...permisosGranularesCaja,
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
      ...permisosGranularesDashboard,
      "PRODUCTOS_VER",
      "INVENTARIO_VER",
      ...permisosGranularesInventario,
    ],
  },

  {
    rol: "Auxiliar",
    nombre: "Auxiliar",
    descripcion:
      "Rol flexible para funciones de apoyo cuyos permisos son definidos por el Administrador.",
    editable: true,
    permisos: [],
  },
];

export const dependenciasPermisos: Partial<
  Record<PermisoSistema, PermisoSistema>
> = {
  DASHBOARD_INDICADORES_VER:
    "DASHBOARD_VER",
  DASHBOARD_GRAFICOS_VER:
    "DASHBOARD_VER",
  DASHBOARD_ALERTAS_VER:
    "DASHBOARD_VER",
  DASHBOARD_ACTIVIDAD_VER:
    "DASHBOARD_VER",
  DASHBOARD_ALERTAS_GESTIONAR:
    "DASHBOARD_ALERTAS_VER",

  USUARIOS_CREAR: "USUARIOS_VER",
  USUARIOS_EDITAR: "USUARIOS_VER",
  USUARIOS_DESACTIVAR: "USUARIOS_VER",
  ROLES_GESTIONAR: "USUARIOS_VER",

  PRODUCTOS_CREAR: "PRODUCTOS_VER",
  PRODUCTOS_EDITAR: "PRODUCTOS_VER",
  PRODUCTOS_DESACTIVAR:
    "PRODUCTOS_VER",
  CATEGORIAS_GESTIONAR:
    "PRODUCTOS_VER",

  CLIENTES_CREAR: "CLIENTES_VER",
  CLIENTES_EDITAR: "CLIENTES_VER",
  CLIENTES_ARCHIVAR: "CLIENTES_VER",
  CLIENTES_COMPARTIR: "CLIENTES_VER",

  VENTAS_CREAR: "VENTAS_VER",
  VENTAS_PREPARAR: "VENTAS_VER",
  VENTAS_CONFIGURAR_FLUJO: "VENTAS_VER",
  VENTAS_COBRAR: "VENTAS_VER",
  VENTAS_ANULAR: "VENTAS_VER",
  VENTAS_HISTORIAL: "VENTAS_VER",
  VENTAS_COMPARTIR_ENTREGA:
    "VENTAS_VER",

  CAJA_CERRAR: "CAJA_VER",
  CAJA_ABRIR: "CAJA_CERRAR",
  CAJA_INGRESOS: "CAJA_ABRIR",
  CAJA_EGRESOS: "CAJA_ABRIR",
  CAJA_HISTORIAL: "CAJA_VER",

  INVENTARIO_INSUMOS_CREAR:
    "INVENTARIO_VER",
  INVENTARIO_INSUMOS_EDITAR:
    "INVENTARIO_VER",
  INVENTARIO_ESTADO_INSUMO:
    "INVENTARIO_VER",
  INVENTARIO_ENTRADAS:
    "INVENTARIO_VER",
  INVENTARIO_AJUSTES_AUMENTAR:
    "INVENTARIO_VER",
  INVENTARIO_AJUSTES_DISMINUIR:
    "INVENTARIO_VER",
  INVENTARIO_RECETAS_VER:
    "INVENTARIO_VER",
  INVENTARIO_RECETAS_GESTIONAR:
    "INVENTARIO_RECETAS_VER",
  INVENTARIO_MOVIMIENTOS_VER:
    "INVENTARIO_VER",
  INVENTARIO_CONTEOS_VER:
    "INVENTARIO_VER",
  INVENTARIO_CONTEOS_REGISTRAR:
    "INVENTARIO_CONTEOS_VER",

  REPORTES_RESUMEN: "REPORTES_VER",
  REPORTES_VENTAS: "REPORTES_VER",
  REPORTES_ARQUEOS: "REPORTES_VER",
  REPORTES_INVENTARIO: "REPORTES_VER",
  REPORTES_USUARIOS: "REPORTES_VER",
  REPORTES_BITACORA: "REPORTES_VER",
  REPORTES_PEDIDOSYA: "REPORTES_VER",
  REPORTES_PEDIDOSYA_LIQUIDAR: "REPORTES_PEDIDOSYA",
  REPORTES_EXPORTAR: "REPORTES_VER",
  REPORTES_IMPRIMIR: "REPORTES_VER",
};

interface RolPersistidoCrudo {
  rol?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  editable?: unknown;
  permisos?: unknown;
}

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

function esPermisoSistema(
  valor: unknown,
): valor is PermisoSistema {
  return (
    typeof valor === "string" &&
    permisosSistema.includes(
      valor as PermisoSistema,
    )
  );
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

function agregarTodos(
  destino: Set<string>,
  permisos: readonly string[],
) {
  permisos.forEach((permiso) => {
    destino.add(permiso);
  });
}

function normalizarPermisos(
  permisosEntrada: readonly unknown[],
): PermisoSistema[] {
  const permisos = new Set<PermisoSistema>(
    permisosEntrada.filter(
      esPermisoSistema,
    ),
  );

  let huboCambios = true;

  while (huboCambios) {
    huboCambios = false;

    Array.from(permisos).forEach(
      (permiso) => {
        const dependencia =
          dependenciasPermisos[permiso];

        if (
          dependencia &&
          !permisos.has(dependencia)
        ) {
          permisos.add(dependencia);
          huboCambios = true;
        }
      },
    );
  }

  return permisosSistema.filter(
    (permiso) => permisos.has(permiso),
  );
}


/**
 * Normaliza una lista de permisos y agrega automáticamente las
 * dependencias necesarias. Se expone para resolver permisos
 * individuales sin duplicar reglas de autorización.
 */
export function normalizarPermisosConDependencias(
  permisosEntrada: readonly unknown[],
): PermisoSistema[] {
  return normalizarPermisos(permisosEntrada);
}

function obtenerVersionGuardada(): number {
  const version = Number(
    localStorage.getItem(
      CLAVE_VERSION_PERMISOS,
    ) ?? "0",
  );

  return Number.isFinite(version)
    ? version
    : 0;
}

/**
 * Convierte cualquier configuración generada desde los bloques 1–8
 * al catálogo definitivo de la versión 9.
 *
 * El conjunto se mantiene como string durante la migración para poder
 * reconocer permisos históricos que ya no pertenecen a PermisoSistema.
 */
function migrarPermisosHistoricos(
  permisosEntrada: unknown,
  versionGuardada: number,
): PermisoSistema[] {
  const permisos = new Set<string>(
    Array.isArray(permisosEntrada)
      ? permisosEntrada.filter(
          (permiso): permiso is string =>
            typeof permiso === "string",
        )
      : [],
  );

  if (
    versionGuardada < 2 &&
    permisos.has(
      permisosLegados.productosGestionar,
    )
  ) {
    agregarTodos(
      permisos,
      permisosGranularesProductos,
    );
  }

  if (versionGuardada < 3) {
    if (permisos.has("VENTAS_VER")) {
      permisos.add("CLIENTES_VER");
    }

    if (permisos.has("VENTAS_CREAR")) {
      agregarTodos(
        permisos,
        permisosGranularesClientes,
      );
    }
  }

  if (
    versionGuardada < 4 &&
    permisos.has("VENTAS_CREAR")
  ) {
    agregarTodos(
      permisos,
      permisosGranularesVentas,
    );
  }

  if (
    versionGuardada < 5 &&
    permisos.has(
      permisosLegados.cajaGestionar,
    )
  ) {
    agregarTodos(
      permisos,
      permisosGranularesCaja,
    );
  }

  if (versionGuardada < 6) {
    if (
      permisos.has(
        permisosLegados.inventarioGestionar,
      )
    ) {
      agregarTodos(
        permisos,
        permisosGranularesInventario,
      );
    }

    if (
      permisos.has(
        permisosLegados.inventarioRecetas,
      )
    ) {
      permisos.add(
        "INVENTARIO_RECETAS_VER",
      );
      permisos.add(
        "INVENTARIO_RECETAS_GESTIONAR",
      );
    }

    if (
      permisos.has(
        permisosLegados.inventarioConteos,
      )
    ) {
      permisos.add(
        "INVENTARIO_CONTEOS_VER",
      );
      permisos.add(
        "INVENTARIO_CONTEOS_REGISTRAR",
      );
    }

    if (
      permisos.has(
        "INVENTARIO_INSUMOS_EDITAR",
      )
    ) {
      permisos.add(
        "INVENTARIO_INSUMOS_CREAR",
      );
    }
  }

  if (
    versionGuardada < 7 &&
    permisos.has("REPORTES_VER")
  ) {
    agregarTodos(
      permisos,
      permisosGranularesReportes,
    );
  }

  if (versionGuardada < 8) {
    if (permisos.has("DASHBOARD_VER")) {
      agregarTodos(
        permisos,
        permisosGranularesDashboard,
      );
    }

    if (
      permisos.has("DASHBOARD_VER") &&
      permisos.has("REPORTES_VER")
    ) {
      permisos.add(
        "DASHBOARD_ALERTAS_GESTIONAR",
      );
    }
  }

  // La normalización final descarta definitivamente los nombres legados.
  return normalizarPermisos(
    Array.from(permisos),
  );
}

function crearRolDesdePersistencia(
  rolCrudo: RolPersistidoCrudo,
  versionGuardada: number,
): RolConfiguracion | null {
  if (!esRolUsuario(rolCrudo.rol)) {
    return null;
  }

  const rolInicial = rolesIniciales.find(
    (rol) => rol.rol === rolCrudo.rol,
  );

  if (!rolInicial) {
    return null;
  }

  if (rolCrudo.rol === "Administrador") {
    return {
      ...rolInicial,
      permisos: [...permisosSistema],
    };
  }

  const permisosMigrados = migrarPermisosHistoricos(
    rolCrudo.permisos,
    versionGuardada,
  );

  if (
    versionGuardada < 10 &&
    rolCrudo.rol === "Cajero" &&
    !permisosMigrados.includes("VENTAS_CONFIGURAR_FLUJO")
  ) {
    permisosMigrados.push("VENTAS_CONFIGURAR_FLUJO");
  }

  return {
    rol: rolCrudo.rol,
    nombre:
      typeof rolCrudo.nombre === "string" &&
      rolCrudo.nombre.trim()
        ? rolCrudo.nombre
        : rolInicial.nombre,
    descripcion:
      typeof rolCrudo.descripcion === "string" &&
      rolCrudo.descripcion.trim()
        ? rolCrudo.descripcion
        : rolInicial.descripcion,
    editable: true,
    permisos: normalizarPermisos(
      permisosMigrados,
    ),
  };
}

function normalizarRolesPersistidos(
  datos: unknown,
  versionGuardada: number,
): RolConfiguracion[] {
  if (!Array.isArray(datos)) {
    return clonarRoles(rolesIniciales);
  }

  const rolesLeidos = datos
    .map((rol) =>
      crearRolDesdePersistencia(
        (rol ?? {}) as RolPersistidoCrudo,
        versionGuardada,
      ),
    )
    .filter(
      (rol): rol is RolConfiguracion =>
        rol !== null,
    );

  return rolesUsuario.map((rolUsuario) => {
    const encontrado = rolesLeidos.find(
      (rol) => rol.rol === rolUsuario,
    );

    const inicial = rolesIniciales.find(
      (rol) => rol.rol === rolUsuario,
    );

    if (!inicial) {
      throw new Error(
        `No existe configuración inicial para ${rolUsuario}.`,
      );
    }

    return encontrado
      ? {
          ...encontrado,
          permisos:
            rolUsuario === "Administrador"
              ? [...permisosSistema]
              : normalizarPermisos(
                  encontrado.permisos,
                ),
        }
      : {
          ...inicial,
          permisos: [...inicial.permisos],
        };
  });
}

function obtenerRolesPersistidos():
  RolConfiguracion[] {
  const datosGuardados =
    localStorage.getItem(CLAVE_ROLES);

  const versionGuardada =
    obtenerVersionGuardada();

  if (!datosGuardados) {
    guardarRoles(rolesIniciales);

    localStorage.setItem(
      CLAVE_VERSION_PERMISOS,
      String(VERSION_PERMISOS),
    );

    return clonarRoles(rolesIniciales);
  }

  try {
    const datos = JSON.parse(
      datosGuardados,
    ) as unknown;

    const rolesNormalizados =
      normalizarRolesPersistidos(
        datos,
        versionGuardada,
      );

    const rolesSerializados =
      JSON.stringify(rolesNormalizados);

    if (
      versionGuardada < VERSION_PERMISOS ||
      rolesSerializados !== datosGuardados
    ) {
      localStorage.setItem(
        CLAVE_ROLES,
        rolesSerializados,
      );

      localStorage.setItem(
        CLAVE_VERSION_PERMISOS,
        String(VERSION_PERMISOS),
      );
    }

    return clonarRoles(
      rolesNormalizados,
    );
  } catch {
    guardarRoles(rolesIniciales);

    localStorage.setItem(
      CLAVE_VERSION_PERMISOS,
      String(VERSION_PERMISOS),
    );

    return clonarRoles(rolesIniciales);
  }
}

export async function listarRoles(): Promise<
  RolConfiguracion[]
> {
  await esperar(350);

  return obtenerRolesPersistidos();
}export async function obtenerPermisosRoles(
  rolesDelUsuario: readonly RolUsuario[],
): Promise<PermisoSistema[]> {
  const rolesUnicos = Array.from(
    new Set(rolesDelUsuario),
  );

  if (rolesUnicos.includes("Administrador")) {
    return [...permisosSistema];
  }

  const configuraciones =
    obtenerRolesPersistidos();

  const permisos =
    new Set<PermisoSistema>();

  rolesUnicos.forEach((rol) => {
    const configuracion =
      configuraciones.find(
        (item) => item.rol === rol,
      );

    configuracion?.permisos.forEach(
      (permiso) => permisos.add(permiso),
    );
  });

  return permisosSistema.filter(
    (permiso) => permisos.has(permiso),
  );
}

export async function actualizarPermisosRol(
  rol: RolUsuario,
  permisosEntrada: PermisoSistema[],
): Promise<RolConfiguracion> {
  await esperar(650);

  const roles = obtenerRolesPersistidos();

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
    permisosEntrada.filter(
      (permiso) =>
        permiso !== "ROLES_GESTIONAR",
    );

  const rolActualizado: RolConfiguracion = {
    ...rolActual,
    permisos: normalizarPermisos(
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

  const rolInicial = rolesIniciales.find(
    (configuracion) =>
      configuracion.rol === rol,
  );

  if (!rolInicial) {
    throw new Error(
      "No existe una configuración inicial para el rol.",
    );
  }

  const roles = obtenerRolesPersistidos();

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
    permisos: [
      ...rolInicial.permisos,
    ],
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
