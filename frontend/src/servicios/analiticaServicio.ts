import type {
  MetodoPago,
  MovimientoCaja,
  PagoVenta,
  SesionCaja,
} from "../tipos/caja";

import type {
  ConsumoVentaInventario,
  ConteoFisicoInventario,
  InsumoInventario,
  MovimientoInventario,
  NivelStockInventario,
  RecetaProducto,
  TipoMovimientoInventario,
} from "../tipos/inventario";

import type {
  ProductoMenu,
} from "../tipos/producto";

import type {
  Venta,
} from "../tipos/venta";

import type {
  ActividadOperativa,
  ActividadUsuarioAnalitica,
  AlertaAdministrativa,
  EstadoCajaAnalitica,
  FiltroPeriodoAnalitica,
  IndicadoresComerciales,
  InsumoAlertaAnalitica,
  PanelAdministrativo,
  PeriodoRapidoAnalitica,
  ProductoVendidoAnalitica,
  PuntoVentasDiarias,
  PuntoVentasHora,
  ResumenInventarioAnalitica,
  ResumenMetodoPagoAnalitica,
  VariacionIndicador,
} from "../tipos/analitica";

import type {
  RegistroAuditoria,
} from "../tipos/auditoria";

import {
  listarMovimientosCaja,
  listarPagosVenta,
  listarSesionesCaja,
  obtenerCajaAbierta,
} from "./cajaServicio";

import {
  calcularNivelStockInsumo,
  listarConsumosVentaInventario,
  listarConteosFisicosInventario,
  listarInsumosInventario,
  listarMovimientosInventario,
  listarRecetasInventario,
} from "./inventarioServicio";

import {
  listarProductos,
} from "./productoServicio";

import {
  listarVentas,
} from "./ventaServicio";

import {
  listarAuditoria,
} from "./auditoriaServicio";

interface DatosAnalitica {
  ventas: Venta[];
  pagos: PagoVenta[];
  sesionesCaja: SesionCaja[];
  movimientosCaja: MovimientoCaja[];

  insumos: InsumoInventario[];
  movimientosInventario:
    MovimientoInventario[];
  consumos: ConsumoVentaInventario[];
  conteos: ConteoFisicoInventario[];
  recetas: RecetaProducto[];

  productos: ProductoMenu[];
  auditoria: RegistroAuditoria[];
}

interface LimitesPeriodo {
  desde: number;
  hasta: number;
}

interface AcumuladorUsuario {
  usuarioId: number | null;
  usuarioNombre: string;

  ventasRegistradas: number;
  montoVentasRegistradas: number;

  cobrosRealizados: number;
  montoCobrado: number;

  movimientosInventario: number;
  movimientosCajaManuales: number;

  aperturasCaja: number;
  cierresCaja: number;

  eventosAuditoria: number;
}

interface AcumuladorProducto {
  productoId: number;
  codigoProducto: string;
  nombreProducto: string;

  cantidadVendida: number;
  pedidos: Set<number>;

  importeBruto: number;
  importeNetoEstimado: number;
}

const TIPOS_MOVIMIENTO_INVENTARIO:
  TipoMovimientoInventario[] = [
    "Stock inicial",
    "Entrada",
    "Consumo automático",
    "Reversión por anulación",
    "Merma por anulación",
    "Ajuste positivo",
    "Ajuste negativo",
    "Conteo físico",
  ];

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function redondearPorcentaje(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 10,
  ) / 10;
}

function formatearFechaInput(
  fecha: Date,
): string {
  const anio = fecha.getFullYear();
  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");
  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function crearFechaLocal(
  fechaInput: string,
): Date {
  const [anio, mes, dia] =
    fechaInput
      .split("-")
      .map(Number);

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia)
  ) {
    throw new Error(
      "El rango de fechas no es válido.",
    );
  }

  return new Date(
    anio,
    mes - 1,
    dia,
  );
}

function sumarDias(
  fecha: Date,
  dias: number,
): Date {
  const resultado = new Date(fecha);
  resultado.setDate(
    resultado.getDate() + dias,
  );
  return resultado;
}

function normalizarPeriodo(
  periodo: FiltroPeriodoAnalitica,
): FiltroPeriodoAnalitica {
  const fechaDesde = crearFechaLocal(
    periodo.fechaDesde,
  );
  const fechaHasta = crearFechaLocal(
    periodo.fechaHasta,
  );

  if (
    fechaDesde.getTime() >
    fechaHasta.getTime()
  ) {
    throw new Error(
      "La fecha inicial no puede ser posterior a la fecha final.",
    );
  }

  return {
    fechaDesde:
      formatearFechaInput(fechaDesde),
    fechaHasta:
      formatearFechaInput(fechaHasta),
  };
}

function obtenerLimitesPeriodo(
  periodo: FiltroPeriodoAnalitica,
): LimitesPeriodo {
  return {
    desde: new Date(
      `${periodo.fechaDesde}T00:00:00`,
    ).getTime(),

    hasta: new Date(
      `${periodo.fechaHasta}T23:59:59.999`,
    ).getTime(),
  };
}

function fechaEnPeriodo(
  fechaHora: string | null,
  limites: LimitesPeriodo,
): boolean {
  if (!fechaHora) {
    return false;
  }

  const tiempo = new Date(
    fechaHora,
  ).getTime();

  return (
    tiempo >= limites.desde &&
    tiempo <= limites.hasta
  );
}

function crearPeriodoAnterior(
  periodo: FiltroPeriodoAnalitica,
): FiltroPeriodoAnalitica {
  const desde = crearFechaLocal(
    periodo.fechaDesde,
  );
  const hasta = crearFechaLocal(
    periodo.fechaHasta,
  );

  const cantidadDias =
    Math.round(
      (hasta.getTime() -
        desde.getTime()) /
        86400000,
    ) + 1;

  const hastaAnterior = sumarDias(
    desde,
    -1,
  );

  const desdeAnterior = sumarDias(
    hastaAnterior,
    -(cantidadDias - 1),
  );

  return {
    fechaDesde:
      formatearFechaInput(
        desdeAnterior,
      ),
    fechaHasta:
      formatearFechaInput(
        hastaAnterior,
      ),
  };
}

