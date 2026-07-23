import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Tags,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  actualizarCategoria,
  cambiarEstadoCategoria,
  crearCategoria,
  listarCategorias,
} from "../../servicios/categoriaServicio";

import {
  listarProductos,
} from "../../servicios/productoServicio";

import type {
  CategoriaProducto,
  CrearCategoriaDto,
  EstadoCatalogo,
  ProductoMenu,
} from "../../tipos/producto";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";

import FormularioCategoria from "./FormularioCategoria";

type FiltroEstadoCategoria =
  | "Todos"
  | EstadoCatalogo;

interface AccionCategoria {
  categoria: CategoriaProducto;
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

interface GestionCategoriasProps {
  puedeGestionar: boolean;
}

function GestionCategorias({
  puedeGestionar,
}: GestionCategoriasProps) {
  const [categorias, setCategorias] =
    useState<CategoriaProducto[]>([]);

  const [productos, setProductos] =
    useState<ProductoMenu[]>([]);

  const [
    cargandoInicial,
    setCargandoInicial,
  ] = useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstadoCategoria>(
      "Todos",
    );

  const [
    modalFormularioAbierto,
    setModalFormularioAbierto,
  ] = useState(false);

  const [
    categoriaEnEdicion,
    setCategoriaEnEdicion,
  ] =
    useState<CategoriaProducto | null>(
      null,
    );

  const [guardando, setGuardando] =
    useState(false);

  const [
    accionCategoria,
    setAccionCategoria,
  ] =
    useState<AccionCategoria | null>(
      null,
    );

  const [
    cambiandoEstado,
    setCambiandoEstado,
  ] = useState(false);

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
      listarCategorias(),
      listarProductos(),
    ])
      .then(
        ([
          categoriasObtenidas,
          productosObtenidos,
        ]) => {
          if (!componenteActivo) {
            return;
          }

          setCategorias(
            categoriasObtenidas,
          );

          setProductos(
            productosObtenidos,
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
          setCargandoInicial(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, []);

  async function recargarDatos() {
    const [
      categoriasObtenidas,
      productosObtenidos,
    ] = await Promise.all([
      listarCategorias(),
      listarProductos(),
    ]);

    setCategorias(
      categoriasObtenidas,
    );

    setProductos(
      productosObtenidos,
    );

    setErrorCarga(null);
  }

  async function reintentarCarga() {
    setCargandoInicial(true);
    setErrorCarga(null);

    try {
      await recargarDatos();
    } catch (error: unknown) {
      setErrorCarga(
        obtenerMensajeError(error),
      );
    } finally {
      setCargandoInicial(false);
    }
  }

  function abrirNuevaCategoria() {
    if (!puedeGestionar) {
      return;
    }

  setCategoriaEnEdicion(null);
  setModalFormularioAbierto(true);
}

  function abrirEditarCategoria(
    categoria: CategoriaProducto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setCategoriaEnEdicion(
      categoria,
    );

    setModalFormularioAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setModalFormularioAbierto(false);
    setCategoriaEnEdicion(null);
  }

  async function guardarCategoria(
    datos: CrearCategoriaDto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setGuardando(true);
    try {
      if (categoriaEnEdicion) {
        const categoriaActualizada =
          await actualizarCategoria(
            categoriaEnEdicion.id,
            datos,
          );

        await auditarAccion({
          modulo: "Productos",
          accion: "Actualizar categoría",
          entidad: "Categoría",
          entidadId:
            categoriaActualizada.id,
          descripcion:
            `Se actualizó la categoría ${categoriaActualizada.nombre}.`,
          datosAnteriores:
            categoriaEnEdicion,
          datosPosteriores:
            categoriaActualizada,
        });

        setNotificacion({
          tipo: "exito",
          titulo:
            "Categoría actualizada",
          mensaje:
            "Los cambios se guardaron correctamente.",
        });
      } else {
        const categoriaCreada =
          await crearCategoria(datos);

        await auditarAccion({
          modulo: "Productos",
          accion: "Crear categoría",
          entidad: "Categoría",
          entidadId:
            categoriaCreada.id,
          descripcion:
            `Se registró la categoría ${categoriaCreada.nombre}.`,
          datosPosteriores:
            categoriaCreada,
        });

        setNotificacion({
          tipo: "exito",
          titulo:
            "Categoría registrada",
          mensaje:
            "La nueva categoría ya se encuentra disponible.",
        });
      }

      await recargarDatos();

      setModalFormularioAbierto(false);
      setCategoriaEnEdicion(null);
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

  function solicitarCambioEstado(
    categoria: CategoriaProducto,
    ) {
    if (!puedeGestionar) {
      return;
    }
    const nuevoEstado:
      EstadoCatalogo =
      categoria.estado === "Activo"
        ? "Inactivo"
        : "Activo";

    setAccionCategoria({
      categoria,
      nuevoEstado,
    });
  }

  async function confirmarCambioEstado() {
    if (
      !accionCategoria ||
      !puedeGestionar
    ) {
      return;
    }

    setCambiandoEstado(true);

    try {
      const categoriaActualizada =
        await cambiarEstadoCategoria(
          accionCategoria.categoria.id,
          accionCategoria.nuevoEstado,
        );

      await auditarAccion({
        modulo: "Productos",
        accion:
          accionCategoria.nuevoEstado === "Activo"
            ? "Activar categoría"
            : "Desactivar categoría",
        entidad: "Categoría",
        entidadId:
          categoriaActualizada.id,
        descripcion:
          `${categoriaActualizada.nombre} fue ${accionCategoria.nuevoEstado === "Activo" ? "activada" : "desactivada"}.`,
        datosAnteriores:
          accionCategoria.categoria,
        datosPosteriores:
          categoriaActualizada,
        nivel:
          accionCategoria.nuevoEstado === "Inactivo"
            ? "Advertencia"
            : "Información",
      });

      await recargarDatos();

      const seActivo =
        accionCategoria.nuevoEstado ===
        "Activo";

      setNotificacion({
        tipo: "exito",
        titulo: seActivo
          ? "Categoría activada"
          : "Categoría desactivada",
        mensaje: seActivo
          ? "La categoría puede utilizarse nuevamente."
          : "La categoría quedó fuera de uso sin eliminar su información.",
      });

      setAccionCategoria(null);
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

  const categoriasFiltradas =
    useMemo(() => {
      const textoBusqueda = busqueda
        .trim()
        .toLocaleLowerCase("es");

      return categorias.filter(
        (categoria) => {
          const coincideBusqueda =
            !textoBusqueda ||
            categoria.nombre
              .toLocaleLowerCase("es")
              .includes(
                textoBusqueda,
              ) ||
            categoria.descripcion
              .toLocaleLowerCase("es")
              .includes(
                textoBusqueda,
              );

          const coincideEstado =
            filtroEstado === "Todos" ||
            categoria.estado ===
              filtroEstado;

          return (
            coincideBusqueda &&
            coincideEstado
          );
        },
      );
    }, [
      categorias,
      busqueda,
      filtroEstado,
    ]);

  const totalCategorias =
    categorias.length;

  const categoriasActivas =
    categorias.filter(
      (categoria) =>
        categoria.estado === "Activo",
    ).length;

  const categoriasInactivas =
    totalCategorias -
    categoriasActivas;

  function contarProductos(
    categoriaId: number,
  ): number {
    return productos.filter(
      (producto) =>
        producto.categoriaId ===
        categoriaId,
    ).length;
  }

  function contarProductosActivos(
    categoriaId: number,
  ): number {
    return productos.filter(
      (producto) =>
        producto.categoriaId ===
          categoriaId &&
        producto.estado === "Activo",
    ).length;
  }

  if (cargandoInicial) {
    return (
      <div
        className="
          flex min-h-80
          items-center justify-center
          rounded-3xl
          border border-slate-200
          bg-white
        "
      >
        <div className="text-center">
          <LoaderCircle
            size={34}
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
            Cargando categorías...
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
          size={38}
          className="
            mx-auto text-red-600
          "
        />

        <h2
          className="
            mt-4 text-lg font-black
            text-red-900
          "
        >
          No se pudieron cargar las
          categorías
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
          onClick={reintentarCarga}
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
            grid gap-4
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          <article
            className="
              rounded-2xl
              border border-slate-200
              bg-white p-5
              shadow-sm
            "
          >
            <div
              className="
                flex items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm font-semibold
                    text-slate-500
                  "
                >
                  Total de categorías
                </p>

                <p
                  className="
                    mt-2 text-3xl
                    font-black
                    text-slate-900
                  "
                >
                  {totalCategorias}
                </p>
              </div>

              <div
                className="
                  flex h-12 w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-slate-100
                  text-slate-700
                "
              >
                <Tags size={24} />
              </div>
            </div>
          </article>

          <article
            className="
              rounded-2xl
              border border-emerald-200
              bg-emerald-50 p-5
            "
          >
            <div
              className="
                flex items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm font-semibold
                    text-emerald-700
                  "
                >
                  Categorías activas
                </p>

                <p
                  className="
                    mt-2 text-3xl
                    font-black
                    text-emerald-900
                  "
                >
                  {categoriasActivas}
                </p>
              </div>

              <div
                className="
                  flex h-12 w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-100
                  text-emerald-700
                "
              >
                <CheckCircle2
                  size={24}
                />
              </div>
            </div>
          </article>

          <article
            className="
              rounded-2xl
              border border-amber-200
              bg-amber-50 p-5
              sm:col-span-2
              xl:col-span-1
            "
          >
            <div
              className="
                flex items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm font-semibold
                    text-amber-700
                  "
                >
                  Fuera de uso
                </p>

                <p
                  className="
                    mt-2 text-3xl
                    font-black
                    text-amber-900
                  "
                >
                  {
                    categoriasInactivas
                  }
                </p>
              </div>

              <div
                className="
                  flex h-12 w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-amber-100
                  text-amber-700
                "
              >
                <Power size={24} />
              </div>
            </div>
          </article>
        </div>

        <div
          className="
            rounded-3xl
            border border-slate-200
            bg-white shadow-sm
          "
        >
          <div
            className="
              flex flex-col gap-4
              border-b border-slate-100
              p-5 lg:flex-row
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
                Categorías del menú
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-slate-500
                "
              >
                Organiza los productos
                que se ofrecerán en el
                restaurante.
              </p>
            </div>

            {puedeGestionar && (
              <button
                type="button"
                onClick={
                  abrirNuevaCategoria
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
                "
              >
                <Plus size={19} />
                Nueva categoría
              </button>
            )}
          </div>

          <div
            className="
              grid gap-3
              border-b border-slate-100
              bg-slate-50/70 p-5
              lg:grid-cols-[1fr_220px]
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
                placeholder="Buscar por nombre o descripción..."
                onChange={(evento) =>
                  setBusqueda(
                    evento.target.value,
                  )
                }
                className="
                  w-full rounded-xl
                  border border-slate-300
                  bg-white py-3
                  pl-11 pr-4
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
              value={filtroEstado}
              onChange={(evento) =>
                setFiltroEstado(
                  evento.target
                    .value as FiltroEstadoCategoria,
                )
              }
              className="
                rounded-xl
                border border-slate-300
                bg-white px-4 py-3
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
                Activas
              </option>

              <option value="Inactivo">
                Inactivas
              </option>
            </select>
          </div>

          {categoriasFiltradas.length ===
          0 ? (
            <div
              className="
                px-6 py-16
                text-center
              "
            >
              <FolderOpen
                size={44}
                className="
                  mx-auto text-slate-300
                "
              />

              <h3
                className="
                  mt-4 text-lg
                  font-black
                  text-slate-800
                "
              >
                No se encontraron
                categorías
              </h3>

              <p
                className="
                  mx-auto mt-2 max-w-md
                  text-sm leading-relaxed
                  text-slate-500
                "
              >
                Modifica los filtros o
                registra una nueva
                categoría para organizar
                el catálogo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190">
                <thead
                  className="
                    bg-slate-50
                    text-left
                  "
                >
                  <tr
                    className="
                      text-xs uppercase
                      tracking-wider
                      text-slate-500
                    "
                  >
                    <th className="px-5 py-4">
                      Categoría
                    </th>

                    <th className="px-5 py-4">
                      Productos
                    </th>

                    <th className="px-5 py-4">
                      Estado
                    </th>

                    <th className="px-5 py-4">
                      Última actualización
                    </th>

                    <th
                      className="
                        px-5 py-4
                        text-right
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
                  {categoriasFiltradas.map(
                    (categoria) => {
                      const totalProductos =
                        contarProductos(
                          categoria.id,
                        );

                      const productosActivos =
                        contarProductosActivos(
                          categoria.id,
                        );

                      return (
                        <tr
                          key={
                            categoria.id
                          }
                          className="
                            transition-colors
                            hover:bg-slate-50/70
                          "
                        >
                          <td className="px-5 py-4">
                            <div
                              className="
                                flex items-start
                                gap-3
                              "
                            >
                              <div
                                className="
                                  mt-0.5 flex
                                  h-10 w-10
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-red-50
                                  text-red-700
                                "
                              >
                                <Tags
                                  size={19}
                                />
                              </div>

                              <div>
                                <p
                                  className="
                                    font-bold
                                    text-slate-900
                                  "
                                >
                                  {
                                    categoria.nombre
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1 max-w-md
                                    text-sm
                                    leading-relaxed
                                    text-slate-500
                                  "
                                >
                                  {
                                    categoria.descripcion
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p
                              className="
                                font-bold
                                text-slate-800
                              "
                            >
                              {
                                totalProductos
                              }{" "}
                              producto
                              {totalProductos ===
                              1
                                ? ""
                                : "s"}
                            </p>

                            <p
                              className="
                                mt-1 text-xs
                                text-slate-500
                              "
                            >
                              {
                                productosActivos
                              }{" "}
                              activo
                              {productosActivos ===
                              1
                                ? ""
                                : "s"}
                            </p>
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
                                  categoria.estado ===
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
                                categoria.estado
                              }
                            </span>
                          </td>

                          <td
                            className="
                              px-5 py-4
                              text-sm
                              text-slate-600
                            "
                          >
                            {new Intl.DateTimeFormat(
                              "es-BO",
                              {
                                dateStyle:
                                  "medium",
                                timeStyle:
                                  "short",
                              },
                            ).format(
                              new Date(
                                categoria.fechaActualizacion,
                              ),
                            )}
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
                                  title="Editar categoría"
                                  onClick={() =>
                                    abrirEditarCategoria(
                                      categoria,
                                    )
                                  }
                                  className="
                                    rounded-xl
                                    border border-blue-200
                                    bg-blue-50 p-2.5
                                    text-blue-700
                                    transition-colors
                                    hover:bg-blue-100
                                  "
                                >
                                  <Pencil size={18} />
                                </button>

                                <button
                                  type="button"
                                  title={
                                    categoria.estado ===
                                    "Activo"
                                      ? "Desactivar categoría"
                                      : "Activar categoría"
                                  }
                                  onClick={() =>
                                    solicitarCambioEstado(
                                      categoria,
                                    )
                                  }
                                  className={`
                                    rounded-xl
                                    border p-2.5
                                    transition-colors
                                    ${
                                      categoria.estado ===
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
                                  {categoria.estado ===
                                  "Activo" ? (
                                    <Power size={18} />
                                  ) : (
                                    <RotateCcw size={18} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p
                                className="
                                  text-right text-xs
                                  font-semibold
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
              flex flex-col gap-1
              border-t border-slate-100
              px-5 py-4
              text-sm text-slate-500
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <span>
              Mostrando{" "}
              <strong
                className="
                  text-slate-700
                "
              >
                {
                  categoriasFiltradas.length
                }
              </strong>{" "}
              de{" "}
              <strong
                className="
                  text-slate-700
                "
              >
                {categorias.length}
              </strong>{" "}
              categorías
            </span>

            <span>
              {
                productos.length
              }{" "}
              productos relacionados
            </span>
          </div>
        </div>
      </section>

      <Modal
        abierto={
          modalFormularioAbierto
        }
        titulo={
          categoriaEnEdicion
            ? "Editar categoría"
            : "Registrar categoría"
        }
        descripcion={
          categoriaEnEdicion
            ? "Actualiza la información de la categoría seleccionada."
            : "Crea una categoría para organizar los productos del menú."
        }
        alCerrar={cerrarFormulario}
      >
        <FormularioCategoria
          key={
            categoriaEnEdicion
              ? `editar-${categoriaEnEdicion.id}`
              : "nueva-categoria"
          }
          categoria={
            categoriaEnEdicion
          }
          cargando={guardando}
          alGuardar={
            guardarCategoria
          }
          alCancelar={
            cerrarFormulario
          }
        />
      </Modal>

      <ModalConfirmacion
        abierto={
          accionCategoria !== null
        }
        titulo={
          accionCategoria
            ?.nuevoEstado ===
          "Activo"
            ? "Activar categoría"
            : "Desactivar categoría"
        }
        descripcion={
          accionCategoria
            ?.nuevoEstado ===
          "Activo"
            ? `¿Deseas activar la categoría “${accionCategoria.categoria.nombre}”? Podrá utilizarse nuevamente para registrar productos.`
            : `¿Deseas desactivar la categoría “${accionCategoria?.categoria.nombre ?? ""}”? Esta acción no eliminará su información.`
        }
        textoConfirmar={
          accionCategoria
            ?.nuevoEstado ===
          "Activo"
            ? "Sí, activar"
            : "Sí, desactivar"
        }
        variante={
          accionCategoria
            ?.nuevoEstado ===
          "Activo"
            ? "activar"
            : "peligro"
        }
        cargando={
          cambiandoEstado
        }
        alConfirmar={
          confirmarCambioEstado
        }
        alCancelar={() => {
          if (!cambiandoEstado) {
            setAccionCategoria(null);
          }
        }}
      />

      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={
          cerrarNotificacion
        }
      />
    </>
  );
}

export default GestionCategorias;