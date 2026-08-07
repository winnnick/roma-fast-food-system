import {
  Check,
  History,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  RefreshCcw,
  Save,
  ShieldCheck,
  ShieldX,
  X,
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

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  actualizarPermisosRol,
  dependenciasPermisos,
  listarRoles,
  restablecerPermisosRol,
} from "../../servicios/rolServicio";


import type {
  RolUsuario,
} from "../../tipos/auth";

import {
  permisosSistema,
  type PermisoSistema,
  type RolConfiguracion,
} from "../../tipos/rol";


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

interface ConfiguracionVisualRol {
  icono: LucideIcon | typeof IconoCajaRegistradora;
  colorIcono: string;
  colorFondo: string;
  colorBordeActivo: string;
  colorFondoActivo: string;
}

const configuracionVisualRoles: Record<
  RolUsuario,
  ConfiguracionVisualRol
> = {
  Administrador: {
    icono: ShieldCheck,
    colorIcono:
      "text-roma-700 dark:text-roma-300",
    colorFondo:
      "bg-roma-100 dark:bg-roma-950/50",
    colorBordeActivo:
      "border-roma-500",
    colorFondoActivo:
      "bg-roma-50 dark:bg-roma-950/35",
  },

  Cajero: {
    icono: IconoCajaRegistradora,
    colorIcono:
      "text-blue-700 dark:text-blue-300",
    colorFondo:
      "bg-blue-100 dark:bg-blue-950/50",
    colorBordeActivo:
      "border-blue-500",
    colorFondoActivo:
      "bg-blue-50 dark:bg-blue-950/35",
  },

  Inventario: {
    icono: PackageCheck,
    colorIcono:
      "text-emerald-700 dark:text-emerald-300",
    colorFondo:
      "bg-emerald-100 dark:bg-emerald-950/50",
    colorBordeActivo:
      "border-emerald-500",
    colorFondoActivo:
      "bg-emerald-50 dark:bg-emerald-950/35",
  },
};

async function obtenerDatosPagina() {
  return listarRoles();
}