function calcularVariacion(
  valorActual: number,
  valorAnterior: number,
): VariacionIndicador {
  let porcentaje = 0;

  if (
    valorAnterior === 0 &&
    valorActual > 0
  ) {
    porcentaje = 100;
  } else if (valorAnterior !== 0) {
    porcentaje =
      ((valorActual -
        valorAnterior) /
        Math.abs(valorAnterior)) *
      100;
  }

  return {
    valorActual:
      redondearMoneda(valorActual),
    valorAnterior:
      redondearMoneda(valorAnterior),
    porcentaje:
      redondearPorcentaje(
        porcentaje,
      ),
  };
}

function porcentaje(
  parte: number,
  total: number,
): number {
  if (total <= 0) {
    return 0;
  }

  return redondearPorcentaje(
    (parte / total) * 100,
  );
}

function sumar(
  valores: number[],
): number {
  return redondearMoneda(
    valores.reduce(
      (acumulado, valor) =>
        acumulado + valor,
      0,
    ),
  );
}

function obtenerFechaClave(
  fechaHora: string,
): string {
  const fecha = new Date(fechaHora);
  return formatearFechaInput(fecha);
}

function crearListaDias(
  periodo: FiltroPeriodoAnalitica,
): string[] {
  const dias: string[] = [];

  const fechaActual = crearFechaLocal(
    periodo.fechaDesde,
  );
  const fechaHasta = crearFechaLocal(
    periodo.fechaHasta,
  );

  while (
    fechaActual.getTime() <=
    fechaHasta.getTime()
  ) {
    dias.push(
      formatearFechaInput(
        fechaActual,
      ),
    );

    fechaActual.setDate(
      fechaActual.getDate() + 1,
    );
  }

  return dias;
}

function construirIndicadoresComerciales(
  ventas: Venta[],
  pagos: PagoVenta[],
  limites: LimitesPeriodo,
  limitesAnteriores: LimitesPeriodo,
): IndicadoresComerciales {
  const ventasPeriodo = ventas.filter(
    (venta) =>
      fechaEnPeriodo(
        venta.fechaHoraRegistro,
        limites,
      ),
  );

  const pagosPeriodo = pagos.filter(
    (pago) =>
      fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      ),
  );

  const pagosPeriodoAnterior =
    pagos.filter((pago) =>
      fechaEnPeriodo(
        pago.fechaHoraCobro,
        limitesAnteriores,
      ),
    );

  const ventasPeriodoAnterior =
    ventas.filter((venta) =>
      fechaEnPeriodo(
        venta.fechaHoraRegistro,
        limitesAnteriores,
      ),
    );

  const ventasNetas = sumar(
    pagosPeriodo.map(
      (pago) => pago.totalCobrado,
    ),
  );

  const ventasBrutas = sumar(
    pagosPeriodo.map(
      (pago) => pago.subtotal,
    ),
  );

  const ventasNetasAnterior = sumar(
    pagosPeriodoAnterior.map(
      (pago) => pago.totalCobrado,
    ),
  );

  const pedidosAnulados =
    ventas.filter(
      (venta) =>
        fechaEnPeriodo(
          venta.fechaHoraAnulacion,
          limites,
        ),
    ).length;

  const pedidosPendientes =
    ventasPeriodo.filter(
      (venta) =>
        venta.estadoCobro ===
        "Pendiente de cobro",
    ).length;

  const ventasPendientes = sumar(
    ventasPeriodo
      .filter(
        (venta) =>
          venta.estadoCobro ===
          "Pendiente de cobro",
      )
      .map(
        (venta) => venta.total,
      ),
  );

  const ticketPromedio =
    pagosPeriodo.length > 0
      ? redondearMoneda(
          ventasNetas /
            pagosPeriodo.length,
        )
      : 0;

  const ticketAnterior =
    pagosPeriodoAnterior.length > 0
      ? redondearMoneda(
          ventasNetasAnterior /
            pagosPeriodoAnterior.length,
        )
      : 0;

  const clientesIdentificados =
    new Set(
      ventasPeriodo
        .map(
          (venta) =>
            venta.clienteId,
        )
        .filter(
          (clienteId) =>
            clienteId !== null,
        ),
    ).size;

  return {
    ventasNetas,
    ventasBrutas,
    ventasPendientes,

    pedidosRegistrados:
      ventasPeriodo.length,
    pedidosCobrados:
      pagosPeriodo.length,
    pedidosPendientes,
    pedidosAnulados,

    ticketPromedio,

    descuentosOtorgados: sumar(
      pagosPeriodo.map(
        (pago) =>
          pago.montoDescuento,
      ),
    ),

    porcentajeAnulacion:
      porcentaje(
        pedidosAnulados,
        ventasPeriodo.length +
          pedidosAnulados,
      ),

    clientesIdentificados,

    variacionVentas:
      calcularVariacion(
        ventasNetas,
        ventasNetasAnterior,
      ),

    variacionPedidos:
      calcularVariacion(
        ventasPeriodo.length,
        ventasPeriodoAnterior.length,
      ),

    variacionTicket:
      calcularVariacion(
        ticketPromedio,
        ticketAnterior,
      ),
  };
}

function construirMetodosPago(
  pagos: PagoVenta[],
  limites: LimitesPeriodo,
): ResumenMetodoPagoAnalitica[] {
  const pagosPeriodo = pagos.filter(
    (pago) =>
      fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      ),
  );

  const totalPeriodo = sumar(
    pagosPeriodo.map(
      (pago) => pago.totalCobrado,
    ),
  );

  const metodos: MetodoPago[] = [
    "Efectivo",
    "QR",
    "Mixto",
  ];

  return metodos.map((metodo) => {
    const pagosMetodo =
      pagosPeriodo.filter(
        (pago) =>
          pago.metodoPago === metodo,
      );

    const totalCobrado = sumar(
      pagosMetodo.map(
        (pago) =>
          pago.totalCobrado,
      ),
    );

    return {
      metodo,
      cantidadPagos:
        pagosMetodo.length,
      totalCobrado,

      montoEfectivo: sumar(
        pagosMetodo.map(
          (pago) =>
            pago.montoEfectivo,
        ),
      ),

      montoQr: sumar(
        pagosMetodo.map(
          (pago) => pago.montoQr,
        ),
      ),

      porcentajeMonto:
        porcentaje(
          totalCobrado,
          totalPeriodo,
        ),
    };
  });
}

