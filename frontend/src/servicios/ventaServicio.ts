import type {
  UsuarioSesion,
} from "../tipos/auth";

import {
  listarClientes,
} from "./clienteServicio";

import {
  listarProductos,
} from "./productoServicio";

import type {
  CanalVenta,
  CrearVentaDto,
  DetalleVenta,
  EstadoPreparacion,
  LiquidacionPedidosYa,
  ModoInicioPreparacion,
  RegistrarCobroVentaDto,
  RegistrarLiquidacionPedidosYaDto,
  ResumenPedidosYaPeriodo,
  TipoClienteVenta,
  Venta,
} from "../tipos/venta";

const CLAVE_VENTAS =
  "roma-ventas-unificadas-v1";

const CLAVE_LIQUIDACIONES_PEDIDOSYA =
  "roma-pedidosya-liquidaciones-v1";

export const CLAVE_FLUJO_PREPARACION =
  "roma-ventas-flujo-preparacion-v1";

const MODO_INICIO_PREPARACION_PREDETERMINADO: ModoInicioPreparacion =
  "En preparación";

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

export function obtenerModoInicioPreparacion(): ModoInicioPreparacion {
  const guardado = localStorage.getItem(
    CLAVE_FLUJO_PREPARACION,
  );

  return guardado === "En cola" ||
    guardado === "En preparación"
    ? guardado
    : MODO_INICIO_PREPARACION_PREDETERMINADO;
}

