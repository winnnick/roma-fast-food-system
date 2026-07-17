import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import BarraLateral from "../shared/layout/BarraLateral";
import BarraSuperior from "../shared/layout/BarraSuperior";
import PiePagina from "../shared/layout/PiePagina";

import { obtenerPaginaActual } from "../shared/navegacion/menu";

const CLAVE_BARRA_LATERAL =
  "roma-barra-lateral-contraida";

function LayoutPrincipal() {
  const location = useLocation();

  const [barraContraida, setBarraContraida] =
    useState<boolean>(() => {
      const estadoGuardado = localStorage.getItem(
        CLAVE_BARRA_LATERAL,
      );

      return estadoGuardado === "true";
    });

  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
  ] = useState(false);

  const paginaActual = obtenerPaginaActual(
    location.pathname,
  );

  useEffect(() => {
    localStorage.setItem(
      CLAVE_BARRA_LATERAL,
      String(barraContraida),
    );
  }, [barraContraida]);

  /*
    Evita que el contenido del fondo se desplace
    mientras el menú móvil está abierto.
  */
  useEffect(() => {
    document.body.style.overflow =
      menuMovilAbierto ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuMovilAbierto]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <BarraLateral
        contraida={barraContraida}
        abiertaMovil={menuMovilAbierto}
        alCerrarMovil={() =>
          setMenuMovilAbierto(false)
        }
      />

      <div
        className={`
          flex min-h-screen flex-col
          transition-[padding] duration-300
          ${
            barraContraida
              ? "lg:pl-20"
              : "lg:pl-72"
          }
        `}
      >
        <BarraSuperior
          titulo={paginaActual.nombre}
          descripcion={paginaActual.descripcion}
          seccion={paginaActual.seccion}
          contraida={barraContraida}
          alAlternarBarra={() =>
            setBarraContraida(
              (estadoActual) => !estadoActual,
            )
          }
          alAbrirMenuMovil={() =>
            setMenuMovilAbierto(true)
          }
        />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>

        <PiePagina />
      </div>
    </div>
  );
}

export default LayoutPrincipal;