function construirVentasPorDia(
  ventas: Venta[],
  pagos: PagoVenta[],
  periodo: FiltroPeriodoAnalitica,
  limites: LimitesPeriodo,
): PuntoVentasDiarias[] {
  const ventasPeriodo = ventas.filter(
    (venta) =>
      fechaEnPeriodo(
        venta.fechaHoraRegistro,
        limites,
      ),
  );

  const pagosPeriodo = pagos.filter(
    (pago) =>
      fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      ),
  );

  return crearListaDias(periodo).map(
    (fecha) => {
      const pedidosDia =
        ventasPeriodo.filter(
          (venta) =>
            obtenerFechaClave(
              venta.fechaHoraRegistro,
            ) === fecha,
        );

      const pagosDia =
        pagosPeriodo.filter(
          (pago) =>
            obtenerFechaClave(
              pago.fechaHoraCobro,
            ) === fecha,
        );

      const fechaLocal =
        crearFechaLocal(fecha);

      return {
        fecha,

        etiqueta:
          new Intl.DateTimeFormat(
            "es-BO",
            {
              day: "2-digit",
              month: "short",
            },
          ).format(fechaLocal),

        ventasCobradas: sumar(
          pagosDia.map(
            (pago) =>
              pago.totalCobrado,
          ),
        ),

        pedidosRegistrados:
          pedidosDia.length,

        pedidosCobrados:
          pagosDia.length,

        pedidosAnulados:
          ventas.filter(
            (venta) =>
              venta.fechaHoraAnulacion !==
                null &&
              obtenerFechaClave(
                venta.fechaHoraAnulacion,
              ) === fecha,
          ).length,
      };
    },
  );
}

function construirVentasPorHora(
  ventas: Venta[],
  pagos: PagoVenta[],
  limites: LimitesPeriodo,
): PuntoVentasHora[] {
  const ventasPeriodo = ventas.filter(
    (venta) =>
      fechaEnPeriodo(
        venta.fechaHoraRegistro,
        limites,
      ),
  );

  const pagosPeriodo = pagos.filter(
    (pago) =>
      fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      ),
  );

  return Array.from(
    { length: 24 },
    (_, hora) => ({
      hora,
      etiqueta: `${String(
        hora,
      ).padStart(2, "0")}:00`,

      ventasCobradas: sumar(
        pagosPeriodo
          .filter(
            (pago) =>
              new Date(
                pago.fechaHoraCobro,
              ).getHours() === hora,
          )
          .map(
            (pago) =>
              pago.totalCobrado,
          ),
      ),

      pedidosRegistrados:
        ventasPeriodo.filter(
          (venta) =>
            new Date(
              venta.fechaHoraRegistro,
            ).getHours() === hora,
        ).length,
    }),
  );
}

function construirProductosMasVendidos(
  ventas: Venta[],
  pagos: PagoVenta[],
  limites: LimitesPeriodo,
): ProductoVendidoAnalitica[] {
  const ventaPorId = new Map(
    ventas.map(
      (venta) => [venta.id, venta],
    ),
  );

  const acumuladores = new Map<
    number,
    AcumuladorProducto
  >();

  for (const pago of pagos) {
    if (
      !fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      )
    ) {
      continue;
    }

    const venta = ventaPorId.get(
      pago.ventaId,
    );

    if (!venta) {
      continue;
    }

    const factorNeto =
      venta.subtotal > 0
        ? pago.totalCobrado /
          venta.subtotal
        : 0;

    for (const detalle of venta.detalles) {
      const actual =
        acumuladores.get(
          detalle.productoId,
        ) ?? {
          productoId:
            detalle.productoId,
          codigoProducto:
            detalle.codigoProducto,
          nombreProducto:
            detalle.nombreProducto,
          cantidadVendida: 0,
          pedidos: new Set<number>(),
          importeBruto: 0,
          importeNetoEstimado: 0,
        };

      actual.cantidadVendida +=
        detalle.cantidad;

      actual.pedidos.add(venta.id);

      actual.importeBruto +=
        detalle.subtotal;

      actual.importeNetoEstimado +=
        detalle.subtotal *
        factorNeto;

      acumuladores.set(
        detalle.productoId,
        actual,
      );
    }
  }

  return Array.from(
    acumuladores.values(),
  )
    .map((producto) => ({
      productoId:
        producto.productoId,
      codigoProducto:
        producto.codigoProducto,
      nombreProducto:
        producto.nombreProducto,

      cantidadVendida:
        producto.cantidadVendida,

      cantidadPedidos:
        producto.pedidos.size,

      importeBruto:
        redondearMoneda(
          producto.importeBruto,
        ),

      importeNetoEstimado:
        redondearMoneda(
          producto
            .importeNetoEstimado,
        ),
    }))
    .sort(
      (productoA, productoB) =>
        productoB.cantidadVendida -
          productoA.cantidadVendida ||
        productoB
          .importeNetoEstimado -
          productoA
            .importeNetoEstimado,
    );
}

function obtenerClaveUsuario(
  usuarioId: number | null,
  usuarioNombre: string,
): string {
  return usuarioId !== null
    ? `id-${usuarioId}`
    : `nombre-${usuarioNombre}`;
}

function obtenerAcumuladorUsuario(
  mapa: Map<
    string,
    AcumuladorUsuario
  >,
  usuarioId: number | null,
  usuarioNombre: string,
): AcumuladorUsuario {
  const clave = obtenerClaveUsuario(
    usuarioId,
    usuarioNombre,
  );

  const existente = mapa.get(clave);

  if (existente) {
    return existente;
  }

  const nuevo: AcumuladorUsuario = {
    usuarioId,
    usuarioNombre,

    ventasRegistradas: 0,
    montoVentasRegistradas: 0,

    cobrosRealizados: 0,
    montoCobrado: 0,

    movimientosInventario: 0,
    movimientosCajaManuales: 0,

    aperturasCaja: 0,
    cierresCaja: 0,

    eventosAuditoria: 0,
  };

  mapa.set(clave, nuevo);
  return nuevo;
}