export async function actualizarModoInicioPreparacion(
  nuevoModo: ModoInicioPreparacion,
): Promise<ModoInicioPreparacion> {
  await esperar(250);

  if (nuevoModo === "En preparación") {
    const pedidosEnCola =
      obtenerVentasPersistidas().filter(
        (venta) =>
          venta.estadoPreparacion === "En cola" &&
          venta.estadoCobro !== "Anulada",
      );

    if (pedidosEnCola.length > 0) {
      throw new Error(
        `No se puede desactivar la cola mientras existan ${pedidosEnCola.length} pedido${pedidosEnCola.length === 1 ? "" : "s"} esperando preparación.`,
      );
    }
  }

  localStorage.setItem(
    CLAVE_FLUJO_PREPARACION,
    nuevoModo,
  );

  window.dispatchEvent(
    new CustomEvent(
      "roma-flujo-preparacion-actualizado",
      { detail: nuevoModo },
    ),
  );

  return nuevoModo;
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function clonarDetalle(
  detalle: DetalleVenta,
): DetalleVenta {
  return {
    ...detalle,
    requierePreparacion:
      detalle.requierePreparacion !== false,
  };
}

function esTipoClienteVenta(
  valor: unknown,
): valor is TipoClienteVenta {
  return (
    valor ===
      "Consumidor final" ||
    valor === "Registrado" ||
    valor === "Ocasional"
  );
}

function inferirTipoClienteVenta(
  venta: Venta,
): TipoClienteVenta {
  if (
    esTipoClienteVenta(
      venta.tipoCliente,
    )
  ) {
    return venta.tipoCliente;
  }

  if (venta.clienteId !== null) {
    return "Registrado";
  }

  const nombre =
    venta.clienteNombre
      ?.trim() ?? "";

  if (
    nombre &&
    nombre.toLocaleLowerCase(
      "es",
    ) !== "consumidor final"
  ) {
    return "Ocasional";
  }

  return "Consumidor final";
}

function normalizarNombreClienteVenta(
  venta: Venta,
  tipoCliente: TipoClienteVenta,
): string {
  if (
    tipoCliente ===
    "Consumidor final"
  ) {
    return "Consumidor final";
  }

  const nombre =
    venta.clienteNombre
      ?.trim() ?? "";

  return nombre ||
    "Cliente sin nombre";
}

function normalizarVenta(
  venta: Venta,
): Venta {
  const subtotal =
    Number.isFinite(
      venta.subtotal,
    )
      ? venta.subtotal
      : venta.total;

  const montoDescuento =
    Number.isFinite(
      venta.montoDescuento,
    )
      ? venta.montoDescuento
      : 0;

  const total =
    Number.isFinite(venta.total)
      ? venta.total
      : redondearMoneda(
          subtotal -
            montoDescuento,
        );

  const tipoCliente =
    inferirTipoClienteVenta(
      venta,
    );

  const canalVenta: CanalVenta =
    venta.canalVenta === "PedidosYa"
      ? "PedidosYa"
      : "Local";

  const estadoCobroNormalizado =
    canalVenta === "PedidosYa"
      ? venta.estadoCobro === "Liquidada"
        ? "Liquidada"
        : venta.estadoCobro === "Anulada"
          ? "Anulada"
          : "Pendiente de liquidación"
      : venta.estadoCobro === "Cobrada" ||
          venta.estadoCobro === "Anulada"
        ? venta.estadoCobro
        : "Pendiente de cobro";

  return {
    ...venta,

    canalVenta,
    referenciaPedidosYa:
      canalVenta === "PedidosYa"
        ? venta.referenciaPedidosYa?.trim() || null
        : null,
    liquidacionPedidosYaId:
      canalVenta === "PedidosYa" &&
      Number.isInteger(venta.liquidacionPedidosYaId)
        ? venta.liquidacionPedidosYaId
        : null,
    fechaHoraLiquidacionPedidosYa:
      canalVenta === "PedidosYa"
        ? venta.fechaHoraLiquidacionPedidosYa ?? null
        : null,

    tipoCliente,

    clienteNombre:
      normalizarNombreClienteVenta(
        venta,
        tipoCliente,
      ),

    usuarioRegistroId:
      Number.isInteger(
        venta.usuarioRegistroId,
      )
        ? venta.usuarioRegistroId
        : null,

    usuarioRegistroNombre:
      venta.usuarioRegistroNombre
        ?.trim() ||
      "No registrado",

    sesionCajaIdRegistro:
      Number.isInteger(
        venta.sesionCajaIdRegistro,
      )
        ? venta.sesionCajaIdRegistro
        : null,

    subtotal,

    tipoDescuento:
      venta.tipoDescuento ??
      "Ninguno",

    valorDescuento:
      Number.isFinite(
        venta.valorDescuento,
      )
        ? venta.valorDescuento
        : 0,

    montoDescuento,

    total,

    estadoCobro: estadoCobroNormalizado,

    pagoId:
      canalVenta === "PedidosYa"
        ? null
        : venta.pagoId ?? null,

    metodoPago:
      canalVenta === "PedidosYa"
        ? null
        : venta.metodoPago ?? null,

    fechaHoraCobro:
      canalVenta === "PedidosYa"
        ? null
        : venta.fechaHoraCobro ?? null,

    usuarioEntregaId:
      Number.isInteger(venta.usuarioEntregaId)
        ? venta.usuarioEntregaId
        : null,
    usuarioEntregaNombre:
      venta.usuarioEntregaNombre?.trim() || null,
    sesionCajaIdEntrega:
      Number.isInteger(venta.sesionCajaIdEntrega)
        ? venta.sesionCajaIdEntrega
        : null,

    requierePreparacion:
      typeof venta.requierePreparacion === "boolean"
        ? venta.requierePreparacion
        : Array.isArray(venta.detalles)
          ? venta.detalles.some(
              (detalle) =>
                detalle.requierePreparacion !== false,
            )
          : true,

    estadoPreparacion:
      venta.estadoPreparacion === "En cola" ||
      venta.estadoPreparacion === "En preparación" ||
      venta.estadoPreparacion === "Entrega directa" ||
      venta.estadoPreparacion === "Listo" ||
      venta.estadoPreparacion === "Entregado" ||
      venta.estadoPreparacion === "Anulado"
        ? venta.estadoPreparacion
        : "En preparación",

    fechaHoraInicioPreparacion:
      venta.fechaHoraInicioPreparacion ??
      (venta.estadoPreparacion === "En cola" ||
      venta.estadoPreparacion === "Entrega directa"
        ? null
        : venta.fechaHoraRegistro),

    detalles:
      Array.isArray(
        venta.detalles,
      )
        ? venta.detalles.map(
            clonarDetalle,
          )
        : [],
  };
}

function clonarVenta(
  venta: Venta,
): Venta {
  return normalizarVenta(venta);
}

function guardarVentas(
  ventas: Venta[],
): void {
  localStorage.setItem(
    CLAVE_VENTAS,
    JSON.stringify(
      ventas.map(normalizarVenta),
    ),
  );
}

function obtenerVentasPersistidas():
  Venta[] {
  const datos =
    localStorage.getItem(
      CLAVE_VENTAS,
    );

  if (!datos) {
    guardarVentas([]);
    return [];
  }

  try {
    const ventas = JSON.parse(
      datos,
    ) as Venta[];

    if (!Array.isArray(ventas)) {
      throw new Error(
        "Los datos de ventas no son válidos.",
      );
    }

    return ventas.map(
      normalizarVenta,
    );
  } catch {
    guardarVentas([]);
    return [];
  }
}

function obtenerLiquidacionesPedidosYaPersistidas(): LiquidacionPedidosYa[] {
  const datos = localStorage.getItem(
    CLAVE_LIQUIDACIONES_PEDIDOSYA,
  );

  if (!datos) {
    localStorage.setItem(
      CLAVE_LIQUIDACIONES_PEDIDOSYA,
      JSON.stringify([]),
    );
    return [];
  }

  try {
    const liquidaciones = JSON.parse(datos) as LiquidacionPedidosYa[];
    return Array.isArray(liquidaciones)
      ? liquidaciones.filter(
          (item) =>
            Number.isInteger(item.id) &&
            Array.isArray(item.ventaIds),
        )
      : [];
  } catch {
    localStorage.setItem(
      CLAVE_LIQUIDACIONES_PEDIDOSYA,
      JSON.stringify([]),
    );
    return [];
  }
}

function guardarLiquidacionesPedidosYa(
  liquidaciones: LiquidacionPedidosYa[],
): void {
  localStorage.setItem(
    CLAVE_LIQUIDACIONES_PEDIDOSYA,
    JSON.stringify(liquidaciones),
  );
}

function fechaEnRango(
  fecha: string,
  fechaDesde: string,
  fechaHasta: string,
): boolean {
  const tiempo = new Date(fecha).getTime();
  const desde = new Date(`${fechaDesde}T00:00:00`).getTime();
  const hasta = new Date(`${fechaHasta}T23:59:59.999`).getTime();
  return tiempo >= desde && tiempo <= hasta;
}export async function obtenerResumenPedidosYa(
  fechaDesde: string,
  fechaHasta: string,
): Promise<ResumenPedidosYaPeriodo> {
  await esperar(250);

  const ventas = obtenerVentasPersistidas().filter(
    (venta) =>
      venta.canalVenta === "PedidosYa" &&
      venta.estadoCobro !== "Anulada" &&
      fechaEnRango(
        venta.fechaHoraRegistro,
        fechaDesde,
        fechaHasta,
      ),
  );

  const pedidosEnCurso = ventas.filter(
    (venta) =>
      venta.estadoCobro === "Pendiente de liquidación" &&
      venta.estadoPreparacion !== "Entregado",
  );

  // Solo un pedido que ya fue entregado al repartidor se considera
  // una deuda exigible de PedidosYa. Esto evita liquidar pedidos que
  // todavía se encuentran en cola, preparación o listos.
  const pedidosPendientes = ventas.filter(
    (venta) =>
      venta.estadoCobro === "Pendiente de liquidación" &&
      venta.estadoPreparacion === "Entregado",
  );

  const pedidosLiquidados = ventas.filter(
    (venta) => venta.estadoCobro === "Liquidada",
  );

  const liquidaciones =
    obtenerLiquidacionesPedidosYaPersistidas()
      .filter(
        (liquidacion) =>
          liquidacion.fechaHasta >= fechaDesde &&
          liquidacion.fechaDesde <= fechaHasta,
      )
      .sort(
        (a, b) =>
          new Date(b.fechaHoraRegistro).getTime() -
          new Date(a.fechaHoraRegistro).getTime(),
      );

  return {
    fechaDesde,
    fechaHasta,
    pedidosEnCurso: pedidosEnCurso.map(clonarVenta),
    cantidadEnCurso: pedidosEnCurso.length,
    montoEnCurso: redondearMoneda(
      pedidosEnCurso.reduce(
        (total, venta) => total + venta.total,
        0,
      ),
    ),
    pedidosPendientes: pedidosPendientes.map(clonarVenta),
    cantidadPendiente: pedidosPendientes.length,
    montoPendiente: redondearMoneda(
      pedidosPendientes.reduce(
        (total, venta) => total + venta.total,
        0,
      ),
    ),
    pedidosLiquidados: pedidosLiquidados.map(clonarVenta),
    cantidadLiquidada: pedidosLiquidados.length,
    montoLiquidado: redondearMoneda(
      pedidosLiquidados.reduce(
        (total, venta) => total + venta.total,
        0,
      ),
    ),
    liquidaciones: liquidaciones.map((item) => ({
      ...item,
      ventaIds: [...item.ventaIds],
    })),
  };
}

export async function registrarLiquidacionPedidosYa(
  datos: RegistrarLiquidacionPedidosYaDto,
  usuario: UsuarioSesion,
): Promise<LiquidacionPedidosYa> {
  await esperar(550);

  if (!usuario.permisos.includes("REPORTES_PEDIDOSYA_LIQUIDAR")) {
    throw new Error(
      "No tienes permiso para registrar liquidaciones de PedidosYa.",
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaDesde) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaHasta) ||
      datos.fechaDesde > datos.fechaHasta) {
    throw new Error(
      "Selecciona un rango de fechas válido para la liquidación.",
    );
  }

  if (!Number.isFinite(datos.montoRecibido) || datos.montoRecibido <= 0) {
    throw new Error(
      "El monto transferido por PedidosYa debe ser un valor válido mayor a cero.",
    );
  }

  const ventas = obtenerVentasPersistidas();
  const elegibles = ventas.filter(
    (venta) =>
      venta.canalVenta === "PedidosYa" &&
      venta.estadoCobro === "Pendiente de liquidación" &&
      venta.estadoPreparacion === "Entregado" &&
      fechaEnRango(
        venta.fechaHoraRegistro,
        datos.fechaDesde,
        datos.fechaHasta,
      ),
  );

  if (elegibles.length === 0) {
    throw new Error(
      "No existen pedidos de PedidosYa ya entregados y pendientes de liquidación dentro del periodo seleccionado.",
    );
  }

  const montoBruto = redondearMoneda(
    elegibles.reduce(
      (total, venta) => total + venta.total,
      0,
    ),
  );
  const montoRecibido = redondearMoneda(datos.montoRecibido);
  const diferencia = redondearMoneda(montoRecibido - montoBruto);
  const observacion = datos.observacion?.trim() || null;

  if (Math.abs(diferencia) > 0.009 && !observacion) {
    throw new Error(
      "Registra una observación cuando el monto transferido sea diferente al total bruto de los pedidos seleccionados.",
    );
  }

  const liquidaciones = obtenerLiquidacionesPedidosYaPersistidas();
  const id = liquidaciones.length === 0
    ? 1
    : Math.max(...liquidaciones.map((item) => item.id)) + 1;
  const fechaHoraRegistro = new Date().toISOString();

  const liquidacion: LiquidacionPedidosYa = {
    id,
    numeroLiquidacion: `PY-${String(id).padStart(4, "0")}`,
    fechaDesde: datos.fechaDesde,
    fechaHasta: datos.fechaHasta,
    ventaIds: elegibles.map((venta) => venta.id),
    cantidadPedidos: elegibles.length,
    montoBruto,
    montoRecibido,
    diferencia,
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombreCompleto,
    observacion,
    fechaHoraRegistro,
  };

  const ids = new Set(liquidacion.ventaIds);
  const ventasActualizadas = ventas.map((venta) =>
    ids.has(venta.id)
      ? {
          ...venta,
          estadoCobro: "Liquidada" as const,
          liquidacionPedidosYaId: id,
          fechaHoraLiquidacionPedidosYa: fechaHoraRegistro,
          fechaHoraActualizacion: fechaHoraRegistro,
        }
      : venta,
  );

  guardarVentas(ventasActualizadas);
  guardarLiquidacionesPedidosYa([
    ...liquidaciones,
    liquidacion,
  ]);

  window.dispatchEvent(
    new CustomEvent("roma-pedidosya-actualizado"),
  );

  return {
    ...liquidacion,
    ventaIds: [...liquidacion.ventaIds],
  };
}

