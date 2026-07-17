import {
  Check,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  RefreshCcw,
  Save,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  gruposPermisos,
  obtenerNombrePermiso,
} from "./catalogoPermisos";

import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import {
  actualizarPermisosRol,
  dependenciasPermisos,
  listarRoles,
  restablecerPermisosRol,
} from "../../servicios/rolServicio";

import {
  listarUsuarios,
} from "../../servicios/usuarioServicio";

import type {
  RolUsuario,
} from "../../tipos/auth";

import {
  permisosSistema,
  type PermisoSistema,
  type RolConfiguracion,
} from "../../tipos/rol";

import type {
  Usuario,
} from "../../tipos/usuario";

interface ConfiguracionVisualRol {
  icono: LucideIcon;
  colorIcono: string;
  colorFondo: string;
}

const configuracionVisualRoles: Record<
  RolUsuario,
  ConfiguracionVisualRol
> = {
  Administrador: {
    icono: ShieldCheck,
    colorIcono: "text-roma-700",
    colorFondo: "bg-roma-100",
  },

  Cajero: {
    icono: WalletCards,
    colorIcono: "text-blue-700",
    colorFondo: "bg-blue-100",
  },

  Inventario: {
    icono: PackageCheck,
    colorIcono: "text-emerald-700",
    colorFondo: "bg-emerald-100",
  },
};

async function obtenerDatosPagina() {
  return Promise.all([
    listarRoles(),
    listarUsuarios(),
  ]);
}

