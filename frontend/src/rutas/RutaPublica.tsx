import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "../contextos/AuthContext";

interface RutaPublicaProps {
  children: ReactNode;
}

function RutaPublica({
  children,
}: RutaPublicaProps) {
  const { autenticado } = useAuth();

  if (autenticado) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default RutaPublica;