function obtenerSiguienteId(
  ventas: Venta[],
): number {
  if (ventas.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...ventas.map(
        (venta) => venta.id,
      ),
    ) + 1
  );
}

function generarNumeroPedido(
  id: number,
): string {
  return `PED-${String(id).padStart(
    4,
    "0",
  )}`;
}

function normalizarTextoOpcional(
  valor: string | null,
  longitudMaxima: number,
  nombreCampo: string,
): string | null {
  const texto =
    valor?.trim() ?? "";

  if (!texto) {
    return null;
  }

  if (
    texto.length >
    longitudMaxima
  ) {
    throw new Error(
      `${nombreCampo} no puede superar los ${longitudMaxima} caracteres.`,
    );
  }

  return texto;
}

async function resolverCliente(
  datos: CrearVentaDto,
): Promise<{
  tipoCliente: TipoClienteVenta;
  clienteId: number | null;
  clienteNombre: string;
}> {
  if (datos.clienteId !== null) {
    const clientes =
      await listarClientes();

    const cliente =
      clientes.find(
        (clienteActual) =>
          clienteActual.id ===
          datos.clienteId,
      );

    if (!cliente) {
      throw new Error(
        "El cliente seleccionado no existe.",
      );
    }

    if (cliente.archivado) {
      throw new Error(
        "El cliente seleccionado está archivado.",
      );
    }

    return {
      tipoCliente: "Registrado",
      clienteId: cliente.id,
      clienteNombre:
        cliente.nombreCompleto,
    };
  }

  if (
    datos.tipoCliente ===
    "Registrado"
  ) {
    throw new Error(
      "Selecciona un cliente registrado válido.",
    );
  }

  const nombreEscrito =
    datos.clienteNombre
      ?.trim() ?? "";

  const solicitaClienteOcasional =
    datos.tipoCliente ===
      "Ocasional" ||
    (
      !datos.tipoCliente &&
      nombreEscrito.length > 0 &&
      nombreEscrito
        .toLocaleLowerCase("es") !==
        "consumidor final"
    );

  if (solicitaClienteOcasional) {
    if (nombreEscrito.length < 2) {
      throw new Error(
        "El nombre del cliente ocasional debe contener al menos 2 caracteres.",
      );
    }

    if (nombreEscrito.length > 100) {
      throw new Error(
        "El nombre del cliente ocasional no puede superar los 100 caracteres.",
      );
    }

    return {
      tipoCliente: "Ocasional",
      clienteId: null,
      clienteNombre:
        nombreEscrito,
    };
  }

  return {
    tipoCliente:
      "Consumidor final",
    clienteId: null,
    clienteNombre:
      "Consumidor final",
  };
}

