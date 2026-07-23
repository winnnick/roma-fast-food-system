import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  crearPeriodoRapidoAnalitica,
} from "../../servicios/analiticaServicio";

import {
  descargarCsv,
  imprimirReporte,
} from "../../servicios/exportacionServicio";

import {
  filtrarArqueosPorTexto,
  obtenerDatosReportesAdministrativos,
  type DatosReportesAdministrativos,
} from "../../servicios/reporteServicio";

import DashboardSkeleton from "../../shared/feedback/DashboardSkeleton";

import type {
  FiltroPeriodoAnalitica,
  PeriodoRapidoAnalitica,
} from "../../tipos/analitica";

import type {
  ModuloAuditoria,
  NivelAuditoria,
  RegistroAuditoria,
} from "../../tipos/auditoria";

import type {
  MetodoPago,
} from "../../tipos/caja";

import type {
  TipoMovimientoInventario,
} from "../../tipos/inventario";

import type {
  ColumnaExportacion,
  FilaReporteInventario,
  FilaReporteUsuario,
  FilaReporteVenta,
  TipoReporteAdministrativo,
} from "../../tipos/reportes";

import type {
  EstadoCobro,
  EstadoPreparacion,
} from "../../tipos/venta";

import type {
  ArqueoAdministrativo,
} from "../../servicios/conciliacionServicio";

import FiltrosReportes from "./FiltrosReportes";
import PanelArqueos from "./PanelArqueos";
import PanelBitacora from "./PanelBitacora";
import PanelInventarioReportes from "./PanelInventarioReportes";
import PanelResumenReportes from "./PanelResumenReportes";
import PanelUsuariosReportes from "./PanelUsuariosReportes";
import PanelVentasReportes from "./PanelVentasReportes";

type PestanaReporte = Exclude<
  TipoReporteAdministrativo,
  "Caja"
>;

interface FilaResumenExportacion {
  indicador: string;
  valor: string | number;
  descripcion: string;
}

const PESTANAS: Array<{
  id: PestanaReporte;
  icono: typeof BarChart3;
  descripcion: string;
}> = [
  {
    id: "Resumen",
    icono: BarChart3,
    descripcion:
      "Visión general del negocio",
  },
  {
    id: "Ventas",
    icono: ReceiptText,
    descripcion:
      "Pedidos, cobros y descuentos",
  },
  {
    id: "Arqueos",
    icono: WalletCards,
    descripcion:
      "Conciliación de caja",
  },
  {
    id: "Inventario",
    icono: Boxes,
    descripcion:
      "Movimientos y valoración",
  },
  {
    id: "Actividad por usuario",
    icono: UsersRound,
    descripcion:
      "Operaciones por responsable",
  },
  {
    id: "Bitácora",
    icono: ShieldCheck,
    descripcion:
      "Auditoría de acciones",
  },
];

function obtenerMensajeError(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "No fue posible generar los reportes.";
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function fechaHora(
  valor: string | null,
): string {
  if (!valor) return "";

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(valor));
}

function descripcionPeriodo(
  filtro: FiltroPeriodoAnalitica,
): string {
  return `Periodo del ${filtro.fechaDesde} al ${filtro.fechaHasta}.`;
}