function construirActividadPorUsuario(
  datos: DatosAnalitica,
  limites: LimitesPeriodo,
): ActividadUsuarioAnalitica[] {
  const mapa = new Map<
    string,
    AcumuladorUsuario
  >();

  const ventaPorId = new Map(
    datos.ventas.map(
      (venta) => [venta.id, venta],
    ),
  );

  for (const consumo of datos.consumos) {
    if (
      !fechaEnPeriodo(
        consumo.fechaHoraRegistro,
        limites,
      )
    ) {
      continue;
    }

    const acumulador =
      obtenerAcumuladorUsuario(
        mapa,
        consumo.usuarioRegistroId,
        consumo.usuarioRegistroNombre,
      );

    acumulador.ventasRegistradas += 1;
    acumulador.montoVentasRegistradas +=
      ventaPorId.get(
        consumo.ventaId,
      )?.total ?? 0;
  }

  for (const pago of datos.pagos) {
    if (
      !fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      )
    ) {
      continue;
    }

    const acumulador =
      obtenerAcumuladorUsuario(
        mapa,
        pago.usuarioId,
        pago.usuarioNombre,
      );

    acumulador.cobrosRealizados += 1;
    acumulador.montoCobrado +=
      pago.totalCobrado;
  }

  for (
    const movimiento
    of datos.movimientosInventario
  ) {
    if (
      !fechaEnPeriodo(
        movimiento.fechaHora,
        limites,
      )
    ) {
      continue;
    }

    const acumulador =
      obtenerAcumuladorUsuario(
        mapa,
        movimiento.usuarioId,
        movimiento.usuarioNombre,
      );

    acumulador.movimientosInventario +=
      1;
  }

  for (
    const movimiento
    of datos.movimientosCaja
  ) {
    if (
      movimiento.tipo === "Venta" ||
      !fechaEnPeriodo(
        movimiento.fechaHoraRegistro,
        limites,
      )
    ) {
      continue;
    }

    const acumulador =
      obtenerAcumuladorUsuario(
        mapa,
        movimiento.usuarioId,
        movimiento.usuarioNombre,
      );

    acumulador.movimientosCajaManuales +=
      1;
  }

  for (const sesion of datos.sesionesCaja) {
    if (
      fechaEnPeriodo(
        sesion.fechaHoraApertura,
        limites,
      )
    ) {
      const acumulador =
        obtenerAcumuladorUsuario(
          mapa,
          sesion.usuarioAperturaId,
          sesion.usuarioAperturaNombre,
        );

      acumulador.aperturasCaja += 1;
    }

    if (
      sesion.usuarioCierreId !== null &&
      sesion.usuarioCierreNombre !==
        null &&
      fechaEnPeriodo(
        sesion.fechaHoraCierre,
        limites,
      )
    ) {
      const acumulador =
        obtenerAcumuladorUsuario(
          mapa,
          sesion.usuarioCierreId,
          sesion.usuarioCierreNombre,
        );

      acumulador.cierresCaja += 1;
    }
  }

  for (const evento of datos.auditoria) {
    if (
      !fechaEnPeriodo(
        evento.fechaHora,
        limites,
      )
    ) {
      continue;
    }

    const acumulador =
      obtenerAcumuladorUsuario(
        mapa,
        evento.usuarioId,
        evento.usuarioNombre,
      );

    acumulador.eventosAuditoria += 1;
  }

  return Array.from(mapa.values())
    .map((usuario) => ({
      usuarioId: usuario.usuarioId,
      usuarioNombre:
        usuario.usuarioNombre,

      ventasRegistradas:
        usuario.ventasRegistradas,

      montoVentasRegistradas:
        redondearMoneda(
          usuario
            .montoVentasRegistradas,
        ),

      cobrosRealizados:
        usuario.cobrosRealizados,

      montoCobrado:
        redondearMoneda(
          usuario.montoCobrado,
        ),

      movimientosInventario:
        usuario.movimientosInventario,

      movimientosCajaManuales:
        usuario
          .movimientosCajaManuales,

      aperturasCaja:
        usuario.aperturasCaja,

      cierresCaja:
        usuario.cierresCaja,

      eventosAuditoria:
        usuario.eventosAuditoria,

      totalAcciones:
        usuario.ventasRegistradas +
        usuario.cobrosRealizados +
        usuario.movimientosInventario +
        usuario
          .movimientosCajaManuales +
        usuario.aperturasCaja +
        usuario.cierresCaja +
        usuario.eventosAuditoria,
    }))
    .sort(
      (usuarioA, usuarioB) =>
        usuarioB.totalAcciones -
        usuarioA.totalAcciones,
    );
}

function convertirNivelStock(
  insumo: InsumoInventario,
): NivelStockInventario {
  return calcularNivelStockInsumo(
    insumo,
  );
}