async function construirDetalles(
  datos: CrearVentaDto,
): Promise<DetalleVenta[]> {
  const canalVenta: CanalVenta =
    datos.canalVenta === "PedidosYa"
      ? "PedidosYa"
      : "Local";

  if (
    !Array.isArray(
      datos.detalles,
    ) ||
    datos.detalles.length === 0
  ) {
    throw new Error(
      "Agrega al menos un producto.",
    );
  }

  if (
    datos.detalles.length > 30
  ) {
    throw new Error(
      "El pedido no puede contener más de 30 productos diferentes.",
    );
  }

  const idsProductos =
    datos.detalles.map(
      (detalle) =>
        detalle.productoId,
    );

  if (
    new Set(idsProductos).size !==
    idsProductos.length
  ) {
    throw new Error(
      "Existen productos repetidos en el pedido.",
    );
  }

  const productos =
    await listarProductos();

  return datos.detalles.map(
    (detalle) => {
      const producto =
        productos.find(
          (productoActual) =>
            productoActual.id ===
            detalle.productoId,
        );

      if (!producto) {
        throw new Error(
          "Uno de los productos seleccionados ya no existe.",
        );
      }

      if (
        producto.estado !==
          "Activo" ||
        !producto.disponible
      ) {
        throw new Error(
          `El producto “${producto.nombre}” ya no se encuentra disponible.`,
        );
      }

      if (
        canalVenta === "PedidosYa" &&
        (!producto.disponiblePedidosYa ||
          producto.precioPedidosYa === null ||
          producto.precioPedidosYa <= 0)
      ) {
        throw new Error(
          `El producto “${producto.nombre}” no está habilitado para PedidosYa o no tiene un precio válido en ese canal.`,
        );
      }

      if (
        !Number.isInteger(
          detalle.cantidad,
        ) ||
        detalle.cantidad < 1 ||
        detalle.cantidad > 50
      ) {
        throw new Error(
          `La cantidad de “${producto.nombre}” debe estar entre 1 y 50.`,
        );
      }

      const observacion =
        normalizarTextoOpcional(
          detalle.observacion,
          120,
          `La observación de “${producto.nombre}”`,
        );

      const precioUnitario =
        canalVenta === "PedidosYa"
          ? producto.precioPedidosYa as number
          : producto.precio;

      return {
        productoId:
          producto.id,

        codigoProducto:
          producto.codigo,

        nombreProducto:
          producto.nombre,

        precioUnitario,

        cantidad:
          detalle.cantidad,

        observacion,

        subtotal:
          redondearMoneda(
            precioUnitario *
              detalle.cantidad,
          ),

        requierePreparacion:
          producto.modoPreparacion !==
          "Entrega directa",
      };
    },
  );
}

