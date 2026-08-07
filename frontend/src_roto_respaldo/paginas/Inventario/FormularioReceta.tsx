import {
  BadgeDollarSign,
  Info,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  GuardarRecetaProductoDto,
  InsumoInventario,
  RecetaProducto,
} from "../../tipos/inventario";

import type {
  ProductoMenu,
} from "../../tipos/producto";

interface LineaFormulario {
  idTemporal: number;
  insumoId: string;
  cantidad: string;
}

interface FormularioRecetaProps {
  producto: ProductoMenu;
  recetaVigente: RecetaProducto | null;
  insumos: InsumoInventario[];
  cargando: boolean;

  alGuardar: (
    datos: GuardarRecetaProductoDto,
  ) => Promise<void>;

  alCancelar: () => void;
}

function numero(valor: string): number {
  const resultado = Number(valor);

  return Number.isFinite(resultado)
    ? resultado
    : 0;
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

function crearLineasIniciales(
  receta: RecetaProducto | null,
): LineaFormulario[] {
  if (!receta) {
    return [
      {
        idTemporal: 1,
        insumoId: "",
        cantidad: "",
      },
    ];
  }

  return receta.ingredientes.map(
    (ingrediente, indice) => ({
      idTemporal: indice + 1,
      insumoId:
        ingrediente.insumoId.toString(),
      cantidad:
        ingrediente.cantidadPorProducto.toString(),
    }),
  );
}

function FormularioReceta({
  producto,
  recetaVigente,
  insumos,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioRecetaProps) {
  const [lineas, setLineas] =
    useState<LineaFormulario[]>(
      () =>
        crearLineasIniciales(
          recetaVigente,
        ),
    );

  const [error, setError] =
    useState<string | null>(null);

  const insumosActivos = useMemo(
    () =>
      insumos.filter(
        (insumo) =>
          insumo.estado === "Activo",
      ),
    [insumos],
  );

  const costoTeorico = useMemo(() => {
    return lineas.reduce(
      (acumulado, linea) => {
        const insumo =
          insumos.find(
            (item) =>
              item.id ===
              Number(linea.insumoId),
          );

        if (
          !insumo ||
          !insumo.controlEconomico ||
          insumo.costoPromedioUnidadBase ===
            null
        ) {
          return acumulado;
        }

        return (
          acumulado +
          numero(linea.cantidad) *
            insumo.costoPromedioUnidadBase
        );
      },
      0,
    );
  }, [lineas, insumos]);

  const tieneInsumosSinValoracion =
    useMemo(() => {
      return lineas.some((linea) => {
        const insumo = insumos.find(
          (item) =>
            item.id ===
            Number(linea.insumoId),
        );

        return (
          insumo !== undefined &&
          !insumo.controlEconomico
        );
      });
    }, [lineas, insumos]);

  function agregarLinea() {
    setLineas((actuales) => {
      const nuevoId =
        actuales.length === 0
          ? 1
          : Math.max(
              ...actuales.map(
                (linea) =>
                  linea.idTemporal,
              ),
            ) + 1;

      return [
        {
          idTemporal: nuevoId,
          insumoId: "",
          cantidad: "",
        },
        ...actuales,
      ];
    });

    setError(null);
  }

  function eliminarLinea(
    idTemporal: number,
  ) {
    setLineas((actuales) => {
      const siguientes =
        actuales.filter(
          (linea) =>
            linea.idTemporal !==
            idTemporal,
        );

      return siguientes.length > 0
        ? siguientes
        : [
            {
              idTemporal: 1,
              insumoId: "",
              cantidad: "",
            },
          ];
    });

    setError(null);
  }

  function actualizarLinea(
    idTemporal: number,
    campo: "insumoId" | "cantidad",
    valor: string,
  ) {
    setLineas((actuales) =>
      actuales.map((linea) =>
        linea.idTemporal ===
        idTemporal
          ? {
              ...linea,
              [campo]: valor,
            }
          : linea,
      ),
    );

    setError(null);
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    const lineasCompletas =
      lineas.filter(
        (linea) =>
          linea.insumoId &&
          numero(linea.cantidad) > 0,
      );

    if (lineasCompletas.length === 0) {
      setError(
        "La receta debe contener al menos un insumo con una cantidad válida.",
      );
      return;
    }

    if (
      lineasCompletas.length !==
      lineas.length
    ) {
      setError(
        "Completa o elimina las filas vacías antes de guardar.",
      );
      return;
    }

    const cantidadNoEntera = lineasCompletas.find(
      (linea) => !Number.isInteger(numero(linea.cantidad)),
    );

    if (cantidadNoEntera) {
      setError(
        "Las cantidades de la receta deben registrarse en números enteros de la unidad base (g, ml o unidad).",
      );
      return;
    }

    const ids = lineasCompletas.map(
      (linea) =>
        Number(linea.insumoId),
    );

    if (
      new Set(ids).size !== ids.length
    ) {
      setError(
        "Un mismo insumo no puede repetirse dentro de la receta.",
      );
      return;
    }

    await alGuardar({
      productoId: producto.id,
      ingredientes:
        lineasCompletas.map(
          (linea) => ({
            insumoId: Number(
              linea.insumoId,
            ),
            cantidadPorProducto:
              numero(linea.cantidad),
          }),
        ),
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="flex min-h-0 flex-col"
      style={{
        height:
          "min(44rem, calc(90vh - 7rem))",
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">
                Ingredientes de la receta
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Los nuevos ingredientes aparecen primero para que puedas completarlos sin desplazarte al final.
              </p>
            </div>

            <button
              type="button"
              disabled={cargando}
              onClick={agregarLinea}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus size={17} />
              Nuevo ingrediente
            </button>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
            {lineas.map((linea, indice) => {
              const insumoSeleccionado =
                insumos.find(
                  (insumo) =>
                    insumo.id ===
                    Number(
                      linea.insumoId,
                    ),
                );

              const costoLinea =
                insumoSeleccionado?.controlEconomico &&
                insumoSeleccionado.costoPromedioUnidadBase !==
                  null
                  ? numero(linea.cantidad) *
                    insumoSeleccionado.costoPromedioUnidadBase
                  : null;

              return (
                <div
                  key={linea.idTemporal}
                  className="grid gap-3 p-3.5 lg:grid-cols-[40px_minmax(0,1fr)_210px_140px_42px] lg:items-end"
                >
                  <div className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {indice + 1}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      Insumo
                    </label>

                    <select
                      value={linea.insumoId}
                      disabled={cargando}
                      onChange={(evento) =>
                        actualizarLinea(
                          linea.idTemporal,
                          "insumoId",
                          evento.target.value,
                        )
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-red-950/50"
                    >
                      <option value="">
                        Selecciona un insumo
                      </option>

                      {insumosActivos.map(
                        (insumo) => (
                          <option
                            key={insumo.id}
                            value={insumo.id}
                          >
                            {insumo.nombre} ({insumo.unidadBase})
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      Cantidad por producto
                    </label>

                    <div className="relative mt-2">
                      <input
                        type="number"
                        value={linea.cantidad}
                        disabled={cargando}
                        min="1"
                        step="1"
                        inputMode="numeric"
                        placeholder="0"
                        onChange={(evento) =>
                          actualizarLinea(
                            linea.idTemporal,
                            "cantidad",
                            evento.target.value,
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 pr-20 text-sm font-bold text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {insumoSeleccionado?.unidadBase ?? "unidad"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/70">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Costo estimado
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">
                      {costoLinea === null
                        ? "Sin valoración"
                        : moneda(costoLinea)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={cargando}
                    title="Eliminar ingrediente"
                    aria-label={`Eliminar ingrediente ${indice + 1}`}
                    onClick={() =>
                      eliminarLinea(
                        linea.idTemporal,
                      )
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-red-50 text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <BadgeDollarSign
                size={18}
                className="shrink-0 text-emerald-700 dark:text-emerald-300"
              />
              <span className="text-[10px] font-black uppercase tracking-wide">
                Costo insumos
              </span>
              <strong className="text-sm">
                {moneda(costoTeorico)}
              </strong>
            </div>

            <div
              title={
                tieneInsumosSinValoracion
                  ? "Hay insumos configurados solo para control de cantidades y no se incluyen en el costo."
                  : "Todos los insumos con valoración activa se incluyen en el costo teórico."
              }
              className="inline-flex h-11 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
            >
              <Info
                size={16}
                className="shrink-0 text-slate-400"
              />
              <span className="truncate">
                {tieneInsumosSinValoracion
                  ? "Hay insumos sin valoración económica."
                  : "Costo calculado con insumos valorados."}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              disabled={cargando}
              onClick={alCancelar}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <X size={18} />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={cargando}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
            >
              {cargando ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              Guardar nueva versión
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}

export default FormularioReceta;
