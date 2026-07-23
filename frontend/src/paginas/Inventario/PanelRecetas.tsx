import {
  BookOpen,
  ChefHat,
  Clock3,
  Edit3,
  History,
  PackageSearch,
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
  useAuth,
} from "../../contextos/AuthContext";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  guardarNuevaVersionReceta,
  listarInsumosInventario,
  listarRecetasInventario,
} from "../../servicios/inventarioServicio";

import {
  listarProductos,
} from "../../servicios/productoServicio";

import type {
  GuardarRecetaProductoDto,
  InsumoInventario,
  RecetaProducto,
} from "../../tipos/inventario";

import type {
  ProductoMenu,
} from "../../tipos/producto";

import type {
  DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import FormularioReceta from "./FormularioReceta";

interface PanelRecetasProps {
  puedeGestionar: boolean;
  alNotificar: (
    notificacion: DatosNotificacion,
  ) => void;
  alCambio: () => Promise<void>;
}

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function fecha(fechaIso: string): string {
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

function PanelRecetas({
  puedeGestionar,
  alNotificar,
  alCambio,
}: PanelRecetasProps) {
  const { usuario } = useAuth();

  const [productos, setProductos] =
    useState<ProductoMenu[]>([]);

  const [insumos, setInsumos] =
    useState<InsumoInventario[]>([]);

  const [recetas, setRecetas] =
    useState<RecetaProducto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtro, setFiltro] =
    useState<
      "Todos" | "Con receta" | "Sin receta"
    >("Todos");

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ProductoMenu | null>(null);

  const [productoHistorial, setProductoHistorial] =
    useState<ProductoMenu | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const [
        productosRespuesta,
        insumosRespuesta,
        recetasRespuesta,
      ] = await Promise.all([
        listarProductos(),
        listarInsumosInventario(),
        listarRecetasInventario(),
      ]);

      setProductos(productosRespuesta);
      setInsumos(insumosRespuesta);
      setRecetas(recetasRespuesta);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo:
          "No se pudieron cargar las recetas",
        mensaje: mensajeError(error),
      });
    } finally {
      setCargando(false);
    }
  }, [alNotificar]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargar();
    }, 0);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [cargar]);

  const recetasVigentes = useMemo(() => {
    return new Map(
      recetas
        .filter(
          (receta) =>
            receta.estado === "Vigente",
        )
        .map((receta) => [
          receta.productoId,
          receta,
        ]),
    );
  }, [recetas]);

  const productosFiltrados =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLocaleLowerCase("es");

      return productos.filter(
        (producto) => {
          const receta =
            recetasVigentes.get(
              producto.id,
            );

          const coincideTexto =
            !texto ||
            producto.nombre
              .toLocaleLowerCase("es")
              .includes(texto) ||
            producto.codigo
              .toLocaleLowerCase("es")
              .includes(texto);

          const coincideFiltro =
            filtro === "Todos" ||
            (filtro === "Con receta" &&
              receta !== undefined) ||
            (filtro === "Sin receta" &&
              receta === undefined);

          return (
            coincideTexto &&
            coincideFiltro
          );
        },
      );
    }, [
      productos,
      busqueda,
      filtro,
      recetasVigentes,
    ]);

  const recetaSeleccionada =
    productoSeleccionado
      ? recetasVigentes.get(
          productoSeleccionado.id,
        ) ?? null
      : null;

  const historialSeleccionado =
    productoHistorial
      ? recetas.filter(
          (receta) =>
            receta.productoId ===
            productoHistorial.id,
        )
      : [];

  function costoReceta(
    receta: RecetaProducto,
  ): number {
    return receta.ingredientes.reduce(
      (acumulado, ingrediente) => {
        const insumo = insumos.find(
          (item) =>
            item.id ===
            ingrediente.insumoId,
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
          ingrediente.cantidadPorProducto *
            insumo.costoPromedioUnidadBase
        );
      },
      0,
    );
  }

  async function guardar(
    datos: GuardarRecetaProductoDto,
  ) {
    if (
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesando(true);

      const receta =
        await guardarNuevaVersionReceta(
          datos,
          usuario,
        );

      await auditarAccion(
        {
          modulo: "Recetas",
          accion: "Crear versión de receta",
          entidad: "Receta",
          entidadId: receta.id,
          descripcion:
            `${usuario.nombreCompleto} creó la versión ${receta.version} de la receta de ${receta.productoNombre}.`,
          datosPosteriores: receta,
        },
        usuario,
      );

      setProductoSeleccionado(null);

      alNotificar({
        tipo: "exito",
        titulo:
          "Receta actualizada",
        mensaje: `${receta.productoNombre} ahora utiliza la versión ${receta.version}.`,
      });

      await Promise.all([
        cargar(),
        alCambio(),
      ]);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo:
          "No se pudo guardar la receta",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {Array.from({
          length: 6,
        }).map((_, indice) => (
          <div
            key={indice}
            className="h-56 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Recetas técnicas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Define cuánto consume cada
            producto y conserva todas sus
            versiones históricas.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-64">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={busqueda}
              placeholder="Buscar producto..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <select
            value={filtro}
            onChange={(evento) =>
              setFiltro(
                evento.target.value as
                  | "Todos"
                  | "Con receta"
                  | "Sin receta",
              )
            }
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
          >
            <option value="Todos">
              Todos los productos
            </option>
            <option value="Con receta">
              Con receta
            </option>
            <option value="Sin receta">
              Sin receta
            </option>
          </select>

          <button
            type="button"
            onClick={() => void cargar()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>
      </div>

      {productosFiltrados.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <PackageSearch
            size={38}
            className="text-slate-300"
          />

          <h3 className="mt-4 text-lg font-black text-slate-900">
            No existen resultados
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Modifica la búsqueda o el
            filtro aplicado.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2 2xl:grid-cols-3">
          {productosFiltrados.map(
            (producto) => {
              const receta =
                recetasVigentes.get(
                  producto.id,
                );

              return (
                <article
                  key={producto.id}
                  className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                        <ChefHat size={22} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900">
                          {producto.nombre}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {producto.codigo}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        receta
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {receta
                        ? `Versión ${receta.version}`
                        : "Sin receta"}
                    </span>
                  </div>

                  {receta ? (
                    <>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Ingredientes
                          </p>

                          <p className="mt-1 text-lg font-black text-slate-900">
                            {receta.ingredientes.length}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-[10px] font-bold uppercase text-emerald-600">
                            Costo valorado
                          </p>

                          <p className="mt-1 text-lg font-black text-emerald-900">
                            {moneda(
                              costoReceta(receta),
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {receta.ingredientes
                          .slice(0, 4)
                          .map(
                            (ingrediente) => (
                              <span
                                key={ingrediente.insumoId}
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                {ingrediente.insumoNombre}: {ingrediente.cantidadPorProducto} {ingrediente.unidadBase}
                              </span>
                            ),
                          )}

                        {receta.ingredientes.length >
                          4 && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            +{receta.ingredientes.length - 4} más
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
                      <BookOpen
                        size={30}
                        className="text-amber-500"
                      />

                      <p className="mt-3 text-sm font-black text-amber-900">
                        Producto sin control de inventario
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-amber-700">
                        Mientras no tenga receta,
                        sus ventas no descontarán
                        insumos.
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex gap-2 pt-5">
                    {puedeGestionar && (
                      <button
                        type="button"
                        disabled={
                          producto.estado ===
                          "Inactivo"
                        }
                        onClick={() =>
                          setProductoSeleccionado(
                            producto,
                          )
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Edit3 size={16} />
                        {receta
                          ? "Nueva versión"
                          : "Crear receta"}
                      </button>
                    )}

                    {receta && (
                      <button
                        type="button"
                        onClick={() =>
                          setProductoHistorial(
                            producto,
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <History size={16} />
                        Historial
                      </button>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      <Modal
        abierto={Boolean(
          productoSeleccionado,
        )}
        titulo={
          productoSeleccionado
            ? `Receta de ${productoSeleccionado.nombre}`
            : "Configurar receta"
        }
        descripcion="Cada guardado crea una versión nueva y preserva el consumo histórico."
        ancho="grande"
        alCerrar={() => {
          if (!procesando) {
            setProductoSeleccionado(null);
          }
        }}
      >
        {productoSeleccionado && (
          <FormularioReceta
            key={`${productoSeleccionado.id}-${recetaSeleccionada?.version ?? 0}`}
            producto={productoSeleccionado}
            recetaVigente={
              recetaSeleccionada
            }
            insumos={insumos}
            cargando={procesando}
            alGuardar={guardar}
            alCancelar={() =>
              setProductoSeleccionado(null)
            }
          />
        )}
      </Modal>

      <Modal
        abierto={Boolean(
          productoHistorial,
        )}
        titulo={
          productoHistorial
            ? `Historial de ${productoHistorial.nombre}`
            : "Historial de receta"
        }
        descripcion="Consulta las versiones sin alterar registros anteriores."
        ancho="grande"
        alCerrar={() =>
          setProductoHistorial(null)
        }
      >
        <div className="space-y-4 p-5 sm:p-6">
          {historialSeleccionado
            .sort(
              (recetaA, recetaB) =>
                recetaB.version -
                recetaA.version,
            )
            .map((receta) => (
              <article
                key={receta.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900">
                        Versión {receta.version}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          receta.estado ===
                          "Vigente"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {receta.estado}
                      </span>
                    </div>

                    <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 size={14} />
                      Desde {fecha(receta.fechaVigenciaDesde)}
                      {receta.fechaVigenciaHasta
                        ? ` hasta ${fecha(receta.fechaVigenciaHasta)}`
                        : ""}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Costo valorado
                    </p>

                    <p className="mt-1 font-black text-emerald-700">
                      {moneda(
                        costoReceta(receta),
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {receta.ingredientes.map(
                    (ingrediente) => (
                      <div
                        key={ingrediente.insumoId}
                        className="rounded-xl bg-slate-50 p-3"
                      >
                        <p className="text-sm font-bold text-slate-800">
                          {ingrediente.insumoNombre}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {ingrediente.cantidadPorProducto} {ingrediente.unidadBase}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </article>
            ))}
        </div>
      </Modal>
    </div>
  );
}

export default PanelRecetas;
