import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  FilterX,
  History,
  PackageSearch,
  RefreshCw,
  Search,
  Utensils,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../contextos/AuthContext";
import { auditarAccion } from "../../servicios/auditoriaAccionesServicio";
import { listarCategorias } from "../../servicios/categoriaServicio";
import {
  guardarNuevaVersionRecetaInventario,
  listarInsumosInventario,
  listarRecetasInventario,
} from "../../servicios/inventarioServicio";
import { listarProductos } from "../../servicios/productoServicio";

import type {
  GuardarRecetaProductoDto,
  InsumoInventario,
  RecetaProducto,
} from "../../tipos/inventario";
import type {
  CategoriaProducto,
  ProductoMenu,
} from "../../tipos/producto";
import type { DatosNotificacion } from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import FormularioReceta from "./FormularioReceta";

interface PanelRecetasProps {
  puedeGestionarRecetas: boolean;
  alNotificar: (notificacion: DatosNotificacion) => void;
  alCambio: () => Promise<void>;
}

const REGISTROS_POR_PAGINA = 6;

type FiltroReceta =
  | "Todos"
  | "Con receta"
  | "Sin receta"
  | "No controla inventario";

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function fecha(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fechaIso));
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function PanelRecetas({
  puedeGestionarRecetas,
  alNotificar,
  alCambio,
}: PanelRecetasProps) {
  const { usuario } = useAuth();

  const [productos, setProductos] = useState<ProductoMenu[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [recetas, setRecetas] = useState<RecetaProducto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [filtro, setFiltro] = useState<FiltroReceta>("Todos");
  const [pagina, setPagina] = useState(1);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoMenu | null>(null);
  const [productoHistorial, setProductoHistorial] = useState<ProductoMenu | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [productosRespuesta, categoriasRespuesta, insumosRespuesta, recetasRespuesta] = await Promise.all([
        listarProductos(),
        listarCategorias(),
        listarInsumosInventario(),
        listarRecetasInventario(),
      ]);
      setProductos(productosRespuesta);
      setCategorias(categoriasRespuesta);
      setInsumos(insumosRespuesta);
      setRecetas(recetasRespuesta);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo: "No se pudieron cargar las recetas",
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
    return () => window.clearTimeout(temporizador);
  }, [cargar]);

  const mapaCategorias = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])),
    [categorias],
  );

  const recetasVigentes = useMemo(
    () => new Map(
      recetas
        .filter((receta) => receta.estado === "Vigente")
        .map((receta) => [receta.productoId, receta]),
    ),
    [recetas],
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");
    return productos.filter((producto) => {
      const receta = recetasVigentes.get(producto.id);
      const categoriaNombre = mapaCategorias.get(producto.categoriaId) ?? "";
      const coincideTexto =
        !texto ||
        producto.nombre.toLocaleLowerCase("es").includes(texto) ||
        producto.codigo.toLocaleLowerCase("es").includes(texto) ||
        categoriaNombre.toLocaleLowerCase("es").includes(texto);
      const coincideCategoria = !categoriaId || producto.categoriaId === Number(categoriaId);
      const coincideFiltro =
        filtro === "Todos" ||
        (filtro === "Con receta" && receta !== undefined) ||
        (filtro === "Sin receta" && producto.controlInventario === "Con receta" && receta === undefined) ||
        (filtro === "No controla inventario" && producto.controlInventario === "No controla inventario");
      return coincideTexto && coincideCategoria && coincideFiltro;
    });
  }, [productos, busqueda, categoriaId, filtro, recetasVigentes, mapaCategorias]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / REGISTROS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const productosPagina = productosFiltrados.slice(
    (paginaSegura - 1) * REGISTROS_POR_PAGINA,
    paginaSegura * REGISTROS_POR_PAGINA,
  );

  const recetaSeleccionada = productoSeleccionado
    ? recetasVigentes.get(productoSeleccionado.id) ?? null
    : null;

  const historialSeleccionado = productoHistorial
    ? recetas.filter((receta) => receta.productoId === productoHistorial.id)
    : [];

  function costoReceta(receta: RecetaProducto): number {
    return receta.ingredientes.reduce((acumulado, ingrediente) => {
      const insumo = insumos.find((item) => item.id === ingrediente.insumoId);
      if (!insumo || !insumo.controlEconomico || insumo.costoPromedioUnidadBase === null) {
        return acumulado;
      }
      return acumulado + ingrediente.cantidadPorProducto * insumo.costoPromedioUnidadBase;
    }, 0);
  }

  async function guardar(datos: GuardarRecetaProductoDto) {
    if (!usuario || !puedeGestionarRecetas) return;
    try {
      setProcesando(true);
      const receta = await guardarNuevaVersionRecetaInventario(datos, usuario);
      await auditarAccion(
        {
          modulo: "Recetas",
          accion: "Crear versión de receta",
          entidad: "Receta",
          entidadId: receta.id,
          descripcion: `${usuario.nombreCompleto} creó la versión ${receta.version} de la receta de ${receta.productoNombre}.`,
          datosPosteriores: receta,
        },
        usuario,
      );
      setProductoSeleccionado(null);
      alNotificar({
        tipo: "exito",
        titulo: "Receta actualizada",
        mensaje: `${receta.productoNombre} ahora utiliza la versión ${receta.version}.`,
      });
      await Promise.all([cargar(), alCambio()]);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo: "No se pudo guardar la receta",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCategoriaId("");
    setFiltro("Todos");
    setPagina(1);
  }

  if (cargando) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 7 }).map((_, indice) => (
          <div key={indice} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-136">
      <header className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Recetas técnicas</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Supervisa ingredientes, costos y versiones sin saturar la pantalla.
          </p>
        </div>
        <button
          type="button"
          title="Actualizar recetas"
          aria-label="Actualizar recetas"
          onClick={() => void cargar()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      <div className="grid gap-2 border-b border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/30 xl:grid-cols-[minmax(260px,1fr)_220px_220px_48px]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            placeholder="Buscar producto, código o categoría"
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
          />
        </div>
        <select
          value={categoriaId}
          onChange={(evento) => {
            setCategoriaId(evento.target.value);
            setPagina(1);
          }}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
          ))}
        </select>
        <select
          value={filtro}
          onChange={(evento) => {
            setFiltro(evento.target.value as FiltroReceta);
            setPagina(1);
          }}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="Todos">Todos los productos</option>
          <option value="Con receta">Con receta</option>
          <option value="Sin receta">Sin receta</option>
          <option value="No controla inventario">No controla inventario</option>
        </select>
        <button
          type="button"
          title="Limpiar filtros"
          aria-label="Limpiar filtros"
          onClick={limpiarFiltros}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <FilterX size={17} />
        </button>
      </div>

      {productosFiltrados.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <PackageSearch size={38} className="text-slate-300" />
          <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">No existen resultados</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Modifica la búsqueda o los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="max-h-124 overflow-y-auto">
            <div className="sticky top-0 z-10 hidden grid-cols-[minmax(220px,1.15fr)_145px_minmax(250px,1.25fr)_135px_104px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:grid">
              <span>Producto</span>
              <span>Estado</span>
              <span>Ingredientes</span>
              <span>Costo insumos</span>
              <span className="text-center">Acciones</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {productosPagina.map((producto) => {
                const receta = recetasVigentes.get(producto.id);
                const noControla = producto.controlInventario === "No controla inventario";
                return (
                  <article key={producto.id} className="grid gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 lg:grid-cols-[minmax(220px,1.15fr)_145px_minmax(250px,1.25fr)_135px_104px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"><Utensils size={18} /></span>
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-900 dark:text-white">{producto.nombre}</p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-400">{producto.codigo} · {mapaCategorias.get(producto.categoriaId) ?? "Sin categoría"}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                        noControla
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          : receta
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}>
                        {noControla ? "No controla" : receta ? `Versión ${receta.version}` : "Sin receta"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {receta ? (
                        <div>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                            {receta.ingredientes.length} {receta.ingredientes.length === 1 ? "ingrediente" : "ingredientes"}
                          </p>
                          <div className="mt-1 space-y-0.5">
                            {receta.ingredientes.slice(0, 2).map((ingrediente) => (
                              <p
                                key={ingrediente.insumoId}
                                className="truncate text-xs text-slate-500 dark:text-slate-400"
                                title={`${ingrediente.insumoNombre}: ${ingrediente.cantidadPorProducto} ${ingrediente.unidadBase}`}
                              >
                                {ingrediente.insumoNombre}: <strong>{ingrediente.cantidadPorProducto} {ingrediente.unidadBase}</strong>
                              </p>
                            ))}
                            {receta.ingredientes.length > 2 && (
                              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                +{receta.ingredientes.length - 2} más
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {noControla ? "No descuenta insumos al venderse." : "Configura ingredientes para descontar inventario."}
                        </p>
                      )}
                    </div>
                    <p className="font-black text-slate-900 dark:text-white">{receta ? moneda(costoReceta(receta)) : "—"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        title={
                          noControla
                            ? "Este producto no controla inventario"
                            : receta
                              ? "Crear nueva versión"
                              : "Crear receta"
                        }
                        aria-label={
                          noControla
                            ? `${producto.nombre} no controla inventario`
                            : `${receta ? "Crear nueva versión de" : "Crear receta para"} ${producto.nombre}`
                        }
                        disabled={
                          !puedeGestionarRecetas ||
                          noControla ||
                          producto.estado === "Inactivo"
                        }
                        onClick={() => setProductoSeleccionado(producto)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
                      >
                        <Edit3 size={17} />
                      </button>

                      <button
                        type="button"
                        title={receta ? "Ver historial" : "Sin historial disponible"}
                        aria-label={
                          receta
                            ? `Ver historial de ${producto.nombre}`
                            : `${producto.nombre} no tiene historial de receta`
                        }
                        disabled={!receta}
                        onClick={() => {
                          if (receta) {
                            setProductoHistorial(producto);
                          }
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-700"
                      >
                        <History size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Página {paginaSegura} de {totalPaginas} · {productosFiltrados.length} productos</p>
            <div className="flex gap-2">
              <button type="button" title="Página anterior" aria-label="Página anterior" disabled={paginaSegura <= 1} onClick={() => setPagina((actual) => Math.max(1, actual - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><ChevronLeft size={17} /></button>
              <button type="button" title="Página siguiente" aria-label="Página siguiente" disabled={paginaSegura >= totalPaginas} onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><ChevronRight size={17} /></button>
            </div>
          </footer>
        </>
      )}

      <Modal
        abierto={Boolean(productoSeleccionado)}
        titulo={productoSeleccionado ? `Receta de ${productoSeleccionado.nombre}` : "Configurar receta"}
        descripcion={
          recetaSeleccionada
            ? `La versión ${recetaSeleccionada.version} seguirá asociada a las ventas históricas. La nueva versión se aplicará solamente a ventas futuras.`
            : "Define los ingredientes y cantidades que descontará cada venta futura de este producto."
        }
        ancho="grande"
        alCerrar={() => { if (!procesando) setProductoSeleccionado(null); }}
      >
        {productoSeleccionado && (
          <FormularioReceta
            key={`${productoSeleccionado.id}-${recetaSeleccionada?.version ?? 0}`}
            producto={productoSeleccionado}
            recetaVigente={recetaSeleccionada}
            insumos={insumos}
            cargando={procesando}
            alGuardar={guardar}
            alCancelar={() => setProductoSeleccionado(null)}
          />
        )}
      </Modal>

      <Modal
        abierto={Boolean(productoHistorial)}
        titulo={productoHistorial ? `Historial de ${productoHistorial.nombre}` : "Historial de receta"}
        descripcion="Consulta las versiones sin alterar registros anteriores."
        ancho="grande"
        alCerrar={() => setProductoHistorial(null)}
      >
        <div className="space-y-3 p-4 sm:p-5">
          {historialSeleccionado
            .sort((recetaA, recetaB) => recetaB.version - recetaA.version)
            .map((receta) => (
              <article key={receta.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900 dark:text-white">Versión {receta.version}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${receta.estado === "Vigente" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{receta.estado}</span>
                    </div>
                    <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Clock3 size={14} />Desde {fecha(receta.fechaVigenciaDesde)}{receta.fechaVigenciaHasta ? ` hasta ${fecha(receta.fechaVigenciaHasta)}` : ""}</p>
                  </div>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">{moneda(costoReceta(receta))}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {receta.ingredientes.map((ingrediente) => (
                    <div key={ingrediente.insumoId} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{ingrediente.insumoNombre}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{ingrediente.cantidadPorProducto} {ingrediente.unidadBase}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </div>
      </Modal>
    </div>
  );
}

export default PanelRecetas;
