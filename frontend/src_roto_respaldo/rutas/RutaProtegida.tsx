import type { ReactNode } from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../contextos/AuthContext";

interface RutaProtegidaProps {
  children: ReactNode;
}

function RutaProtegida({
  children,
}: RutaProtegidaProps) {
  const { autenticado } = useAuth();

  const location = useLocation();

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          desde: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default RutaProtegida;