function construirResumenInventario(
  datos: DatosAnalitica,
  limites: LimitesPeriodo,
): ResumenInventarioAnalitica {
  const insumosActivos =
    datos.insumos.filter(
      (insumo) =>
        insumo.estado === "Activo",
    );

  const movimientosPeriodo =
    datos.movimientosInventario.filter(
      (movimiento) =>
        fechaEnPeriodo(
          movimiento.fechaHora,
          limites,
        ),
    );

  const recetasVigentes =
    datos.recetas.filter(
      (receta) =>
        receta.estado === "Vigente",
    );

  const idsProductosConReceta =
    new Set(
      recetasVigentes.map(
        (receta) =>
          receta.productoId,
      ),
    );

  const productosActivosSinReceta =
    datos.productos.filter(
      (producto) =>
        producto.estado === "Activo" &&
        !idsProductosConReceta.has(
          producto.id,
        ),
    ).length;

  const movimientosConsumo =
    movimientosPeriodo.filter(
      (movimiento) =>
        movimiento.tipo ===
        "Consumo automático",
    );

  const movimientosReversion =
    movimientosPeriodo.filter(
      (movimiento) =>
        movimiento.tipo ===
        "Reversión por anulación",
    );

  const costoConsumos = sumar(
    movimientosConsumo.map(
      (movimiento) =>
        movimiento.impactoEconomico ??
        0,
    ),
  );

  const costoReversiones = sumar(
    movimientosReversion.map(
      (movimiento) =>
        movimiento.impactoEconomico ??
        0,
    ),
  );

  const movimientosValorables =
    movimientosConsumo.filter(
      (movimiento) =>
        movimiento.impactoEconomico !==
        null,
    ).length;

  const movimientosMerma =
    movimientosPeriodo.filter(
      (movimiento) =>
        movimiento.tipo ===
        "Merma por anulación",
    );

  const alertasStock:
    InsumoAlertaAnalitica[] =
    insumosActivos
      .map((insumo) => ({
        id: insumo.id,
        codigo: insumo.codigo,
        nombre: insumo.nombre,

        stockActual:
          insumo.stockActual,

        stockMinimo:
          insumo.controlarStockBajo
            ? insumo.stockMinimo
            : null,

        unidadBase:
          insumo.unidadBase,

        nivel:
          convertirNivelStock(
            insumo,
          ),
      }))
      .filter(
        (insumo) =>
          insumo.nivel !== "Normal",
      )
      .sort((insumoA, insumoB) => {
        if (
          insumoA.nivel ===
            "Negativo" &&
          insumoB.nivel !==
            "Negativo"
        ) {
          return -1;
        }

        if (
          insumoB.nivel ===
            "Negativo" &&
          insumoA.nivel !==
            "Negativo"
        ) {
          return 1;
        }

        return (
          insumoA.stockActual -
          insumoB.stockActual
        );
      });

  const valorInventarioPositivo =
    sumar(
      insumosActivos.map(
        (insumo) => {
          if (
            !insumo.controlEconomico ||
            insumo
              .costoPromedioUnidadBase ===
              null ||
            insumo.stockActual <= 0
          ) {
            return 0;
          }

          return (
            insumo.stockActual *
            insumo
              .costoPromedioUnidadBase
          );
        },
      ),
    );

  const valorDeficitInventario =
    sumar(
      insumosActivos.map(
        (insumo) => {
          if (
            !insumo.controlEconomico ||
            insumo
              .costoPromedioUnidadBase ===
              null ||
            insumo.stockActual >= 0
          ) {
            return 0;
          }

          return (
            Math.abs(insumo.stockActual) *
            insumo
              .costoPromedioUnidadBase
          );
        },
      ),
    );

  const fechasConteo = new Set(
    datos.conteos
      .filter((conteo) =>
        fechaEnPeriodo(
          conteo.fechaHora,
          limites,
        ),
      )
      .map(
        (conteo) => conteo.id,
      ),
  );

  return {
    insumosActivos:
      insumosActivos.length,

    insumosStockBajo:
      alertasStock.filter(
        (insumo) =>
          insumo.nivel === "Bajo",
      ).length,

    insumosStockNegativo:
      alertasStock.filter(
        (insumo) =>
          insumo.nivel ===
          "Negativo",
      ).length,

    productosActivosSinReceta,

    entradasRegistradas:
      movimientosPeriodo.filter(
        (movimiento) =>
          movimiento.tipo ===
          "Entrada",
      ).length,

    ajustesRegistrados:
      movimientosPeriodo.filter(
        (movimiento) =>
          movimiento.tipo ===
            "Ajuste positivo" ||
          movimiento.tipo ===
            "Ajuste negativo",
      ).length,

    conteosRegistrados:
      fechasConteo.size,

    mermasRegistradas:
      movimientosMerma.length,

    costoConsumoValorado:
      Math.max(
        0,
        redondearMoneda(
          Math.abs(costoConsumos) -
            costoReversiones,
        ),
      ),

    costoMermasValoradas:
      sumar(
        movimientosMerma.map(
          (movimiento) =>
            Math.abs(
              movimiento
                .impactoEconomico ?? 0,
            ),
        ),
      ),

    coberturaValoracionPorcentaje:
      porcentaje(
        movimientosValorables,
        movimientosConsumo.length,
      ),

    valorInventarioPositivo,
    valorDeficitInventario,

    alertasStock,

    movimientosPorTipo:
      TIPOS_MOVIMIENTO_INVENTARIO.map(
        (tipo) => ({
          tipo,
          cantidad:
            movimientosPeriodo.filter(
              (movimiento) =>
                movimiento.tipo === tipo,
            ).length,
        }),
      ),
  };
}

function construirEstadoCaja(
  datos: DatosAnalitica,
  limites: LimitesPeriodo,
  cajaAbierta: SesionCaja | null,
): EstadoCajaAnalitica {
  const movimientosPeriodo =
    datos.movimientosCaja.filter(
      (movimiento) =>
        fechaEnPeriodo(
          movimiento.fechaHoraRegistro,
          limites,
        ),
    );

  const sesionesCerradasPeriodo =
    datos.sesionesCaja.filter(
      (sesion) =>
        sesion.estado === "Cerrada" &&
        fechaEnPeriodo(
          sesion.fechaHoraCierre,
          limites,
        ),
    );

  const ultimaSesionCerrada =
    [...datos.sesionesCaja]
      .filter(
        (sesion) =>
          sesion.estado === "Cerrada" &&
          sesion.fechaHoraCierre !== null,
      )
      .sort(
        (sesionA, sesionB) =>
          new Date(
            sesionB.fechaHoraCierre ??
              sesionB.fechaHoraApertura,
          ).getTime() -
          new Date(
            sesionA.fechaHoraCierre ??
              sesionA.fechaHoraApertura,
          ).getTime(),
      )[0] ?? null;

  const movimientosCajaAbierta =
    cajaAbierta
      ? datos.movimientosCaja.filter(
          (movimiento) =>
            movimiento.sesionCajaId ===
            cajaAbierta.id,
        )
      : [];

  const efectivoEsperado =
    cajaAbierta
      ? redondearMoneda(
          cajaAbierta.montoInicial +
            sumar(
              movimientosCajaAbierta
                .filter(
                  (movimiento) =>
                    movimiento.tipo ===
                    "Venta",
                )
                .map(
                  (movimiento) =>
                    movimiento.montoEfectivo,
                ),
            ) +
            sumar(
              movimientosCajaAbierta
                .filter(
                  (movimiento) =>
                    movimiento.tipo ===
                    "Ingreso",
                )
                .map(
                  (movimiento) =>
                    movimiento.montoEfectivo,
                ),
            ) -
            sumar(
              movimientosCajaAbierta
                .filter(
                  (movimiento) =>
                    movimiento.tipo ===
                    "Egreso",
                )
                .map(
                  (movimiento) =>
                    movimiento.montoEfectivo,
                ),
            ),
        )
      : 0;

  return {
    cajaAbierta:
      cajaAbierta !== null,

    sesionCajaId:
      cajaAbierta?.id ?? null,

    usuarioAperturaNombre:
      cajaAbierta
        ?.usuarioAperturaNombre ??
      null,

    fechaHoraApertura:
      cajaAbierta
        ?.fechaHoraApertura ?? null,

    montoInicial:
      cajaAbierta?.montoInicial ?? 0,

    efectivoEsperado,

    ingresosManualesPeriodo: sumar(
      movimientosPeriodo
        .filter(
          (movimiento) =>
            movimiento.tipo ===
            "Ingreso",
        )
        .map(
          (movimiento) =>
            movimiento.montoEfectivo,
        ),
    ),

    egresosManualesPeriodo: sumar(
      movimientosPeriodo
        .filter(
          (movimiento) =>
            movimiento.tipo ===
            "Egreso",
        )
        .map(
          (movimiento) =>
            movimiento.montoEfectivo,
        ),
    ),

    sesionesCerradasPeriodo:
      sesionesCerradasPeriodo.length,

    sesionesConDiferencia:
      sesionesCerradasPeriodo.filter(
        (sesion) =>
          Math.abs(
            sesion.diferencia ?? 0,
          ) > 0.01,
      ).length,

    diferenciaAcumulada: sumar(
      sesionesCerradasPeriodo.map(
        (sesion) =>
          sesion.diferencia ?? 0,
      ),
    ),

    ultimaDiferencia:
      ultimaSesionCerrada?.diferencia ??
      null,
  };
}

