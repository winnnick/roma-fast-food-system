import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FilterX,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  formatearCantidadInventario,
  listarInsumosInventario,
  listarMovimientosInventario,
} from "../../servicios/inventarioServicio";

import type {
  InsumoInventario,
  MovimientoInventario,
  TipoMovimientoInventario,
} from "../../tipos/inventario";
import type { DatosNotificacion } from "../../shared/feedback/NotificacionFlotante";

interface PanelMovimientosProps {
  alNotificar: (notificacion: DatosNotificacion) => void;
}

const REGISTROS_POR_PAGINA = 7;

const TIPOS_MOVIMIENTO: TipoMovimientoInventario[] = [
  "Stock inicial",
  "Entrada",
  "Consumo automático",
  "Reversión por anulación",
  "Merma por anulación",
  "Ajuste positivo",
  "Ajuste negativo",
  "Conteo físico",
];

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function fechaCorta(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(fechaIso));
}

function horaCorta(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}


function claseTipo(tipo: TipoMovimientoInventario): string {
  if (
    tipo === "Consumo automático" ||
    tipo === "Ajuste negativo" ||
    tipo === "Merma por anulación"
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }

  if (
    tipo === "Entrada" ||
    tipo === "Ajuste positivo" ||
    tipo === "Reversión por anulación"
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (tipo === "Conteo físico") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  }

  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

function detalleMovimiento(
  movimiento: MovimientoInventario,
): string {
  const motivo = movimiento.motivo?.trim() ?? "";

  if (
    movimiento.tipo === "Consumo automático" &&
    movimiento.numeroPedido
  ) {
    return `Pedido ${movimiento.numeroPedido}`;
  }

  if (!motivo) {
    return "Sin detalle adicional";
  }

  return motivo;
}

function PanelMovimientos({ alNotificar }: PanelMovimientosProps) {
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState("");
  const [insumoId, setInsumoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const [listaInsumos, listaMovimientos] = await Promise.all([
        listarInsumosInventario(),
        listarMovimientosInventario({
          insumoId: insumoId ? Number(insumoId) : undefined,
          tipo: tipo ? (tipo as TipoMovimientoInventario) : undefined,
          texto: texto || undefined,
          fechaDesde: fechaDesde || undefined,
          fechaHasta: fechaHasta || undefined,
        }),
      ]);

      setInsumos(listaInsumos);
      setMovimientos(listaMovimientos);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo: "No se pudieron cargar los movimientos",
        mensaje: mensajeError(error),
      });
    } finally {
      setCargando(false);
    }
  }, [alNotificar, insumoId, tipo, texto, fechaDesde, fechaHasta]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargar();
    }, 120);

    return () => window.clearTimeout(temporizador);
  }, [cargar]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(movimientos.length / REGISTROS_POR_PAGINA),
  );

  const paginaSegura = Math.min(pagina, totalPaginas);

  const movimientosPagina = useMemo(
    () =>
      movimientos.slice(
        (paginaSegura - 1) * REGISTROS_POR_PAGINA,
        paginaSegura * REGISTROS_POR_PAGINA,
      ),
    [movimientos, paginaSegura],
  );

  const desdeRegistro =
    movimientos.length === 0
      ? 0
      : (paginaSegura - 1) * REGISTROS_POR_PAGINA + 1;

  const hastaRegistro = Math.min(
    paginaSegura * REGISTROS_POR_PAGINA,
    movimientos.length,
  );

  function limpiar() {
    setTexto("");
    setInsumoId("");
    setTipo("");
    setFechaDesde("");
    setFechaHasta("");
    setPagina(1);
  }

  return (
    <div className="min-h-[38rem]">
      <header className="border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Movimientos de inventario
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Revisa entradas, consumos, ajustes y conteos sin mezclar información secundaria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {movimientos.length} movimientos
            </span>

            <button
              type="button"
              title="Actualizar movimientos"
              aria-label="Actualizar movimientos"
              onClick={() => void cargar()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 2xl:grid-cols-[minmax(300px,1.35fr)_220px_220px_minmax(310px,.95fr)_48px]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={texto}
              placeholder="Pedido, insumo, motivo o usuario"
              onChange={(evento) => {
                setTexto(evento.target.value);
                setPagina(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
            />
          </div>

          <select
            value={insumoId}
            onChange={(evento) => {
              setInsumoId(evento.target.value);
              setPagina(1);
            }}
            className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Todos los insumos</option>
            {insumos.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(evento) => {
              setTipo(evento.target.value);
              setPagina(1);
            }}
            className="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Todos los movimientos</option>
            {TIPOS_MOVIMIENTO.map((tipoMovimiento) => (
              <option key={tipoMovimiento} value={tipoMovimiento}>
                {tipoMovimiento}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900">
            <label className="relative border-r border-slate-200 dark:border-slate-700">
              <span className="sr-only">Fecha inicial</span>
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={fechaDesde}
                onChange={(evento) => {
                  setFechaDesde(evento.target.value);
                  setPagina(1);
                }}
                className="h-11 w-full bg-transparent pl-9 pr-2 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
              />
            </label>

            <label className="relative">
              <span className="sr-only">Fecha final</span>
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={fechaHasta}
                onChange={(evento) => {
                  setFechaHasta(evento.target.value);
                  setPagina(1);
                }}
                className="h-11 w-full bg-transparent pl-9 pr-2 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
              />
            </label>
          </div>

          <button
            type="button"
            title="Limpiar filtros"
            aria-label="Limpiar filtros"
            onClick={limpiar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FilterX size={17} />
          </button>
        </div>
      </header>

      {cargando ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 7 }).map((_, indice) => (
            <div
              key={indice}
              className="h-18 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : movimientos.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <FileSearch size={38} className="text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
            Sin movimientos encontrados
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            No existen registros que coincidan con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[35.25rem] overflow-y-auto">
            <div className="sticky top-0 z-10 hidden grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_minmax(0,.75fr)_minmax(0,.95fr)_minmax(0,.8fr)] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:grid">
              <span>Fecha y usuario</span>
              <span>Insumo</span>
              <span>Movimiento</span>
              <span>Cantidad y saldo</span>
              <span>Detalle</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {movimientosPagina.map((movimiento) => (
                <article
                  key={movimiento.id}
                  className="grid gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1.35fr)_minmax(0,.75fr)_minmax(0,.95fr)_minmax(0,.8fr)] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {fechaCorta(movimiento.fechaHora)}
                    </p>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="shrink-0">{horaCorta(movimiento.fechaHora)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate" title={movimiento.usuarioNombre}>
                        {movimiento.usuarioNombre}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="font-black text-slate-900 dark:text-white">
                      {movimiento.insumoNombre}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      {movimiento.insumoCodigo}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${claseTipo(
                        movimiento.tipo,
                      )}`}
                    >
                      {movimiento.tipo}
                    </span>
                  </div>

                  <div>
                    <p
                      className={`font-black ${
                        movimiento.cantidad < 0
                          ? "text-red-700 dark:text-red-300"
                          : movimiento.cantidad > 0
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {movimiento.cantidad > 0 ? "+" : ""}
                      {formatearCantidadInventario(
                        movimiento.cantidad,
                        movimiento.unidadBase,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Saldo: {formatearCantidadInventario(
                        movimiento.stockPosterior,
                        movimiento.unidadBase,
                      )}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p
                      className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                      title={detalleMovimiento(movimiento)}
                    >
                      {detalleMovimiento(movimiento)}
                    </p>
                    {movimiento.cantidadClasificada !== null && (
                      <p className="mt-1 text-xs font-semibold text-red-500 dark:text-red-300">
                        Clasificado: {formatearCantidadInventario(
                          movimiento.cantidadClasificada,
                          movimiento.unidadBase,
                        )}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {desdeRegistro}-{hastaRegistro} de {movimientos.length}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Página {paginaSegura} de {totalPaginas}
              </span>

              <button
                type="button"
                title="Página anterior"
                aria-label="Página anterior"
                disabled={paginaSegura <= 1}
                onClick={() =>
                  setPagina((actual) => Math.max(1, actual - 1))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                title="Página siguiente"
                aria-label="Página siguiente"
                disabled={paginaSegura >= totalPaginas}
                onClick={() =>
                  setPagina((actual) => Math.min(totalPaginas, actual + 1))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default PanelMovimientos;
