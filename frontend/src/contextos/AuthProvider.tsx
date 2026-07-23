import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AuthContext,
  type AuthContextType,
} from "./AuthContext";

import type {
  SesionUsuario,
} from "../tipos/auth";

import {
  auditarAccion,
} from "../servicios/auditoriaAccionesServicio";

interface AuthProviderProps {
  children: ReactNode;
}

const CLAVE_SESION = "roma-sesion";

function recuperarSesion(): SesionUsuario | null {
  const sesionGuardada =
    localStorage.getItem(CLAVE_SESION);

  if (!sesionGuardada) {
    return null;
  }

  try {
    return JSON.parse(
      sesionGuardada,
    ) as SesionUsuario;
  } catch {
    localStorage.removeItem(CLAVE_SESION);

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

  function iniciarSesion(
    nuevaSesion: SesionUsuario,
  ) {
    setSesion(nuevaSesion);

    localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify(nuevaSesion),
    );

    void auditarAccion(
      {
        modulo: "Autenticación",
        accion: "Iniciar sesión",
        entidad: "Sesión",
        entidadId:
          nuevaSesion.usuario.id,
        descripcion:
          `${nuevaSesion.usuario.nombreCompleto} inició sesión en el sistema.`,
        datosPosteriores: {
          fechaInicio:
            nuevaSesion.fechaInicio,
          usuario:
            nuevaSesion.usuario,
        },
      },
      nuevaSesion.usuario,
    );
  }

  function cerrarSesion() {
    const usuarioActual =
      sesion?.usuario ?? null;

    if (usuarioActual) {
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
    }

    setSesion(null);
    localStorage.removeItem(CLAVE_SESION);
  }

  const valorContexto =
    useMemo<AuthContextType>(
      () => ({
        sesion,
        usuario: sesion?.usuario ?? null,
        autenticado: Boolean(sesion),
        iniciarSesion,
        cerrarSesion,
      }),
      [sesion],
    );

  return (
    <AuthContext.Provider value={valorContexto}>
      {children}
    </AuthContext.Provider>
  );
}