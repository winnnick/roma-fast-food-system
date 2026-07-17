import {
  Ban,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
  UserX,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import FormularioUsuario from "./FormularioUsuario";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import { useAuth } from "../../contextos/AuthContext";

import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  crearUsuario,
  listarUsuarios,
} from "../../servicios/usuarioServicio";

import type {
  RolUsuario,
} from "../../tipos/auth";

import type {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  EstadoUsuario,
  Usuario,
} from "../../tipos/usuario";

const USUARIOS_POR_PAGINA = 5;

type FiltroRol =
  | "Todos"
  | RolUsuario;

type FiltroEstado =
  | "Todos"
  | EstadoUsuario;

function formatearFecha(
  fecha: string | null,
): string {
  if (!fecha) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fecha));
}

function Usuarios() {
  const { usuario: usuarioSesion } =
    useAuth();

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroRol, setFiltroRol] =
    useState<FiltroRol>("Todos");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>("Todos");

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    usuarioSeleccionado,
    setUsuarioSeleccionado,
  ] = useState<Usuario | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [
    usuarioCambioEstado,
    setUsuarioCambioEstado,
  ] = useState<Usuario | null>(null);

  const [
    cambiandoEstado,
    setCambiandoEstado,
  ] = useState(false);

  const [
    notificacion,
    setNotificacion,
  ] = useState<DatosNotificacion | null>(
    null,
  );

  const cargarUsuarios =
    useCallback(async () => {
      try {
        setCargando(true);
        setError(null);

        const respuesta =
          await listarUsuarios();

        setUsuarios(respuesta);
      } catch {
        setError(
          "No fue posible cargar los usuarios.",
        );
      } finally {
        setCargando(false);
      }
    }, []);

