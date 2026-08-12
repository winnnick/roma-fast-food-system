import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock3,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  CajaAbiertaAlCerrarSesionError,
  useAuth,
} from "../../contextos/AuthContext";

import Modal from "../ui/Modal";

interface BarraSuperiorProps {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  contraida: boolean;
  temaOscuro: boolean;
  alAlternarTema: () => void;
  alAlternarBarra: () => void;
  alAbrirMenuMovil: () => void;
}

function formatearDuracion(
  fechaInicio: string | undefined,
  ahora: number,
): string {
  if (!fechaInicio) {
    return "00:00:00";
  }

  const inicio = new Date(fechaInicio).getTime();

  if (Number.isNaN(inicio)) {
    return "00:00:00";
  }

  const segundosTotales = Math.max(
    0,
    Math.floor((ahora - inicio) / 1000),
  );

  const horas = Math.floor(
    segundosTotales / 3600,
  );

  const minutos = Math.floor(
    (segundosTotales % 3600) / 60,
  );

  const segundos =
    segundosTotales % 60;

  return [horas, minutos, segundos]
    .map((valor) =>
      String(valor).padStart(2, "0"),
    )
    .join(":");
}

function BarraSuperior({
  titulo,
  descripcion,
  icono: IconoPagina,
  contraida,
  temaOscuro,
  alAlternarTema,
  alAlternarBarra,
  alAbrirMenuMovil,
}: BarraSuperiorProps) {
  const [
    menuUsuarioAbierto,
    setMenuUsuarioAbierto,
  ] = useState(false);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);

  const [
    errorCerrarSesion,
    setErrorCerrarSesion,
  ] = useState<string | null>(null);

  const [
    cajaAbiertaAlSalirId,
    setCajaAbiertaAlSalirId,
  ] = useState<number | null>(null);

  const [ahora, setAhora] =
    useState(() => Date.now());

  const contenedorMenuRef =
    useRef<HTMLDivElement>(null);

  const {
    usuario,
    sesion,
    cerrarSesion,
  } = useAuth();

  const navigate = useNavigate();

  const nombreUsuario =
    usuario?.nombreCompleto ||
    usuario?.username ||
    "Usuario";

  const fechaFormateada =
    new Intl.DateTimeFormat(
      "es-BO",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    ).format(new Date());

  const duracionSesion =
    formatearDuracion(
      sesion?.fechaInicio,
      ahora,
    );

  const puedeIrACaja =
    usuario?.permisos.includes(
      "CAJA_VER",
    ) ?? false;

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        setAhora(Date.now());
      }, 1000);

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, []);

  useEffect(() => {
    function cerrarAlHacerClickFuera(
      evento: MouseEvent,
    ) {
      const elemento =
        evento.target as Node;

      if (
        contenedorMenuRef.current &&
        !contenedorMenuRef.current.contains(
          elemento,
        )
      ) {
        setMenuUsuarioAbierto(false);
      }
    }

    function cerrarConEscape(
      evento: KeyboardEvent,
    ) {
      if (evento.key === "Escape") {
        setMenuUsuarioAbierto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      cerrarAlHacerClickFuera,
    );

    document.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarAlHacerClickFuera,
      );

      document.removeEventListener(
        "keydown",
        cerrarConEscape,
      );
    };
  }, []);

  function completarSalida() {
    setCajaAbiertaAlSalirId(null);
    setMenuUsuarioAbierto(false);

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }

  async function salir() {
    try {
      setCerrandoSesion(true);
      setErrorCerrarSesion(null);

      await cerrarSesion();
      completarSalida();
    } catch (error: unknown) {
      if (
        error instanceof
        CajaAbiertaAlCerrarSesionError
      ) {
        setCajaAbiertaAlSalirId(
          error.cajaId,
        );
        return;
      }

      setErrorCerrarSesion(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la sesión.",
      );
    } finally {
      setCerrandoSesion(false);
    }
  }

  async function confirmarSalidaConCajaAbierta() {
    try {
      setCerrandoSesion(true);
      setErrorCerrarSesion(null);

      await cerrarSesion({
        permitirCajaAbierta: true,
      });

      completarSalida();
    } catch (error: unknown) {
      setCajaAbiertaAlSalirId(null);
      setErrorCerrarSesion(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la sesión.",
      );
    } finally {
      setCerrandoSesion(false);
    }
  }

  function irACerrarCaja() {
    setCajaAbiertaAlSalirId(null);
    setMenuUsuarioAbierto(false);
    navigate("/caja");
  }

  return (
    <>
    <header
      className={`
        relative z-30 shrink-0 border-b
        backdrop-blur-xl
        ${
          temaOscuro
            ? "border-slate-800 bg-slate-950/95"
            : "border-slate-200/80 bg-white/95"
        }
      `}
    >
      <div
        className="
          mx-auto flex h-19
          max-w-[1800px]
          items-center
          justify-between
          gap-4 px-4
          sm:px-6 lg:px-8
        "
      >
        <div
          className="
            flex min-w-0
            items-center gap-3
          "
        >
          {/* Menú móvil */}
          <button
            type="button"
            onClick={alAbrirMenuMovil}
            aria-label="Abrir menú lateral"
            className={`
              inline-flex h-10 w-10
              shrink-0 items-center
              justify-center
              rounded-xl border
              shadow-sm
              transition-colors
              lg:hidden
              ${
                temaOscuro
                  ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }
            `}
          >
            <Menu size={19} />
          </button>

          {/* Contraer/expandir en escritorio */}
          <button
            type="button"
            onClick={alAlternarBarra}
            aria-label={
              contraida
                ? "Expandir barra lateral"
                : "Contraer barra lateral"
            }
            title={
              contraida
                ? "Expandir barra lateral"
                : "Contraer barra lateral"
            }
            className={`
              hidden h-10 w-10
              shrink-0 items-center
              justify-center
              rounded-xl border
              shadow-sm
              transition-colors
              lg:inline-flex
              ${
                temaOscuro
                  ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }
            `}
          >
            {contraida ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>

          {/* Identificación de la pantalla */}
          <div
            className="
              flex min-w-0
              items-center gap-3
            "
          >
            <div
              className={`
                flex h-10 w-10
                shrink-0 items-center
                justify-center
                rounded-xl
                ${
                  temaOscuro
                    ? "bg-roma-500/15 text-roma-300"
                    : "bg-roma-50 text-roma-700"
                }
              `}
            >
              <IconoPagina
                size={20}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h1
                className={`
                  truncate text-base
                  font-black
                  sm:text-lg
                  ${
                    temaOscuro
                      ? "text-white"
                      : "text-slate-900"
                  }
                `}
              >
                {titulo}
              </h1>

              <p
                className={`
                  hidden truncate
                  text-xs
                  sm:block
                  ${
                    temaOscuro
                      ? "text-slate-400"
                      : "text-slate-500"
                  }
                `}
              >
                {descripcion}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            flex shrink-0
            items-center gap-2
          "
        >
          {/* Fecha */}
          <div
            className={`
              hidden items-center
              gap-2 rounded-xl
              border px-3 py-2
              text-xs font-semibold
              xl:flex
              ${
                temaOscuro
                  ? "border-slate-800 bg-slate-900/70 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }
            `}
          >
            <CalendarDays
              size={15}
              className="text-roma-500"
            />

            <span className="capitalize">
              {fechaFormateada}
            </span>
          </div>

          {/* Duración de sesión */}
          <div
            className={`
              hidden items-center
              gap-2 rounded-xl
              border px-3 py-2
              text-xs font-semibold
              lg:flex
              ${
                temaOscuro
                  ? "border-slate-800 bg-slate-900/70 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }
            `}
            title="Tiempo transcurrido desde el inicio de sesión"
          >
            <Clock3
              size={15}
              className="text-emerald-500"
            />

            {duracionSesion}
          </div>

          {/* Usuario */}
          <div
            ref={contenedorMenuRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setErrorCerrarSesion(null);
                setMenuUsuarioAbierto(
                  (estadoActual) =>
                    !estadoActual,
                );
              }}
              aria-haspopup="menu"
              aria-expanded={
                menuUsuarioAbierto
              }
              className={`
                flex items-center
                gap-2 rounded-xl
                border px-1.5 py-1.5
                transition-colors
                ${
                  temaOscuro
                    ? "border-slate-800 bg-slate-900/70 hover:bg-slate-800"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                }
              `}
            >
              <div
                className={`
                  relative flex h-9 w-9
                  items-center
                  justify-center
                  rounded-xl
                  ${
                    temaOscuro
                      ? "bg-slate-800 text-roma-300"
                      : "bg-roma-50 text-roma-700"
                  }
                `}
              >
                <UserRound
                  size={19}
                  strokeWidth={2.2}
                />

                <span
                  className="
                    absolute -bottom-0.5
                    -right-0.5 h-3 w-3
                    rounded-full
                    border-2 border-white
                    bg-emerald-500
                  "
                />
              </div>

              <div
                className="
                  hidden max-w-48
                  text-left md:block
                "
              >
                <p
                  className={`
                    truncate text-sm
                    font-bold
                    ${
                      temaOscuro
                        ? "text-white"
                        : "text-slate-900"
                    }
                  `}
                >
                  {nombreUsuario}
                </p>

                <p
                  className={`
                    truncate text-[11px]
                    ${
                      temaOscuro
                        ? "text-slate-400"
                        : "text-slate-500"
                    }
                  `}
                >
                  {usuario?.roles?.join(" · ") ||
                    usuario?.rol ||
                    "Sin rol"}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`
                  hidden
                  transition-transform
                  duration-200
                  md:block
                  ${
                    temaOscuro
                      ? "text-slate-500"
                      : "text-slate-400"
                  }
                  ${
                    menuUsuarioAbierto
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {menuUsuarioAbierto && (
              <div
                role="menu"
                className={`
                  absolute right-0
                  top-full mt-2
                  w-[20rem]
                  overflow-hidden
                  rounded-2xl border
                  shadow-flotante
                  ${
                    temaOscuro
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                <div
                  className={`
                    border-b p-4
                    ${
                      temaOscuro
                        ? "border-slate-800"
                        : "border-slate-100"
                    }
                  `}
                >
                  <div
                    className="
                      flex items-center
                      gap-3
                    "
                  >
                    <div
                      className={`
                        relative flex
                        h-11 w-11
                        items-center
                        justify-center
                        rounded-xl
                        ${
                          temaOscuro
                            ? "bg-slate-800 text-roma-300"
                            : "bg-roma-50 text-roma-700"
                        }
                      `}
                    >
                      <UserRound
                        size={21}
                      />

                      <ShieldCheck
                        size={13}
                        className="
                          absolute -bottom-1
                          -right-1
                          rounded-full
                          bg-emerald-500
                          p-0.5 text-white
                        "
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`
                          truncate
                          font-bold
                          ${
                            temaOscuro
                              ? "text-white"
                              : "text-slate-900"
                          }
                        `}
                      >
                        {nombreUsuario}
                      </p>

                      <p
                        className={`
                          truncate text-sm
                          ${
                            temaOscuro
                              ? "text-slate-400"
                              : "text-slate-500"
                          }
                        `}
                      >
                        {usuario?.roles?.join(" · ") ||
                          usuario?.rol ||
                          "Sin rol asignado"}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`
                    space-y-1 border-b
                    p-2
                    ${
                      temaOscuro
                        ? "border-slate-800"
                        : "border-slate-100"
                    }
                  `}
                >
                  <div
                    className={`
                      flex items-center
                      justify-between
                      rounded-xl px-3
                      py-2.5
                      ${
                        temaOscuro
                          ? "bg-slate-800/70"
                          : "bg-slate-50"
                      }
                    `}
                  >
                    <div
                      className="
                        flex items-center
                        gap-3
                      "
                    >
                      <Clock3
                        size={17}
                        className="text-emerald-500"
                      />

                      <div>
                        <p
                          className={`
                            text-sm font-semibold
                            ${
                              temaOscuro
                                ? "text-slate-200"
                                : "text-slate-700"
                            }
                          `}
                        >
                          Tiempo de sesión
                        </p>

                        <p
                          className={`
                            text-xs
                            ${
                              temaOscuro
                                ? "text-slate-500"
                                : "text-slate-400"
                            }
                          `}
                        >
                          Sesión activa
                        </p>
                      </div>
                    </div>

                    <span
                      className={`
                        font-mono text-xs
                        font-bold
                        ${
                          temaOscuro
                            ? "text-slate-200"
                            : "text-slate-700"
                        }
                      `}
                    >
                      {duracionSesion}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      temaOscuro
                    }
                    onClick={
                      alAlternarTema
                    }
                    className={`
                      flex w-full
                      items-center
                      justify-between
                      rounded-xl px-3
                      py-2.5
                      text-left
                      transition-colors
                      ${
                        temaOscuro
                          ? "hover:bg-slate-800"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >
                    <div
                      className="
                        flex items-center
                        gap-3
                      "
                    >
                      {temaOscuro ? (
                        <Moon
                          size={17}
                          className="text-violet-400"
                        />
                      ) : (
                        <Sun
                          size={17}
                          className="text-amber-500"
                        />
                      )}

                      <div>
                        <p
                          className={`
                            text-sm font-semibold
                            ${
                              temaOscuro
                                ? "text-slate-200"
                                : "text-slate-700"
                            }
                          `}
                        >
                          Modo oscuro
                        </p>

                        <p
                          className={`
                            text-xs
                            ${
                              temaOscuro
                                ? "text-slate-500"
                                : "text-slate-400"
                            }
                          `}
                        >
                          Cambiar apariencia
                        </p>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`
                        relative h-6 w-11
                        rounded-full
                        transition-colors
                        ${
                          temaOscuro
                            ? "bg-roma-600"
                            : "bg-slate-300"
                        }
                      `}
                    >
                      <span
                        className={`
                          absolute top-1
                          h-4 w-4
                          rounded-full
                          bg-white shadow
                          transition-transform
                          ${
                            temaOscuro
                              ? "translate-x-6"
                              : "translate-x-1"
                          }
                        `}
                      />
                    </span>
                  </button>
                </div>

                <div className="space-y-2 p-2">
                  {errorCerrarSesion && (
                    <div
                      role="alert"
                      className={`
                        flex items-start gap-2
                        rounded-xl border p-3
                        text-xs font-semibold
                        leading-relaxed
                        ${
                          temaOscuro
                            ? "border-red-500/30 bg-red-500/10 text-red-200"
                            : "border-red-200 bg-red-50 text-red-700"
                        }
                      `}
                    >
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 shrink-0"
                      />
                      <span>
                        {errorCerrarSesion}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    disabled={cerrandoSesion}
                    onClick={() =>
                      void salir()
                    }
                    className={`
                      flex w-full
                      items-center gap-3
                      rounded-xl px-3
                      py-2.5 text-left
                      text-sm font-semibold
                      text-red-600
                      transition-colors
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      ${
                        temaOscuro
                          ? "hover:bg-red-500/10"
                          : "hover:bg-red-50"
                      }
                    `}
                  >
                    {cerrandoSesion ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <LogOut size={17} />
                    )}
                    {cerrandoSesion
                      ? "Verificando caja..."
                      : "Cerrar sesión"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      <Modal
        abierto={
          cajaAbiertaAlSalirId !== null
        }
        titulo="Hay una caja abierta"
        descripcion="Puedes cerrar sesión sin cerrar la caja, pero el turno seguirá pendiente de cierre."
        alCerrar={() =>
          setCajaAbiertaAlSalirId(null)
        }
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <AlertTriangle size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                La caja N.º {cajaAbiertaAlSalirId} seguirá abierta y asociada a tu usuario.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Sus movimientos no se considerarán cerrados ni conciliados hasta que realices el cierre de caja. Al volver a iniciar sesión, podrás continuar con esa misma caja.
              </p>
            </div>
          </div>

          <div
            className={`mt-6 grid gap-3 ${
              puedeIrACaja
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            <button
              type="button"
              disabled={cerrandoSesion}
              onClick={() =>
                setCajaAbiertaAlSalirId(null)
              }
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-center text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Seguir conectado
            </button>

            {puedeIrACaja && (
              <button
                type="button"
                disabled={cerrandoSesion}
                onClick={irACerrarCaja}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-center text-sm font-black text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
              >
                Ir a Caja
              </button>
            )}

            <button
              type="button"
              disabled={cerrandoSesion}
              onClick={() =>
                void confirmarSalidaConCajaAbierta()
              }
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-center text-sm font-black text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cerrandoSesion ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={17} />
              )}
              Cerrar sesión de todos modos
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default BarraSuperior;