function construirActividadOperativa(
  datos: DatosAnalitica,
  limites: LimitesPeriodo,
): ActividadOperativa[] {
  const actividades:
    ActividadOperativa[] = [];

  const ventaPorId = new Map(
    datos.ventas.map(
      (venta) => [venta.id, venta],
    ),
  );

  for (const consumo of datos.consumos) {
    if (
      !fechaEnPeriodo(
        consumo.fechaHoraRegistro,
        limites,
      )
    ) {
      continue;
    }

    const venta = ventaPorId.get(
      consumo.ventaId,
    );

    actividades.push({
      id: `venta-${consumo.id}`,
      fechaHora:
        consumo.fechaHoraRegistro,
      modulo: "Ventas",
      accion: "Venta registrada",
      descripcion:
        `${consumo.usuarioRegistroNombre} registró ${consumo.numeroPedido}${venta ? ` por Bs ${venta.total.toFixed(2)}` : ""}.`,
      usuarioId:
        consumo.usuarioRegistroId,
      usuarioNombre:
        consumo.usuarioRegistroNombre,
      referencia:
        consumo.numeroPedido,
      monto: venta?.total ?? null,
      nivel:
        consumo.autorizoSaldoNegativo
          ? "Atención"
          : "Normal",
      fuente: "Operación",
    });

    if (
      consumo.fechaHoraTratamiento &&
      consumo.usuarioTratamientoNombre
    ) {
      actividades.push({
        id: `anulacion-inventario-${consumo.id}`,
        fechaHora:
          consumo.fechaHoraTratamiento,
        modulo: "Inventario",
        accion:
          consumo.tratamientoAnulacion ??
          "Tratamiento de anulación",
        descripcion:
          `${consumo.usuarioTratamientoNombre} aplicó “${consumo.tratamientoAnulacion ?? "tratamiento"}” a ${consumo.numeroPedido}.`,
        usuarioId:
          consumo.usuarioTratamientoId,
        usuarioNombre:
          consumo.usuarioTratamientoNombre,
        referencia:
          consumo.numeroPedido,
        monto: null,
        nivel:
          consumo.tratamientoAnulacion ===
          "Registrar como merma"
            ? "Atención"
            : "Normal",
        fuente: "Operación",
      });
    }
  }

  for (const pago of datos.pagos) {
    if (
      !fechaEnPeriodo(
        pago.fechaHoraCobro,
        limites,
      )
    ) {
      continue;
    }

    actividades.push({
      id: `pago-${pago.id}`,
      fechaHora: pago.fechaHoraCobro,
      modulo: "Caja",
      accion: "Venta cobrada",
      descripcion:
        `${pago.usuarioNombre} cobró ${pago.numeroPedido} mediante ${pago.metodoPago}.`,
      usuarioId: pago.usuarioId,
      usuarioNombre:
        pago.usuarioNombre,
      referencia:
        pago.numeroPedido,
      monto: pago.totalCobrado,
      nivel:
        pago.montoDescuento > 0
          ? "Atención"
          : "Normal",
      fuente: "Operación",
    });
  }

  for (
    const movimiento
    of datos.movimientosCaja
  ) {
    if (
      movimiento.tipo === "Venta" ||
      !fechaEnPeriodo(
        movimiento.fechaHoraRegistro,
        limites,
      )
    ) {
      continue;
    }

    actividades.push({
      id: `caja-${movimiento.id}`,
      fechaHora:
        movimiento.fechaHoraRegistro,
      modulo: "Caja",
      accion:
        movimiento.tipo === "Ingreso"
          ? "Ingreso manual"
          : "Egreso manual",
      descripcion:
        `${movimiento.usuarioNombre} registró ${movimiento.concepto}.`,
      usuarioId:
        movimiento.usuarioId,
      usuarioNombre:
        movimiento.usuarioNombre,
      referencia: null,
      monto: movimiento.monto,
      nivel:
        movimiento.tipo === "Egreso"
          ? "Atención"
          : "Normal",
      fuente: "Operación",
    });
  }

  for (const sesion of datos.sesionesCaja) {
    if (
      fechaEnPeriodo(
        sesion.fechaHoraApertura,
        limites,
      )
    ) {
      actividades.push({
        id: `apertura-${sesion.id}`,
        fechaHora:
          sesion.fechaHoraApertura,
        modulo: "Caja",
        accion: "Apertura de caja",
        descripcion:
          `${sesion.usuarioAperturaNombre} abrió la caja con Bs ${sesion.montoInicial.toFixed(2)}.`,
        usuarioId:
          sesion.usuarioAperturaId,
        usuarioNombre:
          sesion.usuarioAperturaNombre,
        referencia:
          `Caja #${sesion.id}`,
        monto: sesion.montoInicial,
        nivel: "Normal",
        fuente: "Operación",
      });
    }

    if (
      sesion.fechaHoraCierre &&
      sesion.usuarioCierreNombre &&
      fechaEnPeriodo(
        sesion.fechaHoraCierre,
        limites,
      )
    ) {
      actividades.push({
        id: `cierre-${sesion.id}`,
        fechaHora:
          sesion.fechaHoraCierre,
        modulo: "Caja",
        accion: "Cierre de caja",
        descripcion:
          `${sesion.usuarioCierreNombre} cerró la caja con una diferencia de Bs ${(sesion.diferencia ?? 0).toFixed(2)}.`,
        usuarioId:
          sesion.usuarioCierreId,
        usuarioNombre:
          sesion.usuarioCierreNombre,
        referencia:
          `Caja #${sesion.id}`,
        monto:
          sesion.diferencia,
        nivel:
          Math.abs(
            sesion.diferencia ?? 0,
          ) > 0.01
            ? "Atención"
            : "Normal",
        fuente: "Operación",
      });
    }
  }

  for (
    const movimiento
    of datos.movimientosInventario
  ) {
    if (
      movimiento.tipo ===
        "Consumo automático" ||
      !fechaEnPeriodo(
        movimiento.fechaHora,
        limites,
      )
    ) {
      continue;
    }

    actividades.push({
      id: `inventario-${movimiento.id}`,
      fechaHora:
        movimiento.fechaHora,
      modulo: "Inventario",
      accion: movimiento.tipo,
      descripcion:
        `${movimiento.usuarioNombre} registró ${movimiento.tipo.toLocaleLowerCase("es")} de ${movimiento.insumoNombre}.`,
      usuarioId:
        movimiento.usuarioId,
      usuarioNombre:
        movimiento.usuarioNombre,
      referencia:
        movimiento.numeroPedido ??
        movimiento.referencia,
      monto:
        movimiento.impactoEconomico,
      nivel:
        movimiento.tipo ===
          "Merma por anulación" ||
        movimiento.stockPosterior < 0
          ? "Atención"
          : "Normal",
      fuente: "Operación",
    });
  }

  for (const receta of datos.recetas) {
    if (
      !fechaEnPeriodo(
        receta.fechaVigenciaDesde,
        limites,
      )
    ) {
      continue;
    }

    actividades.push({
      id: `receta-${receta.id}`,
      fechaHora:
        receta.fechaVigenciaDesde,
      modulo: "Recetas",
      accion:
        receta.version === 1
          ? "Receta creada"
          : "Nueva versión de receta",
      descripcion:
        `${receta.usuarioRegistroNombre} registró la versión ${receta.version} de ${receta.productoNombre}.`,
      usuarioId:
        receta.usuarioRegistroId,
      usuarioNombre:
        receta.usuarioRegistroNombre,
      referencia:
        receta.productoCodigo,
      monto: null,
      nivel: "Normal",
      fuente: "Operación",
    });
  }

  for (const evento of datos.auditoria) {
    if (
      !fechaEnPeriodo(
        evento.fechaHora,
        limites,
      )
    ) {
      continue;
    }

    actividades.push({
      id: `auditoria-${evento.id}`,
      fechaHora: evento.fechaHora,
      modulo: "Auditoría",
      accion: evento.accion,
      descripcion:
        evento.descripcion,
      usuarioId: evento.usuarioId,
      usuarioNombre:
        evento.usuarioNombre,
      referencia:
        evento.entidadId === null
          ? evento.entidad
          : `${evento.entidad} ${evento.entidadId}`,
      monto: null,
      nivel:
        evento.nivel === "Crítico"
          ? "Crítico"
          : evento.nivel ===
              "Advertencia"
            ? "Atención"
            : "Normal",
      fuente: "Auditoría",
    });
  }

  return actividades
    .sort(
      (actividadA, actividadB) =>
        new Date(
          actividadB.fechaHora,
        ).getTime() -
        new Date(
          actividadA.fechaHora,
        ).getTime(),
    )
    .slice(0, 40);
}

