import {
  BadgeDollarSign,
  ClipboardList,
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
    setLineas((actuales) => [
      ...actuales,
      {
        idTemporal:
          actuales.length === 0
            ? 1
            : Math.max(
                ...actuales.map(
                  (linea) =>
                    linea.idTemporal,
                ),
              ) + 1,
        insumoId: "",
        cantidad: "",
      },
    ]);

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
    >
      <div className="space-y-5 p-5 sm:p-6">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <ClipboardList
              size={22}
              className="mt-0.5 shrink-0 text-blue-700"
            />

            <div>
              <p className="font-black text-blue-950">
                {producto.nombre}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                {producto.codigo} · Cada
                venta de una unidad
                descontará las cantidades
                configuradas aquí.
              </p>
            </div>
          </div>
        </section>

        {recetaVigente && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">
              Se creará una nueva versión
            </p>

            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              La versión {recetaVigente.version}
              seguirá asociada a las ventas
              históricas. La nueva versión se
              aplicará solamente a ventas futuras.
            </p>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-slate-900">
                Ingredientes de la receta
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Las cantidades siempre se
                registran en la unidad base del
                insumo.
              </p>
            </div>

            <button
              type="button"
              disabled={cargando}
              onClick={agregarLinea}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <Plus size={17} />
              Agregar ingrediente
            </button>
          </div>

          <div className="divide-y divide-slate-100">
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
                  className="grid gap-3 p-4 lg:grid-cols-[44px_minmax(0,1fr)_220px_150px_44px] lg:items-end"
                >
                  <div className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">
                    {indice + 1}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500">
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
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
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
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Cantidad por producto
                    </label>

                    <div className="relative mt-2">
                      <input
                        type="number"
                        value={linea.cantidad}
                        disabled={cargando}
                        min="0.001"
                        step="0.001"
                        placeholder="0"
                        onChange={(evento) =>
                          actualizarLinea(
                            linea.idTemporal,
                            "cantidad",
                            evento.target.value,
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-20 text-sm font-bold outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {insumoSeleccionado?.unidadBase ?? "unidad"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Costo estimado
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-800">
                      {costoLinea === null
                        ? "Sin valoración"
                        : moneda(costoLinea)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={cargando}
                    title="Eliminar ingrediente"
                    onClick={() =>
                      eliminarLinea(
                        linea.idTemporal,
                      )
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <BadgeDollarSign
                size={22}
                className="text-emerald-700"
              />

              <div>
                <p className="text-xs font-bold uppercase text-emerald-600">
                  Costo teórico valorado
                </p>

                <p className="mt-1 text-2xl font-black text-emerald-900">
                  {moneda(costoTeorico)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-800">
              Alcance del cálculo
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {tieneInsumosSinValoracion
                ? "La receta contiene insumos configurados solo para control de cantidades; esos componentes no se incluyen en el costo."
                : "Todos los insumos seleccionados con valoración activa se incluyen en el costo teórico."}
            </p>
          </div>
        </section>

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

          Guardar nueva versión
        </button>
      </footer>
    </form>
  );
}

export default FormularioReceta;
