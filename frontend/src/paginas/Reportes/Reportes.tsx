import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
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
  useAuth,
} from "../../contextos/AuthContext";

import {
  crearPeriodoRapidoAnalitica,
} from "../../servicios/analiticaServicio";

import {
  descargarPdfReporte,
  imprimirReporte,
} from "../../servicios/exportacionServicio";

import {
  filtrarArqueosPorTexto,
  obtenerDatosReportesAdministrativos,
  type DatosReportesAdministrativos,
} from "../../servicios/reporteServicio";

import {
  registrarLiquidacionPedidosYa,
} from "../../servicios/ventaServicio";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import DashboardSkeleton from "../../shared/feedback/DashboardSkeleton";
import Modal from "../../shared/ui/Modal";

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
  PermisoSistema,
} from "../../tipos/rol";

import type {
  EstadoCobro,
  EstadoPreparacion,
  LiquidacionPedidosYa,
  ResumenPedidosYaPeriodo,
  Venta,
} from "../../tipos/venta";

import type {
  ArqueoAdministrativo,
  EstadoConciliacionCaja,
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


const CLAVE_PREFERENCIAS_REPORTES =
  "roma-reportes-preferencias-v1";

type FiltroCobroReporte =
  | "Todos"
  | EstadoCobro;
type FiltroPreparacionReporte =
  | "Todos"
  | EstadoPreparacion;
type FiltroMetodoReporte =
  | "Todos"
  | MetodoPago;
type FiltroEstadoArqueoReporte =
  | "Todos"
  | EstadoConciliacionCaja;
type FiltroInventarioReporte =
  | "Todos"
  | TipoMovimientoInventario;
type FiltroModuloAuditoriaReporte =
  | "Todos"
  | ModuloAuditoria;
type FiltroNivelAuditoriaReporte =
  | "Todos"
  | NivelAuditoria;

interface PreferenciasReportes {
  pestana: PestanaReporte;
  periodoRapido: PeriodoRapidoAnalitica;
  filtroBorrador: FiltroPeriodoAnalitica;
  filtroAplicado: FiltroPeriodoAnalitica;
  texto: string;
  filtroCobro: FiltroCobroReporte;
  filtroPreparacion: FiltroPreparacionReporte;
  filtroMetodo: FiltroMetodoReporte;
  filtroEstadoArqueo: FiltroEstadoArqueoReporte;
  filtroTipoInventario: FiltroInventarioReporte;
  filtroModuloAuditoria: FiltroModuloAuditoriaReporte;
  filtroNivelAuditoria: FiltroNivelAuditoriaReporte;
}

function esPeriodoValido(
  valor: unknown,
): valor is FiltroPeriodoAnalitica {
  if (!valor || typeof valor !== "object") {
    return false;
  }

  const periodo = valor as Record<
    string,
    unknown
  >;

  const patronFecha = /^\d{4}-\d{2}-\d{2}$/;

  return (
    typeof periodo.fechaDesde === "string" &&
    typeof periodo.fechaHasta === "string" &&
    patronFecha.test(periodo.fechaDesde) &&
    patronFecha.test(periodo.fechaHasta)
  );
}

function crearPreferenciasReportesIniciales(): PreferenciasReportes {
  const periodo =
    crearPeriodoRapidoAnalitica(
      "Este mes",
    );

  const base: PreferenciasReportes = {
    pestana: "Resumen",
    periodoRapido: "Este mes",
    filtroBorrador: periodo,
    filtroAplicado: periodo,
    texto: "",
    filtroCobro: "Todos",
    filtroPreparacion: "Todos",
    filtroMetodo: "Todos",
    filtroEstadoArqueo: "Todos",
    filtroTipoInventario: "Todos",
    filtroModuloAuditoria: "Todos",
    filtroNivelAuditoria: "Todos",
  };

  if (typeof window === "undefined") {
    return base;
  }

  try {
    const guardado = window.localStorage.getItem(
      CLAVE_PREFERENCIAS_REPORTES,
    );

    if (!guardado) {
      return base;
    }

    const datos = JSON.parse(guardado) as Partial<
      PreferenciasReportes
    >;

    return {
      ...base,
      ...datos,
      pestana: PESTANAS.some(
        (item) => item.id === datos.pestana,
      )
        ? (datos.pestana as PestanaReporte)
        : base.pestana,
      periodoRapido: [
        "Hoy",
        "Últimos 7 días",
        "Este mes",
        "Mes anterior",
        "Personalizado",
      ].includes(
        String(datos.periodoRapido),
      )
        ? (datos.periodoRapido as PeriodoRapidoAnalitica)
        : base.periodoRapido,
      filtroBorrador: esPeriodoValido(
        datos.filtroBorrador,
      )
        ? datos.filtroBorrador
        : base.filtroBorrador,
      filtroAplicado: esPeriodoValido(
        datos.filtroAplicado,
      )
        ? datos.filtroAplicado
        : base.filtroAplicado,
      texto:
        typeof datos.texto === "string"
          ? datos.texto
          : base.texto,
    };
  } catch {
    return base;
  }
}

function guardarPreferenciasReportes(
  cambios: Partial<PreferenciasReportes>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const actuales =
      crearPreferenciasReportesIniciales();

    window.localStorage.setItem(
      CLAVE_PREFERENCIAS_REPORTES,
      JSON.stringify({
        ...actuales,
        ...cambios,
      }),
    );
  } catch {
    // La persistencia es una mejora de experiencia;
    // el reporte debe seguir funcionando si localStorage falla.
  }
}

