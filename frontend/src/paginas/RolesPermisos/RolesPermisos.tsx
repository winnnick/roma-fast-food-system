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
  UserRound,
  UsersRound,
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

import {
  actualizarAccesosUsuario,
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

  Auxiliar: {
    icono: KeyRound,
    colorIcono:
      "text-teal-700 dark:text-teal-300",
    colorFondo:
      "bg-teal-100 dark:bg-teal-950/50",
    colorBordeActivo:
      "border-teal-500",
    colorFondoActivo:
      "bg-teal-50 dark:bg-teal-950/35",
  },
};

type ModoConfiguracion =
  | "rol"
  | "usuario";

type SeleccionPendiente =
  | {
      tipo: "modo";
      modo: ModoConfiguracion;
    }
  | {
      tipo: "rol";
      rol: RolUsuario;
    }
  | {
      tipo: "usuario";
      usuarioId: number;
    };

const rolesAsignables: RolUsuario[] = [
  "Cajero",
  "Inventario",
  "Auxiliar",
];

function ordenarRoles(
  roles: readonly RolUsuario[],
): RolUsuario[] {
  return rolesAsignables.filter((rol) =>
    roles.includes(rol),
  );
}

function mismosRoles(
  a: readonly RolUsuario[],
  b: readonly RolUsuario[],
): boolean {
  return rolesAsignables.every(
    (rol) =>
      a.includes(rol) === b.includes(rol),
  );
}

function mismosPermisos(
  a: readonly PermisoSistema[],
  b: readonly PermisoSistema[],
): boolean {
  return permisosSistema.every(
    (permiso) =>
      a.includes(permiso) ===
      b.includes(permiso),
  );
}


function obtenerPermisosHeredados(
  rolesAsignados: readonly RolUsuario[],
  configuraciones: readonly RolConfiguracion[],
): PermisoSistema[] {
  const permisos = new Set<PermisoSistema>();

  rolesAsignados.forEach((rol) => {
    configuraciones
      .find((item) => item.rol === rol)
      ?.permisos.forEach((permiso) =>
        permisos.add(permiso),
      );
  });

  return permisosSistema.filter(
    (permiso) => permisos.has(permiso),
  );
}

