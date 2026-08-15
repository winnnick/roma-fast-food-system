import type {
  RolUsuario,
} from "../tipos/auth";

import {
  permisosSistema,
  type PermisoSistema,
  type RolConfiguracion,
} from "../tipos/rol";

import {
  apiAuth,
  crearErrorApi,
} from "./apiCliente";

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
  VENTAS_CONFIGURAR_FLUJO:
    "VENTAS_VER",
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
  REPORTES_PEDIDOSYA_LIQUIDAR:
    "REPORTES_PEDIDOSYA",
  REPORTES_EXPORTAR: "REPORTES_VER",
  REPORTES_IMPRIMIR: "REPORTES_VER",
};

export function normalizarPermisosConDependencias(
  permisosEntrada: readonly unknown[],
): PermisoSistema[] {
  const permisos = new Set<PermisoSistema>(
    permisosEntrada.filter(
      (permiso): permiso is PermisoSistema =>
        typeof permiso === "string" &&
        permisosSistema.includes(
          permiso as PermisoSistema,
        ),
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

export async function listarRoles(): Promise<
  RolConfiguracion[]
> {
  try {
    const respuesta =
      await apiAuth.get<RolConfiguracion[]>(
        "/roles",
      );

    return respuesta.data.map((rol) => ({
      ...rol,
      permisos: [...rol.permisos],
    }));
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cargar los roles.",
    );
  }
}

export async function obtenerPermisosRoles(
  rolesDelUsuario: readonly RolUsuario[],
): Promise<PermisoSistema[]> {
  if (
    rolesDelUsuario.includes(
      "Administrador",
    )
  ) {
    return [...permisosSistema];
  }

  const configuraciones =
    await listarRoles();
  const permisos =
    new Set<PermisoSistema>();

  rolesDelUsuario.forEach((rol) => {
    configuraciones
      .find((item) => item.rol === rol)
      ?.permisos.forEach((permiso) =>
        permisos.add(permiso),
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
  try {
    const permisos =
      normalizarPermisosConDependencias(
        permisosEntrada.filter(
          (permiso) =>
            permiso !== "ROLES_GESTIONAR",
        ),
      );

    const respuesta =
      await apiAuth.put<RolConfiguracion>(
        `/roles/${encodeURIComponent(rol)}/permisos`,
        { permisos },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar los permisos del rol.",
    );
  }
}

export async function restablecerPermisosRol(
  rol: RolUsuario,
): Promise<RolConfiguracion> {
  try {
    const respuesta =
      await apiAuth.post<RolConfiguracion>(
        `/roles/${encodeURIComponent(rol)}/restablecer`,
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible restablecer los permisos del rol.",
    );
  }
}
