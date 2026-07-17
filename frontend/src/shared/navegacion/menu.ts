import {
  FileText,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type {
  PermisoSistema,
} from "../../tipos/rol";

export interface ElementoMenu {
  nombre: string;
  ruta: string;
  descripcion: string;
  icono: LucideIcon;
  permiso: PermisoSistema;
}

export interface SeccionMenu {
  titulo: string;
  elementos: ElementoMenu[];
}

export interface PaginaActual
  extends ElementoMenu {
  seccion: string;
}

export const seccionesMenu: SeccionMenu[] = [
  {
    titulo: "Principal",

    elementos: [
      {
        nombre: "Dashboard",
        ruta: "/dashboard",
        descripcion:
          "Resumen general de la operación",
        icono: LayoutDashboard,
        permiso: "DASHBOARD_VER",
      },
    ],
  },

  {
    titulo: "Operaciones",

    elementos: [
      {
        nombre: "Ventas",
        ruta: "/ventas",
        descripcion:
          "Registro y seguimiento de ventas",
        icono: ShoppingCart,
        permiso: "VENTAS_VER",
      },

      {
        nombre: "Productos",
        ruta: "/productos",
        descripcion:
          "Administración del menú",
        icono: Utensils,
        permiso: "PRODUCTOS_VER",
      },

      {
        nombre: "Caja",
        ruta: "/caja",
        descripcion:
          "Apertura, movimientos y cierre",
        icono: Wallet,
        permiso: "CAJA_VER",
      },

      {
        nombre: "Inventario",
        ruta: "/inventario",
        descripcion:
          "Control de insumos y existencias",
        icono: Package,
        permiso: "INVENTARIO_VER",
      },
    ],
  },

  {
    titulo: "Administración",

    elementos: [
      {
        nombre: "Usuarios",
        ruta: "/usuarios",
        descripcion:
          "Administración de cuentas y roles",
        icono: Users,
        permiso: "USUARIOS_VER",
      },

      {
        nombre: "Roles y permisos",
        ruta: "/roles-permisos",
        descripcion:
          "Configuración de accesos por rol",
        icono: ShieldCheck,
        permiso: "ROLES_GESTIONAR",
      },

      {
        nombre: "Reportes",
        ruta: "/reportes",
        descripcion:
          "Información operativa y administrativa",
        icono: FileText,
        permiso: "REPORTES_VER",
      },
    ],
  },
];

const paginas: PaginaActual[] =
  seccionesMenu.flatMap((seccion) =>
    seccion.elementos.map(
      (elemento) => ({
        ...elemento,
        seccion: seccion.titulo,
      }),
    ),
  );

export function obtenerPaginaActual(
  pathname: string,
): PaginaActual {
  const paginaEncontrada =
    paginas.find(
      (pagina) =>
        pathname === pagina.ruta ||
        pathname.startsWith(
          `${pagina.ruta}/`,
        ),
    );

  return (
    paginaEncontrada ?? {
      nombre: "Sistema",
      ruta: pathname,
      descripcion:
        "Sistema interno de gestión",
      icono: LayoutDashboard,
      seccion: "Roma Fast Food",
      permiso: "DASHBOARD_VER",
    }
  );
}