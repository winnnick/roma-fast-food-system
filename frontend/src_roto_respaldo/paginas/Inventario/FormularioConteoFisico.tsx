import {
  CheckSquare,
  LoaderCircle,
  Save,
  Search,
  Square,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  InsumoInventario,
  RegistrarConteoFisicoDto,
} from "../../tipos/inventario";

import {
  formatearCantidadInventario,
} from "../../servicios/inventarioServicio";

interface FilaConteo {
  seleccionada: boolean;
  stockFisico: string;
  motivo: string;
}

interface FormularioConteoFisicoProps {
  insumos: InsumoInventario[];
  cargando: boolean;
  alGuardar: (
    datos: RegistrarConteoFisicoDto,
  ) => Promise<void>;
  alCancelar: () => void;
}

function numero(valor: string): number {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function cantidadOperativa(valor: number): number {
  return Math.round(valor);
}

function FormularioConteoFisico({
  insumos,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioConteoFisicoProps) {
  const [busqueda, setBusqueda] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [filas, setFilas] = useState<Record<number, FilaConteo>>(
    () =>
      Object.fromEntries(
        insumos
          .filter((insumo) => insumo.estado === "Activo")
          .map((insumo) => [
            insumo.id,
            {
              seleccionada: true,
              stockFisico: cantidadOperativa(
                Math.max(0, insumo.stockActual),
              ).toString(),
              motivo: "",
            },
          ]),
      ),
  );

  const activos = useMemo(
    () => insumos.filter((insumo) => insumo.estado === "Activo"),
    [insumos],
  );

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    return activos.filter(
      (insumo) =>
        !texto ||
        insumo.nombre.toLocaleLowerCase("es").includes(texto) ||
        insumo.codigo.toLocaleLowerCase("es").includes(texto) ||
        insumo.categoria.toLocaleLowerCase("es").includes(texto),
    );
  }, [activos, busqueda]);

  const seleccionados = activos.filter(
    (insumo) => filas[insumo.id]?.seleccionada,
  );

  const variaciones = seleccionados.filter((insumo) => {
    const fisico = numero(filas[insumo.id].stockFisico);
    return fisico !== cantidadOperativa(insumo.stockActual);
  }).length;

  function actualizarFila(
    insumoId: number,
    cambios: Partial<FilaConteo>,
  ) {
    setFilas((actuales) => ({
      ...actuales,
      [insumoId]: {
        ...actuales[insumoId],
        ...cambios,
      },
    }));
    setError(null);
  }

  function alternarTodos() {
    const todosSeleccionados = activos.every(
      (insumo) => filas[insumo.id]?.seleccionada,
    );

    setFilas((actuales) => {
      const siguientes = { ...actuales };

      activos.forEach((insumo) => {
        siguientes[insumo.id] = {
          ...siguientes[insumo.id],
          seleccionada: !todosSeleccionados,
        };
      });

      return siguientes;
    });
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (seleccionados.length === 0) {
      setError(
        "Selecciona al menos un insumo para registrar el conteo.",
      );
      return;
    }

    for (const insumo of seleccionados) {
      const fila = filas[insumo.id];
      const fisico = numero(fila.stockFisico);
      const teoricoOperativo = cantidadOperativa(insumo.stockActual);
      const diferencia = fisico - teoricoOperativo;

      if (fisico < 0) {
        setError(
          `La cantidad física de ${insumo.nombre} no puede ser negativa.`,
        );
        return;
      }

      if (!Number.isInteger(fisico)) {
        setError(
          `La cantidad física de ${insumo.nombre} debe registrarse en números enteros de ${insumo.unidadBase}.`,
        );
        return;
      }

      if (diferencia !== 0 && fila.motivo.trim().length < 5) {
        setError(
          `Explica la diferencia encontrada en ${insumo.nombre}.`,
        );
        return;
      }
    }

    await alGuardar({
      observaciones: observaciones.trim() || null,
      detalles: seleccionados.map((insumo) => {
        const fila = filas[insumo.id];
        const fisico = numero(fila.stockFisico);
        const teoricoOperativo = cantidadOperativa(insumo.stockActual);
        const diferencia = fisico - teoricoOperativo;

        return {
          insumoId: insumo.id,
          stockFisico: fisico,
          motivo:
            diferencia === 0
              ? "Sin diferencia"
              : fila.motivo.trim(),
        };
      }),
    });
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <div className="space-y-3 p-5 sm:p-6">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={busqueda}
              placeholder="Buscar por nombre, código o categoría"
              onChange={(evento) => setBusqueda(evento.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
            />
          </div>

          <button
            type="button"
            onClick={alternarTodos}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {seleccionados.length === activos.length ? (
              <CheckSquare size={17} />
            ) : (
              <Square size={17} />
            )}
            {seleccionados.length === activos.length
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {seleccionados.length} seleccionados
          </span>
          <span className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">
            {variaciones} diferencias
          </span>
          <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">
            {Math.max(0, seleccionados.length - variaciones)} sin cambios
          </span>
        </div>

        <div className="max-h-[36vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="sticky top-0 z-10 hidden grid-cols-[34px_minmax(180px,1fr)_140px_165px_140px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:grid">
            <span />
            <span>Insumo</span>
            <span>Teórico</span>
            <span>Físico</span>
            <span>Variación</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibles.map((insumo) => {
              const fila = filas[insumo.id];
              const fisico = numero(fila.stockFisico);
              const teoricoOperativo = cantidadOperativa(insumo.stockActual);
              const variacion = fisico - teoricoOperativo;
              const tieneDiferencia = variacion !== 0;

              return (
                <article
                  key={insumo.id}
                  className={`px-4 py-3 transition-colors ${
                    fila.seleccionada
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50 opacity-60 dark:bg-slate-950/40"
                  }`}
                >
                  <div className="grid gap-3 lg:grid-cols-[34px_minmax(180px,1fr)_140px_165px_140px] lg:items-center">
                    <div>
                      <input
                        type="checkbox"
                        checked={fila.seleccionada}
                        disabled={cargando}
                        onChange={(evento) =>
                          actualizarFila(insumo.id, {
                            seleccionada: evento.target.checked,
                          })
                        }
                        aria-label={`Contar ${insumo.nombre}`}
                        className="h-4 w-4 accent-red-700"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900 dark:text-white">
                        {insumo.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {insumo.codigo} · {insumo.categoria}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">
                        Stock teórico
                      </p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {formatearCantidadInventario(
                          teoricoOperativo,
                          insumo.unidadBase,
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">
                        Stock físico
                      </label>
                      <div className="relative mt-1 lg:mt-0">
                        <input
                          type="number"
                          value={fila.stockFisico}
                          disabled={cargando || !fila.seleccionada}
                          min="0"
                          step="1"
                          inputMode="numeric"
                          onChange={(evento) =>
                            actualizarFila(insumo.id, {
                              stockFisico: evento.target.value,
                            })
                          }
                          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-14 text-sm font-bold text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {insumo.unidadBase}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">
                        Variación
                      </p>
                      <p
                        className={`font-black ${
                          variacion < 0
                            ? "text-red-700 dark:text-red-300"
                            : variacion > 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {variacion > 0 ? "+" : ""}
                        {formatearCantidadInventario(
                          variacion,
                          insumo.unidadBase,
                        )}
                      </p>
                    </div>
                  </div>

                  {fila.seleccionada && tieneDiferencia && (
                    <div className="mt-2.5 grid gap-2 border-t border-dashed border-slate-200 pt-2.5 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <input
                        type="text"
                        value={fila.motivo}
                        disabled={cargando}
                        maxLength={200}
                        placeholder="Motivo de la diferencia, ej.: entrada no registrada"
                        onChange={(evento) =>
                          actualizarFila(insumo.id, {
                            motivo: evento.target.value,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-100 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-white dark:focus:ring-amber-950/40 dark:disabled:bg-slate-800"
                      />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        Motivo obligatorio
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="observaciones-conteo"
            className="text-sm font-bold text-slate-700 dark:text-slate-200"
          >
            Observaciones generales
            <span className="ml-2 font-normal text-slate-400">
              Opcional
            </span>
          </label>

          <textarea
            id="observaciones-conteo"
            value={observaciones}
            disabled={cargando}
            maxLength={300}
            rows={2}
            placeholder="Ej.: Conteo de cierre realizado por el encargado del turno."
            onChange={(evento) => setObservaciones(evento.target.value)}
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6 dark:border-slate-700 dark:bg-slate-950/95">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
        >
          {cargando ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Confirmar conteo
        </button>
      </footer>
    </form>
  );
}

export default FormularioConteoFisico;
