import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BarraLateral from "../shared/layout/BarraLateral";
import BarraSuperior from "../shared/layout/BarraSuperior";
import PiePagina from "../shared/layout/PiePagina";

import {
  atajosNavegacion,
  obtenerPaginaActual,
} from "../shared/navegacion/menu";

import { useAuth } from "../contextos/AuthContext";

const CLAVE_BARRA_LATERAL =
  "roma-barra-lateral-contraida";

const CLAVE_TEMA =
  "roma-tema-oscuro";

function esElementoEditable(
  elemento: EventTarget | null,
): boolean {
  if (
    !(elemento instanceof HTMLElement)
  ) {
    return false;
  }

  return (
    elemento.isContentEditable ||
    elemento.tagName === "INPUT" ||
    elemento.tagName === "TEXTAREA" ||
    elemento.tagName === "SELECT"
  );
}

function LayoutPrincipal() {
  const location = useLocation();
  const navigate = useNavigate();

  const { usuario } = useAuth();

  const [
    barraContraida,
    setBarraContraida,
  ] = useState<boolean>(() => {
    const estadoGuardado =
      localStorage.getItem(
        CLAVE_BARRA_LATERAL,
      );

    return estadoGuardado === "true";
  });

  const [
    temaOscuro,
    setTemaOscuro,
  ] = useState<boolean>(() => {
    const temaGuardado =
      localStorage.getItem(
        CLAVE_TEMA,
      );

    return temaGuardado === "true";
  });

  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
  ] = useState(false);

  const paginaActual =
    obtenerPaginaActual(
      location.pathname,
    );

  useEffect(() => {
    localStorage.setItem(
      CLAVE_BARRA_LATERAL,
      String(barraContraida),
    );
  }, [barraContraida]);

  useEffect(() => {
    localStorage.setItem(
      CLAVE_TEMA,
      String(temaOscuro),
    );
  }, [temaOscuro]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const overflowHtmlAnterior =
      html.style.overflow;
    const overflowBodyAnterior =
      body.style.overflow;

    /*
     * Mientras el layout autenticado está montado, el documento
     * exterior no debe desplazarse. El único scroll vertical
     * permitido pertenece al <main> de la aplicación.
     *
     * Se bloquean HTML y BODY porque en Chromium el elemento
     * desplazable del viewport normalmente es <html>; bloquear
     * únicamente <body> puede dejar un scroll residual.
     */
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow =
        overflowHtmlAnterior;
      body.style.overflow =
        overflowBodyAnterior;
    };
  }, []);

  /*
   * Atajos globales invisibles:
   * Alt + Shift + D = Dashboard
   * Alt + Shift + V = Ventas
   */
  useEffect(() => {
    function manejarAtajo(
      evento: KeyboardEvent,
    ) {
      if (
        evento.repeat ||
        evento.ctrlKey ||
        evento.metaKey ||
        !evento.altKey ||
        !evento.shiftKey ||
        esElementoEditable(
          evento.target,
        )
      ) {
        return;
      }

      const atajo =
        atajosNavegacion.find(
          (elemento) =>
            elemento.codigo ===
            evento.code,
        );

      if (
        !atajo ||
        !usuario?.permisos.includes(
          atajo.permiso,
        )
      ) {
        return;
      }

      evento.preventDefault();

      navigate(atajo.ruta);
      setMenuMovilAbierto(false);
    }

    window.addEventListener(
      "keydown",
      manejarAtajo,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        manejarAtajo,
      );
    };
  }, [navigate, usuario]);

  return (
    <div
      className={`
        fixed inset-0 w-full max-w-full
        overflow-hidden
        text-slate-900
        transition-colors
        duration-300
        ${
          temaOscuro
            ? "tema-oscuro bg-slate-950"
            : "bg-slate-100"
        }
      `}
    >
      <BarraLateral
        contraida={barraContraida}
        abiertaMovil={
          menuMovilAbierto
        }
        alCerrarMovil={() =>
          setMenuMovilAbierto(false)
        }
      />

      <div
        className={`
          grid h-full min-h-0 w-full max-w-full
          min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]
          overflow-hidden transition-[padding]
          duration-300
          ${
            barraContraida
              ? "lg:pl-20"
              : "lg:pl-72"
          }
        `}
      >
        <BarraSuperior
          titulo={paginaActual.nombre}
          descripcion={
            paginaActual.descripcion
          }
          icono={
            paginaActual.icono
          }
          contraida={barraContraida}
          temaOscuro={temaOscuro}
          alAlternarTema={() =>
            setTemaOscuro(
              (estadoActual) =>
                !estadoActual,
            )
          }
          alAlternarBarra={() =>
            setBarraContraida(
              (estadoActual) =>
                !estadoActual,
            )
          }
          alAbrirMenuMovil={() =>
            setMenuMovilAbierto(true)
          }
        />

        <main
          className="
            min-h-0 min-w-0 max-w-full
            overflow-x-hidden overflow-y-auto px-4 py-5
            sm:px-6 sm:py-6
            lg:px-8 lg:py-7
          "
        >
          <div
            className="
              mx-auto min-h-0 min-w-0 w-full
              max-w-[1600px] overflow-x-hidden
            "
          >
            <Outlet />
          </div>
        </main>

        <PiePagina />
      </div>
    </div>
  );
}

export default LayoutPrincipal;