async function validarVenta(
  datos: CrearVentaDto,
): Promise<{
  tipoCliente: TipoClienteVenta;
  clienteId: number | null;
  clienteNombre: string;
  detalles: DetalleVenta[];
  observaciones: string | null;
  subtotal: number;
  canalVenta: CanalVenta;
  referenciaPedidosYa: string | null;
}> {
  const [
    cliente,
    detalles,
  ] = await Promise.all([
    resolverCliente(datos),

    construirDetalles(datos),
  ]);

  const observaciones =
    normalizarTextoOpcional(
      datos.observaciones,
      300,
      "Las observaciones generales",
    );

  const subtotal =
    redondearMoneda(
      detalles.reduce(
        (acumulado, detalle) =>
          acumulado +
          detalle.subtotal,
        0,
      ),
    );

  const canalVenta: CanalVenta =
    datos.canalVenta === "PedidosYa"
      ? "PedidosYa"
      : "Local";

  const referenciaPedidosYa =
    canalVenta === "PedidosYa"
      ? normalizarTextoOpcional(
          datos.referenciaPedidosYa ?? null,
          80,
          "La referencia de PedidosYa",
        )
      : null;

  return {
    ...cliente,
    detalles,
    observaciones,
    subtotal,
    canalVenta,
    referenciaPedidosYa,
  };
}

