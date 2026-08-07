import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AuthContext,
  type AuthContextType,
} from "./AuthContext";

import {
  rolesUsuario,
  type RolUsuario,
  type SesionUsuario,
} from "../tipos/auth";

import {
  auditarAccion,
} from "../servicios/auditoriaAccionesServicio";

import {
  obtenerCajaAbiertaPorUsuario,
} from "../servicios/cajaServicio";

interface AuthProviderProps {
  children: ReactNode;
}

const CLAVE_SESION = "roma-sesion";

function esRolUsuario(
  valor: unknown,
): valor is RolUsuario {
  return (
    typeof valor === "string" &&
    rolesUsuario.includes(
      valor as RolUsuario,
    )
  );
}

function normalizarSesion(
  sesion: SesionUsuario,
): SesionUsuario {
  const rolLegado = esRolUsuario(
    sesion.usuario?.rol,
  )
    ? sesion.usuario.rol
    : "Cajero";

  const rolesGuardados =
    Array.isArray(sesion.usuario?.roles)
      ? sesion.usuario.roles.filter(
          esRolUsuario,
        )
      : [];

  const roles =
    rolesGuardados.length > 0
      ? rolesGuardados
      : [rolLegado];

  const rolesNormalizados =
    roles.includes("Administrador")
      ? (["Administrador"] as RolUsuario[])
      : rolesUsuario.filter(
          (rol) =>
            rol !== "Administrador" &&
            roles.includes(rol),
        );

  const rolesFinales =
    rolesNormalizados.length > 0
      ? rolesNormalizados
      : [rolLegado];

  const rolPrincipal =
    rolesFinales.includes("Administrador")
      ? "Administrador"
      : rolesFinales.includes("Cajero")
        ? "Cajero"
        : "Inventario";

  return {
    ...sesion,
    usuario: {
      ...sesion.usuario,
      rol: rolPrincipal,
      roles: [...rolesFinales],
      permisos: Array.isArray(
        sesion.usuario?.permisos,
      )
        ? [...sesion.usuario.permisos]
        : [],
    },
  };
}

function recuperarSesion(): SesionUsuario | null {
  const sesionGuardada =
    localStorage.getItem(CLAVE_SESION);

  if (!sesionGuardada) {
    return null;
  }

  try {
    const sesion = normalizarSesion(
      JSON.parse(
        sesionGuardada,
      ) as SesionUsuario,
    );

    localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify(sesion),
    );

    return sesion;
  } catch {
    localStorage.removeItem(
      CLAVE_SESION,
    );

    return null;
  }
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [sesion, setSesion] =
    useState<SesionUsuario | null>(
      recuperarSesion,
    );

  const iniciarSesion =
    useCallback(
      (
        nuevaSesion: SesionUsuario,
      ) => {
        const sesionNormalizada =
          normalizarSesion(
            nuevaSesion,
          );

        setSesion(sesionNormalizada);

        localStorage.setItem(
          CLAVE_SESION,
          JSON.stringify(
            sesionNormalizada,
          ),
        );

        void auditarAccion(
          {
            modulo: "Autenticación",
            accion: "Iniciar sesión",
            entidad: "Sesión",
            entidadId:
              sesionNormalizada.usuario.id,
            descripcion:
              `${sesionNormalizada.usuario.nombreCompleto} inició sesión en el sistema.`,
            datosPosteriores: {
              fechaInicio:
                sesionNormalizada.fechaInicio,
              usuario:
                sesionNormalizada.usuario,
            },
          },
          sesionNormalizada.usuario,
        );
      },
      [],
    );

  const cerrarSesion =
    useCallback(async () => {
      const usuarioActual =
        sesion?.usuario ?? null;

      if (!usuarioActual) {
        setSesion(null);
        localStorage.removeItem(
          CLAVE_SESION,
        );
        return;
      }

      const cajaAbierta =
        await obtenerCajaAbiertaPorUsuario(
          usuarioActual.id,
        );

      if (cajaAbierta) {
        throw new Error(
          `No puedes cerrar sesión mientras la caja N.º ${cajaAbierta.id} permanezca abierta. Realiza el cierre de tu caja antes de salir.`,
        );
      }

      void auditarAccion(
        {
          modulo: "Autenticación",
          accion: "Cerrar sesión",
          entidad: "Sesión",
          entidadId:
            usuarioActual.id,
          descripcion:
            `${usuarioActual.nombreCompleto} cerró su sesión.`,
        },
        usuarioActual,
      );

      setSesion(null);

      localStorage.removeItem(
        CLAVE_SESION,
      );
    }, [sesion]);

  const valorContexto =
    useMemo<AuthContextType>(
      () => ({
        sesion,
        usuario:
          sesion?.usuario ?? null,
        autenticado:
          Boolean(sesion),
        iniciarSesion,
        cerrarSesion,
      }),
      [
        sesion,
        iniciarSesion,
        cerrarSesion,
      ],
    );

  return (
    <AuthContext.Provider
      value={valorContexto}
    >
      {children}
    </AuthContext.Provider>
  );
}
