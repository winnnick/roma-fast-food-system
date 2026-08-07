import {
  Boxes,
  ChefHat,
  CircleDollarSign,
  CirclePower,
  Edit3,
  ImageOff,
  LoaderCircle,
  PackageOpen,
  PackagePlus,
  Power,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tags,
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
  listarCategorias,
} from "../../servicios/categoriaServicio";

import {
  cambiarEstadoProducto,
  cambiarProductoDestacado,
  listarProductos,
} from "../../servicios/productoServicio";

import {
  actualizarProductoConInventario,
  crearProductoConInventario,
  listarEstadosInventarioProductos,
  listarInsumosInventario,
  obtenerRecetaVigenteProducto,
} from "../../servicios/inventarioServicio";

import type {
  InsumoInventario,
  RecetaProducto,
} from "../../tipos/inventario";

import type {
  CategoriaProducto,
  EstadoCatalogo,
  EstadoConfiguracionInventarioProducto,
  EstadoInventarioProducto,
  ProductoMenu,
} from "../../tipos/producto";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import FormularioProducto, {
  type DatosFormularioProductoIntegrado,
} from "./FormularioProducto";

import GestionCategorias from "./GestionCategorias";

const PRODUCTOS_POR_PAGINA = 8;

type FiltroInventario =
  | "Todos"
  | EstadoConfiguracionInventarioProducto;

interface GestionProductosProps {
  puedeGestionar: boolean;
}

interface AccionEstadoProducto {
  producto: ProductoMenu;
  nuevoEstado: EstadoCatalogo;
}