function construirAlertas(
  datos: DatosAnalitica,
  comerciales: IndicadoresComerciales,
  inventario: ResumenInventarioAnalitica,
  caja: EstadoCajaAnalitica,
  limites: LimitesPeriodo,
): AlertaAdministrativa[] {
  const alertas:
    AlertaAdministrativa[] = [];

  if (
    caja.cajaAbierta &&
    caja.fechaHoraApertura
  ) {
    const horasAbierta =
      (Date.now() -
        new Date(
          caja.fechaHoraApertura,
        ).getTime()) /
      3600000;

    if (horasAbierta >= 16) {
      alertas.push({
        id: "caja-abierta-prolongada",
        tipo: "Caja",
        prioridad: "Crítica",
        titulo:
          "Caja abierta por tiempo prolongado",
        descripcion:
          `La caja continúa abierta desde hace ${Math.floor(horasAbierta)} horas.`,
        cantidad: 1,
        monto:
          caja.efectivoEsperado,
        ruta: "/caja",
      });
    }
  }

  if (comerciales.pedidosPendientes > 0) {
    alertas.push({
      id: "ventas-pendientes",
      tipo: "Cobros",
      prioridad: "Alta",
      titulo:
        "Ventas pendientes de cobro",
      descripcion:
        "Existen pedidos del periodo que todavía no fueron cobrados.",
      cantidad:
        comerciales.pedidosPendientes,
      monto:
        comerciales.ventasPendientes,
      ruta: "/ventas",
    });
  }

  if (
    inventario.insumosStockNegativo > 0
  ) {
    alertas.push({
      id: "stock-negativo",
      tipo: "Inventario",
      prioridad: "Crítica",
      titulo:
        "Insumos con stock negativo",
      descripcion:
        "Existen consumos que superan las existencias teóricas registradas.",
      cantidad:
        inventario
          .insumosStockNegativo,
      monto:
        inventario
          .valorDeficitInventario,
      ruta: "/inventario",
    });
  }

  if (inventario.insumosStockBajo > 0) {
    alertas.push({
      id: "stock-bajo",
      tipo: "Inventario",
      prioridad: "Alta",
      titulo:
        "Insumos próximos a agotarse",
      descripcion:
        "El stock llegó al límite configurado por el administrador.",
      cantidad:
        inventario.insumosStockBajo,
      monto: null,
      ruta: "/inventario",
    });
  }

  if (
    inventario
      .productosActivosSinReceta > 0
  ) {
    alertas.push({
      id: "productos-sin-receta",
      tipo: "Recetas",
      prioridad: "Media",
      titulo:
        "Productos activos sin receta",
      descripcion:
        "Estos productos pueden venderse, pero no descuentan inventario.",
      cantidad:
        inventario
          .productosActivosSinReceta,
      monto: null,
      ruta: "/inventario",
    });
  }

  if (caja.sesionesConDiferencia > 0) {
    alertas.push({
      id: "cierres-con-diferencia",
      tipo: "Arqueos",
      prioridad: "Alta",
      titulo:
        "Cierres de caja con diferencia",
      descripcion:
        "Uno o más arqueos del periodo presentan faltante o sobrante.",
      cantidad:
        caja.sesionesConDiferencia,
      monto:
        caja.diferenciaAcumulada,
      ruta: "/reportes",
    });
  }

  const pagosConDescuentoElevado =
    datos.pagos.filter((pago) => {
      if (
        !fechaEnPeriodo(
          pago.fechaHoraCobro,
          limites,
        ) ||
        pago.montoDescuento <= 0
      ) {
        return false;
      }

      const proporcion =
        pago.subtotal > 0
          ? pago.montoDescuento /
            pago.subtotal
          : 0;

      return (
        proporcion >= 0.2 ||
        pago.montoDescuento >= 50
      );
    });

  if (
    pagosConDescuentoElevado.length > 0
  ) {
    alertas.push({
      id: "descuentos-elevados",
      tipo: "Descuentos",
      prioridad: "Media",
      titulo:
        "Descuentos elevados detectados",
      descripcion:
        "Revisa los cobros con descuentos iguales o superiores al 20 % o Bs 50.",
      cantidad:
        pagosConDescuentoElevado.length,
      monto: sumar(
        pagosConDescuentoElevado.map(
          (pago) =>
            pago.montoDescuento,
        ),
      ),
      ruta: "/reportes",
    });
  }

  const prioridadOrden = {
    Crítica: 0,
    Alta: 1,
    Media: 2,
    Baja: 3,
  } as const;

  return alertas.sort(
    (alertaA, alertaB) =>
      prioridadOrden[
        alertaA.prioridad
      ] -
      prioridadOrden[
        alertaB.prioridad
      ],
  );
}