const PESTANAS: Array<{
  id: PestanaReporte;
  icono: typeof BarChart3;
  permiso: PermisoSistema;
}> = [
  {
    id: "Resumen",
    icono: BarChart3,
    permiso: "REPORTES_RESUMEN",
  },
  {
    id: "Ventas",
    icono: ReceiptText,
    permiso: "REPORTES_VENTAS",
  },
  {
    id: "PedidosYa",
    icono: BadgeDollarSign,
    permiso: "REPORTES_PEDIDOSYA",
  },
  {
    id: "Arqueos",
    icono: WalletCards,
    permiso: "REPORTES_ARQUEOS",
  },
  {
    id: "Inventario",
    icono: Boxes,
    permiso: "REPORTES_INVENTARIO",
  },
  {
    id: "Actividad por usuario",
    icono: UsersRound,
    permiso: "REPORTES_USUARIOS",
  },
  {
    id: "Bitácora",
    icono: ShieldCheck,
    permiso: "REPORTES_BITACORA",
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

function fechaIsoLegible(valor: string): string {
  const [ano, mes, dia] = valor.split("-");

  if (!ano || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

const REGISTROS_POR_PAGINA = 10;

function PaginacionReportes({
  pagina,
  totalPaginas,
  totalRegistros,
  alCambiarPagina,
}: {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  alCambiarPagina: (pagina: number) => void;
}) {
  const desde =
    totalRegistros === 0
      ? 0
      : (pagina - 1) * REGISTROS_POR_PAGINA + 1;

  const hasta = Math.min(
    pagina * REGISTROS_POR_PAGINA,
    totalRegistros,
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-panel sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Mostrando {desde}-{hasta} de {totalRegistros} registros
      </p>

      <div className="flex items-center gap-2">
        <span className="mr-1 text-xs font-bold text-slate-500 dark:text-slate-400">
          Página {pagina} de {totalPaginas}
        </span>

        <button
          type="button"
          title="Página anterior"
          aria-label="Página anterior"
          disabled={pagina <= 1}
          onClick={() => alCambiarPagina(Math.max(1, pagina - 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ChevronLeft size={17} />
        </button>

        <button
          type="button"
          title="Página siguiente"
          aria-label="Página siguiente"
          disabled={pagina >= totalPaginas}
          onClick={() =>
            alCambiarPagina(
              Math.min(totalPaginas, pagina + 1),
            )
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

function etiquetaEstadoPedidosYa(venta: Venta): string {
  if (venta.estadoCobro === "Liquidada") {
    return "Liquidada";
  }

  if (venta.estadoPreparacion === "Entregado") {
    return "Por liquidar";
  }

  return "En curso";
}

function claseEstadoPedidosYa(venta: Venta): string {
  if (venta.estadoCobro === "Liquidada") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300";
  }

  if (venta.estadoPreparacion === "Entregado") {
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950/35 dark:text-fuchsia-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-300";
}

function PanelPedidosYa({
  resumen,
  ventas,
  pagina,
  porPagina,
  puedeLiquidar,
  alRegistrarLiquidacion,
}: {
  resumen: ResumenPedidosYaPeriodo;
  ventas: Venta[];
  pagina: number;
  porPagina: number;
  puedeLiquidar: boolean;
  alRegistrarLiquidacion: () => void;
}) {
  const [ventaDetalle, setVentaDetalle] =
    useState<Venta | null>(null);
  const [liquidacionDetalle, setLiquidacionDetalle] =
    useState<LiquidacionPedidosYa | null>(null);

  const inicio = (pagina - 1) * porPagina;
  const ventasPagina = ventas.slice(
    inicio,
    inicio + porPagina,
  );

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                  <WalletCards size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-950 dark:text-white">
                    Control de PedidosYa
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    El rango seleccionado determina qué pedidos entregados se consideran para una liquidación.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  <strong className="text-slate-900 dark:text-white">
                    {resumen.cantidadPendiente}
                  </strong>{" "}
                  por liquidar · {moneda(resumen.montoPendiente)}
                </span>
                <span className="hidden text-slate-300 sm:inline dark:text-slate-700">•</span>
                <span>
                  <strong className="text-slate-900 dark:text-white">
                    {resumen.cantidadEnCurso}
                  </strong>{" "}
                  en curso · {moneda(resumen.montoEnCurso)}
                </span>
                <span className="hidden text-slate-300 sm:inline dark:text-slate-700">•</span>
                <span>
                  <strong className="text-slate-900 dark:text-white">
                    {resumen.cantidadLiquidada}
                  </strong>{" "}
                  liquidados · {moneda(resumen.montoLiquidado)}
                </span>
              </div>
            </div>

            {puedeLiquidar && (
              <button
                type="button"
                disabled={resumen.cantidadPendiente === 0}
                onClick={alRegistrarLiquidacion}
                title={
                  resumen.cantidadPendiente === 0
                    ? "No hay pedidos entregados pendientes dentro del periodo"
                    : "Registrar la transferencia correspondiente al periodo"
                }
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-fuchsia-700 px-4 text-sm font-bold text-white transition-colors hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-500"
              >
                <WalletCards size={17} />
                Registrar liquidación
              </button>
            )}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-260 w-full border-collapse text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/70">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {[
                  "Pedido",
                  "Registro",
                  "Referencia",
                  "Total",
                  "Operación",
                  "Liquidación",
                  "Entregado por",
                  "Detalle",
                ].map((encabezado) => (
                  <th
                    key={encabezado}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
                  >
                    {encabezado}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ventasPagina.map((venta) => (
                <tr
                  key={venta.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                >
                  <td className="px-4 py-3.5 text-sm font-black text-slate-950 dark:text-white">
                    {venta.numeroPedido}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {fechaHora(venta.fechaHoraRegistro)}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {venta.referenciaPedidosYa ?? "Sin referencia"}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-black text-slate-950 dark:text-white">
                    {moneda(venta.total)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {venta.estadoPreparacion}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${claseEstadoPedidosYa(venta)}`}>
                      {etiquetaEstadoPedidosYa(venta)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {venta.usuarioEntregaNombre ?? "Pendiente"}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setVentaDetalle(venta)}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:border-roma-300 hover:bg-roma-50 hover:text-roma-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-roma-700 dark:hover:bg-roma-950/30 dark:hover:text-roma-200"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ventas.length === 0 && (
          <div className="flex min-h-52 flex-col items-center justify-center border-t border-slate-100 px-6 py-10 text-center dark:border-slate-800">
            <WalletCards size={30} className="text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-black text-slate-900 dark:text-white">
              No hay pedidos de PedidosYa en este periodo
            </p>
            <p className="mt-1 max-w-lg text-sm text-slate-500 dark:text-slate-400">
              Cambia el rango de fechas o registra una venta mediante el canal PedidosYa.
            </p>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-950 dark:text-white">
            Liquidaciones relacionadas con el periodo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conserva el historial de las transferencias registradas; una liquidación cerrada nunca elimina los pedidos anteriores.
          </p>
        </header>

        {resumen.liquidaciones.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            Todavía no existen liquidaciones relacionadas con el rango seleccionado.
          </div>
        ) : (
          <div className="max-h-107.5 overflow-auto">
            <table className="min-w-245 w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {[
                    "Liquidación",
                    "Periodo",
                    "Pedidos",
                    "Ventas brutas",
                    "Transferido",
                    "Diferencia",
                    "Responsable",
                    "Detalle",
                  ].map((encabezado) => (
                    <th
                      key={encabezado}
                      className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
                    >
                      {encabezado}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {resumen.liquidaciones.map((liquidacion) => (
                  <tr
                    key={liquidacion.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                  >
                    <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white">
                      {liquidacion.numeroLiquidacion}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {fechaIsoLegible(liquidacion.fechaDesde)} - {fechaIsoLegible(liquidacion.fechaHasta)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {liquidacion.cantidadPedidos}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {moneda(liquidacion.montoBruto)}
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-slate-950 dark:text-white">
                      {moneda(liquidacion.montoRecibido)}
                    </td>
                    <td className="px-4 py-3 text-xs font-black">
                      <span className={Math.abs(liquidacion.diferencia) <= 0.009 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
                        {moneda(liquidacion.diferencia)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {liquidacion.usuarioNombre}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setLiquidacionDetalle(liquidacion)}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:border-roma-300 hover:bg-roma-50 hover:text-roma-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-roma-700 dark:hover:bg-roma-950/30 dark:hover:text-roma-200"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        abierto={ventaDetalle !== null}
        titulo={ventaDetalle ? `Detalle ${ventaDetalle.numeroPedido}` : "Detalle del pedido"}
        descripcion="Información operativa y financiera del pedido de PedidosYa."
        ancho="grande"
        alCerrar={() => setVentaDetalle(null)}
      >
        {ventaDetalle && (
          <div className="grid gap-4 p-5 md:grid-cols-2 lg:p-6">
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Pedido y registro
              </h4>
              <dl className="mt-3 grid gap-3 text-sm">
                <div><dt className="text-xs font-bold text-slate-400">Pedido</dt><dd className="mt-0.5 font-black text-slate-900 dark:text-white">{ventaDetalle.numeroPedido}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Referencia PedidosYa</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{ventaDetalle.referenciaPedidosYa ?? "No registrada"}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Registrado</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{fechaHora(ventaDetalle.fechaHoraRegistro)}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Responsable</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{ventaDetalle.usuarioRegistroNombre} · Caja #{ventaDetalle.sesionCajaIdRegistro ?? "-"}</dd></div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Entrega y liquidación
              </h4>
              <dl className="mt-3 grid gap-3 text-sm">
                <div><dt className="text-xs font-bold text-slate-400">Estado operativo</dt><dd className="mt-0.5 font-black text-slate-900 dark:text-white">{ventaDetalle.estadoPreparacion}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Estado financiero</dt><dd className="mt-0.5 font-black text-slate-900 dark:text-white">{ventaDetalle.estadoCobro}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Entregado por</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{ventaDetalle.usuarioEntregaNombre ? `${ventaDetalle.usuarioEntregaNombre} · Caja #${ventaDetalle.sesionCajaIdEntrega ?? "-"}` : "Aún no entregado"}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Fecha de entrega</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{ventaDetalle.fechaHoraEntregado ? fechaHora(ventaDetalle.fechaHoraEntregado) : "Pendiente"}</dd></div>
                <div><dt className="text-xs font-bold text-slate-400">Liquidación</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{ventaDetalle.liquidacionPedidosYaId ? `PY-${String(ventaDetalle.liquidacionPedidosYaId).padStart(4, "0")}` : "Pendiente"}</dd></div>
              </dl>
            </section>

            <section className="md:col-span-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Productos
                </h4>
                <strong className="text-base text-slate-950 dark:text-white">{moneda(ventaDetalle.total)}</strong>
              </div>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {ventaDetalle.detalles.map((detalle) => (
                  <div key={`${ventaDetalle.id}-${detalle.productoId}`} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{detalle.cantidad} × {detalle.nombreProducto}</p>
                      {detalle.observacion && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detalle.observacion}</p>}
                    </div>
                    <span className="shrink-0 font-black text-slate-900 dark:text-white">{moneda(detalle.subtotal)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </Modal>

      <Modal
        abierto={liquidacionDetalle !== null}
        titulo={liquidacionDetalle?.numeroLiquidacion ?? "Detalle de liquidación"}
        descripcion="Registro histórico de la transferencia informada por PedidosYa."
        alCerrar={() => setLiquidacionDetalle(null)}
      >
        {liquidacionDetalle && (
          <div className="space-y-4 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Periodo", `${fechaIsoLegible(liquidacionDetalle.fechaDesde)} - ${fechaIsoLegible(liquidacionDetalle.fechaHasta)}`],
                ["Pedidos incluidos", String(liquidacionDetalle.cantidadPedidos)],
                ["Ventas brutas", moneda(liquidacionDetalle.montoBruto)],
                ["Monto transferido", moneda(liquidacionDetalle.montoRecibido)],
                ["Diferencia / ajustes", moneda(liquidacionDetalle.diferencia)],
                ["Responsable", liquidacionDetalle.usuarioNombre],
                ["Registrada", fechaHora(liquidacionDetalle.fechaHoraRegistro)],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{etiqueta}</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{valor}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Observación</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-700 dark:text-slate-200">
                {liquidacionDetalle.observacion ?? "Sin observaciones"}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Reportes() {
  const { usuario } = useAuth();

  const permisosUsuario =
    usuario?.permisos ?? [];

  const pestanasDisponibles =
    PESTANAS.filter((item) =>
      permisosUsuario.includes(
        item.permiso,
      ),
    );

  const puedeExportar =
    permisosUsuario.includes(
      "REPORTES_EXPORTAR",
    );

  const puedeImprimir =
    permisosUsuario.includes(
      "REPORTES_IMPRIMIR",
    );

  const puedeLiquidarPedidosYa =
    permisosUsuario.includes(
      "REPORTES_PEDIDOSYA_LIQUIDAR",
    );

  const preferenciasIniciales = useMemo(
    () => crearPreferenciasReportesIniciales(),
    [],
  );

  const [pestana, setPestana] =
    useState<PestanaReporte>(
      preferenciasIniciales.pestana,
    );

  const pestanaActiva =
    pestanasDisponibles.some(
      (item) => item.id === pestana,
    )
      ? pestana
      : (pestanasDisponibles[0]?.id ??
        null);

  const [periodoRapido, setPeriodoRapido] =
    useState<PeriodoRapidoAnalitica>(
      preferenciasIniciales.periodoRapido,
    );

  const [filtroBorrador, setFiltroBorrador] =
    useState<FiltroPeriodoAnalitica>(
      preferenciasIniciales.filtroBorrador,
    );

  const [filtroAplicado, setFiltroAplicado] =
    useState<FiltroPeriodoAnalitica>(
      preferenciasIniciales.filtroAplicado,
    );

  const [texto, setTexto] = useState(
    preferenciasIniciales.texto,
  );
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] =
    useState<DatosReportesAdministrativos | null>(
      null,
    );

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [modalLiquidacionPedidosYa, setModalLiquidacionPedidosYa] =
    useState(false);
  const [montoLiquidacionPedidosYa, setMontoLiquidacionPedidosYa] =
    useState("");
  const [observacionLiquidacionPedidosYa, setObservacionLiquidacionPedidosYa] =
    useState("");
  const [procesandoLiquidacionPedidosYa, setProcesandoLiquidacionPedidosYa] =
    useState(false);
  const [errorLiquidacionPedidosYa, setErrorLiquidacionPedidosYa] =
    useState<string | null>(null);
  const [mensajePedidosYa, setMensajePedidosYa] =
    useState<string | null>(null);

  const [filtroCobro, setFiltroCobro] =
    useState<FiltroCobroReporte>(
      preferenciasIniciales.filtroCobro,
    );

  const [
    filtroPreparacion,
    setFiltroPreparacion,
  ] = useState<FiltroPreparacionReporte>(
    preferenciasIniciales.filtroPreparacion,
  );

  const [filtroMetodo, setFiltroMetodo] =
    useState<FiltroMetodoReporte>(
      preferenciasIniciales.filtroMetodo,
    );

  const [
    filtroEstadoArqueo,
    setFiltroEstadoArqueo,
  ] = useState<FiltroEstadoArqueoReporte>(
    preferenciasIniciales.filtroEstadoArqueo,
  );

  const [
    filtroTipoInventario,
    setFiltroTipoInventario,
  ] = useState<FiltroInventarioReporte>(
    preferenciasIniciales.filtroTipoInventario,
  );

  const [
    filtroModuloAuditoria,
    setFiltroModuloAuditoria,
  ] = useState<FiltroModuloAuditoriaReporte>(
    preferenciasIniciales.filtroModuloAuditoria,
  );

  const [
    filtroNivelAuditoria,
    setFiltroNivelAuditoria,
  ] = useState<FiltroNivelAuditoriaReporte>(
    preferenciasIniciales.filtroNivelAuditoria,
  );

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
        guardarPreferenciasReportes({
          filtroAplicado: respuesta.periodo,
        });
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
          preferenciasIniciales.filtroAplicado,
        )
          .then((respuesta) => {
            if (!activo) return;

            setDatos(respuesta);
            setFiltroAplicado(
              respuesta.periodo,
            );
            setFiltroBorrador(
              respuesta.periodo,
            );
            guardarPreferenciasReportes({
              filtroAplicado: respuesta.periodo,
              filtroBorrador: respuesta.periodo,
            });
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
  }, [preferenciasIniciales]);

  function seleccionarPeriodo(
    periodo: PeriodoRapidoAnalitica,
  ) {
    const nuevo =
      crearPeriodoRapidoAnalitica(
        periodo,
      );

    setPeriodoRapido(periodo);
    setFiltroBorrador(nuevo);
    setPagina(1);
    guardarPreferenciasReportes({
      periodoRapido: periodo,
      filtroBorrador: nuevo,
      filtroAplicado: nuevo,
    });
    void cargar(nuevo);
  }

  function cambiarFiltro(
    filtro: FiltroPeriodoAnalitica,
  ) {
    setPeriodoRapido("Personalizado");
    setFiltroBorrador(filtro);
    guardarPreferenciasReportes({
      periodoRapido: "Personalizado",
      filtroBorrador: filtro,
    });
  }

  function cambiarTextoReporte(valor: string) {
    setTexto(valor);
    setPagina(1);
    guardarPreferenciasReportes({ texto: valor });
  }

  function cambiarCobro(valor: FiltroCobroReporte) {
    setFiltroCobro(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroCobro: valor,
    });
  }

  function cambiarPreparacion(
    valor: FiltroPreparacionReporte,
  ) {
    setFiltroPreparacion(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroPreparacion: valor,
    });
  }

  function cambiarMetodo(valor: FiltroMetodoReporte) {
    setFiltroMetodo(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroMetodo: valor,
    });
  }

  function cambiarEstadoArqueo(
    valor: FiltroEstadoArqueoReporte,
  ) {
    setFiltroEstadoArqueo(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroEstadoArqueo: valor,
    });
  }

  function cambiarTipoInventario(
    valor: FiltroInventarioReporte,
  ) {
    setFiltroTipoInventario(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroTipoInventario: valor,
    });
  }

  function cambiarModuloAuditoria(
    valor: FiltroModuloAuditoriaReporte,
  ) {
    setFiltroModuloAuditoria(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroModuloAuditoria: valor,
    });
  }

  function cambiarNivelAuditoria(
    valor: FiltroNivelAuditoriaReporte,
  ) {
    setFiltroNivelAuditoria(valor);
    setPagina(1);
    guardarPreferenciasReportes({
      filtroNivelAuditoria: valor,
    });
  }

  function aplicarFiltroPeriodo() {
    setPagina(1);
    guardarPreferenciasReportes({
      filtroAplicado: filtroBorrador,
    });
    void cargar(filtroBorrador);
  }

  function limpiarFiltrosReporte() {
    const periodo = crearPeriodoRapidoAnalitica("Este mes");

    setPeriodoRapido("Este mes");
    setFiltroBorrador(periodo);
    setFiltroAplicado(periodo);
    setTexto("");
    setFiltroCobro("Todos");
    setFiltroPreparacion("Todos");
    setFiltroMetodo("Todos");
    setFiltroEstadoArqueo("Todos");
    setFiltroTipoInventario("Todos");
    setFiltroModuloAuditoria("Todos");
    setFiltroNivelAuditoria("Todos");
    setPagina(1);

    guardarPreferenciasReportes({
      periodoRapido: "Este mes",
      filtroBorrador: periodo,
      filtroAplicado: periodo,
      texto: "",
      filtroCobro: "Todos",
      filtroPreparacion: "Todos",
      filtroMetodo: "Todos",
      filtroEstadoArqueo: "Todos",
      filtroTipoInventario: "Todos",
      filtroModuloAuditoria: "Todos",
      filtroNivelAuditoria: "Todos",
    });

    void cargar(periodo);
  }

  function abrirLiquidacionPedidosYa() {
    if (!datos || datos.pedidosYa.cantidadPendiente === 0) {
      return;
    }

    setMontoLiquidacionPedidosYa(
      datos.pedidosYa.montoPendiente.toFixed(2),
    );
    setObservacionLiquidacionPedidosYa("");
    setErrorLiquidacionPedidosYa(null);
    setModalLiquidacionPedidosYa(true);
  }

  async function confirmarLiquidacionPedidosYa() {
    if (!usuario || !datos || procesandoLiquidacionPedidosYa) {
      return;
    }

    const monto = Number(
      montoLiquidacionPedidosYa.replace(",", "."),
    );

    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorLiquidacionPedidosYa(
        "Ingresa un monto transferido válido mayor a cero.",
      );
      return;
    }

    const diferencia =
      Math.round(
        (monto - datos.pedidosYa.montoPendiente + Number.EPSILON) * 100,
      ) / 100;

    if (
      Math.abs(diferencia) > 0.009 &&
      !observacionLiquidacionPedidosYa.trim()
    ) {
      setErrorLiquidacionPedidosYa(
        "Explica la diferencia entre las ventas brutas y el monto transferido antes de confirmar.",
      );
      return;
    }

    try {
      setProcesandoLiquidacionPedidosYa(true);
      setErrorLiquidacionPedidosYa(null);

      const liquidacion =
        await registrarLiquidacionPedidosYa(
          {
            fechaDesde: filtroAplicado.fechaDesde,
            fechaHasta: filtroAplicado.fechaHasta,
            montoRecibido: monto,
            observacion:
              observacionLiquidacionPedidosYa.trim() || null,
          },
          usuario,
        );

      await auditarAccion(
        {
          modulo: "Reportes",
          accion: "Registrar liquidación PedidosYa",
          entidad: "Liquidación PedidosYa",
          entidadId: liquidacion.numeroLiquidacion,
          descripcion:
            `Se registró ${liquidacion.numeroLiquidacion} con ${liquidacion.cantidadPedidos} pedido(s), ventas brutas por ${moneda(liquidacion.montoBruto)} y transferencia por ${moneda(liquidacion.montoRecibido)}.`,
          datosPosteriores: liquidacion,
          nivel:
            Math.abs(liquidacion.diferencia) > 0.009
              ? "Advertencia"
              : "Información",
        },
        usuario,
      );

      setModalLiquidacionPedidosYa(false);
      setMontoLiquidacionPedidosYa("");
      setObservacionLiquidacionPedidosYa("");
      setMensajePedidosYa(
        `${liquidacion.numeroLiquidacion} registrada correctamente. Los pedidos incluidos ya no forman parte de la deuda pendiente.`,
      );
      setPagina(1);
      await cargar(filtroAplicado);
    } catch (errorLiquidacion: unknown) {
      setErrorLiquidacionPedidosYa(
        obtenerMensajeError(errorLiquidacion),
      );
    } finally {
      setProcesandoLiquidacionPedidosYa(false);
    }
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
          venta.canalVenta,
          venta.referenciaPedidosYa ?? "",
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

    const porTexto =
      filtrarArqueosPorTexto(
        datos.conciliacion.arqueos,
        texto,
      );

    return porTexto.filter(
      (arqueo) =>
        filtroEstadoArqueo ===
          "Todos" ||
        arqueo.estadoConciliacion ===
          filtroEstadoArqueo,
    );
  }, [
    datos,
    texto,
    filtroEstadoArqueo,
  ]);

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

  const pedidosYaOrdenados = useMemo(() => {
    if (!datos) return [];

    return [
      ...datos.pedidosYa.pedidosEnCurso,
      ...datos.pedidosYa.pedidosPendientes,
      ...datos.pedidosYa.pedidosLiquidados,
    ].sort(
      (ventaA, ventaB) =>
        new Date(ventaB.fechaHoraRegistro).getTime() -
        new Date(ventaA.fechaHoraRegistro).getTime(),
    );
  }, [datos]);

  const montoLiquidacionNumerico = Number(
    montoLiquidacionPedidosYa.replace(",", "."),
  );

  const diferenciaLiquidacionCalculada = datos && Number.isFinite(montoLiquidacionNumerico)
    ? Math.round(
        (montoLiquidacionNumerico - datos.pedidosYa.montoPendiente + Number.EPSILON) * 100,
      ) / 100
    : 0;

  const filasResumen = useMemo<
    FilaResumenExportacion[]
  >(() => {
    if (!datos) return [];

    const totalAcciones =
      datos.panel.actividadPorUsuario.reduce(
        (total, usuarioActividad) =>
          total + usuarioActividad.totalAcciones,
        0,
      );

    return [
      {
        indicador: "Ventas cobradas",
        valor: moneda(
          datos.panel.comerciales
            .ventasNetas,
        ),
        descripcion:
          `${datos.panel.comerciales.pedidosCobrados} pedidos cobrados`,
      },
      {
        indicador: "Pendiente de cobro",
        valor: moneda(
          datos.panel.comerciales
            .ventasPendientes,
        ),
        descripcion:
          `${datos.panel.comerciales.pedidosPendientes} pedidos pendientes`,
      },
      {
        indicador: "Descuentos otorgados",
        valor: moneda(
          datos.panel.comerciales
            .descuentosOtorgados,
        ),
        descripcion:
          `${datos.panel.comerciales.descuentosAplicados} ventas con descuento`,
      },
      {
        indicador: "Pedidos anulados",
        valor:
          datos.panel.comerciales
            .pedidosAnulados,
        descripcion:
          "Pedidos anulados dentro del periodo",
      },
      {
        indicador: "Cajas cerradas revisadas",
        valor:
          datos.conciliacion
            .sesionesCerradas,
        descripcion:
          `${datos.conciliacion.sesionesConDiferencias} cierres con diferencia`,
      },
      {
        indicador: "Diferencia acumulada de caja",
        valor: moneda(
          datos.conciliacion
            .diferenciaAcumulada,
        ),
        descripcion:
          "Suma de sobrantes y faltantes registrados",
      },
      {
        indicador: "Insumos con stock bajo",
        valor:
          datos.panel.inventario
            .insumosStockBajo,
        descripcion:
          "Insumos por debajo del nivel mínimo",
      },
      {
        indicador: "Insumos con stock negativo",
        valor:
          datos.panel.inventario
            .insumosStockNegativo,
        descripcion:
          "Existencias que requieren regularización",
      },
      {
        indicador: "Costo de insumos consumidos",
        valor: moneda(
          datos.panel.inventario
            .costoConsumoValorado,
        ),
        descripcion:
          "Costo registrado de consumos valorados",
      },
      {
        indicador: "Valor estimado del stock disponible",
        valor: moneda(
          datos.panel.inventario
            .valorInventarioPositivo,
        ),
        descripcion:
          "Valor de existencias positivas registradas",
      },
      {
        indicador: "Usuarios con actividad",
        valor:
          datos.panel.actividadPorUsuario
            .length,
        descripcion:
          "Usuarios con operaciones dentro del periodo",
      },
      {
        indicador: "Acciones registradas",
        valor: totalAcciones,
        descripcion:
          "Operaciones trazables atribuidas a usuarios",
      },
    ];
  }, [datos]);

  const registrosActivos:
    | FilaResumenExportacion[]
    | FilaReporteVenta[]
    | Venta[]
    | ArqueoAdministrativo[]
    | FilaReporteInventario[]
    | FilaReporteUsuario[]
    | RegistroAuditoria[] =
    pestanaActiva === "Resumen"
      ? filasResumen
      : pestanaActiva === "Ventas"
        ? ventasFiltradas
        : pestanaActiva === "PedidosYa"
          ? pedidosYaOrdenados
          : pestanaActiva === "Arqueos"
          ? arqueosFiltrados
          : pestanaActiva === "Inventario"
            ? inventarioFiltrado
            : pestanaActiva ===
                "Actividad por usuario"
              ? usuariosFiltrados
              : pestanaActiva === "Bitácora"
                ? auditoriaFiltrada
                : [];

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      registrosActivos.length / REGISTROS_POR_PAGINA,
    ),
  );

  const paginaSegura = Math.min(
    pagina,
    totalPaginas,
  );

  function obtenerDescripcionReporteActual(): string {
    const filtros: string[] = [];

    if (texto.trim()) {
      filtros.push(`búsqueda: "${texto.trim()}"`);
    }

    if (pestanaActiva === "Ventas") {
      if (filtroCobro !== "Todos") {
        filtros.push(`cobro: ${filtroCobro}`);
      }
      if (filtroPreparacion !== "Todos") {
        filtros.push(
          `preparación: ${filtroPreparacion}`,
        );
      }
      if (filtroMetodo !== "Todos") {
        filtros.push(`pago: ${filtroMetodo}`);
      }
    }

    if (
      pestanaActiva === "Arqueos" &&
      filtroEstadoArqueo !== "Todos"
    ) {
      filtros.push(
        `resultado: ${
          filtroEstadoArqueo === "Conciliada"
            ? "Sin diferencia"
            : filtroEstadoArqueo
        }`,
      );
    }

    if (
      pestanaActiva === "Inventario" &&
      filtroTipoInventario !== "Todos"
    ) {
      filtros.push(
        `movimiento: ${filtroTipoInventario}`,
      );
    }

    if (pestanaActiva === "Bitácora") {
      if (filtroModuloAuditoria !== "Todos") {
        filtros.push(
          `módulo: ${filtroModuloAuditoria}`,
        );
      }
      if (filtroNivelAuditoria !== "Todos") {
        filtros.push(
          `nivel: ${filtroNivelAuditoria}`,
        );
      }
    }

    return filtros.length > 0
      ? `Filtros adicionales: ${filtros.join(", ")}.`
      : "";
  }

  function exportarActual() {
    if (
      !puedeExportar ||
      !pestanaActiva ||
      !datos
    ) {
      return;
    }

    const nombre =
      `roma-${pestanaActiva}-${filtroAplicado.fechaDesde}-${filtroAplicado.fechaHasta}`;

    const titulo =
      `Roma Fast Food - ${pestanaActiva}`;

    const descripcion =
      obtenerDescripcionReporteActual();

    const resumenBase = [
      {
        etiqueta: "Periodo",
        valor:
          `${fechaIsoLegible(filtroAplicado.fechaDesde)} - ${fechaIsoLegible(filtroAplicado.fechaHasta)}`,
      },
      {
        etiqueta: "Datos actualizados",
        valor: fechaHora(datos.generadoEn),
      },
    ];

    if (pestanaActiva === "Resumen") {
      descargarPdfReporte({
        nombreArchivo: nombre,
        titulo,
        descripcion,
        registros: filasResumen,
        columnas: columnasResumen,
        resumen: [
          ...resumenBase,
          {
            etiqueta: "Ventas cobradas",
            valor: moneda(
              datos.panel.comerciales
                .ventasNetas,
            ),
          },
        ],
      });
      return;
    }

    if (pestanaActiva === "Ventas") {
      const total = ventasFiltradas.reduce(
        (suma, venta) =>
          suma + venta.total,
        0,
      );

      descargarPdfReporte({
        nombreArchivo: nombre,
        titulo,
        descripcion,
        registros: ventasFiltradas,
        columnas: columnasVentas,
        resumen: [
          ...resumenBase,
          {
            etiqueta: "Ventas listadas",
            valor: String(
              ventasFiltradas.length,
            ),
          },
          {
            etiqueta: "Total listado",
            valor: moneda(total),
          },
        ],
      });
      return;
    }

    if (pestanaActiva === "PedidosYa") {
      descargarPdfReporte({
        nombreArchivo: nombre,
        titulo,
        descripcion:
          "Control de pedidos de PedidosYa según el periodo seleccionado. Los pedidos fuera del rango conservan su estado financiero.",
        registros: pedidosYaOrdenados,
        columnas: columnasPedidosYa,
        resumen: [
          ...resumenBase,
          {
            etiqueta: "Por liquidar",
            valor: `${datos.pedidosYa.cantidadPendiente} · ${moneda(datos.pedidosYa.montoPendiente)}`,
          },
          {
            etiqueta: "En curso",
            valor: `${datos.pedidosYa.cantidadEnCurso} · ${moneda(datos.pedidosYa.montoEnCurso)}`,
          },
          {
            etiqueta: "Liquidado",
            valor: `${datos.pedidosYa.cantidadLiquidada} · ${moneda(datos.pedidosYa.montoLiquidado)}`,
          },
        ],
      });
      return;
    }

    if (pestanaActiva === "Arqueos") {
      const conDiferencia =
        arqueosFiltrados.filter(
          (arqueo) =>
            Math.abs(
              arqueo.diferenciaRegistrada ??
                0,
            ) > 0.009,
        ).length;

      descargarPdfReporte({
        nombreArchivo: nombre,
        titulo,
        descripcion,
        registros: arqueosFiltrados,
        columnas: columnasArqueos,
        resumen: [
          ...resumenBase,
          {
            etiqueta: "Cierres listados",
            valor: String(
              arqueosFiltrados.length,
            ),
          },
          {
            etiqueta: "Con diferencia",
            valor: String(conDiferencia),
          },
        ],
      });
      return;
    }

    if (pestanaActiva === "Inventario") {
      descargarPdfReporte({
        nombreArchivo: nombre,
        titulo,
        descripcion,
        registros: inventarioFiltrado,
        columnas: columnasInventario,
        resumen: [
          ...resumenBase,
          {
            etiqueta: "Movimientos listados",
            valor: String(
              inventarioFiltrado.length,
            ),
          },
        ],
      });
      return;
    }

    if (
      pestanaActiva ===
      "Actividad por usuario"
    ) {
      const acciones =
        usuariosFiltrados.reduce(
          (total, usuarioActividad) =>
            total +
            usuarioActividad.totalAcciones,
          0,
        );

      descargarPdfReporte({
        nombreArchivo: nombre,
        titulo,
        descripcion,
        registros: usuariosFiltrados,
        columnas: columnasUsuarios,
        resumen: [
          ...resumenBase,
          {
            etiqueta: "Usuarios listados",
            valor: String(
              usuariosFiltrados.length,
            ),
          },
          {
            etiqueta: "Acciones",
            valor: String(acciones),
          },
        ],
      });
      return;
    }

    const criticos = auditoriaFiltrada.filter(
      (registro) =>
        registro.nivel === "Crítico",
    ).length;

    descargarPdfReporte({
      nombreArchivo: nombre,
      titulo,
      descripcion,
      registros: auditoriaFiltrada,
      columnas: columnasAuditoria,
      resumen: [
        ...resumenBase,
        {
          etiqueta: "Eventos listados",
          valor: String(
            auditoriaFiltrada.length,
          ),
        },
        {
          etiqueta: "Eventos críticos",
          valor: String(criticos),
        },
      ],
    });
  }

  function imprimirActual() {
    if (!puedeImprimir || !pestanaActiva) {
      return;
    }

    const titulo = `Roma Fast Food — ${pestanaActiva}`;
    const descripcion =
      obtenerDescripcionReporteActual();

    if (pestanaActiva === "Resumen") {
      imprimirReporte(
        titulo,
        descripcion,
        filasResumen,
        columnasResumen,
      );
      return;
    }

    if (pestanaActiva === "Ventas") {
      imprimirReporte(
        titulo,
        descripcion,
        ventasFiltradas,
        columnasVentas,
      );
      return;
    }

    if (pestanaActiva === "PedidosYa") {
      imprimirReporte(
        titulo,
        "Pedidos de PedidosYa incluidos en el periodo seleccionado. Los pedidos fuera del rango no cambian su estado financiero.",
        pedidosYaOrdenados,
        columnasPedidosYa,
      );
      return;
    }

    if (pestanaActiva === "Arqueos") {
      imprimirReporte(
        titulo,
        descripcion,
        arqueosFiltrados,
        columnasArqueos,
      );
      return;
    }

    if (pestanaActiva === "Inventario") {
      imprimirReporte(
        titulo,
        descripcion,
        inventarioFiltrado,
        columnasInventario,
      );
      return;
    }

    if (
      pestanaActiva === "Actividad por usuario"
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
      <section className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/50 dark:bg-slate-900">
        <AlertTriangle size={38} className="text-red-700" />
        <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">No se pudieron generar los reportes</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <button type="button" onClick={()=>void cargar(filtroAplicado,true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-roma-700 px-5 py-3 text-sm font-bold text-white hover:bg-roma-800"><RefreshCw size={18}/>Volver a intentar</button>
      </section>
    );
  }

  if (!datos) return null;

  return (
    <div className="space-y-3">
      <nav
        aria-label="Secciones de reportes"
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-panel dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            Reporte a consultar
          </span>

          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
            {pestanasDisponibles.map(({ id, icono: Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPestana(id);
                  setTexto("");
                  setPagina(1);
                  guardarPreferenciasReportes({
                    pestana: id,
                    texto: "",
                  });
                }}
                className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  pestanaActiva === id
                    ? "border-roma-500 bg-roma-50 text-slate-950 shadow-sm dark:border-roma-500 dark:bg-roma-950/35 dark:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-roma-200 hover:bg-roma-50/60 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-roma-800 dark:hover:bg-roma-950/20 dark:hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    pestanaActiva === id
                      ? "bg-roma-100 text-roma-700 dark:bg-roma-950/70 dark:text-roma-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <Icono size={17} />
                </span>

                <span className="min-w-0 flex-1 truncate text-xs font-black">
                  {id}
                </span>

                {pestanaActiva === id && (
                  <Check
                    size={16}
                    className="shrink-0 text-roma-700 dark:text-roma-300"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {pestanaActiva ? (
        <FiltrosReportes
          seccion={pestanaActiva}
          actualizadoEn={fechaHora(datos.generadoEn)}
          periodoRapido={periodoRapido}
          filtro={filtroBorrador}
          texto={texto}
          cargando={cargando}
          cantidadRegistros={registrosActivos.length}
          mostrarBusqueda={pestanaActiva !== "Resumen" && pestanaActiva !== "PedidosYa"}
          puedeExportar={puedeExportar}
          puedeImprimir={puedeImprimir}
          filtroCobro={filtroCobro}
          filtroPreparacion={filtroPreparacion}
          filtroMetodo={filtroMetodo}
          filtroEstadoArqueo={filtroEstadoArqueo}
          filtroTipoInventario={filtroTipoInventario}
          filtroModuloAuditoria={filtroModuloAuditoria}
          filtroNivelAuditoria={filtroNivelAuditoria}
          alSeleccionarPeriodo={seleccionarPeriodo}
          alCambiarFiltro={cambiarFiltro}
          alCambiarTexto={cambiarTextoReporte}
          alCambiarCobro={cambiarCobro}
          alCambiarPreparacion={cambiarPreparacion}
          alCambiarMetodo={cambiarMetodo}
          alCambiarEstadoArqueo={cambiarEstadoArqueo}
          alCambiarTipoInventario={cambiarTipoInventario}
          alCambiarModuloAuditoria={cambiarModuloAuditoria}
          alCambiarNivelAuditoria={cambiarNivelAuditoria}
          alAplicar={aplicarFiltroPeriodo}
          alActualizar={() => void cargar(filtroAplicado)}
          alLimpiarFiltros={limpiarFiltrosReporte}
          alExportar={exportarActual}
          alImprimir={imprimirActual}
        />
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
          <p className="font-black">Sin secciones de reporte asignadas</p>
          <p className="mt-1 text-amber-700 dark:text-amber-300">El usuario puede acceder al módulo, pero no tiene autorización para consultar ningún tipo de reporte.</p>
        </section>
      )}

      {error && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/25"><AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700"/><div><p className="text-sm font-black text-amber-900 dark:text-amber-200">No se pudo actualizar la información</p><p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{error}. Se mantienen los últimos datos cargados.</p></div></div>}

      {pestanaActiva === "PedidosYa" && mensajePedidosYa && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/25">
          <Check size={19} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
          <div className="min-w-0">
            <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">Liquidación registrada</p>
            <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-300">{mensajePedidosYa}</p>
          </div>
        </div>
      )}

      {pestanaActiva === "Resumen" && (
        <PanelResumenReportes
          panel={datos.panel}
          conciliacion={datos.conciliacion}
        />
      )}

      {pestanaActiva === "Ventas" && (
        <PanelVentasReportes
          ventas={ventasFiltradas}
          pagina={paginaSegura}
          porPagina={REGISTROS_POR_PAGINA}
        />
      )}

      {pestanaActiva === "PedidosYa" && (
        <PanelPedidosYa
          resumen={datos.pedidosYa}
          ventas={pedidosYaOrdenados}
          pagina={paginaSegura}
          porPagina={REGISTROS_POR_PAGINA}
          puedeLiquidar={puedeLiquidarPedidosYa}
          alRegistrarLiquidacion={abrirLiquidacionPedidosYa}
        />
      )}

      {pestanaActiva === "Arqueos" && (
        <PanelArqueos
          conciliacion={datos.conciliacion}
          arqueos={arqueosFiltrados}
          pagina={paginaSegura}
          porPagina={REGISTROS_POR_PAGINA}
        />
      )}

      {pestanaActiva === "Inventario" && (
        <PanelInventarioReportes
          movimientos={inventarioFiltrado}
          pagina={paginaSegura}
          porPagina={REGISTROS_POR_PAGINA}
        />
      )}

      {pestanaActiva === "Actividad por usuario" && (
        <PanelUsuariosReportes
          usuarios={usuariosFiltrados}
          pagina={paginaSegura}
          porPagina={REGISTROS_POR_PAGINA}
        />
      )}

      {pestanaActiva === "Bitácora" && (
        <PanelBitacora
          registros={auditoriaFiltrada}
          pagina={paginaSegura}
          porPagina={REGISTROS_POR_PAGINA}
        />
      )}

      {pestanaActiva !== "Resumen" &&
        registrosActivos.length > 0 && (
          <PaginacionReportes
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            totalRegistros={registrosActivos.length}
            alCambiarPagina={setPagina}
          />
        )}

      <Modal
        abierto={modalLiquidacionPedidosYa}
        titulo="Registrar liquidación PedidosYa"
        descripcion="Confirma la transferencia recibida para los pedidos ya entregados dentro del periodo seleccionado."
        ancho="mediano"
        alCerrar={() => {
          if (!procesandoLiquidacionPedidosYa) {
            setModalLiquidacionPedidosYa(false);
            setErrorLiquidacionPedidosYa(null);
          }
        }}
      >
        <div className="space-y-5 p-5 sm:p-6">
          <section className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-fuchsia-700 dark:text-fuchsia-300">Periodo a liquidar</p>
                <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                  {fechaIsoLegible(filtroAplicado.fechaDesde)} - {fechaIsoLegible(filtroAplicado.fechaHasta)}
                </p>
              </div>
              <span className="rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-xs font-black text-fuchsia-700 dark:border-fuchsia-800 dark:bg-slate-900 dark:text-fuchsia-300">
                {datos.pedidosYa.cantidadPendiente} pedido(s)
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4 border-t border-fuchsia-200 pt-4 dark:border-fuchsia-900/60">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ventas brutas pendientes</p>
                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{moneda(datos.pedidosYa.montoPendiente)}</p>
              </div>
              {datos.pedidosYa.cantidadEnCurso > 0 && (
                <p className="max-w-48 text-right text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {datos.pedidosYa.cantidadEnCurso} pedido(s) todavía en curso no se incluirán hasta ser entregados.
                </p>
              )}
            </div>
          </section>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Monto transferido por PedidosYa</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={montoLiquidacionPedidosYa}
              disabled={procesandoLiquidacionPedidosYa}
              onChange={(evento) => {
                setMontoLiquidacionPedidosYa(evento.target.value);
                setErrorLiquidacionPedidosYa(null);
              }}
              className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-black text-slate-900 outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-fuchsia-950/50"
            />
          </label>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Diferencia / ajustes</span>
            <strong className={Math.abs(diferenciaLiquidacionCalculada) <= 0.009 ? "text-sm text-emerald-700 dark:text-emerald-300" : "text-sm text-amber-700 dark:text-amber-300"}>
              {moneda(diferenciaLiquidacionCalculada)}
            </strong>
          </div>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Observación {Math.abs(diferenciaLiquidacionCalculada) > 0.009 ? "(obligatoria por diferencia)" : "(opcional)"}
            </span>
            <textarea
              rows={3}
              maxLength={300}
              value={observacionLiquidacionPedidosYa}
              disabled={procesandoLiquidacionPedidosYa}
              onChange={(evento) => {
                setObservacionLiquidacionPedidosYa(evento.target.value);
                setErrorLiquidacionPedidosYa(null);
              }}
              placeholder="Ej.: comisión, ajuste informado por la plataforma o referencia de la transferencia..."
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-fuchsia-950/50"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
            Solo se marcarán como liquidados los pedidos de PedidosYa <strong>ya entregados</strong> y todavía pendientes dentro de este rango. Los pedidos fuera de las fechas seleccionadas conservarán su deuda pendiente.
          </div>

          {errorLiquidacionPedidosYa && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/25 dark:text-red-300">
              {errorLiquidacionPedidosYa}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              disabled={procesandoLiquidacionPedidosYa}
              onClick={() => setModalLiquidacionPedidosYa(false)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={procesandoLiquidacionPedidosYa || datos.pedidosYa.cantidadPendiente === 0}
              onClick={() => void confirmarLiquidacionPedidosYa()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fuchsia-700 px-5 text-sm font-bold text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-500"
            >
              {procesandoLiquidacionPedidosYa ? <RefreshCw size={17} className="animate-spin" /> : <Check size={17} />}
              Confirmar liquidación
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const columnasResumen: ColumnaExportacion<FilaResumenExportacion>[] = [
  { encabezado: "Indicador", obtenerValor: (fila) => fila.indicador, peso: 1.25 },
  { encabezado: "Valor", obtenerValor: (fila) => fila.valor, peso: 0.7 },
  { encabezado: "Interpretación", obtenerValor: (fila) => fila.descripcion, peso: 2.05 },
];

const columnasVentas: ColumnaExportacion<FilaReporteVenta>[] = [
  { encabezado: "Pedido", obtenerValor: (fila) => fila.numeroPedido, peso: 0.6 },
  { encabezado: "Fecha", obtenerValor: (fila) => fechaHora(fila.fechaHoraRegistro), peso: 0.85 },
  { encabezado: "Canal", obtenerValor: (fila) => fila.canalVenta, peso: 0.6 },
  { encabezado: "Cliente", obtenerValor: (fila) => fila.cliente, peso: 0.85 },
  { encabezado: "Productos", obtenerValor: (fila) => fila.productos, peso: 1.5 },
  { encabezado: "Total", obtenerValor: (fila) => moneda(fila.total), peso: 0.7, alineacion: "derecha" },
  { encabezado: "Pago", obtenerValor: (fila) => fila.canalVenta === "PedidosYa" ? "PedidosYa" : fila.metodoPago ?? "Sin pago", peso: 0.65 },
  { encabezado: "Estado", obtenerValor: (fila) => `${fila.estadoCobro} / ${fila.estadoPreparacion}`, peso: 1.1 },
];

const columnasPedidosYa: ColumnaExportacion<Venta>[] = [
  { encabezado: "Pedido", obtenerValor: (fila) => fila.numeroPedido, peso: 0.65 },
  { encabezado: "Fecha", obtenerValor: (fila) => fechaHora(fila.fechaHoraRegistro), peso: 0.9 },
  { encabezado: "Referencia", obtenerValor: (fila) => fila.referenciaPedidosYa ?? "Sin referencia", peso: 0.85 },
  { encabezado: "Productos", obtenerValor: (fila) => fila.detalles.map((detalle) => `${detalle.cantidad} × ${detalle.nombreProducto}`).join(" · "), peso: 1.75 },
  { encabezado: "Total", obtenerValor: (fila) => moneda(fila.total), peso: 0.75, alineacion: "derecha" },
  { encabezado: "Operación", obtenerValor: (fila) => fila.estadoPreparacion, peso: 0.9 },
  { encabezado: "Liquidación", obtenerValor: (fila) => etiquetaEstadoPedidosYa(fila), peso: 0.9 },
  { encabezado: "Entregado por", obtenerValor: (fila) => fila.usuarioEntregaNombre ?? "Pendiente", peso: 1 },
];

const columnasArqueos: ColumnaExportacion<ArqueoAdministrativo>[] = [
  { encabezado: "Caja", obtenerValor: (fila) => `#${fila.sesionCajaId}`, peso: 0.55 },
  { encabezado: "Responsable", obtenerValor: (fila) => fila.usuarioAperturaNombre, peso: 1.15 },
  { encabezado: "Apertura", obtenerValor: (fila) => fechaHora(fila.fechaHoraApertura), peso: 1.05 },
  { encabezado: "Cierre", obtenerValor: (fila) => fechaHora(fila.fechaHoraCierre), peso: 1.05 },
  { encabezado: "Esperado", obtenerValor: (fila) => moneda(fila.efectivoEsperadoCalculado), peso: 0.85, alineacion: "derecha" },
  { encabezado: "Contado", obtenerValor: (fila) => fila.montoContado === null ? "-" : moneda(fila.montoContado), peso: 0.85, alineacion: "derecha" },
  { encabezado: "Diferencia", obtenerValor: (fila) => fila.diferenciaRegistrada === null ? "-" : moneda(fila.diferenciaRegistrada), peso: 0.85, alineacion: "derecha" },
  { encabezado: "Estado", obtenerValor: (fila) => fila.estadoConciliacion, peso: 0.9 },
];

const columnasInventario: ColumnaExportacion<FilaReporteInventario>[] = [
  { encabezado: "Fecha", obtenerValor: (fila) => fechaHora(fila.fechaHora), peso: 0.9 },
  { encabezado: "Insumo", obtenerValor: (fila) => fila.insumo, peso: 1.15 },
  { encabezado: "Movimiento", obtenerValor: (fila) => fila.tipoMovimiento, peso: 1.05 },
  { encabezado: "Cantidad", obtenerValor: (fila) => `${fila.cantidad} ${fila.unidad}`, peso: 0.75 },
  { encabezado: "Stock final", obtenerValor: (fila) => `${fila.stockPosterior} ${fila.unidad}`, peso: 0.75 },
  { encabezado: "Usuario", obtenerValor: (fila) => fila.usuario, peso: 0.9 },
  { encabezado: "Referencia", obtenerValor: (fila) => fila.referencia ?? "-", peso: 0.85 },
  { encabezado: "Motivo", obtenerValor: (fila) => fila.motivo, peso: 1.35 },
  { encabezado: "Valor", obtenerValor: (fila) => fila.impactoEconomico === null ? "Sin valoración" : moneda(fila.impactoEconomico), peso: 0.8, alineacion: "derecha" },
];

const columnasUsuarios: ColumnaExportacion<FilaReporteUsuario>[] = [
  { encabezado: "Usuario", obtenerValor: (fila) => fila.usuario, peso: 1.15 },
  { encabezado: "Ventas", obtenerValor: (fila) => fila.ventasRegistradas, peso: 0.55, alineacion: "centro" },
  { encabezado: "Monto registrado", obtenerValor: (fila) => moneda(fila.montoVentasRegistradas), peso: 0.85, alineacion: "derecha" },
  { encabezado: "Cobros", obtenerValor: (fila) => fila.cobrosRealizados, peso: 0.55, alineacion: "centro" },
  { encabezado: "Monto cobrado", obtenerValor: (fila) => moneda(fila.montoCobrado), peso: 0.85, alineacion: "derecha" },
  { encabezado: "Inventario", obtenerValor: (fila) => fila.movimientosInventario, peso: 0.65, alineacion: "centro" },
  { encabezado: "Caja", obtenerValor: (fila) => `${fila.movimientosCaja} mov. / ${fila.aperturasCaja} ap. / ${fila.cierresCaja} ci.`, peso: 1.05 },
  { encabezado: "Bitácora", obtenerValor: (fila) => fila.eventosAuditoria, peso: 0.65, alineacion: "centro" },
  { encabezado: "Acciones", obtenerValor: (fila) => fila.totalAcciones, peso: 0.65, alineacion: "centro" },
];

const columnasAuditoria: ColumnaExportacion<RegistroAuditoria>[] = [
  { encabezado: "Fecha", obtenerValor: (fila) => fechaHora(fila.fechaHora), peso: 1 },
  { encabezado: "Usuario", obtenerValor: (fila) => fila.usuarioNombre, peso: 1 },
  { encabezado: "Módulo", obtenerValor: (fila) => fila.modulo, peso: 0.9 },
  { encabezado: "Acción", obtenerValor: (fila) => fila.accion, peso: 1 },
  { encabezado: "Entidad", obtenerValor: (fila) => `${fila.entidad}${fila.entidadId === null ? "" : ` #${fila.entidadId}`}`, peso: 0.9 },
  { encabezado: "Nivel", obtenerValor: (fila) => fila.nivel, peso: 0.7 },
  { encabezado: "Descripción", obtenerValor: (fila) => fila.descripcion, peso: 2 },
];

export default Reportes;
