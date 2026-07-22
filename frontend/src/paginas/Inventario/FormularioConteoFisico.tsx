import {
  CheckSquare,
  ClipboardCheck,
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
  return Number.isFinite(resultado)
    ? resultado
    : 0;
}

function FormularioConteoFisico({
  insumos,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioConteoFisicoProps) {
  const [busqueda, setBusqueda] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [filas, setFilas] =
    useState<Record<number, FilaConteo>>(
      () =>
        Object.fromEntries(
          insumos
            .filter(
              (insumo) =>
                insumo.estado === "Activo",
            )
            .map((insumo) => [
              insumo.id,
              {
                seleccionada: true,
                stockFisico:
                  Math.max(
                    0,
                    insumo.stockActual,
                  ).toString(),
                motivo: "",
              },
            ]),
        ),
    );

  const activos = useMemo(
    () =>
      insumos.filter(
        (insumo) =>
          insumo.estado === "Activo",
      ),
    [insumos],
  );

  const visibles = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLocaleLowerCase("es");

    return activos.filter(
      (insumo) =>
        !texto ||
        insumo.nombre
          .toLocaleLowerCase("es")
          .includes(texto) ||
        insumo.codigo
          .toLocaleLowerCase("es")
          .includes(texto) ||
        insumo.categoria
          .toLocaleLowerCase("es")
          .includes(texto),
    );
  }, [activos, busqueda]);

  const seleccionados = activos.filter(
    (insumo) =>
      filas[insumo.id]?.seleccionada,
  );

  const variaciones = seleccionados.filter(
    (insumo) =>
      numero(
        filas[insumo.id].stockFisico,
      ) !== insumo.stockActual,
  ).length;

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
    const todosSeleccionados =
      activos.every(
        (insumo) =>
          filas[insumo.id]?.seleccionada,
      );

    setFilas((actuales) => {
      const siguientes = {
        ...actuales,
      };

      activos.forEach((insumo) => {
        siguientes[insumo.id] = {
          ...siguientes[insumo.id],
          seleccionada:
            !todosSeleccionados,
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
      const fisico = numero(
        fila.stockFisico,
      );
      const diferencia =
        fisico - insumo.stockActual;

      if (fisico < 0) {
        setError(
          `La cantidad física de ${insumo.nombre} no puede ser negativa.`,
        );
        return;
      }

      if (
        diferencia !== 0 &&
        fila.motivo.trim().length < 5
      ) {
        setError(
          `Explica la diferencia encontrada en ${insumo.nombre}.`,
        );
        return;
      }
    }

    await alGuardar({
      observaciones:
        observaciones.trim() || null,
      detalles: seleccionados.map(
        (insumo) => {
          const fila = filas[insumo.id];
          const fisico = numero(
            fila.stockFisico,
          );
          const diferencia =
            fisico - insumo.stockActual;

          return {
            insumoId: insumo.id,
            stockFisico: fisico,
            motivo:
              diferencia === 0
                ? "Sin diferencia"
                : fila.motivo.trim(),
          };
        },
      ),
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div className="space-y-5 p-5 sm:p-6">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck
              size={22}
              className="mt-0.5 shrink-0 text-blue-700"
            />

            <div>
              <p className="font-black text-blue-950">
                Comparación teórico–física
              </p>

              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                El sistema conservará el stock
                teórico anterior y generará un
                movimiento por cada diferencia.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={busqueda}
              placeholder="Buscar insumo..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <button
            type="button"
            onClick={alternarTodos}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            {seleccionados.length ===
            activos.length ? (
              <CheckSquare size={17} />
            ) : (
              <Square size={17} />
            )}
            Seleccionar todos
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-100 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">
              Insumos seleccionados
            </p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {seleccionados.length}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-xs font-bold uppercase text-amber-600">
              Diferencias detectadas
            </p>
            <p className="mt-1 text-xl font-black text-amber-900">
              {variaciones}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-xs font-bold uppercase text-blue-600">
              Sin cambios
            </p>
            <p className="mt-1 text-xl font-black text-blue-900">
              {seleccionados.length -
                variaciones}
            </p>
          </div>
        </div>

        <div className="max-h-[52vh] overflow-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[980px]">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                {[
                  "Contar",
                  "Insumo",
                  "Stock teórico",
                  "Stock físico",
                  "Variación",
                  "Motivo",
                ].map((encabezado) => (
                  <th
                    key={encabezado}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {encabezado}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibles.map((insumo) => {
                const fila = filas[insumo.id];
                const fisico = numero(
                  fila.stockFisico,
                );
                const variacion =
                  fisico - insumo.stockActual;

                return (
                  <tr
                    key={insumo.id}
                    className={
                      fila.seleccionada
                        ? "bg-white"
                        : "bg-slate-50 opacity-60"
                    }
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={fila.seleccionada}
                        disabled={cargando}
                        onChange={(evento) =>
                          actualizarFila(
                            insumo.id,
                            {
                              seleccionada:
                                evento.target.checked,
                            },
                          )
                        }
                        className="h-4 w-4 accent-red-700"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900">
                        {insumo.nombre}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {insumo.codigo} · {insumo.categoria}
                      </p>
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-700">
                      {formatearCantidadInventario(
                        insumo.stockActual,
                        insumo.unidadBase,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={fila.stockFisico}
                          disabled={
                            cargando ||
                            !fila.seleccionada
                          }
                          min="0"
                          step="0.001"
                          onChange={(evento) =>
                            actualizarFila(
                              insumo.id,
                              {
                                stockFisico:
                                  evento.target.value,
                              },
                            )
                          }
                          className="h-10 w-full rounded-xl border border-slate-300 px-3 pr-16 text-sm font-bold outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
                        />

                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {insumo.unidadBase}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p
                        className={`font-black ${
                          variacion < 0
                            ? "text-red-700"
                            : variacion > 0
                              ? "text-emerald-700"
                              : "text-slate-500"
                        }`}
                      >
                        {variacion > 0 ? "+" : ""}
                        {formatearCantidadInventario(
                          variacion,
                          insumo.unidadBase,
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={fila.motivo}
                        disabled={
                          cargando ||
                          !fila.seleccionada ||
                          variacion === 0
                        }
                        maxLength={200}
                        placeholder={
                          variacion === 0
                            ? "Sin diferencia"
                            : "Ej.: entrada no registrada"
                        }
                        onChange={(evento) =>
                          actualizarFila(
                            insumo.id,
                            {
                              motivo:
                                evento.target.value,
                            },
                          )
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <label
            htmlFor="observaciones-conteo"
            className="text-sm font-bold text-slate-700"
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
            rows={3}
            placeholder="Ej.: Conteo de cierre realizado por el encargado del turno."
            onChange={(evento) =>
              setObservaciones(
                evento.target.value,
              )
            }
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {cargando ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
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
