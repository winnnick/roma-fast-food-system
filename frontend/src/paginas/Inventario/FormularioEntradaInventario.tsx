import {
  CheckSquare,
  LoaderCircle,
  PackagePlus,
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
  RegistrarEntradaInventarioDto,
} from "../../tipos/inventario";

interface FilaEntrada {
  seleccionada: boolean;
  cantidad: string;
  costoTotal: string;
}

interface Props {
  insumos: InsumoInventario[];
  insumoInicialId?: number | null;
  cargando: boolean;
  alGuardar: (datos: RegistrarEntradaInventarioDto[]) => Promise<void>;
  alCancelar: () => void;
}

function numero(valor: string): number {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function cantidadEntera(valor: number): boolean {
  return Math.abs(valor - Math.round(valor)) < 0.000001;
}

function formatearCantidadOperativa(
  valor: number,
  unidad: InsumoInventario["unidadBase"],
): string {
  const cantidad = new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 0,
  }).format(Math.round(valor));

  return `${cantidad} ${unidad}`;
}

function FormularioEntradaInventario({
  insumos,
  insumoInicialId = null,
  cargando,
  alGuardar,
  alCancelar,
}: Props) {
  const activos = useMemo(
    () => insumos.filter((insumo) => insumo.estado === "Activo"),
    [insumos],
  );

  const [busqueda, setBusqueda] = useState("");
  const [referencia, setReferencia] = useState("");
  const [motivo, setMotivo] = useState("Compra o recepción de insumos");
  const [error, setError] = useState<string | null>(null);

  const [filas, setFilas] = useState<Record<number, FilaEntrada>>(
    () =>
      Object.fromEntries(
        activos.map((insumo) => [
          insumo.id,
          {
            seleccionada: insumo.id === insumoInicialId,
            cantidad: "",
            costoTotal: "",
          },
        ]),
      ),
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

  const conCantidad = seleccionados.filter(
    (insumo) => numero(filas[insumo.id]?.cantidad ?? "") > 0,
  ).length;

  const costoTotalLote = seleccionados.reduce(
    (acumulado, insumo) =>
      acumulado +
      (insumo.controlEconomico
        ? Math.max(0, numero(filas[insumo.id]?.costoTotal ?? ""))
        : 0),
    0,
  );

  function actualizarFila(
    insumoId: number,
    cambios: Partial<FilaEntrada>,
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

    setError(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (seleccionados.length === 0) {
      setError("Selecciona al menos un insumo para registrar la entrada.");
      return;
    }

    const motivoLimpio = motivo.trim();

    if (motivoLimpio.length < 5 || motivoLimpio.length > 200) {
      setError("El motivo debe contener entre 5 y 200 caracteres.");
      return;
    }

    for (const insumo of seleccionados) {
      const fila = filas[insumo.id];
      const cantidadPresentaciones = numero(fila.cantidad);
      const cantidadBase = cantidadPresentaciones * insumo.factorConversionCompra;
      const costo = numero(fila.costoTotal);

      if (cantidadPresentaciones <= 0) {
        setError(`Ingresa una cantidad mayor que cero para ${insumo.nombre}.`);
        return;
      }

      if (!cantidadEntera(cantidadBase)) {
        setError(
          `La entrada de ${insumo.nombre} debe equivaler a una cantidad entera de ${insumo.unidadBase}.`,
        );
        return;
      }

      if (insumo.controlEconomico && costo <= 0) {
        setError(`Ingresa el costo total de ${insumo.nombre}.`);
        return;
      }
    }

    setError(null);

    await alGuardar(
      seleccionados.map((insumo) => {
        const fila = filas[insumo.id];

        return {
          insumoId: insumo.id,
          cantidadPresentaciones: numero(fila.cantidad),
          costoTotal: insumo.controlEconomico
            ? numero(fila.costoTotal)
            : null,
          referencia: referencia.trim() || null,
          motivo: motivoLimpio,
        };
      }),
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
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
              disabled={cargando}
              placeholder="Buscar por nombre, código o categoría"
              onChange={(evento) => setBusqueda(evento.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
            />
          </div>

          <button
            type="button"
            disabled={cargando || activos.length === 0}
            onClick={alternarTodos}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {seleccionados.length === activos.length && activos.length > 0 ? (
              <CheckSquare size={17} />
            ) : (
              <Square size={17} />
            )}
            {seleccionados.length === activos.length && activos.length > 0
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {seleccionados.length} seleccionados
          </span>
          <span className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300">
            {conCantidad} con cantidad registrada
          </span>
          {costoTotalLote > 0 && (
            <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">
              Total compra: {moneda(costoTotalLote)}
            </span>
          )}
        </div>

        <div className="max-h-[42vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="sticky top-0 z-10 hidden grid-cols-[34px_minmax(190px,1.35fr)_minmax(125px,.8fr)_150px_150px_minmax(145px,.85fr)] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:grid">
            <span />
            <span>Insumo</span>
            <span>Stock actual</span>
            <span>Presentación</span>
            <span>Cantidad</span>
            <span>Costo total</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibles.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                No hay insumos que coincidan con la búsqueda.
              </div>
            ) : (
              visibles.map((insumo) => {
                const fila = filas[insumo.id];
                const cantidadPresentaciones = numero(fila?.cantidad ?? "");
                const cantidadBase = cantidadPresentaciones * insumo.factorConversionCompra;
                const stockResultante = insumo.stockActual + cantidadBase;
                const seleccionada = fila?.seleccionada ?? false;

                return (
                  <div
                    key={insumo.id}
                    className={`grid gap-3 px-4 py-3 transition-colors lg:grid-cols-[34px_minmax(190px,1.35fr)_minmax(125px,.8fr)_150px_150px_minmax(145px,.85fr)] lg:items-center ${
                      seleccionada
                        ? "bg-red-50/45 dark:bg-red-950/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/45"
                    }`}
                  >
                    <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                      <input
                        type="checkbox"
                        checked={seleccionada}
                        disabled={cargando}
                        onChange={(evento) =>
                          actualizarFila(insumo.id, {
                            seleccionada: evento.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-red-600"
                        aria-label={`Seleccionar ${insumo.nombre}`}
                      />
                    </label>

                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900 dark:text-white">
                        {insumo.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                        {insumo.codigo} · {insumo.categoria}
                      </p>
                    </div>

                    <div>
                      <p className="font-black text-slate-800 dark:text-slate-100">
                        {formatearCantidadOperativa(insumo.stockActual, insumo.unidadBase)}
                      </p>
                      {seleccionada && cantidadPresentaciones > 0 && (
                        <p className="mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                          Quedará en {formatearCantidadOperativa(stockResultante, insumo.unidadBase)}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {insumo.presentacionCompra}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        1 = {formatearCantidadOperativa(insumo.factorConversionCompra, insumo.unidadBase)}
                      </p>
                    </div>

                    <div>
                      <input
                        type="number"
                        value={fila?.cantidad ?? ""}
                        disabled={cargando || !seleccionada}
                        min="0"
                        step={1 / Math.max(1, insumo.factorConversionCompra)}
                        inputMode="decimal"
                        placeholder="0"
                        onChange={(evento) =>
                          actualizarFila(insumo.id, {
                            cantidad: evento.target.value,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
                        aria-label={`Cantidad de ${insumo.presentacionCompra} para ${insumo.nombre}`}
                      />
                      {seleccionada && cantidadPresentaciones > 0 && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          +{formatearCantidadOperativa(cantidadBase, insumo.unidadBase)}
                        </p>
                      )}
                    </div>

                    <div>
                      {insumo.controlEconomico ? (
                        <div className="relative">
                          <input
                            type="number"
                            value={fila?.costoTotal ?? ""}
                            disabled={cargando || !seleccionada}
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0,00"
                            onChange={(evento) =>
                              actualizarFila(insumo.id, {
                                costoTotal: evento.target.value,
                              })
                            }
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-9 text-sm font-bold text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
                            aria-label={`Costo total para ${insumo.nombre}`}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                            Bs
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          Sin valoración
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="referencia-entrada" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Referencia <span className="font-normal text-slate-400">Opcional</span>
            </label>
            <input
              id="referencia-entrada"
              value={referencia}
              disabled={cargando}
              maxLength={100}
              placeholder="Factura, proveedor o nota de recepción"
              onChange={(evento) => setReferencia(evento.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
            />
          </div>

          <div>
            <label htmlFor="motivo-entrada" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Motivo
            </label>
            <input
              id="motivo-entrada"
              value={motivo}
              disabled={cargando}
              maxLength={200}
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setError(null);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50 dark:disabled:bg-slate-800"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Se registrará un movimiento independiente por cada insumo seleccionado.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={cargando}
            onClick={alCancelar}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <X size={18} /> Cancelar
          </button>

          <button
            type="submit"
            disabled={cargando || seleccionados.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : seleccionados.length > 1 ? (
              <PackagePlus size={18} />
            ) : (
              <Save size={18} />
            )}
            Registrar {seleccionados.length > 1 ? `${seleccionados.length} entradas` : "entrada"}
          </button>
        </div>
      </footer>
    </form>
  );
}

export default FormularioEntradaInventario;