async function cargarDatosAnalitica():
  Promise<DatosAnalitica> {
  const [
    ventas,
    pagos,
    sesionesCaja,
    movimientosCaja,
    insumos,
    movimientosInventario,
    consumos,
    conteos,
    recetas,
    productos,
    auditoria,
  ] = await Promise.all([
    listarVentas(),
    listarPagosVenta(),
    listarSesionesCaja(),
    listarMovimientosCaja(),
    listarInsumosInventario(),
    listarMovimientosInventario(),
    listarConsumosVentaInventario(),
    listarConteosFisicosInventario(),
    listarRecetasInventario(),
    listarProductos(),
    listarAuditoria(),
  ]);

  return {
    ventas,
    pagos,
    sesionesCaja,
    movimientosCaja,
    insumos,
    movimientosInventario,
    consumos,
    conteos,
    recetas,
    productos,
    auditoria,
  };
}

export function crearPeriodoRapidoAnalitica(
  periodo: PeriodoRapidoAnalitica,
  fechaReferencia = new Date(),
): FiltroPeriodoAnalitica {
  const referencia = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate(),
  );

  if (periodo === "Hoy") {
    const fecha =
      formatearFechaInput(referencia);

    return {
      fechaDesde: fecha,
      fechaHasta: fecha,
    };
  }

  if (periodo === "Últimos 7 días") {
    return {
      fechaDesde:
        formatearFechaInput(
          sumarDias(referencia, -6),
        ),
      fechaHasta:
        formatearFechaInput(
          referencia,
        ),
    };
  }

  if (periodo === "Mes anterior") {
    const primerDiaMesActual =
      new Date(
        referencia.getFullYear(),
        referencia.getMonth(),
        1,
      );

    const ultimoDiaMesAnterior =
      sumarDias(
        primerDiaMesActual,
        -1,
      );

    const primerDiaMesAnterior =
      new Date(
        ultimoDiaMesAnterior
          .getFullYear(),
        ultimoDiaMesAnterior
          .getMonth(),
        1,
      );

    return {
      fechaDesde:
        formatearFechaInput(
          primerDiaMesAnterior,
        ),
      fechaHasta:
        formatearFechaInput(
          ultimoDiaMesAnterior,
        ),
    };
  }

  const primerDiaMes = new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    1,
  );

  return {
    fechaDesde:
      formatearFechaInput(
        primerDiaMes,
      ),
    fechaHasta:
      formatearFechaInput(
        referencia,
      ),
  };
}

export async function obtenerPanelAdministrativo(
  filtro: FiltroPeriodoAnalitica,
): Promise<PanelAdministrativo> {
  const periodo =
    normalizarPeriodo(filtro);

  const periodoAnterior =
    crearPeriodoAnterior(periodo);

  const limites =
    obtenerLimitesPeriodo(periodo);

  const limitesAnteriores =
    obtenerLimitesPeriodo(
      periodoAnterior,
    );

  const [datos, cajaAbierta] =
    await Promise.all([
      cargarDatosAnalitica(),
      obtenerCajaAbierta(),
    ]);

  const comerciales =
    construirIndicadoresComerciales(
      datos.ventas,
      datos.pagos,
      limites,
      limitesAnteriores,
    );

  const inventario =
    construirResumenInventario(
      datos,
      limites,
    );

  const caja = construirEstadoCaja(
    datos,
    limites,
    cajaAbierta,
  );

  return {
    periodo,
    periodoAnterior,

    generadoEn:
      new Date().toISOString(),

    comerciales,
    caja,
    inventario,

    metodosPago:
      construirMetodosPago(
        datos.pagos,
        limites,
      ),

    ventasPorDia:
      construirVentasPorDia(
        datos.ventas,
        datos.pagos,
        periodo,
        limites,
      ),

    ventasPorHora:
      construirVentasPorHora(
        datos.ventas,
        datos.pagos,
        limites,
      ),

    productosMasVendidos:
      construirProductosMasVendidos(
        datos.ventas,
        datos.pagos,
        limites,
      ),

    actividadPorUsuario:
      construirActividadPorUsuario(
        datos,
        limites,
      ),

    alertas: construirAlertas(
      datos,
      comerciales,
      inventario,
      caja,
      limites,
    ),

    actividadReciente:
      construirActividadOperativa(
        datos,
        limites,
      ),
  };
}