function RolesPermisos() {
  const [roles, setRoles] =
    useState<RolConfiguracion[]>([]);

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [modo, setModo] =
    useState<ModoConfiguracion>("rol");

  const [
    rolSeleccionado,
    setRolSeleccionado,
  ] = useState<RolUsuario | null>(null);

  const [
    permisosRolEditados,
    setPermisosRolEditados,
  ] = useState<PermisoSistema[]>([]);

  const [
    usuarioSeleccionadoId,
    setUsuarioSeleccionadoId,
  ] = useState<number | null>(null);

  const [
    rolesUsuarioEditados,
    setRolesUsuarioEditados,
  ] = useState<RolUsuario[]>([]);

  const [
    permisosUsuarioEditados,
    setPermisosUsuarioEditados,
  ] = useState<PermisoSistema[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [restableciendo, setRestableciendo] =
    useState(false);

  const [
    confirmarRestablecimiento,
    setConfirmarRestablecimiento,
  ] = useState(false);

  const [
    seleccionPendiente,
    setSeleccionPendiente,
  ] = useState<SeleccionPendiente | null>(
    null,
  );

  const [
    notificacion,
    setNotificacion,
  ] = useState<DatosNotificacion | null>(
    null,
  );

  function prepararUsuario(
    usuario: Usuario,
    configuraciones = roles,
  ) {
    const rolesNormalizados = ordenarRoles(
      usuario.roles.length > 0
        ? usuario.roles
        : [usuario.rol],
    );

    const rolesConPrincipal =
      rolesNormalizados.includes(usuario.rol)
        ? rolesNormalizados
        : ordenarRoles([
            usuario.rol,
            ...rolesNormalizados,
          ]);

    const heredados =
      obtenerPermisosHeredados(
        rolesConPrincipal,
        configuraciones,
      );

    setUsuarioSeleccionadoId(usuario.id);
    setRolesUsuarioEditados(
      rolesConPrincipal,
    );
    setPermisosUsuarioEditados(
      usuario.permisosAdicionales.filter(
        (permiso) =>
          permiso !== "ROLES_GESTIONAR" &&
          !heredados.includes(permiso),
      ),
    );
  }

  async function cargarDatos() {
    const [rolesRespuesta, usuariosRespuesta] =
      await Promise.all([
        listarRoles(),
        listarUsuarios(),
      ]);

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

    const usuariosConfigurables =
      usuariosRespuesta.filter(
        (usuario) =>
          !usuario.roles.includes(
            "Administrador",
          ),
      );

    const usuarioInicial =
      usuariosConfigurables.find(
        (usuario) =>
          usuario.username === "cajero01",
      ) ??
      usuariosConfigurables.find(
        (usuario) =>
          usuario.estado === "Activo",
      ) ??
      usuariosConfigurables[0] ??
      null;

    setRoles(rolesRespuesta);
    setUsuarios(usuariosRespuesta);
    setRolSeleccionado(
      rolInicial?.rol ?? null,
    );
    setPermisosRolEditados(
      rolInicial
        ? [...rolInicial.permisos]
        : [],
    );

    if (usuarioInicial) {
      prepararUsuario(
        usuarioInicial,
        rolesRespuesta,
      );
    } else {
      setUsuarioSeleccionadoId(null);
      setRolesUsuarioEditados([]);
      setPermisosUsuarioEditados([]);
    }
  }

  useEffect(() => {
    let componenteActivo = true;

    Promise.all([
      listarRoles(),
      listarUsuarios(),
    ])
      .then(
        ([rolesRespuesta, usuariosRespuesta]) => {
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

          const usuariosConfigurables =
            usuariosRespuesta.filter(
              (usuario) =>
                !usuario.roles.includes(
                  "Administrador",
                ),
            );

          const usuarioInicial =
            usuariosConfigurables.find(
              (usuario) =>
                usuario.username ===
                "cajero01",
            ) ??
            usuariosConfigurables.find(
              (usuario) =>
                usuario.estado === "Activo",
            ) ??
            usuariosConfigurables[0] ??
            null;

          setRoles(rolesRespuesta);
          setUsuarios(usuariosRespuesta);
          setRolSeleccionado(
            rolInicial?.rol ?? null,
          );
          setPermisosRolEditados(
            rolInicial
              ? [...rolInicial.permisos]
              : [],
          );

          if (usuarioInicial) {
            const rolesNormalizados =
              ordenarRoles(
                usuarioInicial.roles,
              );
            const rolesConPrincipal =
              rolesNormalizados.includes(
                usuarioInicial.rol,
              )
                ? rolesNormalizados
                : ordenarRoles([
                    usuarioInicial.rol,
                    ...rolesNormalizados,
                  ]);

            const heredados =
              permisosSistema.filter(
                (permiso) =>
                  rolesConPrincipal.some(
                    (rol) =>
                      rolesRespuesta
                        .find(
                          (item) =>
                            item.rol === rol,
                        )
                        ?.permisos.includes(
                          permiso,
                        ),
                  ),
              );

            setUsuarioSeleccionadoId(
              usuarioInicial.id,
            );
            setRolesUsuarioEditados(
              rolesConPrincipal,
            );
            setPermisosUsuarioEditados(
              usuarioInicial.permisosAdicionales.filter(
                (permiso) =>
                  permiso !==
                    "ROLES_GESTIONAR" &&
                  !heredados.includes(
                    permiso,
                  ),
              ),
            );
          }

          setError(null);
        },
      )
      .catch(() => {
        if (!componenteActivo) {
          return;
        }

        setError(
          "No fue posible cargar la configuración de accesos.",
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

  const usuariosConfigurables = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          !usuario.roles.includes(
            "Administrador",
          ),
      ),
    [usuarios],
  );

  const usuarioActual = useMemo(
    () =>
      usuarios.find(
        (usuario) =>
          usuario.id ===
          usuarioSeleccionadoId,
      ) ?? null,
    [usuarios, usuarioSeleccionadoId],
  );

  const permisosHeredadosUsuario = useMemo(
    () =>
      obtenerPermisosHeredados(
        rolesUsuarioEditados,
        roles,
      ),
    [roles, rolesUsuarioEditados],
  );

  const permisosEfectivosUsuario = useMemo(
    () =>
      permisosSistema.filter(
        (permiso) =>
          permisosHeredadosUsuario.includes(
            permiso,
          ) ||
          permisosUsuarioEditados.includes(
            permiso,
          ),
      ),
    [
      permisosHeredadosUsuario,
      permisosUsuarioEditados,
    ],
  );

  const hayCambiosRol = useMemo(() => {
    if (!rolActual) {
      return false;
    }

    return !mismosPermisos(
      rolActual.permisos,
      permisosRolEditados,
    );
  }, [rolActual, permisosRolEditados]);

  const hayCambiosUsuario = useMemo(() => {
    if (!usuarioActual) {
      return false;
    }

    const rolesOriginales = ordenarRoles(
      usuarioActual.roles,
    );

    const permisosOriginales =
      usuarioActual.permisosAdicionales.filter(
        (permiso) =>
          permiso !== "ROLES_GESTIONAR" &&
          !permisosHeredadosUsuario.includes(
            permiso,
          ),
      );

    return (
      !mismosRoles(
        rolesOriginales,
        rolesUsuarioEditados,
      ) ||
      !mismosPermisos(
        permisosOriginales,
        permisosUsuarioEditados,
      )
    );
  }, [
    usuarioActual,
    rolesUsuarioEditados,
    permisosUsuarioEditados,
    permisosHeredadosUsuario,
  ]);

  const hayCambios =
    modo === "rol"
      ? hayCambiosRol
      : hayCambiosUsuario;

  const rolesAdicionalesUsuario =
    usuarioActual
      ? rolesUsuarioEditados.filter(
          (rol) => rol !== usuarioActual.rol,
        )
      : [];

  const puedeRestablecer =
    modo === "rol"
      ? Boolean(rolActual?.editable)
      : Boolean(
          usuarioActual &&
            (rolesAdicionalesUsuario.length > 0 ||
              permisosUsuarioEditados.length > 0),
        );

  useEffect(() => {
    function advertirSalida(
      evento: BeforeUnloadEvent,
    ) {
      if (!hayCambios) {
        return;
      }

      evento.preventDefault();
      evento.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      advertirSalida,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        advertirSalida,
      );
    };
  }, [hayCambios]);

  async function reintentarCarga() {
    try {
      setCargando(true);
      setError(null);
      await cargarDatos();
    } catch {
      setError(
        "No fue posible cargar la configuración de accesos.",
      );
    } finally {
      setCargando(false);
    }
  }

  function aplicarSeleccionRol(
    rol: RolUsuario,
  ) {
    const configuracion = roles.find(
      (item) => item.rol === rol,
    );

    if (
      !configuracion ||
      !configuracion.editable
    ) {
      return;
    }

    setRolSeleccionado(rol);
    setPermisosRolEditados([
      ...configuracion.permisos,
    ]);
  }

  function aplicarSeleccionUsuario(
    usuarioId: number,
  ) {
    const usuario = usuarios.find(
      (item) => item.id === usuarioId,
    );

    if (
      !usuario ||
      usuario.roles.includes(
        "Administrador",
      )
    ) {
      return;
    }

    prepararUsuario(usuario);
  }

  function solicitarCambio(
    seleccion: SeleccionPendiente,
  ) {
    if (hayCambios) {
      setSeleccionPendiente(seleccion);
      return;
    }

    if (seleccion.tipo === "modo") {
      setModo(seleccion.modo);
      return;
    }

    if (seleccion.tipo === "rol") {
      aplicarSeleccionRol(seleccion.rol);
      return;
    }

    aplicarSeleccionUsuario(
      seleccion.usuarioId,
    );
  }

  function confirmarCambioSeleccion() {
    if (!seleccionPendiente) {
      return;
    }

    const pendiente = seleccionPendiente;
    setSeleccionPendiente(null);

    if (pendiente.tipo === "modo") {
      setModo(pendiente.modo);
      return;
    }

    if (pendiente.tipo === "rol") {
      aplicarSeleccionRol(pendiente.rol);
      return;
    }

    aplicarSeleccionUsuario(
      pendiente.usuarioId,
    );
  }

  function alternarPermisoRol(
    permiso: PermisoSistema,
    habilitar: boolean,
  ) {
    if (
      !rolActual?.editable ||
      permiso === "ROLES_GESTIONAR"
    ) {
      return;
    }

    setPermisosRolEditados(
      (permisosActuales) => {
        const nuevosPermisos =
          new Set<PermisoSistema>(
            permisosActuales,
          );

        if (habilitar) {
          let permisoActual:
            | PermisoSistema
            | undefined = permiso;

          while (permisoActual) {
            nuevosPermisos.add(
              permisoActual,
            );
            permisoActual =
              dependenciasPermisos[
                permisoActual
              ];
          }
        } else {
          nuevosPermisos.delete(permiso);

          let huboCambios = true;
          while (huboCambios) {
            huboCambios = false;

            Object.entries(
              dependenciasPermisos,
            ).forEach(
              ([dependiente, dependencia]) => {
                const permisoDependiente =
                  dependiente as PermisoSistema;

                if (
                  dependencia &&
                  !nuevosPermisos.has(
                    dependencia,
                  ) &&
                  nuevosPermisos.delete(
                    permisoDependiente,
                  )
                ) {
                  huboCambios = true;
                }
              },
            );
          }
        }

        return permisosSistema.filter(
          (item) => nuevosPermisos.has(item),
        );
      },
    );
  }

  function alternarPermisoUsuario(
    permiso: PermisoSistema,
    habilitar: boolean,
  ) {
    if (
      !usuarioActual ||
      permiso === "ROLES_GESTIONAR" ||
      permisosHeredadosUsuario.includes(
        permiso,
      )
    ) {
      return;
    }

    setPermisosUsuarioEditados(
      (permisosActuales) => {
        const extras =
          new Set<PermisoSistema>(
            permisosActuales,
          );

        if (habilitar) {
          let actual:
            | PermisoSistema
            | undefined = permiso;

          while (actual) {
            if (
              actual !== "ROLES_GESTIONAR" &&
              !permisosHeredadosUsuario.includes(
                actual,
              )
            ) {
              extras.add(actual);
            }

            actual =
              dependenciasPermisos[actual];
          }
        } else {
          extras.delete(permiso);

          let huboCambios = true;
          while (huboCambios) {
            huboCambios = false;

            Object.entries(
              dependenciasPermisos,
            ).forEach(
              ([dependiente, dependencia]) => {
                const permisoDependiente =
                  dependiente as PermisoSistema;

                const dependenciaDisponible =
                  !dependencia ||
                  permisosHeredadosUsuario.includes(
                    dependencia,
                  ) ||
                  extras.has(dependencia);

                if (
                  !dependenciaDisponible &&
                  extras.delete(
                    permisoDependiente,
                  )
                ) {
                  huboCambios = true;
                }
              },
            );
          }
        }

        return permisosSistema.filter(
          (item) =>
            item !== "ROLES_GESTIONAR" &&
            !permisosHeredadosUsuario.includes(
              item,
            ) &&
            extras.has(item),
        );
      },
    );
  }

  function alternarRolAdicional(
    rol: RolUsuario,
  ) {
    if (
      !usuarioActual ||
      rol === usuarioActual.rol ||
      rol === "Administrador"
    ) {
      return;
    }

    const nuevosRoles =
      rolesUsuarioEditados.includes(rol)
        ? rolesUsuarioEditados.filter(
            (actual) => actual !== rol,
          )
        : ordenarRoles([
            ...rolesUsuarioEditados,
            rol,
          ]);

    const rolesConPrincipal =
      nuevosRoles.includes(
        usuarioActual.rol,
      )
        ? nuevosRoles
        : ordenarRoles([
            usuarioActual.rol,
            ...nuevosRoles,
          ]);

    const heredadosNuevos =
      obtenerPermisosHeredados(
        rolesConPrincipal,
        roles,
      );

    setRolesUsuarioEditados(
      rolesConPrincipal,
    );
    setPermisosUsuarioEditados(
      (actuales) =>
        actuales.filter(
          (permiso) =>
            !heredadosNuevos.includes(
              permiso,
            ),
        ),
    );
  }

  function descartarCambios() {
    if (!hayCambios) {
      return;
    }

    if (modo === "rol" && rolActual) {
      setPermisosRolEditados([
        ...rolActual.permisos,
      ]);
      return;
    }

    if (usuarioActual) {
      prepararUsuario(usuarioActual);
    }
  }

  async function guardarCambios() {
    if (!hayCambios) {
      return;
    }

    try {
      setGuardando(true);

      if (modo === "rol") {
        if (
          !rolSeleccionado ||
          !rolActual?.editable
        ) {
          return;
        }

        const rolAnterior = rolActual;
        const rolActualizado =
          await actualizarPermisosRol(
            rolSeleccionado,
            permisosRolEditados,
          );

        setRoles((actuales) =>
          actuales.map((rol) =>
            rol.rol === rolActualizado.rol
              ? rolActualizado
              : rol,
          ),
        );
        setPermisosRolEditados([
          ...rolActualizado.permisos,
        ]);

        await auditarAccion({
          modulo: "Roles y permisos",
          accion: "Actualizar permisos de rol",
          entidad: "Rol",
          entidadId: rolActualizado.rol,
          descripcion:
            `Se actualizaron los permisos base del rol ${rolActualizado.nombre}.`,
          datosAnteriores: rolAnterior,
          datosPosteriores: rolActualizado,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Permisos actualizados",
          mensaje:
            `La configuración del rol ${rolActualizado.nombre} fue guardada correctamente.`,
        });
        return;
      }

      if (!usuarioActual) {
        return;
      }

      const usuarioAnterior = usuarioActual;
      const usuarioActualizado =
        await actualizarAccesosUsuario(
          usuarioActual.id,
          {
            roles: rolesUsuarioEditados,
            permisosAdicionales:
              permisosUsuarioEditados,
          },
        );

      setUsuarios((actuales) =>
        actuales.map((usuario) =>
          usuario.id ===
          usuarioActualizado.id
            ? usuarioActualizado
            : usuario,
        ),
      );
      prepararUsuario(usuarioActualizado);

      await auditarAccion({
        modulo: "Roles y permisos",
        accion: "Actualizar permisos de usuario",
        entidad: "Usuario",
        entidadId: usuarioActualizado.id,
        descripcion:
          `Se actualizaron los accesos individuales de ${usuarioActualizado.nombreCompleto}.`,
        datosAnteriores: {
          rolPrincipal:
            usuarioAnterior.rol,
          roles:
            usuarioAnterior.roles,
          permisosAdicionales:
            usuarioAnterior.permisosAdicionales,
        },
        datosPosteriores: {
          rolPrincipal:
            usuarioActualizado.rol,
          roles:
            usuarioActualizado.roles,
          permisosAdicionales:
            usuarioActualizado.permisosAdicionales,
        },
      });

      setNotificacion({
        tipo: "exito",
        titulo: "Accesos actualizados",
        mensaje:
          `Los roles adicionales y permisos especiales de ${usuarioActualizado.nombreCompleto} fueron guardados.`,
      });
    } catch (errorGuardado) {
      const mensaje =
        errorGuardado instanceof Error
          ? errorGuardado.message
          : "No fue posible guardar los cambios.";

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
    try {
      setRestableciendo(true);

      if (modo === "rol") {
        if (
          !rolSeleccionado ||
          !rolActual?.editable
        ) {
          return;
        }

        const rolAnterior = rolActual;
        const rolRestablecido =
          await restablecerPermisosRol(
            rolSeleccionado,
          );

        setRoles((actuales) =>
          actuales.map((rol) =>
            rol.rol === rolRestablecido.rol
              ? rolRestablecido
              : rol,
          ),
        );
        setPermisosRolEditados([
          ...rolRestablecido.permisos,
        ]);

        await auditarAccion({
          modulo: "Roles y permisos",
          accion: "Restablecer permisos de rol",
          entidad: "Rol",
          entidadId: rolRestablecido.rol,
          descripcion:
            `Se restablecieron los permisos iniciales del rol ${rolRestablecido.nombre}.`,
          datosAnteriores: rolAnterior,
          datosPosteriores: rolRestablecido,
          nivel: "Advertencia",
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Configuración restablecida",
          mensaje:
            `El rol ${rolRestablecido.nombre} recuperó sus permisos iniciales.`,
        });
      } else if (usuarioActual) {
        const usuarioAnterior = usuarioActual;
        const usuarioRestablecido =
          await actualizarAccesosUsuario(
            usuarioActual.id,
            {
              roles: [usuarioActual.rol],
              permisosAdicionales: [],
            },
          );

        setUsuarios((actuales) =>
          actuales.map((usuario) =>
            usuario.id ===
            usuarioRestablecido.id
              ? usuarioRestablecido
              : usuario,
          ),
        );
        prepararUsuario(usuarioRestablecido);

        await auditarAccion({
          modulo: "Roles y permisos",
          accion: "Restablecer accesos de usuario",
          entidad: "Usuario",
          entidadId: usuarioRestablecido.id,
          descripcion:
            `Se retiraron los roles adicionales y permisos especiales de ${usuarioRestablecido.nombreCompleto}.`,
          datosAnteriores: {
            roles: usuarioAnterior.roles,
            permisosAdicionales:
              usuarioAnterior.permisosAdicionales,
          },
          datosPosteriores: {
            roles: usuarioRestablecido.roles,
            permisosAdicionales:
              usuarioRestablecido.permisosAdicionales,
          },
          nivel: "Advertencia",
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Accesos restablecidos",
          mensaje:
            `${usuarioRestablecido.nombreCompleto} conserva únicamente los permisos de su rol principal ${usuarioRestablecido.rol}.`,
        });
      }

      setConfirmarRestablecimiento(false);
    } catch (errorRestablecimiento) {
      const mensaje =
        errorRestablecimiento instanceof Error
          ? errorRestablecimiento.message
          : "No fue posible restablecer la configuración.";

      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo restablecer la configuración",
        mensaje,
      });
    } finally {
      setRestableciendo(false);
    }
  }

  if (cargando) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-[34rem] rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/60 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
          <ShieldX size={31} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
          No se pudieron cargar los accesos
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void reintentarCarga()
          }
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-roma-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-roma-800"
        >
          <RefreshCcw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

  const permisosMostrados =
    modo === "rol"
      ? permisosRolEditados
      : permisosEfectivosUsuario;


  const tituloConfiguracion =
    modo === "rol"
      ? `Permisos de ${rolActual?.nombre ?? "rol"}`
      : `Accesos de ${usuarioActual?.nombreCompleto ?? "usuario"}`;

  const descripcionConfiguracion =
    modo === "rol"
      ? "Estos permisos se heredan automáticamente a todas las cuentas que tengan este rol."
      : `@${usuarioActual?.username} · Rol principal: ${usuarioActual?.rol}. Los permisos heredados permanecen bloqueados; aquí solo se agregan accesos.`;

  const controlesConfiguracion = (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        disabled={!hayCambios || guardando}
        onClick={descartarCambios}
        title="Descartar cambios"
        aria-label="Descartar cambios"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70"
      >
        <X size={16} />
      </button>

      <button
        type="button"
        disabled={
          !puedeRestablecer ||
          guardando ||
          restableciendo
        }
        onClick={() =>
          setConfirmarRestablecimiento(
            true,
          )
        }
        title={
          modo === "rol"
            ? "Restablecer permisos iniciales"
            : "Quitar roles y permisos adicionales"
        }
        aria-label="Restablecer configuración"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-950/70"
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
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-roma-700 text-white shadow-sm transition-colors hover:bg-roma-800 disabled:cursor-not-allowed disabled:bg-roma-400 dark:disabled:bg-roma-950/60"
      >
        {guardando ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
      </button>
    </div>
  );

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-4 pb-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() =>
          setNotificacion(null)
        }
      />

      <section className="grid min-w-0 grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            solicitarCambio({
              tipo: "modo",
              modo: "rol",
            })
          }
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
            modo === "rol"
              ? "border-roma-500 bg-roma-50 shadow-sm dark:bg-roma-950/35"
              : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-roma-100 text-roma-700 dark:bg-roma-950/55 dark:text-roma-300">
            <UsersRound size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-900 dark:text-white">
              Permisos por rol
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
              Define el acceso base de todos los usuarios de un rol.
            </span>
          </span>
          {modo === "rol" && (
            <Check className="ml-auto text-emerald-600 dark:text-emerald-300" size={17} />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            solicitarCambio({
              tipo: "modo",
              modo: "usuario",
            })
          }
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
            modo === "usuario"
              ? "border-violet-500 bg-violet-50 shadow-sm dark:bg-violet-950/35"
              : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/55 dark:text-violet-300">
            <UserRound size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-900 dark:text-white">
              Permisos por usuario
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
              Agrega roles o capacidades especiales a una persona concreta.
            </span>
          </span>
          {modo === "usuario" && (
            <Check className="ml-auto text-emerald-600 dark:text-emerald-300" size={17} />
          )}
        </button>
      </section>

      {modo === "rol" ? (
        <section className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-2 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Rol a configurar
            </p>

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
                    solicitarCambio({
                      tipo: "rol",
                      rol: rol.rol,
                    })
                  }
                  className={`inline-flex h-12 w-[180px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all ${
                    seleccionado
                      ? `${visual.colorBordeActivo} ${visual.colorFondoActivo} shadow-sm`
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.colorFondo} ${visual.colorIcono}`}>
                    <Icono size={17} />
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {rol.rol}
                  </span>
                  {seleccionado && (
                    <Check size={16} className="ml-auto text-emerald-600 dark:text-emerald-300" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 xl:self-auto">
            <ShieldCheck size={16} className="text-roma-600 dark:text-roma-300" />
            <span>
              <strong>Administrador:</strong>{" "}
              acceso total, sin configuración.
            </span>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] lg:items-stretch">
            <div className="flex min-w-0 flex-col justify-center">
              <label
                className="text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400"
                htmlFor="usuarioPermisos"
              >
                Usuario a configurar
              </label>

              <select
                id="usuarioPermisos"
                value={usuarioSeleccionadoId ?? ""}
                onChange={(evento) =>
                  solicitarCambio({
                    tipo: "usuario",
                    usuarioId: Number(
                      evento.target.value,
                    ),
                  })
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-violet-950/40"
              >
                {usuariosConfigurables.map(
                  (usuario) => (
                    <option
                      key={usuario.id}
                      value={usuario.id}
                    >
                      {usuario.nombreCompleto} · @{usuario.username} · {usuario.rol} · {usuario.estado}
                    </option>
                  ),
                )}
              </select>
            </div>

            {usuarioActual && (
              <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/55 px-4 py-3 dark:border-violet-900/60 dark:bg-violet-950/20 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {tituloConfiguracion}
                    </h2>

                    {hayCambios && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                        Cambios sin guardar
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {descripcionConfiguracion}
                  </p>
                </div>

                {controlesConfiguracion}
              </div>
            )}
          </div>
        </section>
      )}

      {(modo === "rol" ? rolActual : usuarioActual) && (
        <>
          {modo === "rol" && rolActual && (
            <div className="sticky top-0 z-20 flex min-w-0 max-w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {tituloConfiguracion}
                  </h2>

                  {hayCambios && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                      Cambios sin guardar
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {descripcionConfiguracion}
                </p>
              </div>

              {controlesConfiguracion}
            </div>
          )}

          {modo === "usuario" && usuarioActual && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Roles del usuario
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {usuarioActual.rol} es el rol principal. Los demás pueden añadirse o retirarse sin afectar a otras cuentas.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {permisosHeredadosUsuario.length} heredados
                  </span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {permisosUsuarioEditados.length} adicionales
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {permisosEfectivosUsuario.length} efectivos
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {rolesAsignables.map((rol) => {
                  const visual =
                    configuracionVisualRoles[rol];
                  const Icono = visual.icono;
                  const principal =
                    rol === usuarioActual.rol;
                  const seleccionado =
                    rolesUsuarioEditados.includes(
                      rol,
                    );

                  return (
                    <button
                      key={rol}
                      type="button"
                      disabled={principal}
                      onClick={() =>
                        alternarRolAdicional(rol)
                      }
                      className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                        seleccionado
                          ? `${visual.colorBordeActivo} ${visual.colorFondoActivo}`
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                      } ${principal ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${visual.colorFondo} ${visual.colorIcono}`}>
                        <Icono size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-slate-900 dark:text-white">
                          {rol}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {principal
                            ? "Rol principal"
                            : seleccionado
                              ? "Rol adicional"
                              : "No asignado"}
                        </span>
                      </span>
                      {seleccionado && (
                        <Check size={16} className="text-emerald-600 dark:text-emerald-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="min-w-0 max-w-full">
            <div className="columns-1 gap-3 lg:columns-2 2xl:columns-3">
              {gruposPermisos.map((grupo) => {
                const IconoGrupo = grupo.icono;
                const activosGrupo =
                  grupo.permisos.filter(
                    (item) =>
                      permisosMostrados.includes(
                        item.permiso,
                      ),
                  ).length;

                return (
                  <article
                    key={grupo.nombre}
                    className="mb-3 min-w-0 break-inside-avoid rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <header className="flex items-center justify-between gap-3 rounded-t-xl border-b border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-950/45">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-roma-100 text-roma-700 dark:bg-roma-950/50 dark:text-roma-300">
                          <IconoGrupo size={16} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            {grupo.nombre}
                          </h3>
                          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            {activosGrupo}/{grupo.permisos.length}{" "}
                            {modo === "rol"
                              ? "activos"
                              : "efectivos"}
                          </p>
                        </div>
                      </div>
                    </header>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {grupo.permisos.map((item) => {
                        const seleccionado =
                          permisosMostrados.includes(
                            item.permiso,
                          );

                        const heredado =
                          modo === "usuario" &&
                          permisosHeredadosUsuario.includes(
                            item.permiso,
                          );

                        const adicional =
                          modo === "usuario" &&
                          permisosUsuarioEditados.includes(
                            item.permiso,
                          );

                        const reservado = Boolean(
                          item.reservadoAdministrador,
                        );

                        const bloqueado =
                          modo === "rol"
                            ? reservado
                            : reservado || heredado;

                        const dependencia =
                          dependenciasPermisos[
                            item.permiso
                          ];

                        const rolesOrigen =
                          modo === "usuario" && heredado
                            ? rolesUsuarioEditados.filter(
                                (rol) =>
                                  roles
                                    .find(
                                      (configuracion) =>
                                        configuracion.rol ===
                                        rol,
                                    )
                                    ?.permisos.includes(
                                      item.permiso,
                                    ),
                              )
                            : [];

                        return (
                          <button
                            key={item.permiso}
                            type="button"
                            role="switch"
                            aria-checked={seleccionado}
                            disabled={bloqueado}
                            onClick={() =>
                              modo === "rol"
                                ? alternarPermisoRol(
                                    item.permiso,
                                    !seleccionado,
                                  )
                                : alternarPermisoUsuario(
                                    item.permiso,
                                    !seleccionado,
                                  )
                            }
                            className={`flex w-full min-w-0 gap-3 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-roma-500 ${
                              bloqueado
                                ? "cursor-default bg-slate-50/70 dark:bg-slate-900/50"
                                : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
                                seleccionado
                                  ? heredado
                                    ? "bg-slate-500 dark:bg-slate-600"
                                    : "bg-roma-700"
                                  : "bg-slate-300 dark:bg-slate-700"
                              } ${bloqueado && !heredado ? "opacity-60" : ""}`}
                            >
                              <span
                                className={`absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                                  seleccionado
                                    ? "translate-x-5"
                                    : "translate-x-1"
                                }`}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {item.nombre}
                                </p>

                                {reservado && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                    <LockKeyhole size={9} />
                                    Solo Admin
                                  </span>
                                )}

                                {heredado && !reservado && (
                                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                    Heredado
                                  </span>
                                )}

                                {adicional && (
                                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:bg-violet-950/55 dark:text-violet-300">
                                    Adicional
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                                {item.descripcion}
                              </p>

                              {heredado && rolesOrigen.length > 0 && (
                                <p className="mt-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                  Incluido por: {rolesOrigen.join(" + ")}
                                </p>
                              )}

                              {dependencia && !heredado && (
                                <p className="mt-1.5 text-[9px] font-bold text-violet-600 dark:text-violet-300">
                                  Requiere: {obtenerNombrePermiso(
                                    dependencia,
                                  )}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      <ModalConfirmacion
        abierto={Boolean(seleccionPendiente)}
        titulo="Descartar cambios sin guardar"
        descripcion="Hay modificaciones pendientes. Si continúa, se perderán los cambios que todavía no fueron guardados."
        textoConfirmar="Descartar y continuar"
        textoCancelar="Seguir editando"
        variante="peligro"
        cargando={false}
        alConfirmar={confirmarCambioSeleccion}
        alCancelar={() =>
          setSeleccionPendiente(null)
        }
      />

      <ModalConfirmacion
        abierto={confirmarRestablecimiento}
        titulo={
          modo === "rol"
            ? "Restablecer permisos del rol"
            : "Quitar accesos adicionales"
        }
        descripcion={
          modo === "rol"
            ? `Se reemplazará la configuración actual de ${rolActual?.nombre ?? "este rol"} por sus permisos iniciales.`
            : `${usuarioActual?.nombreCompleto ?? "El usuario"} conservará únicamente su rol principal ${usuarioActual?.rol ?? ""}. Se retirarán los roles adicionales y permisos concedidos individualmente.`
        }
        textoConfirmar={
          modo === "rol"
            ? "Restablecer"
            : "Quitar adicionales"
        }
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
