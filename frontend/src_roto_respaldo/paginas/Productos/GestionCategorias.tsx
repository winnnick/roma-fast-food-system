import {
  CirclePower,
  Edit3,
  FolderPlus,
  LoaderCircle,
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
  actualizarCategoria,
  cambiarEstadoCategoria,
  crearCategoria,
  listarCategorias,
} from "../../servicios/categoriaServicio";

import {
  listarProductos,
} from "../../servicios/productoServicio";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

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

interface GestionCategoriasProps {
  puedeGestionar: boolean;
  alCambiar?: () => void;
}

interface AccionCategoria {
  categoria: CategoriaProducto;
  nuevoEstado: EstadoCatalogo;
}

function obtenerMensajeError(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function GestionCategorias({
  puedeGestionar,
  alCambiar,
}: GestionCategoriasProps) {
  const [categorias, setCategorias] =
    useState<CategoriaProducto[]>([]);

  const [productos, setProductos] =
    useState<ProductoMenu[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState<"Todos" | EstadoCatalogo>(
      "Todos",
    );

  const [modalFormulario, setModalFormulario] =
    useState(false);

  const [categoriaEdicion, setCategoriaEdicion] =
    useState<CategoriaProducto | null>(
      null,
    );

  const [guardando, setGuardando] =
    useState(false);

  const [accionEstado, setAccionEstado] =
    useState<AccionCategoria | null>(
      null,
    );

  const [procesandoEstado, setProcesandoEstado] =
    useState(false);

  const [notificacion, setNotificacion] =
    useState<DatosNotificacion | null>(
      null,
    );

  const cerrarNotificacion =
    useCallback(() => {
      setNotificacion(null);
    }, []);

  const cargarDatos =
    useCallback(async () => {
      try {
        setCargando(true);
        setErrorCarga(null);

        const [categoriasDatos, productosDatos] =
          await Promise.all([
            listarCategorias(),
            listarProductos(),
          ]);

        setCategorias(categoriasDatos);
        setProductos(productosDatos);
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    let activo = true;

    Promise.all([
      listarCategorias(),
      listarProductos(),
    ])
      .then(([categoriasDatos, productosDatos]) => {
        if (!activo) {
          return;
        }

        setCategorias(categoriasDatos);
        setProductos(productosDatos);
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
  }, []);

  const conteoProductos =
    useMemo(() => {
      const mapa = new Map<
        number,
        {
          total: number;
          activos: number;
        }
      >();

      productos.forEach((producto) => {
        const actual =
          mapa.get(producto.categoriaId) ?? {
            total: 0,
            activos: 0,
          };

        mapa.set(producto.categoriaId, {
          total: actual.total + 1,
          activos:
            actual.activos +
            (producto.estado === "Activo"
              ? 1
              : 0),
        });
      });

      return mapa;
    }, [productos]);

  const categoriasFiltradas =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLocaleLowerCase("es");

      return categorias.filter(
        (categoria) => {
          const coincideTexto =
            !texto ||
            categoria.nombre
              .toLocaleLowerCase("es")
              .includes(texto) ||
            categoria.descripcion
              .toLocaleLowerCase("es")
              .includes(texto);

          const coincideEstado =
            filtroEstado === "Todos" ||
            categoria.estado ===
              filtroEstado;

          return (
            coincideTexto &&
            coincideEstado
          );
        },
      );
    }, [
      busqueda,
      categorias,
      filtroEstado,
    ]);

  function abrirNuevaCategoria() {
    if (!puedeGestionar) {
      return;
    }

    setCategoriaEdicion(null);
    setModalFormulario(true);
  }

  function abrirEdicion(
    categoria: CategoriaProducto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setCategoriaEdicion(categoria);
    setModalFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setModalFormulario(false);
    setCategoriaEdicion(null);
  }

  async function guardarCategoria(
    datos: CrearCategoriaDto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    try {
      setGuardando(true);

      if (categoriaEdicion) {
        const actualizada =
          await actualizarCategoria(
            categoriaEdicion.id,
            datos,
          );

        await auditarAccion({
          modulo: "Productos",
          accion: "Actualizar categoría",
          entidad: "Categoría",
          entidadId: actualizada.id,
          descripcion:
            `Se actualizó la categoría ${actualizada.nombre}.`,
          datosAnteriores:
            categoriaEdicion,
          datosPosteriores:
            actualizada,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Categoría actualizada",
          mensaje:
            "Los cambios fueron guardados correctamente.",
        });
      } else {
        const creada =
          await crearCategoria(datos);

        await auditarAccion({
          modulo: "Productos",
          accion: "Crear categoría",
          entidad: "Categoría",
          entidadId: creada.id,
          descripcion:
            `Se registró la categoría ${creada.nombre}.`,
          datosPosteriores: creada,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Categoría creada",
          mensaje:
            "La nueva categoría ya puede asignarse a productos.",
        });
      }

      setModalFormulario(false);
      setCategoriaEdicion(null);

      await cargarDatos();
      alCambiar?.();
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

  async function confirmarEstado() {
    if (
      !accionEstado ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoEstado(true);

      const actualizada =
        await cambiarEstadoCategoria(
          accionEstado.categoria.id,
          accionEstado.nuevoEstado,
        );

      await auditarAccion({
        modulo: "Productos",
        accion:
          accionEstado.nuevoEstado ===
          "Activo"
            ? "Activar categoría"
            : "Desactivar categoría",
        entidad: "Categoría",
        entidadId: actualizada.id,
        descripcion:
          `${actualizada.nombre} cambió a estado ${actualizada.estado}.`,
        datosAnteriores:
          accionEstado.categoria,
        datosPosteriores:
          actualizada,
      });

      setNotificacion({
        tipo: "exito",
        titulo: "Estado actualizado",
        mensaje:
          `La categoría quedó ${actualizada.estado.toLocaleLowerCase("es")}.`,
      });

      setAccionEstado(null);

      await cargarDatos();
      alCambiar?.();
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
      <div className="p-5 sm:p-6">
        <div
          className="
            flex flex-col gap-3
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="buscar-categoria"
              className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Buscar categoría
            </label>

            <div className="relative mt-2">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="buscar-categoria"
                type="search"
                value={busqueda}
                placeholder="Nombre o descripción"
                onChange={(evento) =>
                  setBusqueda(
                    evento.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:ring-red-950/50"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[190px_auto]">
            <div>
              <label
                htmlFor="estado-categoria"
                className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Estado
              </label>

              <select
                id="estado-categoria"
                value={filtroEstado}
                onChange={(evento) =>
                  setFiltroEstado(
                    evento.target.value as
                      | "Todos"
                      | EstadoCatalogo,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-red-950/50"
              >
                <option value="Todos">
                  Todos
                </option>
                <option value="Activo">
                  Activas
                </option>
                <option value="Inactivo">
                  Inactivas
                </option>
              </select>
            </div>

            {puedeGestionar && (
              <button
                type="button"
                onClick={abrirNuevaCategoria}
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-red-700"
              >
                <FolderPlus size={18} />
                Nueva categoría
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="hidden grid-cols-[minmax(230px,1.5fr)_130px_110px_110px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400 md:grid">
            <span>Categoría</span>
            <span>Productos</span>
            <span>Estado</span>
            <span className="text-right">
              Acciones
            </span>
          </div>

          {cargando ? (
            <div className="flex min-h-52 items-center justify-center gap-3 bg-white text-sm font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <LoaderCircle
                size={22}
                className="animate-spin"
              />
              Cargando categorías...
            </div>
          ) : errorCarga ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-slate-900">
              <p className="max-w-md text-sm font-bold text-red-600 dark:text-red-400">
                {errorCarga}
              </p>

              <button
                type="button"
                onClick={() =>
                  void cargarDatos()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RotateCcw size={17} />
                Reintentar
              </button>
            </div>
          ) : categoriasFiltradas.length ===
            0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center bg-white p-6 text-center dark:bg-slate-900">
              <Tags
                size={34}
                className="text-slate-300 dark:text-slate-600"
              />

              <p className="mt-3 font-black text-slate-800 dark:text-slate-100">
                No se encontraron categorías
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cambia la búsqueda o registra una nueva categoría.
              </p>
            </div>
          ) : (
            <div className="min-h-[24rem] divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {categoriasFiltradas.map(
                (categoria) => {
                  const conteo =
                    conteoProductos.get(
                      categoria.id,
                    ) ?? {
                      total: 0,
                      activos: 0,
                    };

                  return (
                    <article
                      key={categoria.id}
                      className="grid gap-4 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 md:grid-cols-[minmax(230px,1.5fr)_130px_110px_110px] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white">
                          {categoria.nombre}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {categoria.descripcion}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {conteo.total}{" "}
                          {conteo.total === 1
                            ? "producto"
                            : "productos"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {conteo.activos} activos
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                            categoria.estado ===
                            "Activo"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {categoria.estado}
                        </span>
                      </div>

                      <div className="flex justify-end gap-2">
                        {puedeGestionar && (
                          <>
                            <button
                              type="button"
                              title="Editar categoría"
                              onClick={() =>
                                abrirEdicion(
                                  categoria,
                                )
                              }
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                            >
                              <Edit3 size={17} />
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
                                setAccionEstado({
                                  categoria,
                                  nuevoEstado:
                                    categoria.estado ===
                                    "Activo"
                                      ? "Inactivo"
                                      : "Activo",
                                })
                              }
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                                categoria.estado ===
                                "Activo"
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                              }`}
                            >
                              {categoria.estado ===
                              "Activo" ? (
                                <Power size={17} />
                              ) : (
                                <CirclePower
                                  size={17}
                                />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {categoriasFiltradas.length} de{" "}
            {categorias.length} categorías
          </span>

          <span>
            {productos.length} productos relacionados
          </span>
        </div>
      </div>

      <Modal
        abierto={modalFormulario}
        titulo={
          categoriaEdicion
            ? "Editar categoría"
            : "Nueva categoría"
        }
        descripcion="Organiza los productos del menú con una categoría clara y fácil de identificar."
        alCerrar={cerrarFormulario}
      >
        <FormularioCategoria
          key={
            categoriaEdicion
              ? `categoria-${categoriaEdicion.id}`
              : "nueva-categoria"
          }
          categoria={categoriaEdicion}
          cargando={guardando}
          alGuardar={guardarCategoria}
          alCancelar={cerrarFormulario}
        />
      </Modal>

      <ModalConfirmacion
        abierto={accionEstado !== null}
        titulo={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? "Activar categoría"
            : "Desactivar categoría"
        }
        descripcion={
          accionEstado?.nuevoEstado ===
          "Activo"
            ? `La categoría “${accionEstado?.categoria.nombre ?? ""}” volverá a estar disponible para productos.`
            : `La categoría “${accionEstado?.categoria.nombre ?? ""}” dejará de estar disponible para nuevas asignaciones. Los productos existentes conservarán su historial.`
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
        alConfirmar={confirmarEstado}
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

export default GestionCategorias;