function Reportes() {
  const periodoInicial = useMemo(
    () =>
      crearPeriodoRapidoAnalitica(
        "Este mes",
      ),
    [],
  );

  const [pestana, setPestana] =
    useState<PestanaReporte>(
      "Resumen",
    );

  const [periodoRapido, setPeriodoRapido] =
    useState<PeriodoRapidoAnalitica>(
      "Este mes",
    );

  const [filtroBorrador, setFiltroBorrador] =
    useState<FiltroPeriodoAnalitica>(
      periodoInicial,
    );

  const [filtroAplicado, setFiltroAplicado] =
    useState<FiltroPeriodoAnalitica>(
      periodoInicial,
    );

  const [texto, setTexto] = useState("");

  const [datos, setDatos] =
    useState<DatosReportesAdministrativos | null>(
      null,
    );

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [filtroCobro, setFiltroCobro] =
    useState<"Todos" | EstadoCobro>(
      "Todos",
    );

  const [
    filtroPreparacion,
    setFiltroPreparacion,
  ] = useState<
    "Todos" | EstadoPreparacion
  >("Todos");

  const [filtroMetodo, setFiltroMetodo] =
    useState<"Todos" | MetodoPago>(
      "Todos",
    );

  const [
    filtroTipoInventario,
    setFiltroTipoInventario,
  ] = useState<
    "Todos" | TipoMovimientoInventario
  >("Todos");

  const [
    filtroModuloAuditoria,
    setFiltroModuloAuditoria,
  ] = useState<
    "Todos" | ModuloAuditoria
  >("Todos");

  const [
    filtroNivelAuditoria,
    setFiltroNivelAuditoria,
  ] = useState<
    "Todos" | NivelAuditoria
  >("Todos");

  const cargar = useCallback(
    async (
      filtro: FiltroPeriodoAnalitica,
      cargaCompleta = false,
    ) => {
      try {
        if (cargaCompleta) {
          setCargando(true);
        }

        setError(null);

        const respuesta =
          await obtenerDatosReportesAdministrativos(
            filtro,
          );

        setDatos(respuesta);
        setFiltroAplicado(
          respuesta.periodo,
        );
      } catch (errorCarga: unknown) {
        setError(
          obtenerMensajeError(errorCarga),
        );
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    let activo = true;

    const temporizador = window.setTimeout(
      () => {
        obtenerDatosReportesAdministrativos(
          periodoInicial,
        )
          .then((respuesta) => {
            if (!activo) return;

            setDatos(respuesta);
            setFiltroAplicado(
              respuesta.periodo,
            );
            setError(null);
          })
          .catch((errorCarga: unknown) => {
            if (!activo) return;

            setError(
              obtenerMensajeError(
                errorCarga,
              ),
            );
          })
          .finally(() => {
            if (activo) {
              setCargando(false);
            }
          });
      },
      0,
    );

    return () => {
      activo = false;
      window.clearTimeout(temporizador);
    };
  }, [periodoInicial]);

  function seleccionarPeriodo(
    periodo: PeriodoRapidoAnalitica,
  ) {
    const nuevo =
      crearPeriodoRapidoAnalitica(
        periodo,
      );

    setPeriodoRapido(periodo);
    setFiltroBorrador(nuevo);
    void cargar(nuevo);
  }

  function cambiarFiltro(
    filtro: FiltroPeriodoAnalitica,
  ) {
    setPeriodoRapido("Personalizado");
    setFiltroBorrador(filtro);
  }

  const busquedaNormalizada = texto
    .trim()
    .toLocaleLowerCase("es");

  const ventasFiltradas = useMemo(() => {
    if (!datos) return [];

    return datos.ventas.filter((venta) => {
      const coincideTexto =
        !busquedaNormalizada ||
        [
          venta.numeroPedido,
          venta.cliente,
          venta.productos,
          venta.metodoPago ?? "",
          venta.estadoCobro,
          venta.estadoPreparacion,
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(busquedaNormalizada);

      const coincideCobro =
        filtroCobro === "Todos" ||
        venta.estadoCobro === filtroCobro;

      const coincidePreparacion =
        filtroPreparacion === "Todos" ||
        venta.estadoPreparacion ===
          filtroPreparacion;

      const coincideMetodo =
        filtroMetodo === "Todos" ||
        venta.metodoPago === filtroMetodo;

      return (
        coincideTexto &&
        coincideCobro &&
        coincidePreparacion &&
        coincideMetodo
      );
    });
  }, [
    datos,
    busquedaNormalizada,
    filtroCobro,
    filtroPreparacion,
    filtroMetodo,
  ]);

  const arqueosFiltrados = useMemo(() => {
    if (!datos) return [];

    return filtrarArqueosPorTexto(
      datos.conciliacion.arqueos,
      texto,
    );
  }, [datos, texto]);

  const inventarioFiltrado = useMemo(() => {
    if (!datos) return [];

    return datos.inventario.filter(
      (movimiento) => {
        const coincideTipo =
          filtroTipoInventario ===
            "Todos" ||
          movimiento.tipoMovimiento ===
            filtroTipoInventario;

        const coincideTexto =
          !busquedaNormalizada ||
          [
            movimiento.insumo,
            movimiento.tipoMovimiento,
            movimiento.usuario,
            movimiento.referencia ?? "",
            movimiento.motivo,
          ]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(busquedaNormalizada);

        return coincideTipo && coincideTexto;
      },
    );
  }, [
    datos,
    filtroTipoInventario,
    busquedaNormalizada,
  ]);

  const usuariosFiltrados = useMemo(() => {
    if (!datos) return [];

    return datos.usuarios.filter(
      (usuario) =>
        !busquedaNormalizada ||
        usuario.usuario
          .toLocaleLowerCase("es")
          .includes(busquedaNormalizada),
    );
  }, [datos, busquedaNormalizada]);

  const auditoriaFiltrada = useMemo(() => {
    if (!datos) return [];

    return datos.auditoria.filter(
      (registro) => {
        const coincideModulo =
          filtroModuloAuditoria ===
            "Todos" ||
          registro.modulo ===
            filtroModuloAuditoria;

        const coincideNivel =
          filtroNivelAuditoria ===
            "Todos" ||
          registro.nivel ===
            filtroNivelAuditoria;

        const coincideTexto =
          !busquedaNormalizada ||
          [
            registro.usuarioNombre,
            registro.modulo,
            registro.accion,
            registro.entidad,
            registro.entidadId ?? "",
            registro.descripcion,
          ]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(busquedaNormalizada);

        return (
          coincideModulo &&
          coincideNivel &&
          coincideTexto
        );
      },
    );
  }, [
    datos,
    filtroModuloAuditoria,
    filtroNivelAuditoria,
    busquedaNormalizada,
  ]);

  const filasResumen = useMemo<
    FilaResumenExportacion[]
  >(() => {
    if (!datos) return [];

    return [
      {
        indicador: "Ventas netas",
        valor: moneda(
          datos.panel.comerciales
            .ventasNetas,
        ),
        descripcion:
          "Importe cobrado en el periodo",
      },
      {
        indicador: "Pedidos registrados",
        valor:
          datos.panel.comerciales
            .pedidosRegistrados,
        descripcion:
          "Pedidos creados en el periodo",
      },
      {
        indicador: "Ticket promedio",
        valor: moneda(
          datos.panel.comerciales
            .ticketPromedio,
        ),
        descripcion:
          "Promedio por venta cobrada",
      },
      {
        indicador: "Pendiente de cobro",
        valor: moneda(
          datos.panel.comerciales
            .ventasPendientes,
        ),
        descripcion:
          "Ventas aún no cobradas",
      },
      {
        indicador: "Diferencia de caja",
        valor: moneda(
          datos.conciliacion
            .diferenciaAcumulada,
        ),
        descripcion:
          "Diferencias acumuladas del periodo",
      },
      {
        indicador: "Stock bajo",
        valor:
          datos.panel.inventario
            .insumosStockBajo,
        descripcion:
          "Insumos en nivel de alerta",
      },
      {
        indicador: "Stock negativo",
        valor:
          datos.panel.inventario
            .insumosStockNegativo,
        descripcion:
          "Insumos pendientes de regularizar",
      },
      {
        indicador: "Cobertura de valoración",
        valor: `${datos.panel.inventario.coberturaValoracionPorcentaje}%`,
        descripcion:
          "Porcentaje de insumos valorados",
      },
    ];
  }, [datos]);

  const registrosActivos:
    | FilaResumenExportacion[]
    | FilaReporteVenta[]
    | ArqueoAdministrativo[]
    | FilaReporteInventario[]
    | FilaReporteUsuario[]
    | RegistroAuditoria[] =
    pestana === "Resumen"
      ? filasResumen
      : pestana === "Ventas"
        ? ventasFiltradas
        : pestana === "Arqueos"
          ? arqueosFiltrados
          : pestana === "Inventario"
            ? inventarioFiltrado
            : pestana ===
                "Actividad por usuario"
              ? usuariosFiltrados
              : auditoriaFiltrada;

  function exportarActual() {
    const nombre = `roma-${pestana}-${filtroAplicado.fechaDesde}-${filtroAplicado.fechaHasta}`;

    if (pestana === "Resumen") {
      descargarCsv(
        nombre,
        filasResumen,
        columnasResumen,
      );
      return;
    }

    if (pestana === "Ventas") {
      descargarCsv(
        nombre,
        ventasFiltradas,
        columnasVentas,
      );
      return;
    }

    if (pestana === "Arqueos") {
      descargarCsv(
        nombre,
        arqueosFiltrados,
        columnasArqueos,
      );
      return;
    }

    if (pestana === "Inventario") {
      descargarCsv(
        nombre,
        inventarioFiltrado,
        columnasInventario,
      );
      return;
    }

    if (
      pestana === "Actividad por usuario"
    ) {
      descargarCsv(
        nombre,
        usuariosFiltrados,
        columnasUsuarios,
      );
      return;
    }

    descargarCsv(
      nombre,
      auditoriaFiltrada,
      columnasAuditoria,
    );
  }

  function imprimirActual() {
    const titulo = `Roma Fast Food — ${pestana}`;
    const descripcion = descripcionPeriodo(
      filtroAplicado,
    );

    if (pestana === "Resumen") {
      imprimirReporte(
        titulo,
        descripcion,
        filasResumen,
        columnasResumen,
      );
      return;
    }

    if (pestana === "Ventas") {
      imprimirReporte(
        titulo,
        descripcion,
        ventasFiltradas,
        columnasVentas,
      );
      return;
    }

    if (pestana === "Arqueos") {
      imprimirReporte(
        titulo,
        descripcion,
        arqueosFiltrados,
        columnasArqueos,
      );
      return;
    }

    if (pestana === "Inventario") {
      imprimirReporte(
        titulo,
        descripcion,
        inventarioFiltrado,
        columnasInventario,
      );
      return;
    }

    if (
      pestana === "Actividad por usuario"
    ) {
      imprimirReporte(
        titulo,
        descripcion,
        usuariosFiltrados,
        columnasUsuarios,
      );
      return;
    }

    imprimirReporte(
      titulo,
      descripcion,
      auditoriaFiltrada,
      columnasAuditoria,
    );
  }

  if (cargando && !datos) {
    return <DashboardSkeleton />;
  }

  if (error && !datos) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel">
        <AlertTriangle size={38} className="text-red-700" />
        <h2 className="mt-4 text-xl font-black text-slate-900">No se pudieron generar los reportes</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">{error}</p>
        <button type="button" onClick={()=>void cargar(filtroAplicado,true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-roma-700 px-5 py-3 text-sm font-bold text-white hover:bg-roma-800"><RefreshCw size={18}/>Volver a intentar</button>
      </section>
    );
  }

  if (!datos) return null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-roma-950 p-6 text-white shadow-panel sm:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-roma-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-roma-200"><ClipboardList size={15}/>Centro administrativo</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Reportes, arqueos y auditoría</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">Analiza ventas, caja, inventario y actividad de usuarios con filtros, conciliación y exportaciones verificables.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-slate-200"><p className="font-black text-white">Última generación</p><p className="mt-1">{fechaHora(datos.generadoEn)}</p><p className="mt-2 text-xs text-slate-400">Los resultados se calculan con los datos actuales de los módulos.</p></div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-panel">
        <div className="flex min-w-max gap-2">
          {PESTANAS.map(({id,icono:Icono,descripcion})=><button key={id} type="button" onClick={()=>{setPestana(id);setTexto("");}} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${pestana===id ? "bg-roma-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icono size={18}/><span><span className="block text-sm font-black">{id}</span><span className={`mt-0.5 block text-[11px] ${pestana===id ? "text-roma-100" : "text-slate-400"}`}>{descripcion}</span></span></button>)}
        </div>
      </section>

      <FiltrosReportes periodoRapido={periodoRapido} filtro={filtroBorrador} texto={texto} cargando={cargando} cantidadRegistros={registrosActivos.length} etiquetaExportacion={pestana} alSeleccionarPeriodo={seleccionarPeriodo} alCambiarFiltro={cambiarFiltro} alCambiarTexto={setTexto} alAplicar={()=>void cargar(filtroBorrador)} alActualizar={()=>void cargar(filtroAplicado)} alExportar={exportarActual} alImprimir={imprimirActual}/>

      {error && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700"/><div><p className="text-sm font-black text-amber-900">No se pudo actualizar la información</p><p className="mt-1 text-sm text-amber-700">{error}. Se mantienen los últimos datos cargados.</p></div></div>}

      {pestana === "Resumen" && <PanelResumenReportes panel={datos.panel} conciliacion={datos.conciliacion}/>} 
      {pestana === "Ventas" && <PanelVentasReportes ventas={ventasFiltradas} filtroCobro={filtroCobro} filtroPreparacion={filtroPreparacion} filtroMetodo={filtroMetodo} alCambiarCobro={setFiltroCobro} alCambiarPreparacion={setFiltroPreparacion} alCambiarMetodo={setFiltroMetodo}/>} 
      {pestana === "Arqueos" && <PanelArqueos conciliacion={datos.conciliacion} arqueos={arqueosFiltrados}/>} 
      {pestana === "Inventario" && <PanelInventarioReportes movimientos={inventarioFiltrado} filtroTipo={filtroTipoInventario} alCambiarTipo={setFiltroTipoInventario}/>} 
      {pestana === "Actividad por usuario" && <PanelUsuariosReportes usuarios={usuariosFiltrados}/>} 
      {pestana === "Bitácora" && <PanelBitacora registros={auditoriaFiltrada} filtroModulo={filtroModuloAuditoria} filtroNivel={filtroNivelAuditoria} alCambiarModulo={setFiltroModuloAuditoria} alCambiarNivel={setFiltroNivelAuditoria}/>} 
    </div>
  );
}

const columnasResumen: ColumnaExportacion<FilaResumenExportacion>[] = [
  { encabezado: "Indicador", obtenerValor: (fila) => fila.indicador },
  { encabezado: "Valor", obtenerValor: (fila) => fila.valor },
  { encabezado: "Descripción", obtenerValor: (fila) => fila.descripcion },
];

const columnasVentas: ColumnaExportacion<FilaReporteVenta>[] = [
  { encabezado: "Pedido", obtenerValor: (fila) => fila.numeroPedido },
  { encabezado: "Fecha registro", obtenerValor: (fila) => fechaHora(fila.fechaHoraRegistro) },
  { encabezado: "Fecha cobro", obtenerValor: (fila) => fechaHora(fila.fechaHoraCobro) },
  { encabezado: "Cliente", obtenerValor: (fila) => fila.cliente },
  { encabezado: "Productos", obtenerValor: (fila) => fila.productos },
  { encabezado: "Subtotal", obtenerValor: (fila) => fila.subtotal },
  { encabezado: "Descuento", obtenerValor: (fila) => fila.descuento },
  { encabezado: "Total", obtenerValor: (fila) => fila.total },
  { encabezado: "Método", obtenerValor: (fila) => fila.metodoPago ?? "" },
  { encabezado: "Cobro", obtenerValor: (fila) => fila.estadoCobro },
  { encabezado: "Preparación", obtenerValor: (fila) => fila.estadoPreparacion },
];

const columnasArqueos: ColumnaExportacion<ArqueoAdministrativo>[] = [
  { encabezado: "Sesión", obtenerValor: (fila) => fila.sesionCajaId },
  { encabezado: "Apertura", obtenerValor: (fila) => fechaHora(fila.fechaHoraApertura) },
  { encabezado: "Cierre", obtenerValor: (fila) => fechaHora(fila.fechaHoraCierre) },
  { encabezado: "Usuario apertura", obtenerValor: (fila) => fila.usuarioAperturaNombre },
  { encabezado: "Usuario cierre", obtenerValor: (fila) => fila.usuarioCierreNombre ?? "" },
  { encabezado: "Monto inicial", obtenerValor: (fila) => fila.montoInicial },
  { encabezado: "Total pagos", obtenerValor: (fila) => fila.totalPagos },
  { encabezado: "Efectivo", obtenerValor: (fila) => fila.totalPagosEfectivo },
  { encabezado: "QR", obtenerValor: (fila) => fila.totalPagosQr },
  { encabezado: "Ingresos", obtenerValor: (fila) => fila.ingresosManuales },
  { encabezado: "Egresos", obtenerValor: (fila) => fila.egresosManuales },
  { encabezado: "Esperado", obtenerValor: (fila) => fila.efectivoEsperadoCalculado },
  { encabezado: "Contado", obtenerValor: (fila) => fila.montoContado ?? "" },
  { encabezado: "Diferencia", obtenerValor: (fila) => fila.diferenciaRegistrada ?? "" },
  { encabezado: "Conciliación", obtenerValor: (fila) => fila.estadoConciliacion },
  { encabezado: "Alertas", obtenerValor: (fila) => fila.alertas.join(" | ") },
];

const columnasInventario: ColumnaExportacion<FilaReporteInventario>[] = [
  { encabezado: "Fecha", obtenerValor: (fila) => fechaHora(fila.fechaHora) },
  { encabezado: "Insumo", obtenerValor: (fila) => fila.insumo },
  { encabezado: "Tipo", obtenerValor: (fila) => fila.tipoMovimiento },
  { encabezado: "Cantidad", obtenerValor: (fila) => fila.cantidad },
  { encabezado: "Unidad", obtenerValor: (fila) => fila.unidad },
  { encabezado: "Stock anterior", obtenerValor: (fila) => fila.stockAnterior },
  { encabezado: "Stock posterior", obtenerValor: (fila) => fila.stockPosterior },
  { encabezado: "Usuario", obtenerValor: (fila) => fila.usuario },
  { encabezado: "Referencia", obtenerValor: (fila) => fila.referencia ?? "" },
  { encabezado: "Motivo", obtenerValor: (fila) => fila.motivo },
  { encabezado: "Impacto económico", obtenerValor: (fila) => fila.impactoEconomico ?? "Sin valoración" },
];

const columnasUsuarios: ColumnaExportacion<FilaReporteUsuario>[] = [
  { encabezado: "Usuario", obtenerValor: (fila) => fila.usuario },
  { encabezado: "Ventas", obtenerValor: (fila) => fila.ventasRegistradas },
  { encabezado: "Monto ventas", obtenerValor: (fila) => fila.montoVentasRegistradas },
  { encabezado: "Cobros", obtenerValor: (fila) => fila.cobrosRealizados },
  { encabezado: "Monto cobrado", obtenerValor: (fila) => fila.montoCobrado },
  { encabezado: "Inventario", obtenerValor: (fila) => fila.movimientosInventario },
  { encabezado: "Movimientos caja", obtenerValor: (fila) => fila.movimientosCaja },
  { encabezado: "Aperturas", obtenerValor: (fila) => fila.aperturasCaja },
  { encabezado: "Cierres", obtenerValor: (fila) => fila.cierresCaja },
  { encabezado: "Total acciones", obtenerValor: (fila) => fila.totalAcciones },
];

const columnasAuditoria: ColumnaExportacion<RegistroAuditoria>[] = [
  { encabezado: "Fecha", obtenerValor: (fila) => fechaHora(fila.fechaHora) },
  { encabezado: "Usuario", obtenerValor: (fila) => fila.usuarioNombre },
  { encabezado: "Rol", obtenerValor: (fila) => fila.usuarioRol ?? "Sistema" },
  { encabezado: "Módulo", obtenerValor: (fila) => fila.modulo },
  { encabezado: "Acción", obtenerValor: (fila) => fila.accion },
  { encabezado: "Entidad", obtenerValor: (fila) => fila.entidad },
  { encabezado: "ID", obtenerValor: (fila) => fila.entidadId ?? "" },
  { encabezado: "Descripción", obtenerValor: (fila) => fila.descripcion },
  { encabezado: "Nivel", obtenerValor: (fila) => fila.nivel },
  { encabezado: "Origen", obtenerValor: (fila) => fila.origen },
];

export default Reportes;