function RolesPermisos() {
  const [roles, setRoles] =
    useState<RolConfiguracion[]>([]);

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
      .then((rolesRespuesta) => {
          if (!componenteActivo) {
            return;
          }

          const rolInicial =
            rolesRespuesta.find(
              (rol) =>
                rol.rol === "Cajero" &&
                rol.editable,
            ) ??
            rolesRespuesta.find(
              (rol) => rol.editable,
            ) ??
            null;

          setRoles(rolesRespuesta);

          setRolSeleccionado(
            rolInicial?.rol ?? null,
          );

          setPermisosEditados(
            rolInicial
              ? [...rolInicial.permisos]
              : [],
          );

          setError(null);
        })
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

  const rolesEditables = useMemo(
    () =>
      roles.filter((rol) => rol.editable),
    [roles],
  );

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


  async function reintentarCarga() {
    try {
      setCargando(true);
      setError(null);

      const rolesRespuesta =
        await obtenerDatosPagina();

      const rolInicial =
        rolesRespuesta.find(
          (rol) =>
            rol.rol === "Cajero" &&
            rol.editable,
        ) ??
        rolesRespuesta.find(
          (rol) => rol.editable,
        ) ??
        null;

      setRoles(rolesRespuesta);

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

    if (
      !configuracion ||
      !configuracion.editable
    ) {
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
      permiso === "ROLES_GESTIONAR" ||
      permiso === "DASHBOARD_VER"
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

  function descartarCambios() {
    if (!rolActual || !hayCambios) {
      return;
    }

    setPermisosEditados([
      ...rolActual.permisos,
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
          rol.rol === rolActualizado.rol
            ? rolActualizado
            : rol,
        ),
      );

      setPermisosEditados([
        ...rolActualizado.permisos,
      ]);

      await auditarAccion({
        modulo: "Roles y permisos",
        accion: "Actualizar permisos",
        entidad: "Rol",
        entidadId: rolActualizado.rol,
        descripcion:
          `Se actualizaron los permisos del rol ${rolActualizado.nombre}.`,
        datosAnteriores: rolActual,
        datosPosteriores: rolActualizado,
      });

      setNotificacion({
        tipo: "exito",
        titulo: "Permisos actualizados",
        mensaje:
          `La configuración del rol ${rolActualizado.nombre} fue guardada correctamente.`,
      });
    } catch (errorGuardado) {
      const mensaje =
        errorGuardado instanceof Error
          ? errorGuardado.message
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
          rol.rol === rolRestablecido.rol
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

      await auditarAccion({
        modulo: "Roles y permisos",
        accion: "Restablecer permisos",
        entidad: "Rol",
        entidadId: rolRestablecido.rol,
        descripcion:
          `Se restablecieron los permisos iniciales del rol ${rolRestablecido.nombre}.`,
        datosAnteriores: rolActual,
        datosPosteriores: rolRestablecido,
        nivel: "Advertencia",
      });

      setNotificacion({
        tipo: "exito",
        titulo:
          "Configuración restablecida",
        mensaje:
          `El rol ${rolRestablecido.nombre} recuperó sus permisos iniciales.`,
      });
    } catch (errorRestablecimiento) {
      const mensaje =
        errorRestablecimiento instanceof Error
          ? errorRestablecimiento.message
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
      <div className="space-y-4 animate-pulse">
        <div
          className="
            h-20 rounded-2xl
            bg-slate-200
            dark:bg-slate-800
          "
        />

        <div
          className="
            h-24 rounded-2xl
            bg-slate-200
            dark:bg-slate-800
          "
        />

        <div
          className="
            h-[34rem] rounded-2xl
            bg-slate-200
            dark:bg-slate-800
          "
        />
      </div>
    );
  }

  if (error) {
    return (
      <section
        className="
          rounded-3xl border
          border-red-200 bg-white
          p-8 text-center shadow-panel
          dark:border-red-900/60
          dark:bg-slate-900
        "
      >
        <div
          className="
            mx-auto flex h-16 w-16
            items-center justify-center
            rounded-2xl bg-red-100
            text-red-700
            dark:bg-red-950/60
            dark:text-red-300
          "
        >
          <ShieldX size={31} />
        </div>

        <h1
          className="
            mt-5 text-2xl font-black
            text-slate-900
            dark:text-white
          "
        >
          No se pudieron cargar los roles
        </h1>

        <p
          className="
            mt-2 text-sm text-slate-500
            dark:text-slate-400
          "
        >
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void reintentarCarga()
          }
          className="
            mt-6 inline-flex items-center
            gap-2 rounded-xl bg-roma-700
            px-5 py-3 text-sm font-bold
            text-white transition-colors
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
    <div className="space-y-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() =>
          setNotificacion(null)
        }
      />

      <section
        className="
          flex flex-col gap-3
          rounded-2xl border
          border-slate-200 bg-white
          p-4 shadow-sm
          dark:border-slate-700
          dark:bg-slate-900
          xl:flex-row xl:items-center
          xl:justify-between
        "
      >
        <div
          className="
            flex flex-wrap items-center
            gap-2
          "
        >
          <div className="mr-2">
            <p
              className="
                text-[11px] font-black
                uppercase tracking-wide
                text-slate-500
                dark:text-slate-400
              "
            >
              Rol a configurar
            </p>
          </div>

          {rolesEditables.map((rol) => {
            const visual =
              configuracionVisualRoles[
                rol.rol
              ];
            const Icono = visual.icono;
            const seleccionado =
              rol.rol === rolSeleccionado;

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
                  inline-flex h-12 w-[180px]
                  items-center gap-3
                  rounded-xl border px-3 py-2
                  text-left transition-all
                  ${
                    seleccionado
                      ? `${visual.colorBordeActivo} ${visual.colorFondoActivo} shadow-sm`
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  }
                `}
              >
                <span
                  className={`
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-lg
                    ${visual.colorFondo}
                    ${visual.colorIcono}
                  `}
                >
                  <Icono size={17} />
                </span>

                <span>
                  <span
                    className="
                      block text-sm font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {rol.rol}
                  </span>
                </span>

                {seleccionado && (
                  <Check
                    size={16}
                    className="
                      ml-1 text-emerald-600
                      dark:text-emerald-300
                    "
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          className="
            inline-flex items-center gap-2
            self-start rounded-xl border
            border-slate-200 bg-slate-50
            px-3 py-2 text-xs
            text-slate-600
            dark:border-slate-700
            dark:bg-slate-950/50
            dark:text-slate-300
            xl:self-auto
          "
        >
          <ShieldCheck
            size={16}
            className="
              text-roma-600
              dark:text-roma-300
            "
          />

          <span>
            <strong>Administrador:</strong>{" "}
            acceso total, sin configuración.
          </span>
        </div>
      </section>

      {rolActual && (
        <>
          <section
            className="
              flex h-[calc(100vh-12.5rem)]
              min-h-[31rem] flex-col
              overflow-hidden rounded-2xl
              border border-slate-200
              bg-white shadow-panel
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <header
              className="
                flex flex-col gap-3
                border-b border-slate-200
                px-4 py-3
                dark:border-slate-700
                lg:flex-row lg:items-center
                lg:justify-between
              "
            >
              <div>
                <div
                  className="
                    flex flex-wrap items-center
                    gap-2
                  "
                >
                  <h2
                    className="
                      text-lg font-black
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Permisos de {rolActual.nombre}
                  </h2>

                  {hayCambios && (
                    <span
                      className="
                        rounded-full
                        bg-amber-100 px-2.5 py-1
                        text-[11px] font-bold
                        text-amber-800
                        dark:bg-amber-950/60
                        dark:text-amber-200
                      "
                    >
                      Cambios sin guardar
                    </span>
                  )}
                </div>

                <p
                  className="
                    mt-1 text-xs
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Los usuarios reciben estos permisos según los roles asignados en Usuarios.
                </p>
              </div>

              <div
                className="
                  flex items-center gap-2
                "
              >
                <button
                  type="button"
                  disabled={!hayCambios || guardando}
                  onClick={descartarCambios}
                  title="Descartar cambios"
                  aria-label="Descartar cambios"
                  className="
                    inline-flex h-9 w-9
                    items-center justify-center
                    rounded-lg border
                    border-amber-300
                    bg-amber-50 text-amber-700
                    transition-colors
                    hover:bg-amber-100
                    disabled:cursor-not-allowed
                    disabled:opacity-35
                    dark:border-amber-900/70
                    dark:bg-amber-950/40
                    dark:text-amber-200
                    dark:hover:bg-amber-950/70
                  "
                >
                  <X size={16} />
                </button>

                <button
                  type="button"
                  disabled={guardando || restableciendo}
                  onClick={() =>
                    setConfirmarRestablecimiento(
                      true,
                    )
                  }
                  title="Restablecer permisos iniciales"
                  aria-label="Restablecer permisos iniciales"
                  className="
                    inline-flex h-9 w-9
                    items-center justify-center
                    rounded-lg border
                    border-violet-300
                    bg-violet-50 text-violet-700
                    transition-colors
                    hover:bg-violet-100
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    dark:border-violet-900/70
                    dark:bg-violet-950/40
                    dark:text-violet-200
                    dark:hover:bg-violet-950/70
                  "
                >
                  <History size={16} />
                </button>

                <button
                  type="button"
                  disabled={!hayCambios || guardando}
                  onClick={() =>
                    void guardarCambios()
                  }
                  title="Guardar cambios"
                  aria-label="Guardar cambios"
                  className="
                    inline-flex h-9 w-9
                    items-center justify-center
                    rounded-lg bg-roma-700
                    text-white shadow-sm
                    transition-colors
                    hover:bg-roma-800
                    disabled:cursor-not-allowed
                    disabled:bg-roma-400
                    dark:disabled:bg-roma-950/60
                  "
                >
                  {guardando ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={16} />
                  )}
                </button>
              </div>
            </header>


            <div
              className="
                min-h-0 flex flex-1
                items-start gap-3
                overflow-x-auto overflow-y-auto
                p-3 pb-4
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
                        w-[235px] shrink-0
                        overflow-hidden rounded-xl
                        border border-slate-200
                        bg-white
                        dark:border-slate-700
                        dark:bg-slate-950/35
                      "
                    >
                      <header
                        className="
                          flex items-center
                          justify-between gap-3
                          border-b border-slate-200
                          bg-slate-50 px-3 py-3
                          dark:border-slate-700
                          dark:bg-slate-900
                        "
                      >
                        <div
                          className="
                            flex min-w-0
                            items-center gap-2
                          "
                        >
                          <span
                            className="
                              flex h-8 w-8 shrink-0
                              items-center
                              justify-center
                              rounded-lg bg-roma-100
                              text-roma-700
                              dark:bg-roma-950/50
                              dark:text-roma-300
                            "
                          >
                            <IconoGrupo size={16} />
                          </span>

                          <div className="min-w-0">
                            <h3
                              className="
                                truncate text-sm
                                font-black
                                text-slate-900
                                dark:text-white
                              "
                            >
                              {grupo.nombre}
                            </h3>

                            <p
                              className="
                                mt-0.5 text-[10px]
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {activosGrupo}/
                              {grupo.permisos.length} activos
                            </p>
                          </div>
                        </div>
                      </header>

                      <div
                        className="
                          divide-y divide-slate-200
                          dark:divide-slate-800
                        "
                      >
                        {grupo.permisos.map(
                          (item) => {
                            const seleccionado =
                              permisosEditados.includes(
                                item.permiso,
                              );

                            const esObligatorio =
                              item.permiso ===
                              "DASHBOARD_VER";

                            const bloqueado =
                              Boolean(
                                item.reservadoAdministrador,
                              ) || esObligatorio;

                            const dependencia =
                              dependenciasPermisos[
                                item.permiso
                              ];

                            return (
                              <label
                                key={item.permiso}
                                className={`
                                  flex gap-3 px-3 py-3
                                  transition-colors
                                  ${
                                    bloqueado
                                      ? "cursor-not-allowed bg-slate-50/70 dark:bg-slate-900/50"
                                      : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
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
                                      evento.target.checked,
                                    )
                                  }
                                  className="sr-only"
                                />

                                <span
                                  aria-hidden="true"
                                  className={`
                                    relative mt-0.5
                                    h-5 w-9 shrink-0
                                    rounded-full
                                    transition-colors
                                    ${
                                      seleccionado
                                        ? "bg-roma-700"
                                        : "bg-slate-300 dark:bg-slate-700"
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
                                      h-3 w-3 rounded-full
                                      bg-white shadow-sm
                                      transition-transform
                                      ${
                                        seleccionado
                                          ? "translate-x-5"
                                          : "translate-x-1"
                                      }
                                    `}
                                  />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div
                                    className="
                                      flex flex-wrap
                                      items-center gap-1.5
                                    "
                                  >
                                    <p
                                      className="
                                        text-xs font-black
                                        text-slate-800
                                        dark:text-slate-100
                                      "
                                    >
                                      {item.nombre}
                                    </p>

                                    {esObligatorio && (
                                      <span
                                        className="
                                          rounded-full
                                          bg-blue-100
                                          px-1.5 py-0.5
                                          text-[9px] font-bold
                                          text-blue-700
                                          dark:bg-blue-950/60
                                          dark:text-blue-200
                                        "
                                      >
                                        Obligatorio
                                      </span>
                                    )}

                                    {item.reservadoAdministrador && (
                                      <span
                                        className="
                                          inline-flex items-center
                                          gap-1 rounded-full
                                          bg-slate-200
                                          px-1.5 py-0.5
                                          text-[9px] font-bold
                                          text-slate-600
                                          dark:bg-slate-700
                                          dark:text-slate-300
                                        "
                                      >
                                        <LockKeyhole
                                          size={9}
                                        />
                                        Admin
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className="
                                      mt-1 text-[10px]
                                      leading-snug
                                      text-slate-500
                                      dark:text-slate-400
                                    "
                                  >
                                    {item.descripcion}
                                  </p>

                                  {dependencia && (
                                    <p
                                      className="
                                        mt-1.5 text-[9px]
                                        font-bold
                                        text-blue-600
                                        dark:text-blue-300
                                      "
                                    >
                                      Requiere: {" "}
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
                flex items-center gap-2
                border-t border-slate-200
                bg-slate-50 px-4 py-2.5
                text-[11px]
                text-slate-500
                dark:border-slate-700
                dark:bg-slate-950/40
                dark:text-slate-400
              "
            >
              <KeyRound
                size={15}
                className="shrink-0"
              />

              <p>
                Los cambios toman efecto cuando el usuario inicia una nueva sesión.
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