export async function listarVentas():
  Promise<Venta[]> {
  await esperar(350);

  return obtenerVentasPersistidas()
    .sort(
      (ventaA, ventaB) =>
        new Date(
          ventaB.fechaHoraRegistro,
        ).getTime() -
        new Date(
          ventaA.fechaHoraRegistro,
        ).getTime(),
    )
    .map(clonarVenta);
}

export async function obtenerVentaPorId(
  id: number,
): Promise<Venta> {
  await esperar(200);

  const venta =
    obtenerVentasPersistidas()
      .find(
        (ventaActual) =>
          ventaActual.id === id,
      );

  if (!venta) {
    throw new Error(
      "La venta seleccionada no existe.",
    );
  }

  return clonarVenta(venta);
}

export async function crearVenta(
  datos: CrearVentaDto,
  usuario: UsuarioSesion,
  sesionCajaId: number,
): Promise<Venta> {
  await esperar(600);

  if (
    !Number.isInteger(
      sesionCajaId,
    ) ||
    sesionCajaId <= 0
  ) {
    throw new Error(
      "La sesión de caja de la venta no es válida.",
    );
  }

  const ventas =
    obtenerVentasPersistidas();

  const datosValidados =
    await validarVenta(datos);

  const id =
    obtenerSiguienteId(ventas);

  const fechaHoraActual =
    new Date().toISOString();

  const modoInicioPreparacion =
    obtenerModoInicioPreparacion();

  const requierePreparacion =
    datosValidados.detalles.some(
      (detalle) =>
        detalle.requierePreparacion,
    );

  const estadoPreparacionInicial:
    EstadoPreparacion = requierePreparacion
      ? modoInicioPreparacion
      : "Entrega directa";

  const nuevaVenta: Venta = {
    id,

    numeroPedido:
      generarNumeroPedido(id),

    canalVenta:
      datosValidados.canalVenta,
    referenciaPedidosYa:
      datosValidados.referenciaPedidosYa,
    liquidacionPedidosYaId: null,
    fechaHoraLiquidacionPedidosYa: null,

    tipoCliente:
      datosValidados.tipoCliente,

    clienteId:
      datosValidados.clienteId,

    clienteNombre:
      datosValidados.clienteNombre,

    usuarioRegistroId:
      usuario.id,

    usuarioRegistroNombre:
      usuario.nombreCompleto,

    sesionCajaIdRegistro:
      sesionCajaId,

    detalles:
      datosValidados.detalles,

    observaciones:
      datosValidados.observaciones,

    requierePreparacion,

    subtotal:
      datosValidados.subtotal,

    tipoDescuento:
      "Ninguno",

    valorDescuento: 0,
    montoDescuento: 0,

    total:
      datosValidados.subtotal,

    estadoPreparacion:
      estadoPreparacionInicial,

    estadoCobro:
      datosValidados.canalVenta === "PedidosYa"
        ? "Pendiente de liquidación"
        : "Pendiente de cobro",

    pagoId: null,
    metodoPago: null,

    motivoAnulacion: null,

    fechaHoraRegistro:
      fechaHoraActual,

    fechaHoraInicioPreparacion:
      estadoPreparacionInicial === "En preparación"
        ? fechaHoraActual
        : null,

    fechaHoraListo: null,
    fechaHoraEntregado: null,

    usuarioEntregaId: null,
    usuarioEntregaNombre: null,
    sesionCajaIdEntrega: null,

    fechaHoraCobro: null,
    fechaHoraAnulacion: null,

    fechaHoraActualizacion:
      fechaHoraActual,
  };

  ventas.push(nuevaVenta);

  guardarVentas(ventas);

  return clonarVenta(
    nuevaVenta,
  );
}

