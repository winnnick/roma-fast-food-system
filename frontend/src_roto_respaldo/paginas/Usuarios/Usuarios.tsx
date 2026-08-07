import {
  Ban,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  FilterX,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
  UserX,
  type LucideIcon,
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
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

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

function IconoCajaRegistradora({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 3h6v6H5V3Zm9 1h5v4h-5V4ZM4 9h15a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 1-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6 12h3M6 15h3M12 12h1M16 12h1M12 15h1M16 15h1M2.5 19h19v2h-19v-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface VisualUsuario {
  icono:
    | LucideIcon
    | typeof IconoCajaRegistradora;
  contenedor: string;
}

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

function obtenerVisualUsuario(
  usuario: Usuario,
): VisualUsuario {
  if (
    usuario.roles.includes(
      "Administrador",
    )
  ) {
    return {
      icono: ShieldCheck,
      contenedor:
        "bg-roma-100 text-roma-700 dark:bg-roma-950/55 dark:text-roma-300",
    };
  }

  if (usuario.roles.length > 1) {
    return {
      icono: UsersRound,
      contenedor:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/55 dark:text-violet-300",
    };
  }

  if (usuario.roles.includes("Cajero")) {
    return {
      icono: IconoCajaRegistradora,
      contenedor:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/55 dark:text-blue-300",
    };
  }

  return {
    icono: Boxes,
    contenedor:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/55 dark:text-amber-300",
  };
}

function clasesRol(
  rol: RolUsuario,
): string {
  if (rol === "Administrador") {
    return "bg-roma-50 text-roma-700 dark:bg-roma-950/45 dark:text-roma-300";
  }

  if (rol === "Cajero") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300";
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300";
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
          .includes(texto) ||
        usuario.roles.some((rol) =>
          rol
            .toLowerCase()
            .includes(texto),
        );

      const coincideRol =
        filtroRol === "Todos" ||
        usuario.roles.includes(filtroRol);

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

  const paginaSegura = Math.min(
    paginaActual,
    totalPaginas,
  );

  const usuariosPagina = useMemo(() => {
    const inicio =
      (paginaSegura - 1) *
      USUARIOS_POR_PAGINA;

    return usuariosFiltrados.slice(
      inicio,
      inicio + USUARIOS_POR_PAGINA,
    );
  }, [
    usuariosFiltrados,
    paginaSegura,
  ]);

  const totalActivos = usuarios.filter(
    (usuario) =>
      usuario.estado === "Activo",
  ).length;

  const totalInactivos =
    usuarios.length - totalActivos;

  const totalMultirrol = usuarios.filter(
    (usuario) =>
      !usuario.roles.includes(
        "Administrador",
      ) && usuario.roles.length > 1,
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
        const usuarioActualizado =
          await actualizarUsuario(
            usuarioSeleccionado.id,
            datos as ActualizarUsuarioDto,
          );

        await auditarAccion({
          modulo: "Usuarios",
          accion: "Actualizar usuario",
          entidad: "Usuario",
          entidadId:
            usuarioActualizado.id,
          descripcion:
            `Se actualizó la cuenta de ${usuarioActualizado.nombreCompleto} con ${usuarioActualizado.roles.length > 1 ? "los roles" : "el rol"} ${usuarioActualizado.roles.join(" + ")}.`,
          datosAnteriores:
            usuarioSeleccionado,
          datosPosteriores:
            usuarioActualizado,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Usuario actualizado",
          mensaje:
            "La información y los roles fueron actualizados correctamente.",
        });
      } else {
        const usuarioCreado =
          await crearUsuario(
            datos as CrearUsuarioDto,
          );

        await auditarAccion({
          modulo: "Usuarios",
          accion: "Crear usuario",
          entidad: "Usuario",
          entidadId:
            usuarioCreado.id,
          descripcion:
            `Se creó la cuenta de ${usuarioCreado.nombreCompleto} con ${usuarioCreado.roles.length > 1 ? "los roles" : "el rol"} ${usuarioCreado.roles.join(" + ")}.`,
          datosPosteriores:
            usuarioCreado,
        });

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
    } catch (errorGuardar) {
      const mensaje =
        errorGuardar instanceof Error
          ? errorGuardar.message
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

      const nuevoEstado: EstadoUsuario =
        usuarioCambioEstado.estado ===
        "Activo"
          ? "Inactivo"
          : "Activo";

      const usuarioActualizado =
        await cambiarEstadoUsuario(
          usuarioCambioEstado.id,
          nuevoEstado,
        );

      await auditarAccion({
        modulo: "Usuarios",
        accion:
          nuevoEstado === "Activo"
            ? "Activar usuario"
            : "Desactivar usuario",
        entidad: "Usuario",
        entidadId:
          usuarioActualizado.id,
        descripcion:
          `${usuarioActualizado.nombreCompleto} fue ${nuevoEstado === "Activo" ? "activado" : "desactivado"}.`,
        datosAnteriores:
          usuarioCambioEstado,
        datosPosteriores:
          usuarioActualizado,
        nivel:
          nuevoEstado === "Inactivo"
            ? "Advertencia"
            : "Información",
      });

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
    } catch (errorCambio) {
      const mensaje =
        errorCambio instanceof Error
          ? errorCambio.message
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
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({
            length: 3,
          }).map((_, indice) => (
            <div
              key={indice}
              className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>

        <div className="h-[33rem] rounded-3xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          No se pudieron cargar los usuarios
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void cargarUsuarios()
          }
          className="mt-5 rounded-xl bg-roma-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-roma-800"
        >
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() =>
          setNotificacion(null)
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <TarjetaMetrica
          titulo="Usuarios registrados"
          valor={String(usuarios.length)}
          descripcion="Total de cuentas del sistema"
          icono={UsersRound}
          tono="azul"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Usuarios activos"
          valor={String(totalActivos)}
          descripcion="Cuentas con acceso habilitado"
          icono={UserCheck}
          tono="verde"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Usuarios inactivos"
          valor={String(totalInactivos)}
          descripcion="Cuentas sin acceso al sistema"
          icono={UserX}
          tono="ambar"
          variante="compacta"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Usuarios del sistema
              </h2>

              {totalMultirrol > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-950/45 dark:text-violet-300">
                  <UsersRound size={13} />
                  {totalMultirrol} multirrol
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Administra cuentas y combina roles operativos sin configurar permisos usuario por usuario.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNuevoUsuario}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-roma-700 px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-roma-800 hover:shadow-md"
          >
            <Plus size={17} />
            Nuevo usuario
          </button>
        </header>

        <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_190px_44px]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={busqueda}
                placeholder="Nombre, usuario o rol"
                onChange={(evento) => {
                  setBusqueda(
                    evento.target.value,
                  );
                  setPaginaActual(1);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-roma-500 focus:ring-4 focus:ring-roma-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-roma-600 dark:focus:ring-roma-950/50"
              />
            </div>

            <select
              value={filtroRol}
              onChange={(evento) => {
                setFiltroRol(
                  evento.target
                    .value as FiltroRol,
                );
                setPaginaActual(1);
              }}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-roma-500 focus:ring-4 focus:ring-roma-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-roma-600 dark:focus:ring-roma-950/50"
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
                  evento.target
                    .value as FiltroEstado,
                );
                setPaginaActual(1);
              }}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-roma-500 focus:ring-4 focus:ring-roma-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-roma-600 dark:focus:ring-roma-950/50"
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
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <FilterX size={18} />
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {usuariosFiltrados.length} usuario(s) encontrados.
          </p>
        </div>

        <div className="hidden grid-cols-[minmax(260px,1.45fr)_minmax(220px,1.1fr)_120px_185px_96px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500 lg:grid dark:border-slate-700 dark:bg-slate-950/55 dark:text-slate-400">
          <div>Usuario</div>
          <div>Roles</div>
          <div>Estado</div>
          <div>Último acceso</div>
          <div className="text-center">
            Acciones
          </div>
        </div>

        <div className="min-h-[22rem]">
          {usuariosPagina.length === 0 ? (
            <div className="flex min-h-[22rem] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Search size={22} />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                No existen resultados
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Modifique la búsqueda o limpie los filtros aplicados.
              </p>
            </div>
          ) : (
            usuariosPagina.map((usuario) => {
              const esUsuarioActual =
                usuario.id ===
                usuarioSesion?.id;
              const visual =
                obtenerVisualUsuario(usuario);
              const IconoUsuario =
                visual.icono;

              return (
                <article
                  key={usuario.id}
                  className="grid min-h-[4.35rem] grid-cols-1 gap-3 border-b border-slate-200 px-5 py-3 transition-colors last:border-b-0 hover:bg-slate-50/80 lg:grid-cols-[minmax(260px,1.45fr)_minmax(220px,1.1fr)_120px_185px_96px] lg:items-center lg:gap-4 dark:border-slate-700 dark:hover:bg-slate-800/55"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.contenedor}`}
                    >
                      <IconoUsuario size={19} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                          {usuario.nombreCompleto}
                        </p>

                        {esUsuarioActual && (
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-700 dark:bg-blue-950/45 dark:text-blue-300">
                            Tú
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        @{usuario.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {usuario.roles.map((rol) => (
                      <span
                        key={rol}
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${clasesRol(rol)}`}
                      >
                        {rol}
                      </span>
                    ))}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
                        usuario.estado ===
                        "Activo"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          usuario.estado ===
                          "Activo"
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {usuario.estado}
                    </span>
                  </div>

                  <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">
                    {formatearFecha(
                      usuario.ultimoAcceso,
                    )}
                  </p>

                  <div className="flex items-center gap-2 lg:justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        abrirEdicion(usuario)
                      }
                      aria-label={`Editar ${usuario.nombreCompleto}`}
                      title="Editar usuario"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={esUsuarioActual}
                      onClick={() =>
                        setUsuarioCambioEstado(
                          usuario,
                        )
                      }
                      aria-label={`${
                        usuario.estado === "Activo"
                          ? "Desactivar"
                          : "Activar"
                      } ${usuario.nombreCompleto}`}
                      title={
                        esUsuarioActual
                          ? "No puede cambiar el estado de su propia cuenta"
                          : usuario.estado ===
                              "Activo"
                            ? "Desactivar usuario"
                            : "Activar usuario"
                      }
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-35 ${
                        usuario.estado === "Activo"
                          ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus-visible:ring-red-400 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:ring-emerald-400 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                      }`}
                    >
                      {usuario.estado ===
                      "Activo" ? (
                        <Ban size={16} />
                      ) : (
                        <CircleCheckBig
                          size={16}
                        />
                      )}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Página {paginaSegura} de {totalPaginas}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaSegura === 1}
              onClick={() =>
                setPaginaActual(
                  paginaSegura - 1,
                )
              }
              aria-label="Página anterior"
              title="Página anterior"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              type="button"
              disabled={
                paginaSegura === totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  paginaSegura + 1,
                )
              }
              aria-label="Página siguiente"
              title="Página siguiente"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </footer>
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
            ? "Actualice los datos de acceso y los roles operativos de la cuenta."
            : "Cree una cuenta y asigne uno o varios roles operativos."
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
        centrarIcono
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
