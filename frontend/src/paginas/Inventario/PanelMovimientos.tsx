import {
  ArrowDownCircle,
  ArrowDownUp,
  ArrowUpCircle,
  CalendarDays,
  FileSearch,
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

import type {
  DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

interface PanelMovimientosProps {
  alNotificar: (
    notificacion: DatosNotificacion,
  ) => void;
}

const TIPOS_MOVIMIENTO:
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

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function fechaHora(fechaIso: string): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fechaIso));
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

function claseTipo(
  tipo: TipoMovimientoInventario,
): string {
  if (
    tipo === "Consumo automático" ||
    tipo === "Ajuste negativo" ||
    tipo === "Merma por anulación"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    tipo === "Entrada" ||
    tipo === "Ajuste positivo" ||
    tipo === "Reversión por anulación"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (tipo === "Conteo físico") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

function PanelMovimientos({
  alNotificar,
}: PanelMovimientosProps) {
  const [insumos, setInsumos] =
    useState<InsumoInventario[]>([]);

  const [movimientos, setMovimientos] =
    useState<MovimientoInventario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [texto, setTexto] =
    useState("");

  const [insumoId, setInsumoId] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [fechaDesde, setFechaDesde] =
    useState("");

  const [fechaHasta, setFechaHasta] =
    useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const [listaInsumos, listaMovimientos] =
        await Promise.all([
          listarInsumosInventario(),
          listarMovimientosInventario({
            insumoId: insumoId
              ? Number(insumoId)
              : undefined,
            tipo: tipo
              ? (tipo as TipoMovimientoInventario)
              : undefined,
            texto: texto || undefined,
            fechaDesde:
              fechaDesde || undefined,
            fechaHasta:
              fechaHasta || undefined,
          }),
        ]);

      setInsumos(listaInsumos);
      setMovimientos(listaMovimientos);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo:
          "No se pudieron cargar los movimientos",
        mensaje: mensajeError(error),
      });
    } finally {
      setCargando(false);
    }
  }, [
    alNotificar,
    insumoId,
    tipo,
    texto,
    fechaDesde,
    fechaHasta,
  ]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargar();
    }, 0);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [cargar]);

  const resumen = useMemo(() => {
    const entradas = movimientos
      .filter(
        (movimiento) =>
          movimiento.cantidad > 0,
      )
      .reduce(
        (acumulado, movimiento) =>
          acumulado +
          Math.abs(movimiento.cantidad),
        0,
      );

    const salidas = movimientos
      .filter(
        (movimiento) =>
          movimiento.cantidad < 0,
      )
      .reduce(
        (acumulado, movimiento) =>
          acumulado +
          Math.abs(movimiento.cantidad),
        0,
      );

    return {
      entradas,
      salidas,
      total: movimientos.length,
    };
  }, [movimientos]);

  function limpiar() {
    setTexto("");
    setInsumoId("");
    setTipo("");
    setFechaDesde("");
    setFechaHasta("");
  }

  return (
    <div>
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Libro de movimientos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Cada variación conserva su
              origen, usuario, referencia y
              stock anterior y posterior.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void cargar()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_170px_170px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={texto}
              placeholder="Pedido, insumo, referencia o usuario..."
              onChange={(evento) =>
                setTexto(
                  evento.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <select
            value={insumoId}
            onChange={(evento) =>
              setInsumoId(
                evento.target.value,
              )
            }
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
          >
            <option value="">
              Todos los insumos
            </option>

            {insumos.map((insumo) => (
              <option
                key={insumo.id}
                value={insumo.id}
              >
                {insumo.nombre}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(evento) =>
              setTipo(
                evento.target.value,
              )
            }
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
          >
            <option value="">
              Todos los movimientos
            </option>

            {TIPOS_MOVIMIENTO.map(
              (tipoMovimiento) => (
                <option
                  key={tipoMovimiento}
                  value={tipoMovimiento}
                >
                  {tipoMovimiento}
                </option>
              ),
            )}
          </select>

          <div className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="date"
              value={fechaDesde}
              onChange={(evento) =>
                setFechaDesde(
                  evento.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="date"
              value={fechaHasta}
              onChange={(evento) =>
                setFechaHasta(
                  evento.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <button
            type="button"
            onClick={limpiar}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:grid-cols-3 sm:p-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ArrowDownUp size={20} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Resultados
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {resumen.total}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowUpCircle size={20} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Cantidad positiva
              </p>
              <p className="mt-1 text-xl font-black text-emerald-700">
                +{new Intl.NumberFormat(
                  "es-BO",
                  {
                    maximumFractionDigits: 3,
                  },
                ).format(resumen.entradas)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <ArrowDownCircle size={20} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Cantidad negativa
              </p>
              <p className="mt-1 text-xl font-black text-red-700">
                -{new Intl.NumberFormat(
                  "es-BO",
                  {
                    maximumFractionDigits: 3,
                  },
                ).format(resumen.salidas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="space-y-3 p-5 sm:p-6">
          {Array.from({
            length: 6,
          }).map((_, indice) => (
            <div
              key={indice}
              className="h-20 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : movimientos.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <FileSearch
            size={38}
            className="text-slate-300"
          />

          <h3 className="mt-4 text-lg font-black text-slate-900">
            Sin movimientos encontrados
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            No existen registros que coincidan
            con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px]">
            <thead>
              <tr className="bg-slate-50">
                {[
                  "Fecha y usuario",
                  "Insumo",
                  "Tipo",
                  "Cantidad",
                  "Stock anterior",
                  "Stock posterior",
                  "Referencia",
                  "Impacto económico",
                  "Motivo",
                ].map((encabezado) => (
                  <th
                    key={encabezado}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {encabezado}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {movimientos.map(
                (movimiento) => (
                  <tr
                    key={movimiento.id}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        {fechaHora(
                          movimiento.fechaHora,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {movimiento.usuarioNombre}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">
                        {movimiento.insumoNombre}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {movimiento.insumoCodigo}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${claseTipo(
                          movimiento.tipo,
                        )}`}
                      >
                        {movimiento.tipo}
                      </span>

                      <p className="mt-2 text-xs text-slate-400">
                        {movimiento.origen}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className={`font-black ${
                          movimiento.cantidad < 0
                            ? "text-red-700"
                            : movimiento.cantidad > 0
                              ? "text-emerald-700"
                              : "text-slate-600"
                        }`}
                      >
                        {movimiento.cantidad > 0
                          ? "+"
                          : ""}
                        {formatearCantidadInventario(
                          movimiento.cantidad,
                          movimiento.unidadBase,
                        )}
                      </p>

                      {movimiento.cantidadClasificada !==
                        null && (
                        <p className="mt-1 text-xs font-semibold text-red-500">
                          Clasificado: {formatearCantidadInventario(
                            movimiento.cantidadClasificada,
                            movimiento.unidadBase,
                          )}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {formatearCantidadInventario(
                        movimiento.stockAnterior,
                        movimiento.unidadBase,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className={`font-black ${
                          movimiento.stockPosterior < 0
                            ? "text-red-700"
                            : "text-slate-900"
                        }`}
                      >
                        {formatearCantidadInventario(
                          movimiento.stockPosterior,
                          movimiento.unidadBase,
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-700">
                        {movimiento.numeroPedido ??
                          movimiento.referencia ??
                          "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {movimiento.impactoEconomico ===
                      null ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          Sin valoración
                        </span>
                      ) : (
                        <p
                          className={`font-black ${
                            movimiento.impactoEconomico < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {movimiento.impactoEconomico > 0
                            ? "+"
                            : ""}
                          {moneda(
                            movimiento.impactoEconomico,
                          )}
                        </p>
                      )}
                    </td>

                    <td className="max-w-72 px-5 py-4 text-sm leading-relaxed text-slate-600">
                      {movimiento.motivo}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PanelMovimientos;
