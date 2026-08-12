import { createElement } from "react";

import {
  FileText,
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  Users,
  Utensils,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

import type {
  PermisoSistema,
} from "../../tipos/rol";

function IconoCajaRegistradora({
  size = 20,
  strokeWidth = 1.7,
  ...propiedades
}: LucideProps) {
  return createElement(
    "svg",
    {
      ...propiedades,
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    createElement("path", {
      d: "M5 3h6v6H5V3Zm9 1h5v4h-5V4ZM4 9h15a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 1-2Z",
      stroke: "currentColor",
      strokeWidth,
      strokeLinejoin: "round",
    }),
    createElement("path", {
      d: "M6 12h3M6 15h3M12 12h1M16 12h1M12 15h1M16 15h1M2.5 19h19v2h-19v-2Z",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }),
  );
}

const IconoCajaMenu =
  IconoCajaRegistradora as unknown as LucideIcon;

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

export interface AtajoNavegacion {
  codigo: string;
  ruta: string;
  permiso: PermisoSistema;
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
        nombre: "Caja",
        ruta: "/caja",
        descripcion:
          "Apertura, movimientos y cierre",
        icono: IconoCajaMenu,
        permiso: "CAJA_VER",
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
        nombre: "Clientes",
        ruta: "/clientes",
        descripcion:
          "Registro y consulta de clientes",
        icono: UserRound,
        permiso: "CLIENTES_VER",
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

export const atajosNavegacion:
  AtajoNavegacion[] = [
    {
      codigo: "KeyD",
      ruta: "/dashboard",
      permiso: "DASHBOARD_VER",
    },

    {
      codigo: "KeyV",
      ruta: "/ventas",
      permiso: "VENTAS_VER",
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
