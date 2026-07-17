import {
  FileBarChart2,
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type {
  PermisoSistema,
} from "../../tipos/rol";

export interface PermisoVisual {
  permiso: PermisoSistema;
  nombre: string;
  descripcion: string;
  reservadoAdministrador?: boolean;
}

export interface GrupoPermisos {
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  permisos: PermisoVisual[];
}

export const gruposPermisos: GrupoPermisos[] = [
  {
    nombre: "Dashboard",
    descripcion:
      "Acceso al resumen general de la operación.",
    icono: LayoutDashboard,
    permisos: [
      {
        permiso: "DASHBOARD_VER",
        nombre: "Ver Dashboard",
        descripcion:
          "Consultar métricas, gráficos, pedidos y alertas.",
      },
    ],
  },

  {
    nombre: "Usuarios y seguridad",
    descripcion:
      "Administración de cuentas, estados y accesos.",
    icono: UsersRound,
    permisos: [
      {
        permiso: "USUARIOS_VER",
        nombre: "Ver usuarios",
        descripcion:
          "Consultar el listado y la información de las cuentas.",
      },
      {
        permiso: "USUARIOS_CREAR",
        nombre: "Registrar usuarios",
        descripcion:
          "Crear nuevas cuentas para el personal.",
      },
      {
        permiso: "USUARIOS_EDITAR",
        nombre: "Modificar usuarios",
        descripcion:
          "Editar datos, rol y contraseña de una cuenta.",
      },
      {
        permiso: "USUARIOS_DESACTIVAR",
        nombre: "Activar o desactivar usuarios",
        descripcion:
          "Cambiar el estado lógico de las cuentas.",
      },
      {
        permiso: "ROLES_GESTIONAR",
        nombre: "Gestionar roles y permisos",
        descripcion:
          "Modificar la configuración de acceso del sistema.",
        reservadoAdministrador: true,
      },
    ],
  },

  {
    nombre: "Productos",
    descripcion:
      "Administración del menú y los productos.",
    icono: UtensilsCrossed,
    permisos: [
      {
        permiso: "PRODUCTOS_VER",
        nombre: "Ver productos",
        descripcion:
          "Consultar productos, categorías y precios.",
      },
      {
        permiso: "PRODUCTOS_GESTIONAR",
        nombre: "Gestionar productos",
        descripcion:
          "Registrar, modificar y desactivar productos.",
      },
    ],
  },

  {
    nombre: "Ventas",
    descripcion:
      "Registro y seguimiento de pedidos y ventas.",
    icono: ShoppingCart,
    permisos: [
      {
        permiso: "VENTAS_VER",
        nombre: "Ver ventas",
        descripcion:
          "Consultar pedidos, ventas e historial.",
      },
      {
        permiso: "VENTAS_CREAR",
        nombre: "Registrar ventas",
        descripcion:
          "Crear pedidos y completar operaciones de venta.",
      },
    ],
  },

  {
    nombre: "Caja",
    descripcion:
      "Control de apertura, movimientos y cierre.",
    icono: WalletCards,
    permisos: [
      {
        permiso: "CAJA_VER",
        nombre: "Ver caja",
        descripcion:
          "Consultar el estado y los movimientos de caja.",
      },
      {
        permiso: "CAJA_GESTIONAR",
        nombre: "Gestionar caja",
        descripcion:
          "Abrir, cerrar y registrar movimientos de caja.",
      },
    ],
  },

  {
    nombre: "Inventario",
    descripcion:
      "Control de insumos, existencias y movimientos.",
    icono: PackageSearch,
    permisos: [
      {
        permiso: "INVENTARIO_VER",
        nombre: "Ver inventario",
        descripcion:
          "Consultar insumos, stock y alertas.",
      },
      {
        permiso: "INVENTARIO_GESTIONAR",
        nombre: "Gestionar inventario",
        descripcion:
          "Registrar entradas, salidas y ajustes de stock.",
      },
    ],
  },

  {
    nombre: "Reportes",
    descripcion:
      "Acceso a información operativa y administrativa.",
    icono: FileBarChart2,
    permisos: [
      {
        permiso: "REPORTES_VER",
        nombre: "Ver reportes",
        descripcion:
          "Consultar reportes y resultados del sistema.",
      },
    ],
  },
];

export function obtenerNombrePermiso(
  permisoBuscado: PermisoSistema,
): string {
  for (const grupo of gruposPermisos) {
    const permisoEncontrado =
      grupo.permisos.find(
        (item) =>
          item.permiso === permisoBuscado,
      );

    if (permisoEncontrado) {
      return permisoEncontrado.nombre;
    }
  }

  return permisoBuscado;
}