function obtenerMensajeError(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function formatearPrecio(
  precio: number,
): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(precio)}`;
}

function claseInventario(
  estado:
    EstadoConfiguracionInventarioProducto,
): string {
  if (estado === "Receta configurada") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (estado === "Sin receta") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
}

function GestionProductos({
  puedeGestionar,
}: GestionProductosProps) {
  const { usuario } = useAuth();

  const [productos, setProductos] =
    useState<ProductoMenu[]>([]);

  const [categorias, setCategorias] =
    useState<CategoriaProducto[]>([]);

  const [insumos, setInsumos] =
    useState<InsumoInventario[]>([]);

  const [estadosInventario, setEstadosInventario] =
    useState<EstadoInventarioProducto[]>(
      [],
    );

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroCategoria, setFiltroCategoria] =
    useState("Todas");

  const [filtroEstado, setFiltroEstado] =
    useState<"Todos" | EstadoCatalogo>(
      "Todos",
    );

  const [filtroInventario, setFiltroInventario] =
    useState<FiltroInventario>(
      "Todos",
    );

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [modalProducto, setModalProducto] =
    useState(false);

  const [modalCategorias, setModalCategorias] =
    useState(false);

  const [productoEdicion, setProductoEdicion] =
    useState<ProductoMenu | null>(
      null,
    );

  const [recetaEdicion, setRecetaEdicion] =
    useState<RecetaProducto | null>(
      null,
    );

  const [guardando, setGuardando] =
    useState(false);

  const [cargandoEdicion, setCargandoEdicion] =
    useState(false);

  const [accionEstado, setAccionEstado] =
    useState<AccionEstadoProducto | null>(
      null,
    );

  const [procesandoEstado, setProcesandoEstado] =
    useState(false);

  const [productoProcesandoId, setProductoProcesandoId] =
    useState<number | null>(null);

  const [notificacion, setNotificacion] =
    useState<DatosNotificacion | null>(
      null,
    );

  const cerrarNotificacion =
    useCallback(() => {
      setNotificacion(null);
    }, []);

  const obtenerDatos =
    useCallback(async () => {
      return Promise.all([
        listarProductos(),
        listarCategorias(),
        listarInsumosInventario(),
        listarEstadosInventarioProductos(),
      ]);
    }, []);

  const aplicarDatos =
    useCallback(
      (
        datos: Awaited<
          ReturnType<typeof obtenerDatos>
        >,
      ) => {
        const [
          productosDatos,
          categoriasDatos,
          insumosDatos,
          estadosDatos,
        ] = datos;

        setProductos(productosDatos);
        setCategorias(categoriasDatos);
        setInsumos(insumosDatos);
        setEstadosInventario(estadosDatos);
      },
      [],
    );

  const recargarDatos =
    useCallback(async () => {
      try {
        setCargando(true);
        setErrorCarga(null);

        aplicarDatos(
          await obtenerDatos(),
        );
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      } finally {
        setCargando(false);
      }
    }, [aplicarDatos, obtenerDatos]);

  useEffect(() => {
    let activo = true;

    obtenerDatos()
      .then((datos) => {
        if (!activo) {
          return;
        }

        aplicarDatos(datos);
        setErrorCarga(null);
      })
      .catch((error: unknown) => {
        if (activo) {
          setErrorCarga(
            obtenerMensajeError(error),
          );
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [aplicarDatos, obtenerDatos]);

  const mapaCategorias = useMemo(
    () =>
      new Map(
        categorias.map((categoria) => [
          categoria.id,
          categoria,
        ]),
      ),
    [categorias],
  );

  const mapaInventario = useMemo(
    () =>
      new Map(
        estadosInventario.map((estado) => [
          estado.productoId,
          estado,
        ]),
      ),
    [estadosInventario],
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLocaleLowerCase("es");

    return productos.filter((producto) => {
      const categoria =
        mapaCategorias.get(
          producto.categoriaId,
        );

      const inventario =
        mapaInventario.get(producto.id)
          ?.estado ??
        (producto.controlInventario ===
        "No controla inventario"
          ? "No controla inventario"
          : "Sin receta");

      const coincideTexto =
        !texto ||
        producto.codigo
          .toLocaleLowerCase("es")
          .includes(texto) ||
        producto.nombre
          .toLocaleLowerCase("es")
          .includes(texto) ||
        producto.descripcion
          .toLocaleLowerCase("es")
          .includes(texto) ||
        categoria?.nombre
          .toLocaleLowerCase("es")
          .includes(texto);

      const coincideCategoria =
        filtroCategoria === "Todas" ||
        producto.categoriaId ===
          Number(filtroCategoria);

      const coincideEstado =
        filtroEstado === "Todos" ||
        producto.estado === filtroEstado;

      const coincideInventario =
        filtroInventario === "Todos" ||
        inventario === filtroInventario;

      return (
        coincideTexto &&
        coincideCategoria &&
        coincideEstado &&
        coincideInventario
      );
    });
  }, [
    busqueda,
    filtroCategoria,
    filtroEstado,
    filtroInventario,
    mapaCategorias,
    mapaInventario,
    productos,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      productosFiltrados.length /
        PRODUCTOS_POR_PAGINA,
    ),
  );

  const paginaSegura = Math.min(
    paginaActual,
    totalPaginas,
  );

  const productosPagina = useMemo(() => {
    const inicio =
      (paginaSegura - 1) *
      PRODUCTOS_POR_PAGINA;

    return productosFiltrados.slice(
      inicio,
      inicio + PRODUCTOS_POR_PAGINA,
    );
  }, [productosFiltrados, paginaSegura]);

  const productosActivos = productos.filter(
    (producto) =>
      producto.estado === "Activo",
  ).length;

  const productosSinReceta =
    estadosInventario.filter(
      (estado) =>
        estado.estado === "Sin receta",
    ).length;

  const categoriasActivas = categorias.filter(
    (categoria) =>
      categoria.estado === "Activo",
  ).length;

  const filtrosActivos =
    Boolean(busqueda) ||
    filtroCategoria !== "Todas" ||
    filtroEstado !== "Todos" ||
    filtroInventario !== "Todos";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroCategoria("Todas");
    setFiltroEstado("Todos");
    setFiltroInventario("Todos");
    setPaginaActual(1);
  }

  function abrirNuevoProducto() {
    if (!puedeGestionar) {
      return;
    }

    setProductoEdicion(null);
    setRecetaEdicion(null);
    setModalProducto(true);
  }

  async function abrirEdicionProducto(
    producto: ProductoMenu,
  ) {
    if (!puedeGestionar) {
      return;
    }

    try {
      setCargandoEdicion(true);

      const receta =
        producto.controlInventario ===
        "Con receta"
          ? await obtenerRecetaVigenteProducto(
              producto.id,
            )
          : null;

      setProductoEdicion(producto);
      setRecetaEdicion(receta);
      setModalProducto(true);
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo abrir el producto",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setCargandoEdicion(false);
    }
  }

  function cerrarProducto() {
    if (guardando) {
      return;
    }

    setModalProducto(false);
    setProductoEdicion(null);
    setRecetaEdicion(null);
  }

  async function guardarProducto(
    datos:
      DatosFormularioProductoIntegrado,
  ) {
    if (
      !puedeGestionar ||
      !usuario
    ) {
      return;
    }

    try {
      setGuardando(true);

      if (productoEdicion) {
        const resultado =
          await actualizarProductoConInventario(
            productoEdicion.id,
            {
              codigo: datos.codigo,
              nombre: datos.nombre,
              descripcion:
                datos.descripcion,
              categoriaId:
                datos.categoriaId,
              precio: datos.precio,
              disponible:
                productoEdicion.estado ===
                "Activo",
              destacado:
                productoEdicion.estado ===
                "Activo"
                  ? datos.destacado
                  : false,
              controlInventario:
                datos.controlInventario,
              imagenUrl: datos.imagenUrl,
              ingredientes:
                datos.ingredientes,
            },
            usuario,
          );

        await auditarAccion({
          modulo: "Productos",
          accion: "Actualizar producto y receta",
          entidad: "Producto",
          entidadId:
            resultado.producto.id,
          descripcion:
            `Se actualizó ${resultado.producto.nombre} y su configuración de inventario.`,
          datosAnteriores: {
            producto: productoEdicion,
            receta: recetaEdicion,
          },
          datosPosteriores: resultado,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Producto actualizado",
          mensaje:
            "La información comercial y el control de inventario fueron guardados.",
        });
      } else {
        const resultado =
          await crearProductoConInventario(
            {
              codigo: datos.codigo,
              nombre: datos.nombre,
              descripcion:
                datos.descripcion,
              categoriaId:
                datos.categoriaId,
              precio: datos.precio,
              disponible: true,
              destacado: datos.destacado,
              controlInventario:
                datos.controlInventario,
              imagenUrl: datos.imagenUrl,
              ingredientes:
                datos.ingredientes ?? [],
            },
            usuario,
          );

        await auditarAccion({
          modulo: "Productos",
          accion: "Crear producto y receta",
          entidad: "Producto",
          entidadId:
            resultado.producto.id,
          descripcion:
            `Se registró ${resultado.producto.nombre} con su configuración de inventario.`,
          datosPosteriores: resultado,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Producto registrado",
          mensaje:
            resultado.receta
              ? "El producto y su receta ya están disponibles."
              : "El producto fue registrado sin control de inventario.",
        });
      }

      setModalProducto(false);
      setProductoEdicion(null);
      setRecetaEdicion(null);

      await recargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo guardar",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarDestacado(
    producto: ProductoMenu,
  ) {
    if (
      !puedeGestionar ||
      producto.estado === "Inactivo"
    ) {
      return;
    }

    try {
      setProductoProcesandoId(
        producto.id,
      );

      const actualizado =
        await cambiarProductoDestacado(
          producto.id,
          !producto.destacado,
        );

      await auditarAccion({
        modulo: "Productos",
        accion: actualizado.destacado
          ? "Destacar producto"
          : "Quitar producto destacado",
        entidad: "Producto",
        entidadId: actualizado.id,
        descripcion:
          `${actualizado.nombre} ${
            actualizado.destacado
              ? "fue destacado"
              : "dejó de estar destacado"
          } en el menú.`,
        datosAnteriores: producto,
        datosPosteriores: actualizado,
      });

      setProductos((actuales) =>
        actuales.map((actual) =>
          actual.id === actualizado.id
            ? actualizado
            : actual,
        ),
      );
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo actualizar",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProductoProcesandoId(null);
    }
  }

  async function confirmarCambioEstado() {
    if (
      !accionEstado ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoEstado(true);

      const actualizado =
        await cambiarEstadoProducto(
          accionEstado.producto.id,
          accionEstado.nuevoEstado,
        );

      await auditarAccion({
        modulo: "Productos",
        accion:
          accionEstado.nuevoEstado ===
          "Activo"
            ? "Activar producto"
            : "Desactivar producto",
        entidad: "Producto",
        entidadId: actualizado.id,
        descripcion:
          `${actualizado.nombre} cambió a estado ${actualizado.estado}.`,
        datosAnteriores:
          accionEstado.producto,
        datosPosteriores: actualizado,
      });

      setNotificacion({
        tipo: "exito",
        titulo: "Estado actualizado",
        mensaje:
          `El producto quedó ${actualizado.estado.toLocaleLowerCase("es")}.`,
      });

      setAccionEstado(null);
      await recargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo cambiar el estado",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesandoEstado(false);
    }
  }

  return (
    <>
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          titulo="Productos registrados"
          valor={String(productos.length)}
          descripcion="Catálogo comercial completo."
          icono={Boxes}
          tono="neutro"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Productos activos"
          valor={String(productosActivos)}
          descripcion="Habilitados para nuevas ventas."
          icono={CirclePower}
          tono="verde"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Categorías activas"
          valor={String(categoriasActivas)}
          descripcion="Organización actual del menú."
          icono={Tags}
          tono="azul"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Productos sin receta"
          valor={String(productosSinReceta)}
          descripcion="Requieren configurar inventario."
          icono={ChefHat}
          tono="ambar"
          variante="compacta"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <Boxes size={22} />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Productos del menú
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Información comercial y receta en una sola gestión.
              </p>
            </div>
          </div>

          {puedeGestionar && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setModalCategorias(true)
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Tags size={18} />
                Gestionar categorías
              </button>

              <button
                type="button"
                onClick={abrirNuevoProducto}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-red-700"
              >
                <PackagePlus size={18} />
                Nuevo producto
              </button>
            </div>
          )}
        </header>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.05fr)_minmax(220px,.92fr)_minmax(190px,.78fr)_minmax(230px,.95fr)_48px] dark:border-slate-800 dark:bg-slate-950/60">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={busqueda}
              placeholder="Código, producto, descripción o categoría"
              onChange={(evento) => {
                setBusqueda(
                  evento.target.value,
                );
                setPaginaActual(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:ring-red-950/50"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(evento) => {
              setFiltroCategoria(
                evento.target.value,
              );
              setPaginaActual(1);
            }}
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-red-950/50"
          >
            <option value="Todas">
              Todas las categorías
            </option>

            {categorias.map((categoria) => (
              <option
                key={categoria.id}
                value={categoria.id}
              >
                {categoria.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(evento) => {
              setFiltroEstado(
                evento.target.value as
                  | "Todos"
                  | EstadoCatalogo,
              );
              setPaginaActual(1);
            }}
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-red-950/50"
          >
            <option value="Todos">
              Todos los estados
            </option>
            <option value="Activo">
              Activos
            </option>
            <option value="Inactivo">
              Inactivos
            </option>
          </select>

          <select
            value={filtroInventario}
            onChange={(evento) => {
              setFiltroInventario(
                evento.target.value as
                  FiltroInventario,
              );
              setPaginaActual(1);
            }}
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-red-950/50"
          >
            <option value="Todos">
              Todo inventario
            </option>
            <option value="Receta configurada">
              Receta configurada
            </option>
            <option value="Sin receta">
              Sin receta
            </option>
            <option value="No controla inventario">
              No controla inventario
            </option>
          </select>

          <button
            type="button"
            disabled={!filtrosActivos}
            onClick={limpiarFiltros}
            aria-label="Limpiar filtros"
            title="Limpiar filtros"
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="hidden grid-cols-[minmax(270px,1.55fr)_minmax(120px,.7fr)_110px_minmax(170px,.9fr)_100px_140px] gap-4 border-b border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 xl:grid">
          <span>Producto</span>
          <span>Categoría</span>
          <span>Precio</span>
          <span>Inventario</span>
          <span>Estado</span>
          <span className="text-right">
            Acciones
          </span>
        </div>

        {cargando ? (
          <div className="flex min-h-80 items-center justify-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <LoaderCircle
              size={24}
              className="animate-spin"
            />
            Cargando productos...
          </div>
        ) : errorCarga ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-md text-sm font-bold text-red-600 dark:text-red-400">
              {errorCarga}
            </p>

            <button
              type="button"
              onClick={() =>
                void recargarDatos()
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw size={17} />
              Reintentar
            </button>
          </div>
        ) : productosPagina.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
            <Boxes
              size={38}
              className="text-slate-300 dark:text-slate-700"
            />

            <p className="mt-3 font-black text-slate-900 dark:text-white">
              No se encontraron productos
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filtrosActivos
                ? "No existen coincidencias con los filtros aplicados."
                : "Todavía no existen productos registrados."}
            </p>

            {filtrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RotateCcw size={17} />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="min-h-[34rem] divide-y divide-slate-200 dark:divide-slate-800">
            {productosPagina.map((producto) => {
              const categoria =
                mapaCategorias.get(
                  producto.categoriaId,
                );

              const estadoInventario =
                mapaInventario.get(
                  producto.id,
                )?.estado ??
                (producto.controlInventario ===
                "No controla inventario"
                  ? "No controla inventario"
                  : "Sin receta");

              const procesando =
                productoProcesandoId ===
                producto.id;

              return (
                <article
                  key={producto.id}
                  className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 xl:grid-cols-[minmax(270px,1.55fr)_minmax(120px,.7fr)_110px_minmax(170px,.9fr)_100px_140px] xl:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <ImageOff size={20} />

                      {producto.imagenUrl && (
                        <img
                          src={producto.imagenUrl}
                          alt={producto.nombre}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(evento) => {
                            evento.currentTarget.style.display =
                              "none";
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-900 dark:text-white">
                          {producto.nombre}
                        </p>

                        {producto.destacado && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            <Star
                              size={10}
                              fill="currentColor"
                            />
                            Destacado
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs font-black uppercase tracking-wide text-red-600 dark:text-red-400">
                        {producto.codigo}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {producto.descripcion}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {categoria?.nombre ??
                        "Sin categoría"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CircleDollarSign
                      size={17}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="font-black text-slate-900 dark:text-white">
                      {formatearPrecio(
                        producto.precio,
                      )}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={!puedeGestionar}
                      onClick={() =>
                        void abrirEdicionProducto(
                          producto,
                        )
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition-colors ${claseInventario(
                        estadoInventario,
                      )} ${
                        puedeGestionar
                          ? "hover:brightness-95"
                          : "cursor-default"
                      }`}
                    >
                      {estadoInventario ===
                      "Receta configurada" ? (
                        <ChefHat size={14} />
                      ) : estadoInventario ===
                        "Sin receta" ? (
                        <PackagePlus size={14} />
                      ) : (
                        <PackageOpen size={14} />
                      )}
                      {estadoInventario}
                    </button>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                        producto.estado ===
                        "Activo"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {producto.estado}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    {puedeGestionar && (
                      <>
                        <button
                          type="button"
                          title="Editar producto y receta"
                          aria-label={`Editar ${producto.nombre}`}
                          disabled={cargandoEdicion}
                          onClick={() =>
                            void abrirEdicionProducto(
                              producto,
                            )
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          {cargandoEdicion ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Edit3 size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          aria-label={
                            producto.destacado
                              ? `Quitar ${producto.nombre} de destacados`
                              : `Marcar ${producto.nombre} como destacado`
                          }
                          title={
                            producto.destacado
                              ? "Quitar destacado"
                              : "Marcar como destacado"
                          }
                          disabled={
                            procesando ||
                            producto.estado ===
                              "Inactivo"
                          }
                          onClick={() =>
                            void cambiarDestacado(
                              producto,
                            )
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
                        >
                          {procesando ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Sparkles size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          aria-label={
                            producto.estado === "Activo"
                              ? `Desactivar ${producto.nombre}`
                              : `Activar ${producto.nombre}`
                          }
                          title={
                            producto.estado ===
                            "Activo"
                              ? "Desactivar producto"
                              : "Activar producto"
                          }
                          onClick={() =>
                            setAccionEstado({
                              producto,
                              nuevoEstado:
                                producto.estado ===
                                "Activo"
                                  ? "Inactivo"
                                  : "Activo",
                            })
                          }
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                            producto.estado ===
                            "Activo"
                              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                          }`}
                        >
                          {producto.estado ===
                          "Activo" ? (
                            <Power size={17} />
                          ) : (
                            <CirclePower size={17} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando {productosPagina.length} de{" "}
            {productosFiltrados.length} productos
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaSegura <= 1}
              onClick={() =>
                setPaginaActual((pagina) =>
                  Math.max(1, pagina - 1),
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Anterior
            </button>

            <span className="min-w-16 text-center text-xs font-black text-slate-700 dark:text-slate-200">
              {paginaSegura} / {totalPaginas}
            </span>

            <button
              type="button"
              disabled={
                paginaSegura >= totalPaginas
              }
              onClick={() =>
                setPaginaActual((pagina) =>
                  Math.min(
                    totalPaginas,
                    pagina + 1,
                  ),
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>


      <Modal
        abierto={modalProducto}
        titulo={
          productoEdicion
            ? "Editar producto"
            : "Nuevo producto"
        }
        descripcion={
          productoEdicion
            ? "Actualiza la información comercial y su receta sin salir de esta pantalla."
            : "Registra la información comercial y configura el consumo de inventario en una sola operación."
        }
        ancho="grande"
        alCerrar={cerrarProducto}
      >
        <FormularioProducto
          key={
            productoEdicion
              ? `producto-${productoEdicion.id}-${recetaEdicion?.id ?? "sin-receta"}`
              : "nuevo-producto"
          }
          producto={productoEdicion}
          categorias={categorias}
          insumos={insumos}
          recetaVigente={recetaEdicion}
          cargando={guardando}
          alGuardar={guardarProducto}
          alCancelar={cerrarProducto}
          alGestionarCategorias={() =>
            setModalCategorias(true)
          }
        />
      </Modal>

      <Modal
        abierto={modalCategorias}
        titulo="Gestionar categorías"
        descripcion="Crea, edita o cambia el estado de las categorías sin abandonar el catálogo de productos."
        ancho="grande"
        alCerrar={() =>
          setModalCategorias(false)
        }
      >
        <GestionCategorias
          puedeGestionar={puedeGestionar}
          alCambiar={() =>
            void recargarDatos()
          }
        />
      </Modal>

      <ModalConfirmacion
        abierto={accionEstado !== null}
        titulo={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? "Activar producto"
            : "Desactivar producto"
        }
        descripcion={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? `“${accionEstado?.producto.nombre ?? ""}” volverá a estar habilitado para ventas.`
            : `“${accionEstado?.producto.nombre ?? ""}” dejará de mostrarse para nuevas ventas. Su historial y receta se conservarán.`
        }
        textoConfirmar={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? "Sí, activar"
            : "Sí, desactivar"
        }
        centrarIcono
        variante={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? "activar"
            : "peligro"
        }
        cargando={procesandoEstado}
        alConfirmar={confirmarCambioEstado}
        alCancelar={() => {
          if (!procesandoEstado) {
            setAccionEstado(null);
          }
        }}
      />

      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={cerrarNotificacion}
      />
    </>
  );
}

export default GestionProductos;
