import {
  AlertTriangle,
  CircleDollarSign,
  ImageOff,
  LoaderCircle,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  StarOff,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  actualizarProducto,
  cambiarDisponibilidadProducto,
  cambiarEstadoProducto,
  cambiarProductoDestacado,
  crearProducto,
  listarProductos,
} from "../../servicios/productoServicio";

import {
  listarCategorias,
} from "../../servicios/categoriaServicio";

import type {
  CategoriaProducto,
  CrearProductoDto,
  EstadoCatalogo,
  ProductoMenu,
} from "../../tipos/producto";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import FormularioProducto from "./FormularioProducto";

const PRODUCTOS_POR_PAGINA = 6;

type FiltroEstadoProducto =
  | "Todos"
  | EstadoCatalogo;

type FiltroDisponibilidad =
  | "Todas"
  | "Disponible"
  | "No disponible";

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
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function formatearPrecio(
  precio: number,
): string {
  const valor =
    new Intl.NumberFormat("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(precio);

  return `Bs ${valor}`;
}

function formatearFecha(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fecha));
}

function GestionProductos({
  puedeGestionar,
}: GestionProductosProps) {
  const [productos, setProductos] =
    useState<ProductoMenu[]>([]);

  const [categorias, setCategorias] =
    useState<CategoriaProducto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("Todas");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstadoProducto>(
      "Todos",
    );

  const [
    filtroDisponibilidad,
    setFiltroDisponibilidad,
  ] =
    useState<FiltroDisponibilidad>(
      "Todas",
    );

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [
    modalFormularioAbierto,
    setModalFormularioAbierto,
  ] = useState(false);

  const [
    productoEnEdicion,
    setProductoEnEdicion,
  ] =
    useState<ProductoMenu | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [
    accionEstado,
    setAccionEstado,
  ] =
    useState<AccionEstadoProducto | null>(
      null,
    );

  const [
    cambiandoEstado,
    setCambiandoEstado,
  ] = useState(false);

  const [
    productoProcesandoId,
    setProductoProcesandoId,
  ] = useState<number | null>(null);

  const [
    notificacion,
    setNotificacion,
  ] =
    useState<DatosNotificacion | null>(
      null,
    );

  const cerrarNotificacion =
    useCallback(() => {
      setNotificacion(null);
    }, []);

  useEffect(() => {
    let componenteActivo = true;

    Promise.all([
      listarProductos(),
      listarCategorias(),
    ])
      .then(
        ([
          productosObtenidos,
          categoriasObtenidas,
        ]) => {
          if (!componenteActivo) {
            return;
          }

          setProductos(
            productosObtenidos,
          );

          setCategorias(
            categoriasObtenidas,
          );

          setErrorCarga(null);
        },
      )
      .catch((error: unknown) => {
        if (!componenteActivo) {
          return;
        }

        setErrorCarga(
          obtenerMensajeError(error),
        );
      })
      .finally(() => {
        if (componenteActivo) {
          setCargando(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, []);

  async function recargarDatos() {
    const [
      productosObtenidos,
      categoriasObtenidas,
    ] = await Promise.all([
      listarProductos(),
      listarCategorias(),
    ]);

    setProductos(productosObtenidos);
    setCategorias(categoriasObtenidas);
    setErrorCarga(null);
  }

  async function reintentarCarga() {
    setCargando(true);
    setErrorCarga(null);

    try {
      await recargarDatos();
    } catch (error: unknown) {
      setErrorCarga(
        obtenerMensajeError(error),
      );
    } finally {
      setCargando(false);
    }
  }

  const categoriasPorId =
    useMemo(() => {
      return new Map(
        categorias.map((categoria) => [
          categoria.id,
          categoria,
        ]),
      );
    }, [categorias]);

  const categoriasActivas =
    useMemo(() => {
      return categorias.filter(
        (categoria) =>
          categoria.estado === "Activo",
      );
    }, [categorias]);

  const productosFiltrados =
    useMemo(() => {
      const textoBusqueda =
        busqueda
          .trim()
          .toLocaleLowerCase("es");

      return productos.filter(
        (producto) => {
          const categoria =
            categoriasPorId.get(
              producto.categoriaId,
            );

          const coincideBusqueda =
            !textoBusqueda ||
            producto.codigo
              .toLocaleLowerCase("es")
              .includes(textoBusqueda) ||
            producto.nombre
              .toLocaleLowerCase("es")
              .includes(textoBusqueda) ||
            producto.descripcion
              .toLocaleLowerCase("es")
              .includes(textoBusqueda) ||
            categoria?.nombre
              .toLocaleLowerCase("es")
              .includes(textoBusqueda);

          const coincideCategoria =
            filtroCategoria === "Todas" ||
            producto.categoriaId ===
              Number(filtroCategoria);

          const coincideEstado =
            filtroEstado === "Todos" ||
            producto.estado ===
              filtroEstado;

          const coincideDisponibilidad =
            filtroDisponibilidad ===
              "Todas" ||
            (
              filtroDisponibilidad ===
              "Disponible" &&
              producto.disponible
            ) ||
            (
              filtroDisponibilidad ===
              "No disponible" &&
              !producto.disponible
            );

          return (
            coincideBusqueda &&
            coincideCategoria &&
            coincideEstado &&
            coincideDisponibilidad
          );
        },
      );
    }, [
      productos,
      categoriasPorId,
      busqueda,
      filtroCategoria,
      filtroEstado,
      filtroDisponibilidad,
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

  const productosPagina =
    useMemo(() => {
      const inicio =
        (paginaSegura - 1) *
        PRODUCTOS_POR_PAGINA;

      return productosFiltrados.slice(
        inicio,
        inicio +
          PRODUCTOS_POR_PAGINA,
      );
    }, [
      productosFiltrados,
      paginaSegura,
    ]);

  const totalActivos =
    productos.filter(
      (producto) =>
        producto.estado === "Activo",
    ).length;

  const totalDisponibles =
    productos.filter(
      (producto) =>
        producto.estado === "Activo" &&
        producto.disponible,
    ).length;

  const totalNoDisponibles =
    productos.filter(
      (producto) =>
        producto.estado === "Activo" &&
        !producto.disponible,
    ).length;

  const totalDestacados =
    productos.filter(
      (producto) =>
        producto.estado === "Activo" &&
        producto.destacado,
    ).length;

  const filtrosActivos =
    Boolean(busqueda) ||
    filtroCategoria !== "Todas" ||
    filtroEstado !== "Todos" ||
    filtroDisponibilidad !== "Todas";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroCategoria("Todas");
    setFiltroEstado("Todos");
    setFiltroDisponibilidad("Todas");
    setPaginaActual(1);
  }

  function abrirNuevoProducto() {
    if (
      !puedeGestionar ||
      categoriasActivas.length === 0
    ) {
      return;
    }

    setProductoEnEdicion(null);
    setModalFormularioAbierto(true);
  }

  function abrirEdicionProducto(
    producto: ProductoMenu,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setProductoEnEdicion(producto);
    setModalFormularioAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setModalFormularioAbierto(false);
    setProductoEnEdicion(null);
  }

  async function guardarProducto(
    datos: CrearProductoDto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setGuardando(true);

    try {
      if (productoEnEdicion) {
        await actualizarProducto(
          productoEnEdicion.id,
          datos,
        );

        setNotificacion({
          tipo: "exito",
          titulo:
            "Producto actualizado",
          mensaje:
            "Los cambios del producto fueron guardados correctamente.",
        });
      } else {
        await crearProducto(datos);

        setNotificacion({
          tipo: "exito",
          titulo:
            "Producto registrado",
          mensaje:
            "El nuevo producto ya forma parte del catálogo.",
        });
      }

      await recargarDatos();

      setModalFormularioAbierto(false);
      setProductoEnEdicion(null);
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo guardar",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarDisponibilidad(
    producto: ProductoMenu,
  ) {
    if (
      !puedeGestionar ||
      producto.estado === "Inactivo"
    ) {
      return;
    }

    setProductoProcesandoId(
      producto.id,
    );

    try {
      const nuevaDisponibilidad =
        !producto.disponible;

      await cambiarDisponibilidadProducto(
        producto.id,
        nuevaDisponibilidad,
      );

      await recargarDatos();

      setNotificacion({
        tipo: "exito",
        titulo: nuevaDisponibilidad
          ? "Producto disponible"
          : "Producto no disponible",
        mensaje: nuevaDisponibilidad
          ? "El producto puede seleccionarse nuevamente en los pedidos."
          : "El producto dejó de estar disponible temporalmente.",
      });
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo cambiar la disponibilidad",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProductoProcesandoId(null);
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

    setProductoProcesandoId(
      producto.id,
    );

    try {
      const nuevoDestacado =
        !producto.destacado;

      await cambiarProductoDestacado(
        producto.id,
        nuevoDestacado,
      );

      await recargarDatos();

      setNotificacion({
        tipo: "exito",
        titulo: nuevoDestacado
          ? "Producto destacado"
          : "Producto sin destacar",
        mensaje: nuevoDestacado
          ? "El producto tendrá prioridad en futuras pantallas de pedidos."
          : "El producto dejó de estar marcado como destacado.",
      });
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo actualizar el producto",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProductoProcesandoId(null);
    }
  }

  function solicitarCambioEstado(
    producto: ProductoMenu,
  ) {
    if (!puedeGestionar) {
      return;
    }

    const nuevoEstado:
      EstadoCatalogo =
      producto.estado === "Activo"
        ? "Inactivo"
        : "Activo";

    setAccionEstado({
      producto,
      nuevoEstado,
    });
  }

  async function confirmarCambioEstado() {
    if (
      !accionEstado ||
      !puedeGestionar
    ) {
      return;
    }

    setCambiandoEstado(true);

    try {
      await cambiarEstadoProducto(
        accionEstado.producto.id,
        accionEstado.nuevoEstado,
      );

      await recargarDatos();

      const seActivo =
        accionEstado.nuevoEstado ===
        "Activo";

      setNotificacion({
        tipo: "exito",
        titulo: seActivo
          ? "Producto activado"
          : "Producto desactivado",
        mensaje: seActivo
          ? "El producto volvió a formar parte del catálogo activo."
          : "El producto fue desactivado sin eliminar su información histórica.",
      });

      setAccionEstado(null);
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo cambiar el estado",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setCambiandoEstado(false);
    }
  }

  if (cargando) {
    return (
      <div
        className="
          flex min-h-96
          items-center justify-center
          rounded-3xl
          border border-slate-200
          bg-white
        "
      >
        <div className="text-center">
          <LoaderCircle
            size={36}
            className="
              mx-auto animate-spin
              text-red-700
            "
          />

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-700
            "
          >
            Cargando productos...
          </p>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div
        className="
          rounded-3xl
          border border-red-200
          bg-red-50 p-8
          text-center
        "
      >
        <AlertTriangle
          size={40}
          className="
            mx-auto text-red-600
          "
        />

        <h2
          className="
            mt-4 text-xl font-black
            text-red-900
          "
        >
          No se pudieron cargar los
          productos
        </h2>

        <p
          className="
            mx-auto mt-2 max-w-lg
            text-sm leading-relaxed
            text-red-700
          "
        >
          {errorCarga}
        </p>

        <button
          type="button"
          onClick={() =>
            void reintentarCarga()
          }
          className="
            mt-5 inline-flex
            items-center gap-2
            rounded-xl bg-red-700
            px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-red-800
          "
        >
          <RotateCcw size={18} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="space-y-6">
        <div
          className="
            grid grid-cols-1 gap-5
            sm:grid-cols-2 xl:grid-cols-4
          "
        >
          <TarjetaMetrica
            titulo="Productos registrados"
            valor={String(
              productos.length,
            )}
            descripcion={`${totalActivos} productos activos`}
            icono={Package}
            tono="azul"
          />

          <TarjetaMetrica
            titulo="Disponibles"
            valor={String(
              totalDisponibles,
            )}
            descripcion="Habilitados para pedidos"
            icono={PackageCheck}
            tono="verde"
          />

          <TarjetaMetrica
            titulo="No disponibles"
            valor={String(
              totalNoDisponibles,
            )}
            descripcion="Temporalmente fuera del menú"
            icono={PackageX}
            tono="ambar"
          />

          <TarjetaMetrica
            titulo="Destacados"
            valor={String(
              totalDestacados,
            )}
            descripcion="Productos con prioridad"
            icono={Sparkles}
            tono="roma"
          />
        </div>

        <section
          className="
            overflow-hidden
            rounded-3xl
            border border-slate-200
            bg-white shadow-panel
          "
        >
          <div
            className="
              flex flex-col gap-4
              border-b border-slate-100
              p-5 sm:p-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-xl font-black
                  text-slate-900
                "
              >
                Catálogo de productos
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-slate-500
                "
              >
                Consulta y administra los
                productos ofrecidos por
                Roma Fast Food.
              </p>
            </div>

            {puedeGestionar && (
              <button
                type="button"
                disabled={
                  categoriasActivas.length ===
                  0
                }
                title={
                  categoriasActivas.length ===
                  0
                    ? "Registre o active una categoría antes de crear productos"
                    : "Registrar producto"
                }
                onClick={
                  abrirNuevoProducto
                }
                className="
                  inline-flex items-center
                  justify-center gap-2
                  rounded-xl bg-red-700
                  px-5 py-3
                  text-sm font-bold
                  text-white
                  transition-colors
                  hover:bg-red-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Plus size={19} />
                Nuevo producto
              </button>
            )}
          </div>

          <div
            className="
              grid gap-3
              border-b border-slate-100
              bg-slate-50/70 p-5
              xl:grid-cols-[1fr_220px_190px_210px_auto]
            "
          >
            <div className="relative">
              <Search
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="search"
                value={busqueda}
                placeholder="Buscar por código, nombre o categoría..."
                onChange={(evento) => {
                  setBusqueda(
                    evento.target.value,
                  );

                  setPaginaActual(1);
                }}
                className="
                  h-12 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white pl-11 pr-4
                  text-sm outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-red-600
                  focus:ring-4
                  focus:ring-red-100
                "
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
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-semibold
                text-slate-700
                outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
              "
            >
              <option value="Todas">
                Todas las categorías
              </option>

              {categorias.map(
                (categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nombre}
                  </option>
                ),
              )}
            </select>

            <select
              value={filtroEstado}
              onChange={(evento) => {
                setFiltroEstado(
                  evento.target
                    .value as FiltroEstadoProducto,
                );

                setPaginaActual(1);
              }}
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-semibold
                text-slate-700
                outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
              "
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
              value={
                filtroDisponibilidad
              }
              onChange={(evento) => {
                setFiltroDisponibilidad(
                  evento.target
                    .value as FiltroDisponibilidad,
                );

                setPaginaActual(1);
              }}
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-semibold
                text-slate-700
                outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
              "
            >
              <option value="Todas">
                Toda disponibilidad
              </option>

              <option value="Disponible">
                Disponibles
              </option>

              <option value="No disponible">
                No disponibles
              </option>
            </select>

            <button
              type="button"
              disabled={!filtrosActivos}
              onClick={limpiarFiltros}
              className="
                inline-flex h-12
                items-center justify-center
                gap-2 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-bold
                text-slate-700
                transition-colors
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <RotateCcw size={17} />
              Limpiar
            </button>
          </div>

          <div
            className="
              border-b border-slate-100
              px-5 py-4
              text-sm text-slate-500
            "
          >
            Se encontraron{" "}
            <strong
              className="
                text-slate-800
              "
            >
              {
                productosFiltrados.length
              }
            </strong>{" "}
            productos.
          </div>

          {productosPagina.length ===
          0 ? (
            <div
              className="
                flex min-h-80
                flex-col items-center
                justify-center
                px-6 py-12
                text-center
              "
            >
              <div
                className="
                  flex h-16 w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-slate-100
                  text-slate-400
                "
              >
                <Search size={29} />
              </div>

              <h3
                className="
                  mt-5 text-lg
                  font-black
                  text-slate-900
                "
              >
                No se encontraron
                productos
              </h3>

              <p
                className="
                  mt-2 max-w-md
                  text-sm leading-relaxed
                  text-slate-500
                "
              >
                Modifica los criterios de
                búsqueda o registra un
                nuevo producto.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="
                  w-full min-w-[1100px]
                "
              >
                <thead>
                  <tr
                    className="
                      bg-slate-50
                      text-left
                    "
                  >
                    <th
                      className="
                        px-5 py-4
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      Producto
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      Categoría
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      Precio
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      Disponibilidad
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      Estado
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-right
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-100
                  "
                >
                  {productosPagina.map(
                    (producto) => {
                      const categoria =
                        categoriasPorId.get(
                          producto.categoriaId,
                        );

                      const procesando =
                        productoProcesandoId ===
                        producto.id;

                      return (
                        <tr
                          key={producto.id}
                          className="
                            transition-colors
                            hover:bg-slate-50/70
                          "
                        >
                          <td className="px-5 py-4">
                            <div
                              className="
                                flex items-center
                                gap-4
                              "
                            >
                              <div
                                className="
                                  relative flex
                                  h-14 w-14
                                  shrink-0
                                  items-center
                                  justify-center
                                  overflow-hidden
                                  rounded-2xl
                                  bg-slate-100
                                  text-slate-400
                                "
                              >
                                <ImageOff
                                  size={22}
                                />

                                {producto.imagenUrl && (
                                  <img
                                    src={
                                      producto.imagenUrl
                                    }
                                    alt={
                                      producto.nombre
                                    }
                                    className="
                                      absolute inset-0
                                      h-full w-full
                                      object-cover
                                    "
                                    onError={(
                                      evento,
                                    ) => {
                                      evento.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                )}
                              </div>

                              <div>
                                <div
                                  className="
                                    flex flex-wrap
                                    items-center
                                    gap-2
                                  "
                                >
                                  <p
                                    className="
                                      font-bold
                                      text-slate-900
                                    "
                                  >
                                    {
                                      producto.nombre
                                    }
                                  </p>

                                  {producto.destacado && (
                                    <span
                                      title="Producto destacado"
                                      className="
                                        inline-flex
                                        items-center
                                        gap-1 rounded-full
                                        bg-amber-100
                                        px-2 py-0.5
                                        text-[10px]
                                        font-bold
                                        text-amber-700
                                      "
                                    >
                                      <Star
                                        size={
                                          11
                                        }
                                        fill="currentColor"
                                      />
                                      Destacado
                                    </span>
                                  )}
                                </div>

                                <p
                                  className="
                                    mt-1 text-xs
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    text-red-700
                                  "
                                >
                                  {
                                    producto.codigo
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1 max-w-sm
                                    text-xs
                                    leading-relaxed
                                    text-slate-500
                                  "
                                >
                                  {
                                    producto.descripcion
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1 text-[11px]
                                    text-slate-400
                                  "
                                >
                                  Actualizado:{" "}
                                  {formatearFecha(
                                    producto.fechaActualizacion,
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="
                                inline-flex
                                rounded-full
                                bg-blue-50
                                px-3 py-1
                                text-xs font-bold
                                text-blue-700
                              "
                            >
                              {categoria?.nombre ??
                                "Sin categoría"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div
                              className="
                                flex items-center
                                gap-2
                              "
                            >
                              <CircleDollarSign
                                size={18}
                                className="
                                  text-emerald-600
                                "
                              />

                              <span
                                className="
                                  font-black
                                  text-slate-900
                                "
                              >
                                {formatearPrecio(
                                  producto.precio,
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {puedeGestionar ? (
                              <button
                                type="button"
                                disabled={
                                  producto.estado ===
                                    "Inactivo" ||
                                  procesando
                                }
                                title={
                                  producto.estado ===
                                  "Inactivo"
                                    ? "El producto está inactivo"
                                    : producto.disponible
                                      ? "Marcar como no disponible"
                                      : "Marcar como disponible"
                                }
                                onClick={() =>
                                  void cambiarDisponibilidad(
                                    producto,
                                  )
                                }
                                className={`
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-xl
                                  px-3 py-2
                                  text-xs font-bold
                                  transition-colors
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                  ${
                                    producto.disponible
                                      ? `
                                        bg-emerald-50
                                        text-emerald-700
                                        hover:bg-emerald-100
                                      `
                                      : `
                                        bg-amber-50
                                        text-amber-700
                                        hover:bg-amber-100
                                      `
                                  }
                                `}
                              >
                                {procesando ? (
                                  <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : producto.disponible ? (
                                  <PackageCheck
                                    size={
                                      15
                                    }
                                  />
                                ) : (
                                  <PackageX
                                    size={
                                      15
                                    }
                                  />
                                )}

                                {producto.disponible
                                  ? "Disponible"
                                  : "No disponible"}
                              </button>
                            ) : (
                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  gap-2
                                  rounded-full
                                  px-3 py-1
                                  text-xs font-bold
                                  ${
                                    producto.disponible
                                      ? `
                                        bg-emerald-50
                                        text-emerald-700
                                      `
                                      : `
                                        bg-amber-50
                                        text-amber-700
                                      `
                                  }
                                `}
                              >
                                {producto.disponible ? (
                                  <PackageCheck
                                    size={
                                      14
                                    }
                                  />
                                ) : (
                                  <PackageX
                                    size={
                                      14
                                    }
                                  />
                                )}

                                {producto.disponible
                                  ? "Disponible"
                                  : "No disponible"}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`
                                inline-flex
                                items-center
                                rounded-full
                                px-3 py-1
                                text-xs font-bold
                                ${
                                  producto.estado ===
                                  "Activo"
                                    ? `
                                      bg-emerald-100
                                      text-emerald-700
                                    `
                                    : `
                                      bg-slate-200
                                      text-slate-600
                                    `
                                }
                              `}
                            >
                              {
                                producto.estado
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {puedeGestionar ? (
                              <div
                                className="
                                  flex items-center
                                  justify-end gap-2
                                "
                              >
                                <button
                                  type="button"
                                  title="Editar producto"
                                  onClick={() =>
                                    abrirEdicionProducto(
                                      producto,
                                    )
                                  }
                                  className="
                                    rounded-xl
                                    border
                                    border-blue-200
                                    bg-blue-50
                                    p-2.5
                                    text-blue-700
                                    transition-colors
                                    hover:bg-blue-100
                                  "
                                >
                                  <Pencil
                                    size={17}
                                  />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    producto.estado ===
                                      "Inactivo" ||
                                    procesando
                                  }
                                  title={
                                    producto.destacado
                                      ? "Quitar de destacados"
                                      : "Marcar como destacado"
                                  }
                                  onClick={() =>
                                    void cambiarDestacado(
                                      producto,
                                    )
                                  }
                                  className="
                                    rounded-xl
                                    border
                                    border-amber-200
                                    bg-amber-50
                                    p-2.5
                                    text-amber-700
                                    transition-colors
                                    hover:bg-amber-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                  "
                                >
                                  {producto.destacado ? (
                                    <StarOff
                                      size={
                                        17
                                      }
                                    />
                                  ) : (
                                    <Star
                                      size={
                                        17
                                      }
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  title={
                                    producto.estado ===
                                    "Activo"
                                      ? "Desactivar producto"
                                      : "Activar producto"
                                  }
                                  onClick={() =>
                                    solicitarCambioEstado(
                                      producto,
                                    )
                                  }
                                  className={`
                                    rounded-xl
                                    border p-2.5
                                    transition-colors
                                    ${
                                      producto.estado ===
                                      "Activo"
                                        ? `
                                          border-red-200
                                          bg-red-50
                                          text-red-700
                                          hover:bg-red-100
                                        `
                                        : `
                                          border-emerald-200
                                          bg-emerald-50
                                          text-emerald-700
                                          hover:bg-emerald-100
                                        `
                                    }
                                  `}
                                >
                                  {producto.estado ===
                                  "Activo" ? (
                                    <Power
                                      size={
                                        17
                                      }
                                    />
                                  ) : (
                                    <RotateCcw
                                      size={
                                        17
                                      }
                                    />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p
                                className="
                                  text-right
                                  text-xs font-semibold
                                  text-slate-400
                                "
                              >
                                Solo lectura
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div
            className="
              flex flex-col gap-4
              border-t border-slate-100
              px-5 py-4 sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                text-sm text-slate-500
              "
            >
              Página{" "}
              <strong
                className="
                  text-slate-800
                "
              >
                {paginaSegura}
              </strong>{" "}
              de{" "}
              <strong
                className="
                  text-slate-800
                "
              >
                {totalPaginas}
              </strong>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  paginaSegura === 1
                }
                onClick={() =>
                  setPaginaActual(
                    (pagina) =>
                      Math.max(
                        1,
                        pagina - 1,
                      ),
                  )
                }
                className="
                  rounded-xl border
                  border-slate-300
                  px-4 py-2
                  text-sm font-bold
                  text-slate-700
                  transition-colors
                  hover:bg-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={
                  paginaSegura ===
                  totalPaginas
                }
                onClick={() =>
                  setPaginaActual(
                    (pagina) =>
                      Math.min(
                        totalPaginas,
                        pagina + 1,
                      ),
                  )
                }
                className="
                  rounded-xl border
                  border-slate-300
                  px-4 py-2
                  text-sm font-bold
                  text-slate-700
                  transition-colors
                  hover:bg-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </section>

      <Modal
        abierto={
          modalFormularioAbierto
        }
        titulo={
          productoEnEdicion
            ? "Editar producto"
            : "Registrar producto"
        }
        descripcion={
          productoEnEdicion
            ? "Actualiza la información comercial del producto seleccionado."
            : "Completa los datos necesarios para añadir un producto al menú."
        }
        ancho="grande"
        alCerrar={cerrarFormulario}
      >
        <FormularioProducto
          key={
            productoEnEdicion
              ? `editar-producto-${productoEnEdicion.id}`
              : "nuevo-producto"
          }
          producto={productoEnEdicion}
          categorias={categorias}
          cargando={guardando}
          alGuardar={guardarProducto}
          alCancelar={cerrarFormulario}
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
            ? `¿Deseas activar “${accionEstado.producto.nombre}”? El producto volverá a formar parte del catálogo activo.`
            : `¿Deseas desactivar “${accionEstado?.producto.nombre ?? ""}”? También quedará marcado como no disponible y dejará de estar destacado.`
        }
        textoConfirmar={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? "Sí, activar"
            : "Sí, desactivar"
        }
        variante={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? "activar"
            : "peligro"
        }
        cargando={cambiandoEstado}
        alConfirmar={
          confirmarCambioEstado
        }
        alCancelar={() => {
          if (!cambiandoEstado) {
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