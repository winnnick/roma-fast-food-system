import { X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { seccionesMenu } from "../navegacion/menu";

import { useAuth } from "../../contextos/AuthContext";

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

const seccionesVisibles =
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
    );

  return (
    <>
      {/* Fondo oscuro visible cuando el menú móvil está abierto */}
      <button
        type="button"
        aria-label="Cerrar menú lateral"
        onClick={alCerrarMovil}
        className={`
          fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm
          transition-opacity duration-300 lg:hidden
          ${
            abiertaMovil
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          bg-slate-950 text-white
          shadow-2xl
          transition-all duration-300 ease-in-out

          ${
            abiertaMovil
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0

          ${contraida ? "lg:w-20" : "lg:w-72"}
        `}
      >
        {/* Identidad visual */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-xl
                bg-linear-to-br from-roma-500 to-roma-800
                text-lg font-black text-white
                shadow-lg shadow-roma-950/40
              "
            >
              R
            </div>

            <div
              className={`
                min-w-0
                ${contraida ? "lg:hidden" : ""}
              `}
            >
              <h1 className="truncate text-base font-bold">
                Roma Fast Food
              </h1>

              <p className="truncate text-xs text-slate-400">
                Gestión interna
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={alCerrarMovil}
            aria-label="Cerrar menú"
            className="
              rounded-lg p-2 text-slate-400
              transition-colors
              hover:bg-white/10 hover:text-white
              lg:hidden
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav
          aria-label="Navegación principal"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <div className="space-y-6">
            {seccionesVisibles.map((seccion) => (
              <section key={seccion.titulo}>
                <p
                  className={`
                    mb-2 px-3 text-[11px] font-bold
                    uppercase tracking-[0.16em]
                    text-slate-500
                    ${contraida ? "lg:hidden" : ""}
                  `}
                >
                  {seccion.titulo}
                </p>

                <div className="space-y-1">
                  {seccion.elementos.map((elemento) => {
                    const Icono = elemento.icono;

                    return (
                      <NavLink
                        key={elemento.ruta}
                        to={elemento.ruta}
                        end={elemento.ruta === "/dashboard"}
                        title={
                          contraida
                            ? elemento.nombre
                            : undefined
                        }
                        onClick={alCerrarMovil}
                        className={({ isActive }) =>
                          [
                            "group relative flex min-h-11 items-center gap-3",
                            "rounded-xl px-3 py-2.5",
                            "text-sm font-medium",
                            "outline-none transition-all duration-200",
                            "focus-visible:ring-2 focus-visible:ring-roma-400",
                            contraida
                              ? "lg:justify-center lg:px-2"
                              : "",
                            isActive
                              ? "bg-roma-600 text-white shadow-lg shadow-roma-950/25"
                              : "text-slate-300 hover:bg-white/8 hover:text-white",
                          ].join(" ")
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icono
                              size={20}
                              strokeWidth={
                                isActive ? 2.4 : 2
                              }
                              className="shrink-0"
                              aria-hidden="true"
                            />

                            <span
                              className={`
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

                            {isActive && (
                              <span
                                className="
                                  absolute right-2 h-1.5 w-1.5
                                  rounded-full bg-white
                                "
                                aria-hidden="true"
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* Información inferior */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div
            className={`
              rounded-xl bg-white/5 p-3
              ${contraida ? "lg:hidden" : ""}
            `}
          >
            <p className="text-xs font-semibold text-slate-200">
              Sistema de gestión
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Versión de desarrollo 0.1.0
            </p>
          </div>

          {contraida && (
            <div className="hidden text-center text-xs font-bold text-slate-500 lg:block">
              v0.1
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default BarraLateral;