useEffect(() => {
  let componenteActivo = true;

  listarUsuarios()
    .then((respuesta) => {
      if (!componenteActivo) {
        return;
      }

      setUsuarios(respuesta);
      setError(null);
    })
    .catch(() => {
      if (!componenteActivo) {
        return;
      }

      setError(
        "No fue posible cargar los usuarios.",
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

  const usuariosFiltrados = useMemo(() => {
    const texto =
      busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !texto ||
        usuario.username
          .toLowerCase()
          .includes(texto) ||
        usuario.nombreCompleto
          .toLowerCase()
          .includes(texto);

      const coincideRol =
        filtroRol === "Todos" ||
        usuario.rol === filtroRol;

      const coincideEstado =
        filtroEstado === "Todos" ||
        usuario.estado === filtroEstado;

      return (
        coincideBusqueda &&
        coincideRol &&
        coincideEstado
      );
    });
  }, [
    usuarios,
    busqueda,
    filtroRol,
    filtroEstado,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      usuariosFiltrados.length /
        USUARIOS_POR_PAGINA,
    ),
  );

  const usuariosPagina = useMemo(() => {
    const inicio =
      (paginaActual - 1) *
      USUARIOS_POR_PAGINA;

    return usuariosFiltrados.slice(
      inicio,
      inicio + USUARIOS_POR_PAGINA,
    );
  }, [
    usuariosFiltrados,
    paginaActual,
  ]);

  const totalActivos = usuarios.filter(
    (usuario) =>
      usuario.estado === "Activo",
  ).length;

  const totalInactivos =
    usuarios.length - totalActivos;

  const totalAdministradores =
    usuarios.filter(
      (usuario) =>
        usuario.rol ===
        "Administrador",
    ).length;

  const filtrosActivos =
    Boolean(busqueda) ||
    filtroRol !== "Todos" ||
    filtroEstado !== "Todos";

  function abrirNuevoUsuario() {
    setUsuarioSeleccionado(null);
    setModalAbierto(true);
  }

  function abrirEdicion(
    usuario: Usuario,
  ) {
    setUsuarioSeleccionado(usuario);
    setModalAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setUsuarioSeleccionado(null);
  }

  async function guardarUsuario(
    datos:
      | CrearUsuarioDto
      | ActualizarUsuarioDto,
  ) {
    try {
      setGuardando(true);

      if (usuarioSeleccionado) {
        await actualizarUsuario(
          usuarioSeleccionado.id,
          datos as ActualizarUsuarioDto,
        );

        setNotificacion({
          tipo: "exito",
          titulo: "Usuario actualizado",
          mensaje:
            "La información del usuario fue modificada correctamente.",
        });
      } else {
        await crearUsuario(
          datos as CrearUsuarioDto,
        );

        setNotificacion({
          tipo: "exito",
          titulo: "Usuario registrado",
          mensaje:
            "La cuenta fue creada y ya puede utilizarse para iniciar sesión.",
        });
      }

      setModalAbierto(false);
      setUsuarioSeleccionado(null);

      await cargarUsuarios();
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible guardar el usuario.";

      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo guardar el usuario",
        mensaje,
      });
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarCambioEstado() {
    if (!usuarioCambioEstado) {
      return;
    }

    try {
      setCambiandoEstado(true);

      const nuevoEstado:
        EstadoUsuario =
        usuarioCambioEstado.estado ===
        "Activo"
          ? "Inactivo"
          : "Activo";

      await cambiarEstadoUsuario(
        usuarioCambioEstado.id,
        nuevoEstado,
      );

      setNotificacion({
        tipo: "exito",
        titulo:
          nuevoEstado === "Activo"
            ? "Usuario activado"
            : "Usuario desactivado",
        mensaje:
          nuevoEstado === "Activo"
            ? "El usuario recuperó el acceso al sistema."
            : "El usuario ya no podrá iniciar sesión.",
      });

      setUsuarioCambioEstado(null);

      await cargarUsuarios();
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado.";

      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo cambiar el estado",
        mensaje,
      });
    } finally {
      setCambiandoEstado(false);
    }
  }

    function limpiarFiltros() {
    setBusqueda("");
    setFiltroRol("Todos");
    setFiltroEstado("Todos");
    setPaginaActual(1);
    }

  if (cargando) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-3xl bg-slate-300" />

        <div
          className="
            grid grid-cols-1 gap-5
            sm:grid-cols-2 xl:grid-cols-4
          "
        >
          {Array.from({
            length: 4,
          }).map((_, indice) => (
            <div
              key={indice}
              className="
                h-40 rounded-2xl
                bg-white
              "
            />
          ))}
        </div>

        <div className="h-120 rounded-2xl bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <section
        className="
          rounded-3xl border
          border-red-200 bg-white
          p-8 text-center
          shadow-panel
        "
      >
        <h2
          className="
            text-xl font-black
            text-slate-900
          "
        >
          No se pudieron cargar los usuarios
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void cargarUsuarios()
          }
          className="
            mt-5 rounded-xl
            bg-roma-700 px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-roma-800
          "
        >
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() =>
          setNotificacion(null)
        }
      />

      <section
        className="
          flex flex-col gap-5
          rounded-3xl
          bg-linear-to-br
          from-slate-950
          via-slate-900
          to-roma-950
          p-6 text-white
          shadow-panel
          sm:p-8 lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-sm font-bold
              text-roma-300
            "
          >
            Administración de acceso
          </p>

          <h1
            className="
              mt-2 text-3xl
              font-black tracking-tight
            "
          >
            Gestión de usuarios
          </h1>

          <p
            className="
              mt-3 max-w-2xl
              text-sm leading-relaxed
              text-slate-300
            "
          >
            Registra, modifica y controla
            las cuentas del personal
            autorizado para utilizar el
            sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevoUsuario}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl bg-roma-600
            px-5 py-3
            text-sm font-bold
            text-white
            shadow-lg
            shadow-roma-950/30
            transition-all
            hover:-translate-y-0.5
            hover:bg-roma-500
          "
        >
          <Plus size={19} />

          Nuevo usuario
        </button>
      </section>

      <section
        className="
          grid grid-cols-1 gap-5
          sm:grid-cols-2 xl:grid-cols-4
        "
      >
        <TarjetaMetrica
          titulo="Usuarios registrados"
          valor={String(usuarios.length)}
          descripcion="Total de cuentas existentes"
          icono={UsersRound}
          tono="azul"
        />

        <TarjetaMetrica
          titulo="Usuarios activos"
          valor={String(totalActivos)}
          descripcion="Cuentas con acceso habilitado"
          icono={UserCheck}
          tono="verde"
        />

        <TarjetaMetrica
          titulo="Usuarios inactivos"
          valor={String(totalInactivos)}
          descripcion="Cuentas sin acceso al sistema"
          icono={UserX}
          tono="ambar"
        />

        <TarjetaMetrica
          titulo="Administradores"
          valor={String(
            totalAdministradores,
          )}
          descripcion="Usuarios con control completo"
          icono={ShieldCheck}
          tono="roma"
        />
      </section>

      <section
        className="
          overflow-hidden
          rounded-2xl border
          border-slate-200
          bg-white shadow-panel
        "
      >
        <div
          className="
            border-b border-slate-100
            p-5 sm:p-6
          "
        >
          <div
            className="
              grid grid-cols-1
              gap-4 lg:grid-cols-[1fr_220px_220px_auto]
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
                placeholder="Buscar por nombre o usuario..."
                onChange={(evento) => {
                    setBusqueda(evento.target.value);
                    setPaginaActual(1);
                }}
                className="
                  h-12 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white pl-11 pr-4
                  text-sm outline-none
                  transition-all
                  focus:border-roma-500
                  focus:ring-4
                  focus:ring-roma-100
                "
              />
            </div>

            <select
              value={filtroRol}
                onChange={(evento) => {
                setFiltroRol(
                    evento.target.value as FiltroRol,
                );

                setPaginaActual(1);
                }}
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm outline-none
                focus:border-roma-500
                focus:ring-4
                focus:ring-roma-100
              "
            >
              <option value="Todos">
                Todos los roles
              </option>

              <option value="Administrador">
                Administrador
              </option>

              <option value="Cajero">
                Cajero
              </option>

              <option value="Inventario">
                Inventario
              </option>
            </select>

            <select
              value={filtroEstado}
                onChange={(evento) => {
                setFiltroEstado(
                    evento.target.value as FiltroEstado,
                );

                setPaginaActual(1);
                }}
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm outline-none
                focus:border-roma-500
                focus:ring-4
                focus:ring-roma-100
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

            <button
              type="button"
              disabled={!filtrosActivos}
              onClick={limpiarFiltros}
              className="
                inline-flex h-12
                items-center justify-center
                gap-2 rounded-xl
                border border-slate-300
                px-4 text-sm font-bold
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

          <p className="mt-4 text-sm text-slate-500">
            Se encontraron{" "}
            <strong className="text-slate-800">
              {usuariosFiltrados.length}
            </strong>{" "}
            usuarios.
          </p>
        </div>

        {usuariosPagina.length === 0 ? (
          <div
            className="
              flex min-h-72 flex-col
              items-center justify-center
              p-8 text-center
            "
          >
            <div
              className="
                flex h-14 w-14
                items-center justify-center
                rounded-2xl
                bg-slate-100
                text-slate-500
              "
            >
              <Search size={26} />
            </div>

            <h2
              className="
                mt-5 text-lg
                font-black
                text-slate-900
              "
            >
              No existen resultados
            </h2>

            <p
              className="
                mt-2 max-w-sm
                text-sm text-slate-500
              "
            >
              Modifique los criterios de
              búsqueda o limpie los filtros
              aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5">
              <thead>
                <tr className="bg-slate-50">
                  <th
                    className="
                      px-6 py-3
                      text-left text-xs
                      font-bold uppercase
                      tracking-wider
                      text-slate-500
                    "
                  >
                    Usuario
                  </th>

                  <th
                    className="
                      px-6 py-3
                      text-left text-xs
                      font-bold uppercase
                      tracking-wider
                      text-slate-500
                    "
                  >
                    Rol
                  </th>

                  <th
                    className="
                      px-6 py-3
                      text-left text-xs
                      font-bold uppercase
                      tracking-wider
                      text-slate-500
                    "
                  >
                    Estado
                  </th>

                  <th
                    className="
                      px-6 py-3
                      text-left text-xs
                      font-bold uppercase
                      tracking-wider
                      text-slate-500
                    "
                  >
                    Último acceso
                  </th>

                  <th
                    className="
                      px-6 py-3
                      text-right text-xs
                      font-bold uppercase
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
                {usuariosPagina.map(
                  (usuario) => {
                    const esUsuarioActual =
                      usuario.id ===
                      usuarioSesion?.id;

                    return (
                      <tr
                        key={usuario.id}
                        className="
                          transition-colors
                          hover:bg-slate-50/70
                        "
                      >
                        <td className="px-6 py-4">
                          <div
                            className="
                              flex items-center
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex h-10 w-10
                                shrink-0 items-center
                                justify-center
                                rounded-xl
                                bg-roma-100
                                font-black
                                text-roma-700
                              "
                            >
                              {usuario.nombreCompleto
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p
                                className="
                                  text-sm
                                  font-bold
                                  text-slate-900
                                "
                              >
                                {
                                  usuario.nombreCompleto
                                }

                                {esUsuarioActual && (
                                  <span
                                    className="
                                      ml-2 rounded-full
                                      bg-blue-100
                                      px-2 py-0.5
                                      text-[10px]
                                      font-bold
                                      text-blue-700
                                    "
                                  >
                                    Tú
                                  </span>
                                )}
                              </p>

                              <p
                                className="
                                  mt-1 text-xs
                                  text-slate-500
                                "
                              >
                                @{usuario.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
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
                            {usuario.rol}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`
                              inline-flex
                              items-center gap-2
                              rounded-full
                              px-3 py-1
                              text-xs font-bold
                              ${
                                usuario.estado ===
                                "Activo"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }
                            `}
                          >
                            <span
                              className={`
                                h-2 w-2
                                rounded-full
                                ${
                                  usuario.estado ===
                                  "Activo"
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }
                              `}
                            />

                            {usuario.estado}
                          </span>
                        </td>

                        <td
                          className="
                            px-6 py-4
                            text-sm
                            text-slate-600
                          "
                        >
                          {formatearFecha(
                            usuario.ultimoAcceso,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div
                            className="
                              flex items-center
                              justify-end gap-2
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicion(
                                  usuario,
                                )
                              }
                              title="Editar usuario"
                              className="
                                inline-flex
                                items-center gap-2
                                rounded-lg
                                bg-blue-50
                                px-3 py-2
                                text-xs font-bold
                                text-blue-700
                                transition-colors
                                hover:bg-blue-100
                              "
                            >
                              <Pencil size={15} />

                              Editar
                            </button>

                            <button
                              type="button"
                              disabled={
                                esUsuarioActual
                              }
                              title={
                                esUsuarioActual
                                  ? "No puede modificar el estado de su propia cuenta"
                                  : usuario.estado ===
                                      "Activo"
                                    ? "Desactivar usuario"
                                    : "Activar usuario"
                              }
                              onClick={() =>
                                setUsuarioCambioEstado(
                                  usuario,
                                )
                              }
                              className={`
                                inline-flex
                                items-center gap-2
                                rounded-lg
                                px-3 py-2
                                text-xs font-bold
                                transition-colors
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                                ${
                                  usuario.estado ===
                                  "Activo"
                                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }
                              `}
                            >
                              {usuario.estado ===
                              "Activo" ? (
                                <Ban size={15} />
                              ) : (
                                <UserCheck
                                  size={15}
                                />
                              )}

                              {usuario.estado ===
                              "Activo"
                                ? "Desactivar"
                                : "Activar"}
                            </button>
                          </div>
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
            sm:px-6
          "
        >
          <p className="text-sm text-slate-500">
            Página{" "}
            <strong className="text-slate-800">
              {paginaActual}
            </strong>{" "}
            de{" "}
            <strong className="text-slate-800">
              {totalPaginas}
            </strong>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() =>
                setPaginaActual(
                  (pagina) => pagina - 1,
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
                paginaActual ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) => pagina + 1,
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

      <Modal
        abierto={modalAbierto}
        titulo={
          usuarioSeleccionado
            ? "Modificar usuario"
            : "Registrar usuario"
        }
        descripcion={
          usuarioSeleccionado
            ? "Actualice la información y los permisos generales de la cuenta."
            : "Complete la información necesaria para habilitar una nueva cuenta."
        }
        ancho="grande"
        alCerrar={cerrarFormulario}
      >
        <FormularioUsuario
        key={
            usuarioSeleccionado?.id ??
            "nuevo-usuario"
        }
          usuario={usuarioSeleccionado}
          cargando={guardando}
          alGuardar={guardarUsuario}
          alCancelar={cerrarFormulario}
        />
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(
          usuarioCambioEstado,
        )}
        titulo={
          usuarioCambioEstado?.estado ===
          "Activo"
            ? "Desactivar usuario"
            : "Activar usuario"
        }
        descripcion={
          usuarioCambioEstado?.estado ===
          "Activo"
            ? `La cuenta de ${usuarioCambioEstado.nombreCompleto} perderá el acceso al sistema. Los registros históricos se conservarán.`
            : `La cuenta de ${usuarioCambioEstado?.nombreCompleto ?? ""} recuperará el acceso al sistema.`
        }
        textoConfirmar={
          usuarioCambioEstado?.estado ===
          "Activo"
            ? "Desactivar"
            : "Activar"
        }
        variante={
          usuarioCambioEstado?.estado ===
          "Activo"
            ? "peligro"
            : "activar"
        }
        cargando={cambiandoEstado}
        alConfirmar={() =>
          void confirmarCambioEstado()
        }
        alCancelar={() =>
          setUsuarioCambioEstado(null)
        }
      />
    </div>
  );
}

export default Usuarios;