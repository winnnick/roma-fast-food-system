import {
  FileBarChart2,
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  UserRound,
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
      "Acceso al resumen ejecutivo y sus secciones operativas.",
    icono: LayoutDashboard,
    permisos: [
      {
        permiso: "DASHBOARD_VER",
        nombre: "Acceder al Dashboard",
        descripcion:
          "Ingresar al panel administrativo del sistema.",
      },
      {
        permiso: "DASHBOARD_INDICADORES_VER",
        nombre: "Ver indicadores",
        descripcion:
          "Consultar métricas comerciales, caja e inventario del periodo.",
      },
      {
        permiso: "DASHBOARD_GRAFICOS_VER",
        nombre: "Ver análisis gráfico",
        descripcion:
          "Consultar tendencias, demanda, métodos de pago y productos más vendidos.",
      },
      {
        permiso: "DASHBOARD_ALERTAS_VER",
        nombre: "Ver alertas",
        descripcion:
          "Consultar observaciones operativas y administrativas del periodo.",
      },
      {
        permiso: "DASHBOARD_ACTIVIDAD_VER",
        nombre: "Ver actividad reciente",
        descripcion:
          "Consultar el registro operativo reciente atribuido a usuarios.",
      },
      {
        permiso: "DASHBOARD_ALERTAS_GESTIONAR",
        nombre: "Gestionar alertas",
        descripcion:
          "Marcar alertas como revisadas u ocultarlas del panel administrativo.",
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
      "Administración del menú, categorías y configuración comercial.",
    icono: UtensilsCrossed,
    permisos: [
      {
        permiso: "PRODUCTOS_VER",
        nombre: "Ver productos",
        descripcion:
          "Consultar productos, categorías, precios y configuración de inventario.",
      },
      {
        permiso: "PRODUCTOS_CREAR",
        nombre: "Registrar productos",
        descripcion:
          "Crear nuevos productos y configurar su receta inicial.",
      },
      {
        permiso: "PRODUCTOS_EDITAR",
        nombre: "Modificar productos",
        descripcion:
          "Editar información comercial y destacado del producto.",
      },
      {
        permiso: "PRODUCTOS_DESACTIVAR",
        nombre: "Activar o desactivar productos",
        descripcion:
          "Cambiar el estado lógico de un producto sin eliminar su historial.",
      },
      {
        permiso: "CATEGORIAS_GESTIONAR",
        nombre: "Gestionar categorías",
        descripcion:
          "Registrar, modificar, activar o desactivar categorías del menú.",
      },
    ],
  },

  {
    nombre: "Clientes",
    descripcion:
      "Administración del directorio, datos de contacto y entrega.",
    icono: UserRound,
    permisos: [
      {
        permiso: "CLIENTES_VER",
        nombre: "Ver clientes",
        descripcion:
          "Consultar el directorio y la información registrada de los clientes.",
      },
      {
        permiso: "CLIENTES_CREAR",
        nombre: "Registrar clientes",
        descripcion:
          "Crear nuevos clientes y guardar sus datos de contacto y entrega.",
      },
      {
        permiso: "CLIENTES_EDITAR",
        nombre: "Modificar clientes",
        descripcion:
          "Editar información personal, contacto, dirección e indicaciones de entrega.",
      },
      {
        permiso: "CLIENTES_ARCHIVAR",
        nombre: "Archivar o restaurar clientes",
        descripcion:
          "Cambiar la disponibilidad de un cliente sin eliminar su historial.",
      },
      {
        permiso: "CLIENTES_COMPARTIR",
        nombre: "Compartir datos de entrega",
        descripcion:
          "Copiar o enviar por WhatsApp la información necesaria para una entrega.",
      },
    ],
  },

  {
    nombre: "Ventas",
    descripcion:
      "Registro, preparación, cobro y seguimiento de pedidos.",
    icono: ShoppingCart,
    permisos: [
      {
        permiso: "VENTAS_VER",
        nombre: "Ver ventas",
        descripcion:
          "Consultar la operación actual y los pedidos en curso.",
      },
      {
        permiso: "VENTAS_CREAR",
        nombre: "Registrar pedidos",
        descripcion:
          "Crear nuevos pedidos y enviarlos a preparación.",
      },
      {
        permiso: "VENTAS_PREPARAR",
        nombre: "Gestionar preparación",
        descripcion:
          "Mover pedidos de la cola a preparación y marcarlos como listos o entregados.",
      },
      {
        permiso: "VENTAS_CONFIGURAR_FLUJO",
        nombre: "Configurar flujo de preparación",
        descripcion:
          "Elegir si los nuevos pedidos ingresan en cola o directamente a preparación.",
      },
      {
        permiso: "VENTAS_COBRAR",
        nombre: "Registrar cobros",
        descripcion:
          "Cobrar pedidos pendientes desde una caja propia abierta.",
      },
      {
        permiso: "VENTAS_ANULAR",
        nombre: "Anular pedidos",
        descripcion:
          "Anular pedidos y definir el tratamiento de inventario correspondiente.",
      },
      {
        permiso: "VENTAS_HISTORIAL",
        nombre: "Ver historial de ventas",
        descripcion:
          "Consultar ventas anteriores y visualizar sus tickets.",
      },
      {
        permiso: "VENTAS_COMPARTIR_ENTREGA",
        nombre: "Compartir entrega",
        descripcion:
          "Copiar o enviar por WhatsApp los datos de un pedido para delivery.",
      },
    ],
  },

  {
    nombre: "Caja",
    descripcion:
      "Control de apertura, movimientos manuales, cierre e historial.",
    icono: WalletCards,
    permisos: [
      {
        permiso: "CAJA_VER",
        nombre: "Ver caja",
        descripcion:
          "Consultar el estado actual, resumen y movimientos de caja.",
      },
      {
        permiso: "CAJA_ABRIR",
        nombre: "Abrir caja",
        descripcion:
          "Iniciar una caja propia. Al habilitarlo también se concede cierre para evitar sesiones sin salida operativa.",
      },
      {
        permiso: "CAJA_INGRESOS",
        nombre: "Registrar ingresos",
        descripcion:
          "Añadir ingresos manuales de efectivo a la caja propia abierta.",
      },
      {
        permiso: "CAJA_EGRESOS",
        nombre: "Registrar egresos",
        descripcion:
          "Registrar salidas manuales de efectivo de la caja propia abierta.",
      },
      {
        permiso: "CAJA_CERRAR",
        nombre: "Cerrar caja",
        descripcion:
          "Realizar el arqueo y cerrar la caja propia abierta.",
      },
      {
        permiso: "CAJA_HISTORIAL",
        nombre: "Ver historial de cajas",
        descripcion:
          "Consultar aperturas, cierres, responsables y diferencias históricas.",
      },
    ],
  },

  {
    nombre: "Inventario",
    descripcion:
      "Control granular de insumos, existencias, recetas y verificaciones físicas.",
    icono: PackageSearch,
    permisos: [
      {
        permiso: "INVENTARIO_VER",
        nombre: "Ver inventario",
        descripcion:
          "Consultar el resumen, existencias, límites y estado general de los insumos.",
      },
      {
        permiso: "INVENTARIO_INSUMOS_CREAR",
        nombre: "Registrar insumos",
        descripcion:
          "Crear nuevos insumos y definir su unidad, control de stock y valoración inicial.",
      },
      {
        permiso: "INVENTARIO_INSUMOS_EDITAR",
        nombre: "Modificar insumos",
        descripcion:
          "Editar configuración, límites, política de faltantes y valoración de insumos existentes.",
      },
      {
        permiso: "INVENTARIO_ESTADO_INSUMO",
        nombre: "Activar o desactivar insumos",
        descripcion:
          "Cambiar el estado lógico de un insumo sin eliminar su historial.",
      },
      {
        permiso: "INVENTARIO_ENTRADAS",
        nombre: "Registrar entradas",
        descripcion:
          "Registrar compras o recepciones que incrementan las existencias.",
      },
      {
        permiso: "INVENTARIO_AJUSTES_AUMENTAR",
        nombre: "Registrar ajustes positivos",
        descripcion:
          "Aumentar manualmente el stock por correcciones justificadas y auditadas.",
      },
      {
        permiso: "INVENTARIO_AJUSTES_DISMINUIR",
        nombre: "Registrar ajustes negativos",
        descripcion:
          "Disminuir manualmente el stock por mermas o correcciones justificadas.",
      },
      {
        permiso: "INVENTARIO_RECETAS_VER",
        nombre: "Ver recetas",
        descripcion:
          "Consultar ingredientes, costos, versiones vigentes e historial de recetas.",
      },
      {
        permiso: "INVENTARIO_RECETAS_GESTIONAR",
        nombre: "Gestionar recetas",
        descripcion:
          "Crear nuevas versiones de recetas y modificar su composición técnica.",
      },
      {
        permiso: "INVENTARIO_MOVIMIENTOS_VER",
        nombre: "Ver movimientos",
        descripcion:
          "Consultar el historial trazable de entradas, consumos, ajustes y regularizaciones.",
      },
      {
        permiso: "INVENTARIO_CONTEOS_VER",
        nombre: "Ver conteos físicos",
        descripcion:
          "Consultar conteos realizados, diferencias e impacto registrado.",
      },
      {
        permiso: "INVENTARIO_CONTEOS_REGISTRAR",
        nombre: "Registrar conteos físicos",
        descripcion:
          "Registrar verificaciones físicas y regularizar diferencias justificadas.",
      },
    ],
  },

  {
    nombre: "Reportes",
    descripcion:
      "Consulta administrativa, auditoría y salida de información.",
    icono: FileBarChart2,
    permisos: [
      {
        permiso: "REPORTES_VER",
        nombre: "Acceder a reportes",
        descripcion:
          "Ingresar al módulo de reportes administrativos.",
      },
      {
        permiso: "REPORTES_RESUMEN",
        nombre: "Ver resumen ejecutivo",
        descripcion:
          "Consultar indicadores generales de ventas, caja e inventario.",
      },
      {
        permiso: "REPORTES_VENTAS",
        nombre: "Ver reporte de ventas",
        descripcion:
          "Consultar pedidos, cobros, descuentos y estados de venta.",
      },
      {
        permiso: "REPORTES_ARQUEOS",
        nombre: "Ver arqueos de caja",
        descripcion:
          "Consultar conciliaciones, cierres, diferencias y alertas de caja.",
      },
      {
        permiso: "REPORTES_INVENTARIO",
        nombre: "Ver reporte de inventario",
        descripcion:
          "Consultar movimientos, existencias e impacto económico de inventario.",
      },
      {
        permiso: "REPORTES_USUARIOS",
        nombre: "Ver actividad por usuario",
        descripcion:
          "Consultar operaciones y resultados agrupados por responsable.",
      },
      {
        permiso: "REPORTES_BITACORA",
        nombre: "Ver bitácora de auditoría",
        descripcion:
          "Consultar el registro trazable de acciones realizadas en el sistema.",
      },
      {
        permiso: "REPORTES_PEDIDOSYA",
        nombre: "Ver control de PedidosYa",
        descripcion:
          "Consultar ventas, deuda pendiente e historial de liquidaciones del canal PedidosYa.",
      },
      {
        permiso: "REPORTES_PEDIDOSYA_LIQUIDAR",
        nombre: "Registrar liquidaciones de PedidosYa",
        descripcion:
          "Confirmar transferencias de PedidosYa para un rango de fechas y cerrar únicamente las ventas incluidas en ese periodo.",
      },
      {
        permiso: "REPORTES_EXPORTAR",
        nombre: "Generar reportes PDF",
        descripcion:
          "Descargar en PDF la sección de reporte que el usuario tenga autorizada.",
      },
      {
        permiso: "REPORTES_IMPRIMIR",
        nombre: "Imprimir reportes",
        descripcion:
          "Generar una vista imprimible de la sección de reporte autorizada.",
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