export async function cambiarEstadoPreparacion(
  id: number,
  nuevoEstado:
    EstadoPreparacion,
  entrega?: {
    usuarioId: number;
    usuarioNombre: string;
    sesionCajaId: number;
  },
): Promise<Venta> {
  await esperar(450);

  const ventas =
    obtenerVentasPersistidas();

  const indice =
    ventas.findIndex(
      (venta) => venta.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "El pedido seleccionado no existe.",
    );
  }

  const ventaActual =
    ventas[indice];

  const transicionesPermitidas:
    Record<
      EstadoPreparacion,
      EstadoPreparacion[]
    > = {
    "En cola": [
      "En preparación",
    ],

    "En preparación": [
      "Listo",
    ],

    "Entrega directa": [
      "Entregado",
    ],

    Listo: [
      "Entregado",
    ],

    Entregado: [],
    Anulado: [],
  };

  if (
    !transicionesPermitidas[
      ventaActual.estadoPreparacion
    ].includes(nuevoEstado)
  ) {
    throw new Error(
      `No se puede cambiar un pedido “${ventaActual.estadoPreparacion}” a “${nuevoEstado}”.`,
    );
  }

  if (
    nuevoEstado === "Entregado" &&
    ventaActual.canalVenta === "PedidosYa" &&
    (!entrega ||
      !Number.isInteger(entrega.sesionCajaId) ||
      entrega.sesionCajaId <= 0)
  ) {
    throw new Error(
      "Para entregar un pedido de PedidosYa debes tener tu propia caja abierta. Así quedará registrado quién realizó la entrega al repartidor.",
    );
  }

  const fechaHoraActual =
    new Date().toISOString();

  const ventaActualizada:
    Venta = {
    ...ventaActual,

    estadoPreparacion:
      nuevoEstado,

    fechaHoraInicioPreparacion:
      nuevoEstado === "En preparación"
        ? fechaHoraActual
        : ventaActual.fechaHoraInicioPreparacion,

    fechaHoraListo:
      nuevoEstado === "Listo"
        ? fechaHoraActual
        : ventaActual.fechaHoraListo,

    fechaHoraEntregado:
      nuevoEstado === "Entregado"
        ? fechaHoraActual
        : ventaActual
            .fechaHoraEntregado,

    usuarioEntregaId:
      nuevoEstado === "Entregado" && entrega
        ? entrega.usuarioId
        : ventaActual.usuarioEntregaId,
    usuarioEntregaNombre:
      nuevoEstado === "Entregado" && entrega
        ? entrega.usuarioNombre
        : ventaActual.usuarioEntregaNombre,
    sesionCajaIdEntrega:
      nuevoEstado === "Entregado" && entrega
        ? entrega.sesionCajaId
        : ventaActual.sesionCajaIdEntrega,

    fechaHoraActualizacion:
      fechaHoraActual,
  };

  ventas[indice] =
    ventaActualizada;

  guardarVentas(ventas);

  return clonarVenta(
    ventaActualizada,
  );
}

