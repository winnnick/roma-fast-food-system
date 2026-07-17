import {
  createContext,
  useContext,
} from "react";

import type {
  SesionUsuario,
  UsuarioSesion,
} from "../tipos/auth";

export interface AuthContextType {
  sesion: SesionUsuario | null;
  usuario: UsuarioSesion | null;
  autenticado: boolean;
  iniciarSesion: (
    sesion: SesionUsuario,
  ) => void;
  cerrarSesion: () => void;
}

export const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider.",
    );
  }

  return contexto;
}