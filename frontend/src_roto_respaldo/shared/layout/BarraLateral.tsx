import { X } from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { NavLink } from "react-router-dom";

import { useAuth } from "../../contextos/AuthContext";

import {
  seccionesMenu,
} from "../navegacion/menu";

interface BarraLateralProps {
  contraida: boolean;
  abiertaMovil: boolean;
  alCerrarMovil: () => void;
}

function BarraLateral({
  contraida,
  abiertaMovil,
  alCerrarMovil,
}: BarraLateralProps) {
  const { usuario } = useAuth();

  const [
    barraVisible,
    setBarraVisible,
  ] = useState(false);

  const [
    elementosVisibles,
    setElementosVisibles,
  ] = useState(false);

  const seccionesVisibles =
    useMemo(
      () =>
        seccionesMenu
          .map((seccion) => ({
            ...seccion,
            elementos:
              seccion.elementos.filter(
                (elemento) =>
                  usuario?.permisos.includes(
                    elemento.permiso,
                  ),
              ),
          }))
          .filter(
            (seccion) =>
              seccion.elementos.length > 0,
          ),
      [usuario],
    );

  /*
   * La animación se ejecuta cada vez que el layout
   * principal se monta. Esto sucede después del login,
   * sin depender de sessionStorage ni del backend.
   */
  useEffect(() => {
    const primerFrame =
      window.requestAnimationFrame(() => {
        setBarraVisible(true);
      });

    const temporizadorElementos =
      window.setTimeout(() => {
        setElementosVisibles(true);
      }, 230);

    return () => {
      window.cancelAnimationFrame(
        primerFrame,
      );

      window.clearTimeout(
        temporizadorElementos,
      );
    };
  }, []);

  let indiceGlobal = 0;

  const barraOcultaInicialmente =
    !barraVisible;

  return (
    <>
      {/* Fondo oscuro del menú móvil */}
      <button
        type="button"
        aria-label="Cerrar menú lateral"
        onClick={alCerrarMovil}
        className={`
          fixed inset-0 z-40
          bg-slate-950/65
          backdrop-blur-sm
          transition-opacity
          duration-300
          lg:hidden
          ${
            abiertaMovil
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0
          z-50 flex w-72
          flex-col overflow-hidden
          border-r border-white/8
          bg-[#030718]
          text-white
          shadow-2xl
          shadow-slate-950/40
          transition-[width,transform,opacity]
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]

          ${
            barraOcultaInicialmente
              ? "-translate-x-full opacity-0"
              : abiertaMovil
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-100 lg:translate-x-0"
          }

          ${
            contraida
              ? "lg:w-20"
              : "lg:w-72"
          }
        `}
      >
        {/* Identidad visual */}
        <div
          className="
            relative flex h-24
            shrink-0 items-center
            justify-center
            border-b border-white/8
            px-4
          "
        >
          {/* Marca completa */}
          <div
            className={`
              flex flex-col
              items-center text-center
              transition-opacity
              duration-200
              ${
                contraida
                  ? "lg:hidden"
                  : ""
              }
            `}
          >
            <p
              className="
                text-[2.35rem]
                font-black
                leading-[0.8]
                tracking-[-0.07em]
                text-white
                drop-shadow-[0_8px_22px_rgba(0,0,0,0.38)]
              "
            >
              ROMA
            </p>

            <div
              className="
                mt-2.5 flex
                items-center gap-3
              "
            >
              <span
                className="
                  h-px w-7
                  bg-roma-400/80
                "
              />

              <p
                className="
                  text-[9px]
                  font-black
                  tracking-[0.38em]
                  text-roma-300
                "
              >
                FAST FOOD
              </p>

              <span
                className="
                  h-px w-7
                  bg-roma-400/80
                "
              />
            </div>
          </div>

          {/* Marca compacta */}
          <div
            className={`
              hidden flex-col
              items-center text-center
              ${
                contraida
                  ? "lg:flex"
                  : ""
              }
            `}
          >
            <p
              className="
                text-[1.05rem]
                font-black
                leading-none
                tracking-[-0.055em]
                text-white
              "
            >
              ROMA
            </p>

            <p
              className="
                mt-1 text-[5px]
                font-black
                tracking-[0.2em]
                text-roma-300
              "
            >
              FAST FOOD
            </p>
          </div>

          <button
            type="button"
            onClick={alCerrarMovil}
            aria-label="Cerrar menú"
            className="
              absolute right-3 top-3
              rounded-xl p-2
              text-slate-400
              transition-colors
              hover:bg-white/10
              hover:text-white
              lg:hidden
            "
          >
            <X size={19} />
          </button>
        </div>

        {/* Navegación */}
        <nav
          aria-label="Navegación principal"
          className="
            flex-1 overflow-y-auto
            overflow-x-hidden
            px-3 py-4
          "
        >
          {seccionesVisibles.map(
            (seccion, indiceSeccion) => (
              <section
                key={seccion.titulo}
                aria-label={seccion.titulo}
                className={
                  indiceSeccion === 0
                    ? ""
                    : "mt-3 border-t border-white/7 pt-3"
                }
              >
                <h2 className="sr-only">
                  {seccion.titulo}
                </h2>

                <div className="space-y-1.5">
                  {seccion.elementos.map(
                    (elemento) => {
                      const Icono =
                        elemento.icono;

                      const orden =
                        indiceGlobal++;

                      return (
                        <div
                          key={elemento.ruta}
                          style={{
                            transitionDelay:
                              elementosVisibles
                                ? `${orden * 55}ms`
                                : "0ms",
                          }}
                          className={`
                            transition-all
                            duration-500
                            ease-[cubic-bezier(0.22,1,0.36,1)]
                            ${
                              elementosVisibles
                                ? "translate-x-0 opacity-100"
                                : "-translate-x-5 opacity-0"
                            }
                          `}
                        >
                          <NavLink
                            to={elemento.ruta}
                            end={
                              elemento.ruta ===
                              "/dashboard"
                            }
                            title={
                              contraida
                                ? elemento.nombre
                                : undefined
                            }
                            onClick={alCerrarMovil}
                            className={({
                              isActive,
                            }) =>
                              [
                                "group relative flex min-h-11 items-center gap-3 overflow-hidden",
                                "rounded-xl px-3 py-2",
                                "text-sm font-semibold",
                                "outline-none transition-all duration-200",
                                "focus-visible:ring-2 focus-visible:ring-roma-400",
                                "focus-visible:ring-offset-2 focus-visible:ring-offset-[#030718]",
                                contraida
                                  ? "lg:justify-center lg:px-2"
                                  : "",
                                isActive
                                  ? "bg-linear-to-r from-roma-600 to-roma-700 text-white shadow-[0_14px_30px_-20px_rgba(225,29,72,0.95)]"
                                  : "text-slate-300 hover:bg-white/5.5 hover:text-white",
                              ].join(" ")
                            }
                          >
                            {({
                              isActive,
                            }) => (
                              <>
                                {/* Indicador activo sobrio */}
                                <span
                                  aria-hidden="true"
                                  className={`
                                    absolute left-0
                                    top-1/2 h-6
                                    w-0.75
                                    -translate-y-1/2
                                    rounded-r-full
                                    bg-white
                                    transition-opacity
                                    duration-200
                                    ${
                                      isActive
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }
                                  `}
                                />

                                <span
                                  className={`
                                    flex h-8 w-8
                                    shrink-0 items-center
                                    justify-center
                                    rounded-lg
                                    transition-colors
                                    ${
                                      isActive
                                        ? "bg-white/15 text-white"
                                        : "bg-white/[0.035] text-slate-400 group-hover:bg-white/8 group-hover:text-white"
                                    }
                                  `}
                                >
                                  <Icono
                                    size={18}
                                    strokeWidth={
                                      isActive
                                        ? 2.3
                                        : 2
                                    }
                                    aria-hidden="true"
                                  />
                                </span>

                                <span
                                  className={`
                                    min-w-0 flex-1
                                    truncate
                                    ${
                                      contraida
                                        ? "lg:hidden"
                                        : ""
                                    }
                                  `}
                                >
                                  {elemento.nombre}
                                </span>
                              </>
                            )}
                          </NavLink>
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
            ),
          )}
        </nav>

        {/* Pie discreto */}
        <div
          className="
            shrink-0 border-t
            border-white/8
            px-3 py-3
          "
        >
          <div
            className={`
              rounded-xl
              border border-white/7
              bg-white/3
              px-3 py-2.5
              ${
                contraida
                  ? "lg:px-1 lg:text-center"
                  : ""
              }
            `}
          >
            <p
              className={`
                text-[9px]
                font-semibold uppercase
                tracking-[0.2em]
                text-slate-500
                ${
                  contraida
                    ? "lg:hidden"
                    : ""
                }
              `}
            >
              Sistema interno
            </p>

            <p
              className={`
                mt-1 text-[10px]
                text-slate-400
                ${
                  contraida
                    ? "lg:hidden"
                    : ""
                }
              `}
            >
              Roma Fast Food · 2026
            </p>

            <p
              className={`
                hidden text-[8px]
                font-semibold
                text-slate-500
                ${
                  contraida
                    ? "lg:block"
                    : ""
                }
              `}
            >
              v0.1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default BarraLateral;
