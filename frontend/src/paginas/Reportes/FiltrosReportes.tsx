import {
  CalendarDays,
  FileDown,
  Filter,
  FilterX,
  LoaderCircle,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";

import type {
  FiltroPeriodoAnalitica,
  PeriodoRapidoAnalitica,
} from "../../tipos/analitica";

import type {
  ModuloAuditoria,
  NivelAuditoria,
} from "../../tipos/auditoria";

import type {
  MetodoPago,
} from "../../tipos/caja";

import type {
  TipoMovimientoInventario,
} from "../../tipos/inventario";

import type {
  EstadoCobro,
  EstadoPreparacion,
} from "../../tipos/venta";

import type {
  EstadoConciliacionCaja,
} from "../../servicios/conciliacionServicio";

interface FiltrosReportesProps {
  seccion: string;
  actualizadoEn: string;
  periodoRapido: PeriodoRapidoAnalitica;
  filtro: FiltroPeriodoAnalitica;
  texto: string;
  cargando: boolean;
  cantidadRegistros: number;
  mostrarBusqueda?: boolean;
  puedeExportar: boolean;
  puedeImprimir: boolean;

  filtroCobro: "Todos" | EstadoCobro;
  filtroPreparacion: "Todos" | EstadoPreparacion;
  filtroMetodo: "Todos" | MetodoPago;
  filtroEstadoArqueo: "Todos" | EstadoConciliacionCaja;
  filtroTipoInventario: "Todos" | TipoMovimientoInventario;
  filtroModuloAuditoria: "Todos" | ModuloAuditoria;
  filtroNivelAuditoria: "Todos" | NivelAuditoria;

  alSeleccionarPeriodo: (
    periodo: PeriodoRapidoAnalitica,
  ) => void;
  alCambiarFiltro: (
    filtro: FiltroPeriodoAnalitica,
  ) => void;
  alCambiarTexto: (texto: string) => void;
  alCambiarCobro: (
    valor: "Todos" | EstadoCobro,
  ) => void;
  alCambiarPreparacion: (
    valor: "Todos" | EstadoPreparacion,
  ) => void;
  alCambiarMetodo: (
    valor: "Todos" | MetodoPago,
  ) => void;
  alCambiarEstadoArqueo: (
    valor: "Todos" | EstadoConciliacionCaja,
  ) => void;
  alCambiarTipoInventario: (
    valor: "Todos" | TipoMovimientoInventario,
  ) => void;
  alCambiarModuloAuditoria: (
    valor: "Todos" | ModuloAuditoria,
  ) => void;
  alCambiarNivelAuditoria: (
    valor: "Todos" | NivelAuditoria,
  ) => void;
  alAplicar: () => void;
  alActualizar: () => void;
  alLimpiarFiltros: () => void;
  alExportar: () => void;
  alImprimir: () => void;
}

const PERIODOS_RAPIDOS: PeriodoRapidoAnalitica[] = [
  "Hoy",
  "Últimos 7 días",
  "Este mes",
  "Mes anterior",
];

const TIPOS_INVENTARIO: TipoMovimientoInventario[] = [
  "Stock inicial",
  "Entrada",
  "Consumo automático",
  "Reversión por anulación",
  "Merma por anulación",
  "Ajuste positivo",
  "Ajuste negativo",
  "Conteo físico",
];

const MODULOS_AUDITORIA: ModuloAuditoria[] = [
  "Autenticación",
  "Usuarios",
  "Roles y permisos",
  "Productos",
  "Clientes",
  "Ventas",
  "Preparación",
  "Caja",
  "Inventario",
  "Recetas",
  "Conteos físicos",
  "Reportes",
  "Configuración",
  "Sistema",
];

function obtenerPlaceholderBusqueda(
  seccion: string,
): string {
  const placeholders: Record<string, string> = {
    Ventas: "Pedido, cliente o producto...",
    Arqueos: "Sesión o responsable...",
    Inventario: "Insumo, responsable o referencia...",
    "Actividad por usuario": "Nombre del responsable...",
    Bitácora: "Usuario, acción, entidad o descripción...",
  };

  return placeholders[seccion] ?? "Buscar en los registros...";
}

const claseControl = `
  h-10 w-full rounded-xl border
  border-slate-300 bg-white px-3
  text-xs font-semibold text-slate-700
  outline-none transition-colors
  focus:border-roma-500 focus:ring-4 focus:ring-roma-100
  disabled:bg-slate-100 disabled:opacity-60
  dark:border-slate-700 dark:bg-slate-950
  dark:text-slate-200 dark:focus:border-roma-500
  dark:focus:ring-roma-950 dark:disabled:bg-slate-900
`;

function FiltrosReportes({
  seccion,
  actualizadoEn,
  periodoRapido,
  filtro,
  texto,
  cargando,
  cantidadRegistros,
  mostrarBusqueda = true,
  puedeExportar,
  puedeImprimir,
  filtroCobro,
  filtroPreparacion,
  filtroMetodo,
  filtroEstadoArqueo,
  filtroTipoInventario,
  filtroModuloAuditoria,
  filtroNivelAuditoria,
  alSeleccionarPeriodo,
  alCambiarFiltro,
  alCambiarTexto,
  alCambiarCobro,
  alCambiarPreparacion,
  alCambiarMetodo,
  alCambiarEstadoArqueo,
  alCambiarTipoInventario,
  alCambiarModuloAuditoria,
  alCambiarNivelAuditoria,
  alAplicar,
  alActualizar,
  alLimpiarFiltros,
  alExportar,
  alImprimir,
}: FiltrosReportesProps) {
  const tieneFiltrosEspecificos =
    seccion === "Ventas" ||
    seccion === "Arqueos" ||
    seccion === "Inventario" ||
    seccion === "Bitácora";

  const mostrarSegundaFila =
    mostrarBusqueda || tieneFiltrosEspecificos;

  const columnasAccionesPeriodo = mostrarSegundaFila
    ? "xl:grid-cols-[170px_170px_auto_auto_44px]"
    : puedeExportar && puedeImprimir
      ? "xl:grid-cols-[170px_170px_auto_auto_44px_auto_auto]"
      : puedeExportar || puedeImprimir
        ? "xl:grid-cols-[170px_170px_auto_auto_44px_auto]"
        : "xl:grid-cols-[170px_170px_auto_auto_44px]";

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <Filter
                size={18}
                className="text-roma-700 dark:text-roma-300"
              />
              Periodo de análisis
            </div>

            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Actualizado {actualizadoEn}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PERIODOS_RAPIDOS.map((periodo) => (
              <button
                key={periodo}
                type="button"
                disabled={cargando}
                onClick={() => alSeleccionarPeriodo(periodo)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                  periodoRapido === periodo
                    ? "border-roma-700 bg-roma-700 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-roma-200 hover:bg-roma-50 hover:text-roma-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-roma-700 dark:hover:bg-roma-950/35 dark:hover:text-roma-200"
                } disabled:opacity-50`}
              >
                {periodo}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`grid gap-3 sm:grid-cols-2 ${columnasAccionesPeriodo}`}
        >
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Fecha inicial
            </span>
            <div className="relative mt-1.5">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={filtro.fechaDesde}
                disabled={cargando}
                onChange={(evento) =>
                  alCambiarFiltro({
                    ...filtro,
                    fechaDesde: evento.target.value,
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-600 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-roma-500 dark:focus:ring-roma-950 dark:disabled:bg-slate-900"
              />
            </div>
          </label>

          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Fecha final
            </span>
            <div className="relative mt-1.5">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={filtro.fechaHasta}
                disabled={cargando}
                onChange={(evento) =>
                  alCambiarFiltro({
                    ...filtro,
                    fechaHasta: evento.target.value,
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-600 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-roma-500 dark:focus:ring-roma-950 dark:disabled:bg-slate-900"
              />
            </div>
          </label>

          <button
            type="button"
            disabled={cargando}
            onClick={alAplicar}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {cargando ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Filter size={17} />
            )}
            Aplicar
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={alActualizar}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={17}
              className={cargando ? "animate-spin" : ""}
            />
            Actualizar
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={alLimpiarFiltros}
            title="Limpiar todos los filtros"
            aria-label="Limpiar todos los filtros"
            className="inline-flex h-11 w-11 items-center justify-center self-end rounded-xl border border-slate-300 bg-white text-slate-600 transition-colors hover:border-roma-200 hover:bg-roma-50 hover:text-roma-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-roma-800 dark:hover:bg-roma-950/30 dark:hover:text-roma-200"
          >
            <FilterX size={17} />
          </button>

          {!mostrarSegundaFila && puedeExportar && (
            <button
              type="button"
              disabled={cargando || cantidadRegistros === 0}
              onClick={alExportar}
              className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <FileDown size={17} />
              PDF
            </button>
          )}

          {!mostrarSegundaFila && puedeImprimir && (
            <button
              type="button"
              disabled={cargando || cantidadRegistros === 0}
              onClick={alImprimir}
              className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Printer size={17} />
              Imprimir
            </button>
          )}
        </div>
      </div>

      {mostrarSegundaFila && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {mostrarBusqueda && (
                <label className="min-w-0 md:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Buscar
                  </span>
                  <div className="relative mt-1.5">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={texto}
                      disabled={cargando}
                      onChange={(evento) =>
                        alCambiarTexto(evento.target.value)
                      }
                      placeholder={obtenerPlaceholderBusqueda(seccion)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-xs font-semibold text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-roma-500 dark:focus:ring-roma-950"
                    />
                    {texto && (
                      <button
                        type="button"
                        onClick={() => alCambiarTexto("")}
                        title="Limpiar búsqueda"
                        aria-label="Limpiar búsqueda"
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <FilterX size={15} />
                      </button>
                    )}
                  </div>
                </label>
              )}

              {seccion === "Ventas" && (
                <>
                  <label className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Estado de cobro
                    </span>
                    <select
                      value={filtroCobro}
                      onChange={(evento) =>
                        alCambiarCobro(
                          evento.target.value as "Todos" | EstadoCobro,
                        )
                      }
                      className={`mt-1.5 ${claseControl}`}
                    >
                      <option value="Todos">Todos</option>
                      <option value="Pendiente de cobro">Pendiente de cobro</option>
                      <option value="Cobrada">Cobrada</option>
                      <option value="Pendiente de liquidación">Pendiente de liquidación</option>
                      <option value="Liquidada">Liquidada</option>
                      <option value="Anulada">Anulada</option>
                    </select>
                  </label>

                  <label className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Preparación
                    </span>
                    <select
                      value={filtroPreparacion}
                      onChange={(evento) =>
                        alCambiarPreparacion(
                          evento.target.value as "Todos" | EstadoPreparacion,
                        )
                      }
                      className={`mt-1.5 ${claseControl}`}
                    >
                      <option value="Todos">Todos</option>
                      <option value="En cola">En cola</option>
                      <option value="En preparación">En preparación</option>
                      <option value="Entrega directa">Entrega directa</option>
                      <option value="Listo">Listo</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Anulado">Anulado</option>
                    </select>
                  </label>

                  <label className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Método de pago
                    </span>
                    <select
                      value={filtroMetodo}
                      onChange={(evento) =>
                        alCambiarMetodo(
                          evento.target.value as "Todos" | MetodoPago,
                        )
                      }
                      className={`mt-1.5 ${claseControl}`}
                    >
                      <option value="Todos">Todos</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="QR">QR</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </label>
                </>
              )}

              {seccion === "Arqueos" && (
                <label className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Resultado de la sesión
                  </span>
                  <select
                    value={filtroEstadoArqueo}
                    onChange={(evento) =>
                      alCambiarEstadoArqueo(
                        evento.target.value as
                          | "Todos"
                          | EstadoConciliacionCaja,
                      )
                    }
                    className={`mt-1.5 ${claseControl}`}
                  >
                    <option value="Todos">Todas las sesiones</option>
                    <option value="Conciliada">Sin diferencia</option>
                    <option value="Con diferencias">Con diferencias</option>
                    <option value="Abierta">Abiertas</option>
                  </select>
                </label>
              )}

              {seccion === "Inventario" && (
                <label className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Movimiento
                  </span>
                  <select
                    value={filtroTipoInventario}
                    onChange={(evento) =>
                      alCambiarTipoInventario(
                        evento.target.value as
                          | "Todos"
                          | TipoMovimientoInventario,
                      )
                    }
                    className={`mt-1.5 ${claseControl}`}
                  >
                    <option value="Todos">Todos los movimientos</option>
                    {TIPOS_INVENTARIO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {seccion === "Bitácora" && (
                <>
                  <label className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Módulo
                    </span>
                    <select
                      value={filtroModuloAuditoria}
                      onChange={(evento) =>
                        alCambiarModuloAuditoria(
                          evento.target.value as
                            | "Todos"
                            | ModuloAuditoria,
                        )
                      }
                      className={`mt-1.5 ${claseControl}`}
                    >
                      <option value="Todos">Todos los módulos</option>
                      {MODULOS_AUDITORIA.map((modulo) => (
                        <option key={modulo} value={modulo}>
                          {modulo}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Nivel
                    </span>
                    <select
                      value={filtroNivelAuditoria}
                      onChange={(evento) =>
                        alCambiarNivelAuditoria(
                          evento.target.value as "Todos" | NivelAuditoria,
                        )
                      }
                      className={`mt-1.5 ${claseControl}`}
                    >
                      <option value="Todos">Todos los niveles</option>
                      <option value="Información">Información</option>
                      <option value="Advertencia">Advertencia</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {cantidadRegistros} {cantidadRegistros === 1 ? "registro" : "registros"}
              </span>

              {puedeExportar && (
                <button
                  type="button"
                  disabled={cargando || cantidadRegistros === 0}
                  onClick={alExportar}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FileDown size={16} />
                  PDF
                </button>
              )}

              {puedeImprimir && (
                <button
                  type="button"
                  disabled={cargando || cantidadRegistros === 0}
                  onClick={alImprimir}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default FiltrosReportes;