export async function registrarCobroVenta(
  id: number,
  datos:
    RegistrarCobroVentaDto,
): Promise<Venta> {
  await esperar(400);

  const ventas =
    obtenerVentasPersistidas();

  const indice =
    ventas.findIndex(
      (venta) => venta.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "La venta seleccionada no existe.",
    );
  }

  const ventaActual =
    ventas[indice];

  if (ventaActual.canalVenta === "PedidosYa") {
    throw new Error(
      "Los pedidos de PedidosYa no se cobran en caja. Su importe se controla mediante liquidaciones administrativas.",
    );
  }

  if (
    ventaActual.estadoCobro ===
    "Cobrada"
  ) {
    throw new Error(
      "La venta ya fue cobrada.",
    );
  }

  if (
    ventaActual.estadoCobro ===
      "Anulada" ||
    ventaActual.estadoPreparacion ===
      "Anulado"
  ) {
    throw new Error(
      "Una venta anulada no puede cobrarse.",
    );
  }

  if (
    !Number.isFinite(
      datos.totalVenta,
    ) ||
    datos.totalVenta <= 0
  ) {
    throw new Error(
      "El total de la venta no es válido.",
    );
  }

  const ventaActualizada:
    Venta = {
    ...ventaActual,

    subtotal:
      ventaActual.subtotal,

    tipoDescuento:
      datos.tipoDescuento,

    valorDescuento:
      datos.valorDescuento,

    montoDescuento:
      datos.montoDescuento,

    total:
      datos.totalVenta,

    estadoCobro:
      datos.pagoCompleto
        ? "Cobrada"
        : "Pendiente de cobro",

    pagoId:
      datos.pagoId,

    metodoPago:
      datos.metodoPago,

    fechaHoraCobro:
      datos.pagoCompleto
        ? datos.fechaHoraCobro
        : null,

    fechaHoraActualizacion:
      datos.fechaHoraCobro,
  };

  ventas[indice] =
    ventaActualizada;

  guardarVentas(ventas);

  return clonarVenta(
    ventaActualizada,
  );
}

export async function anularVenta(
  id: number,
  motivo: string,
): Promise<Venta> {
  await esperar(550);

  const ventas =
    obtenerVentasPersistidas();

  const indice =
    ventas.findIndex(
      (venta) => venta.id === id,
    );

  if (indice === -1) {
    throw new Error(
      "El pedido seleccionado no existe.",
    );
  }

  const ventaActual =
    ventas[indice];

  if (
    ventaActual.estadoPreparacion ===
    "Anulado"
  ) {
    throw new Error(
      "El pedido ya se encuentra anulado.",
    );
  }

  if (
    ventaActual.estadoPreparacion ===
    "Entregado"
  ) {
    throw new Error(
      "Un pedido entregado no puede anularse desde este módulo.",
    );
  }

  if (
    ventaActual.estadoCobro ===
    "Cobrada"
  ) {
    throw new Error(
      "Una venta cobrada deberá anularse mediante un proceso de devolución.",
    );
  }

  const motivoLimpio =
    motivo.trim();

  if (
    motivoLimpio.length < 5
  ) {
    throw new Error(
      "Indica un motivo de anulación de al menos 5 caracteres.",
    );
  }

  if (
    motivoLimpio.length > 200
  ) {
    throw new Error(
      "El motivo de anulación no puede superar los 200 caracteres.",
    );
  }

  const fechaHoraActual =
    new Date().toISOString();

  const ventaActualizada:
    Venta = {
    ...ventaActual,

    estadoPreparacion:
      "Anulado",

    estadoCobro:
      "Anulada",

    motivoAnulacion:
      motivoLimpio,

    fechaHoraAnulacion:
      fechaHoraActual,

    fechaHoraActualizacion:
      fechaHoraActual,
  };

  ventas[indice] =
    ventaActualizada;

  guardarVentas(ventas);

  return clonarVenta(
    ventaActualizada,
  );
}