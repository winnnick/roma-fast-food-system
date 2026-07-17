import type {
  ReactNode,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../contextos/AuthContext";

import type {
  PermisoSistema,
} from "../tipos/rol";

interface RutaConPermisoProps {
  permiso: PermisoSistema;
  children: ReactNode;
}

function RutaConPermiso({
  permiso,
  children,
}: RutaConPermisoProps) {
  const { usuario } = useAuth();

  const autorizado =
    usuario?.permisos.includes(
      permiso,
    );

  if (!autorizado) {
    return (
      <Navigate
        to="/sin-permiso"
        replace
      />
    );
  }

  return children;
}

export default RutaConPermiso;