function RolesPermisos() {
  const [roles, setRoles] =
    useState<RolConfiguracion[]>([]);

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [
    rolSeleccionado,
    setRolSeleccionado,
  ] = useState<RolUsuario | null>(null);

  const [
    permisosEditados,
    setPermisosEditados,
  ] = useState<PermisoSistema[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [
    restableciendo,
    setRestableciendo,
  ] = useState(false);

  const [
    confirmarRestablecimiento,
    setConfirmarRestablecimiento,
  ] = useState(false);

  const [
    rolPendiente,
    setRolPendiente,
  ] = useState<RolUsuario | null>(null);

  const [
    notificacion,
    setNotificacion,
  ] = useState<DatosNotificacion | null>(
    null,
  );

  useEffect(() => {
    let componenteActivo = true;

    obtenerDatosPagina()
      .then(
        ([
          rolesRespuesta,
          usuariosRespuesta,
        ]) => {
          if (!componenteActivo) {
            return;
          }

          const rolInicial =
            rolesRespuesta.find(
              (rol) =>
                rol.rol === "Cajero",
            ) ??
            rolesRespuesta[0] ??
            null;

          setRoles(rolesRespuesta);
          setUsuarios(usuariosRespuesta);

          setRolSeleccionado(
            rolInicial?.rol ?? null,
          );

          setPermisosEditados(
            rolInicial
              ? [...rolInicial.permisos]
              : [],
          );

          setError(null);
        },
      )
      .catch(() => {
        if (!componenteActivo) {
          return;
        }

        setError(
          "No fue posible cargar la configuración de roles.",
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

  const rolActual = useMemo(
    () =>
      roles.find(
        (rol) =>
          rol.rol === rolSeleccionado,
      ) ?? null,
    [roles, rolSeleccionado],
  );

  const hayCambios = useMemo(() => {
    if (!rolActual) {
      return false;
    }

    return permisosSistema.some(
      (permiso) =>
        rolActual.permisos.includes(
          permiso,
        ) !==
        permisosEditados.includes(
          permiso,
        ),
    );
  }, [rolActual, permisosEditados]);

  const usuariosDelRol = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          usuario.rol === rolSeleccionado,
      ).length,
    [usuarios, rolSeleccionado],
  );

  const modulosHabilitados =
    gruposPermisos.filter((grupo) =>
      grupo.permisos.some((item) =>
        permisosEditados.includes(
          item.permiso,
        ),
      ),
    ).length;

  async function reintentarCarga() {
    try {
      setCargando(true);
      setError(null);

      const [
        rolesRespuesta,
        usuariosRespuesta,
      ] = await obtenerDatosPagina();

      const rolInicial =
        rolesRespuesta.find(
          (rol) =>
            rol.rol === "Cajero",
        ) ??
        rolesRespuesta[0] ??
        null;

      setRoles(rolesRespuesta);
      setUsuarios(usuariosRespuesta);

      setRolSeleccionado(
        rolInicial?.rol ?? null,
      );

      setPermisosEditados(
        rolInicial
          ? [...rolInicial.permisos]
          : [],
      );
    } catch {
      setError(
        "No fue posible cargar la configuración de roles.",
      );
    } finally {
      setCargando(false);
    }
  }

  function aplicarSeleccionRol(
    rol: RolUsuario,
  ) {
    const configuracion =
      roles.find(
        (item) => item.rol === rol,
      );

    if (!configuracion) {
      return;
    }

    setRolSeleccionado(rol);

    setPermisosEditados([
      ...configuracion.permisos,
    ]);

    setRolPendiente(null);
  }

  function solicitarSeleccionRol(
    rol: RolUsuario,
  ) {
    if (rol === rolSeleccionado) {
      return;
    }

    if (hayCambios) {
      setRolPendiente(rol);

      return;
    }

    aplicarSeleccionRol(rol);
  }

  function alternarPermiso(
    permiso: PermisoSistema,
    habilitar: boolean,
  ) {
    if (
      !rolActual?.editable ||
      permiso === "ROLES_GESTIONAR"
    ) {
      return;
    }

    setPermisosEditados(
      (permisosActuales) => {
        const nuevosPermisos =
          new Set<PermisoSistema>(
            permisosActuales,
          );

        if (habilitar) {
          nuevosPermisos.add(permiso);

          const dependencia =
            dependenciasPermisos[permiso];

          if (dependencia) {
            nuevosPermisos.add(
              dependencia,
            );
          }
        } else {
          nuevosPermisos.delete(
            permiso,
          );

          Object.entries(
            dependenciasPermisos,
          ).forEach(
            ([
              permisoDependiente,
              dependencia,
            ]) => {
              if (
                dependencia === permiso
              ) {
                nuevosPermisos.delete(
                  permisoDependiente as PermisoSistema,
                );
              }
            },
          );
        }

        /*
          El Dashboard se conserva como acceso
          mínimo para todos los roles.
        */
        nuevosPermisos.add(
          "DASHBOARD_VER",
        );

        return permisosSistema.filter(
          (permisoSistema) =>
            nuevosPermisos.has(
              permisoSistema,
            ),
        );
      },
    );
  }

  function seleccionarTodos() {
    if (!rolActual?.editable) {
      return;
    }

    setPermisosEditados(
      permisosSistema.filter(
        (permiso) =>
          permiso !==
          "ROLES_GESTIONAR",
      ),
    );
  }

  function dejarAccesoBasico() {
    if (!rolActual?.editable) {
      return;
    }

    setPermisosEditados([
      "DASHBOARD_VER",
    ]);
  }

  async function guardarCambios() {
    if (
      !rolSeleccionado ||
      !rolActual?.editable ||
      !hayCambios
    ) {
      return;
    }

    try {
      setGuardando(true);

      const rolActualizado =
        await actualizarPermisosRol(
          rolSeleccionado,
          permisosEditados,
        );

      setRoles((rolesActuales) =>
        rolesActuales.map((rol) =>
          rol.rol ===
          rolActualizado.rol
            ? rolActualizado
            : rol,
        ),
      );

      setPermisosEditados([
        ...rolActualizado.permisos,
      ]);

      setNotificacion({
        tipo: "exito",
        titulo:
          "Permisos actualizados",
        mensaje:
          `La configuración del rol ${rolActualizado.nombre} fue guardada correctamente.`,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible guardar los permisos.";

      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudieron guardar los cambios",
        mensaje,
      });
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarRestablecer() {
    if (
      !rolSeleccionado ||
      !rolActual?.editable
    ) {
      return;
    }

    try {
      setRestableciendo(true);

      const rolRestablecido =
        await restablecerPermisosRol(
          rolSeleccionado,
        );

      setRoles((rolesActuales) =>
        rolesActuales.map((rol) =>
          rol.rol ===
          rolRestablecido.rol
            ? rolRestablecido
            : rol,
        ),
      );

      setPermisosEditados([
        ...rolRestablecido.permisos,
      ]);

      setConfirmarRestablecimiento(
        false,
      );

      setNotificacion({
        tipo: "exito",
        titulo:
          "Configuración restablecida",
        mensaje:
          `El rol ${rolRestablecido.nombre} recuperó sus permisos iniciales.`,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible restablecer el rol.";

      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo restablecer el rol",
        mensaje,
      });
    } finally {
      setRestableciendo(false);
    }
  }

  if (cargando) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-slate-300" />

        <div
          className="
            grid grid-cols-1 gap-5
            lg:grid-cols-3
          "
        >
          {Array.from({
            length: 3,
          }).map((_, indice) => (
            <div
              key={indice}
              className="
                h-48 rounded-2xl
                bg-white
              "
            />
          ))}
        </div>

        <div className="h-150 rounded-2xl bg-white" />
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
        <div
          className="
            mx-auto flex h-16 w-16
            items-center justify-center
            rounded-2xl
            bg-red-100 text-red-700
          "
        >
          <ShieldX size={31} />
        </div>

        <h1
          className="
            mt-5 text-2xl
            font-black text-slate-900
          "
        >
          No se pudieron cargar los roles
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void reintentarCarga()
          }
          className="
            mt-6 inline-flex
            items-center gap-2
            rounded-xl bg-roma-700
            px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-roma-800
          "
        >
          <RefreshCcw size={18} />

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
          flex flex-col gap-6
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
            Seguridad y autorización
          </p>

          <h1
            className="
              mt-2 text-3xl
              font-black tracking-tight
            "
          >
            Roles y permisos
          </h1>

          <p
            className="
              mt-3 max-w-2xl
              text-sm leading-relaxed
              text-slate-300
            "
          >
            Define las funciones disponibles
            para cada tipo de usuario y controla
            el acceso a los módulos del sistema.
          </p>
        </div>

        <div
          className="
            flex items-center gap-3
            rounded-2xl border
            border-white/10
            bg-white/5 p-4
            backdrop-blur-sm
          "
        >
          <LockKeyhole
            size={25}
            className="text-roma-300"
          />

          <div>
            <p className="text-sm font-bold">
              Control centralizado
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Configuración exclusiva del administrador
            </p>
          </div>
        </div>
      </section>

      <section
        className="
          grid grid-cols-1 gap-5
          lg:grid-cols-3
        "
      >
        {roles.map((rol) => {
          const visual =
            configuracionVisualRoles[
              rol.rol
            ];

          const Icono = visual.icono;

          const seleccionado =
            rol.rol === rolSeleccionado;

          const cantidadUsuarios =
            usuarios.filter(
              (usuario) =>
                usuario.rol === rol.rol,
            ).length;

          return (
            <button
              key={rol.rol}
              type="button"
              onClick={() =>
                solicitarSeleccionRol(
                  rol.rol,
                )
              }
              className={`
                rounded-2xl border
                p-5 text-left
                shadow-sm transition-all
                ${
                  seleccionado
                    ? "border-roma-500 bg-white ring-4 ring-roma-100"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-panel"
                }
              `}
            >
              <div
                className="
                  flex items-start
                  justify-between gap-4
                "
              >
                <div
                  className={`
                    flex h-12 w-12
                    items-center justify-center
                    rounded-2xl
                    ${visual.colorFondo}
                    ${visual.colorIcono}
                  `}
                >
                  <Icono size={25} />
                </div>

                {seleccionado && (
                  <span
                    className="
                      inline-flex
                      items-center gap-1
                      rounded-full
                      bg-roma-100
                      px-3 py-1
                      text-xs font-bold
                      text-roma-700
                    "
                  >
                    <Check size={14} />

                    Seleccionado
                  </span>
                )}
              </div>

              <h2
                className="
                  mt-5 text-lg
                  font-black text-slate-900
                "
              >
                {rol.nombre}
              </h2>

              <p
                className="
                  mt-2 min-h-10
                  text-sm leading-relaxed
                  text-slate-500
                "
              >
                {rol.descripcion}
              </p>

              <div
                className="
                  mt-5 flex items-center
                  justify-between
                  border-t border-slate-100
                  pt-4 text-xs
                  text-slate-500
                "
              >
                <span>
                  {cantidadUsuarios} usuarios
                </span>

                <span>
                  {rol.permisos.length} permisos
                </span>
              </div>

              {!rol.editable && (
                <div
                  className="
                    mt-4 flex items-center
                    gap-2 rounded-xl
                    bg-slate-100 px-3 py-2
                    text-xs font-bold
                    text-slate-600
                  "
                >
                  <LockKeyhole size={15} />

                  Configuración protegida
                </div>
              )}
            </button>
          );
        })}
      </section>

      {rolActual && (
        <>
          <section
            className="
              grid grid-cols-1 gap-5
              sm:grid-cols-2 xl:grid-cols-4
            "
          >
            <TarjetaMetrica
              titulo="Rol seleccionado"
              valor={rolActual.nombre}
              descripcion="Configuración en revisión"
              icono={KeyRound}
              tono="roma"
            />

            <TarjetaMetrica
              titulo="Usuarios asignados"
              valor={String(usuariosDelRol)}
              descripcion="Cuentas asociadas al rol"
              icono={UsersRound}
              tono="azul"
            />

            <TarjetaMetrica
              titulo="Permisos habilitados"
              valor={String(
                permisosEditados.length,
              )}
              descripcion="Funciones actualmente seleccionadas"
              icono={ShieldCheck}
              tono="verde"
            />

            <TarjetaMetrica
              titulo="Módulos accesibles"
              valor={String(
                modulosHabilitados,
              )}
              descripcion="Áreas visibles para el rol"
              icono={SlidersHorizontal}
              tono="ambar"
            />
          </section>

          <section
            className="
              overflow-hidden rounded-2xl
              border border-slate-200
              bg-white shadow-panel
            "
          >
            <header
              className="
                flex flex-col gap-5
                border-b border-slate-100
                p-5 sm:p-6 lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="
                      text-xl font-black
                      text-slate-900
                    "
                  >
                    Permisos de {rolActual.nombre}
                  </h2>

                  {hayCambios && (
                    <span
                      className="
                        rounded-full
                        bg-amber-100
                        px-3 py-1
                        text-xs font-bold
                        text-amber-700
                      "
                    >
                      Cambios sin guardar
                    </span>
                  )}

                  {!rolActual.editable && (
                    <span
                      className="
                        rounded-full
                        bg-slate-100
                        px-3 py-1
                        text-xs font-bold
                        text-slate-600
                      "
                    >
                      Solo lectura
                    </span>
                  )}
                </div>

                <p
                  className="
                    mt-2 text-sm
                    leading-relaxed
                    text-slate-500
                  "
                >
                  Active las operaciones que estarán
                  disponibles para los usuarios de este rol.
                </p>
              </div>

              <div
                className="
                  flex flex-col gap-3
                  sm:flex-row
                "
              >
                <button
                  type="button"
                  disabled={
                    !rolActual.editable ||
                    guardando
                  }
                  onClick={() =>
                    setConfirmarRestablecimiento(
                      true,
                    )
                  }
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    rounded-xl border
                    border-slate-300
                    px-4 py-3
                    text-sm font-bold
                    text-slate-700
                    transition-colors
                    hover:bg-slate-100
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <RefreshCcw size={17} />

                  Restablecer
                </button>

                <button
                  type="button"
                  disabled={
                    !rolActual.editable ||
                    !hayCambios ||
                    guardando
                  }
                  onClick={() =>
                    void guardarCambios()
                  }
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    rounded-xl bg-roma-700
                    px-5 py-3
                    text-sm font-bold
                    text-white
                    transition-colors
                    hover:bg-roma-800
                    disabled:cursor-not-allowed
                    disabled:bg-roma-400
                  "
                >
                  {guardando ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  Guardar cambios
                </button>
              </div>
            </header>

            {rolActual.editable && (
              <div
                className="
                  flex flex-col gap-3
                  border-b border-slate-100
                  bg-slate-50
                  px-5 py-4 sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-6
                "
              >
                <p className="text-sm text-slate-500">
                  Utilice estas acciones para configurar
                  rápidamente el rol seleccionado.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={dejarAccesoBasico}
                    className="
                      rounded-lg border
                      border-slate-300
                      bg-white px-3 py-2
                      text-xs font-bold
                      text-slate-700
                      hover:bg-slate-100
                    "
                  >
                    Solo acceso básico
                  </button>

                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    className="
                      rounded-lg
                      bg-blue-100 px-3 py-2
                      text-xs font-bold
                      text-blue-700
                      hover:bg-blue-200
                    "
                  >
                    Seleccionar todos
                  </button>
                </div>
              </div>
            )}

            <div
              className="
                grid grid-cols-1 gap-5
                p-5 sm:p-6 xl:grid-cols-2
              "
            >
              {gruposPermisos.map(
                (grupo) => {
                  const IconoGrupo =
                    grupo.icono;

                  const activosGrupo =
                    grupo.permisos.filter(
                      (item) =>
                        permisosEditados.includes(
                          item.permiso,
                        ),
                    ).length;

                  return (
                    <article
                      key={grupo.nombre}
                      className="
                        overflow-hidden
                        rounded-2xl border
                        border-slate-200
                        bg-white
                      "
                    >
                      <header
                        className="
                          flex items-start
                          justify-between gap-4
                          border-b border-slate-100
                          bg-slate-50 p-4
                        "
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="
                              flex h-10 w-10
                              shrink-0 items-center
                              justify-center
                              rounded-xl
                              bg-roma-100
                              text-roma-700
                            "
                          >
                            <IconoGrupo size={20} />
                          </div>

                          <div>
                            <h3
                              className="
                                text-sm font-black
                                text-slate-900
                              "
                            >
                              {grupo.nombre}
                            </h3>

                            <p
                              className="
                                mt-1 text-xs
                                leading-relaxed
                                text-slate-500
                              "
                            >
                              {grupo.descripcion}
                            </p>
                          </div>
                        </div>

                        <span
                          className="
                            shrink-0 rounded-full
                            bg-white px-3 py-1
                            text-xs font-bold
                            text-slate-600
                            shadow-sm
                          "
                        >
                          {activosGrupo}/
                          {grupo.permisos.length}
                        </span>
                      </header>

                      <div
                        className="
                          divide-y
                          divide-slate-100
                        "
                      >
                        {grupo.permisos.map(
                          (item) => {
                            const seleccionado =
                              permisosEditados.includes(
                                item.permiso,
                              );

                            const bloqueado =
                              !rolActual.editable ||
                              Boolean(
                                item.reservadoAdministrador,
                              );

                            const dependencia =
                              dependenciasPermisos[
                                item.permiso
                              ];

                            return (
                              <label
                                key={item.permiso}
                                className={`
                                  flex gap-4 p-4
                                  transition-colors
                                  ${
                                    bloqueado
                                      ? "cursor-not-allowed bg-slate-50/70"
                                      : "cursor-pointer hover:bg-slate-50"
                                  }
                                `}
                              >
                                <input
                                  type="checkbox"
                                  checked={seleccionado}
                                  disabled={bloqueado}
                                  onChange={(evento) =>
                                    alternarPermiso(
                                      item.permiso,
                                      evento.target
                                        .checked,
                                    )
                                  }
                                  className="sr-only"
                                />

                                <span
                                  aria-hidden="true"
                                  className={`
                                    relative mt-0.5
                                    h-6 w-11 shrink-0
                                    rounded-full
                                    transition-colors
                                    ${
                                      seleccionado
                                        ? "bg-roma-700"
                                        : "bg-slate-300"
                                    }
                                    ${
                                      bloqueado
                                        ? "opacity-60"
                                        : ""
                                    }
                                  `}
                                >
                                  <span
                                    className={`
                                      absolute top-1
                                      h-4 w-4
                                      rounded-full
                                      bg-white shadow-sm
                                      transition-transform
                                      ${
                                        seleccionado
                                          ? "translate-x-6"
                                          : "translate-x-1"
                                      }
                                    `}
                                  />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div
                                    className="
                                      flex flex-wrap
                                      items-center gap-2
                                    "
                                  >
                                    <p
                                      className="
                                        text-sm font-bold
                                        text-slate-800
                                      "
                                    >
                                      {item.nombre}
                                    </p>

                                    {item.reservadoAdministrador && (
                                      <span
                                        className="
                                          inline-flex
                                          items-center gap-1
                                          rounded-full
                                          bg-slate-200
                                          px-2 py-0.5
                                          text-[10px]
                                          font-bold
                                          text-slate-600
                                        "
                                      >
                                        <LockKeyhole
                                          size={11}
                                        />

                                        Solo administrador
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className="
                                      mt-1 text-xs
                                      leading-relaxed
                                      text-slate-500
                                    "
                                  >
                                    {item.descripcion}
                                  </p>

                                  {dependencia && (
                                    <p
                                      className="
                                        mt-2 text-[11px]
                                        font-semibold
                                        text-blue-600
                                      "
                                    >
                                      Requiere:{" "}
                                      {obtenerNombrePermiso(
                                        dependencia,
                                      )}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          },
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>

            <footer
              className="
                flex items-start gap-3
                border-t border-blue-100
                bg-blue-50 px-5 py-4
                text-sm text-blue-700
                sm:px-6
              "
            >
              <KeyRound
                size={19}
                className="mt-0.5 shrink-0"
              />

              <p className="leading-relaxed">
                Los cambios se aplicarán cuando los
                usuarios del rol inicien una nueva sesión.
                Las sesiones que ya están abiertas
                conservarán temporalmente sus permisos
                anteriores.
              </p>
            </footer>
          </section>
        </>
      )}

      <ModalConfirmacion
        abierto={Boolean(rolPendiente)}
        titulo="Descartar cambios sin guardar"
        descripcion="Existen modificaciones pendientes en el rol actual. Si continúa, estos cambios se perderán."
        textoConfirmar="Descartar cambios"
        variante="peligro"
        cargando={false}
        alConfirmar={() => {
          if (rolPendiente) {
            aplicarSeleccionRol(
              rolPendiente,
            );
          }
        }}
        alCancelar={() =>
          setRolPendiente(null)
        }
      />

      <ModalConfirmacion
        abierto={
          confirmarRestablecimiento
        }
        titulo="Restablecer permisos"
        descripcion={`El rol ${rolActual?.nombre ?? ""} recuperará su configuración inicial. Los cambios actuales serán reemplazados.`}
        textoConfirmar="Restablecer"
        variante="peligro"
        cargando={restableciendo}
        alConfirmar={() =>
          void confirmarRestablecer()
        }
        alCancelar={() =>
          setConfirmarRestablecimiento(
            false,
          )
        }
      />
    </div>
  );
}

export default RolesPermisos;