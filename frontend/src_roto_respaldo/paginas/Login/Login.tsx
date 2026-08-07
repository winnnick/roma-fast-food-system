import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Package,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import CampoFormulario from "../../shared/ui/CampoFormulario";

import { useAuth } from "../../contextos/AuthContext";
import { autenticarUsuario } from "../../servicios/authServicio";

interface ErroresFormulario {
  username?: string;
  password?: string;
}

interface EstadoNavegacion {
  desde?: string;
}

type FaseAcceso =
  | "formulario"
  | "separando"
  | "cargando"
  | "bienvenida";

const DURACION_SEPARACION_MS = 850;
const DURACION_CARGA_MS = 2300;
const DURACION_BIENVENIDA_MS = 1800;

function esperar(
  milisegundos: number,
): Promise<void> {
  return new Promise((resolver) => {
    window.setTimeout(
      resolver,
      milisegundos,
    );
  });
}

function Login() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(false);

  const [
    faseAcceso,
    setFaseAcceso,
  ] =
    useState<FaseAcceso>(
      "formulario",
    );

  const [
    progresoCarga,
    setProgresoCarga,
  ] = useState(0);

  const [
    nombreUsuarioAcceso,
    setNombreUsuarioAcceso,
  ] = useState("");

  const [errores, setErrores] =
    useState<ErroresFormulario>({});

  const [
    errorGeneral,
    setErrorGeneral,
  ] = useState<string | null>(
    null,
  );

  const { iniciarSesion } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const estadoNavegacion =
    location.state as EstadoNavegacion | null;

  const animandoAcceso =
    faseAcceso !== "formulario";

  const mostrarPantallaCentral =
    faseAcceso === "cargando" ||
    faseAcceso === "bienvenida";

  const cargaCompleta =
    faseAcceso === "bienvenida";

  const interfazBloqueada =
    cargando || animandoAcceso;

  function validarFormulario(): boolean {
    const nuevosErrores: ErroresFormulario =
      {};

    if (!username.trim()) {
      nuevosErrores.username =
        "Ingrese su nombre de usuario.";
    }

    if (!password) {
      nuevosErrores.password =
        "Ingrese su contraseña.";
    } else if (
      password.length < 6
    ) {
      nuevosErrores.password =
        "La contraseña debe contener al menos 6 caracteres.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(
        nuevosErrores,
      ).length === 0
    );
  }

  function obtenerEstadoCarga(): string {
    if (progresoCarga < 25) {
      return "Validando perfil de usuario";
    }

    if (progresoCarga < 55) {
      return "Cargando permisos asignados";
    }

    if (progresoCarga < 85) {
      return "Preparando módulos operativos";
    }

    if (progresoCarga < 100) {
      return "Finalizando configuración";
    }

    return "Entorno preparado";
  }

  async function animarBarraCarga(): Promise<void> {
    setProgresoCarga(0);

    const momentoInicial =
      performance.now();

    await new Promise<void>(
      (resolver) => {
        function actualizarProgreso(
          momentoActual: number,
        ) {
          const tiempoTranscurrido =
            momentoActual -
            momentoInicial;

          const porcentaje =
            Math.min(
              100,
              Math.round(
                (tiempoTranscurrido /
                  DURACION_CARGA_MS) *
                  100,
              ),
            );

          setProgresoCarga(
            porcentaje,
          );

          if (porcentaje < 100) {
            window.requestAnimationFrame(
              actualizarProgreso,
            );

            return;
          }

          resolver();
        }

        window.requestAnimationFrame(
          actualizarProgreso,
        );
      },
    );
  }

  async function ingresar(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (interfazBloqueada) {
      return;
    }

    setErrorGeneral(null);
    setProgresoCarga(0);
    setNombreUsuarioAcceso("");
    setFaseAcceso("formulario");

    if (!validarFormulario()) {
      return;
    }

    try {
      setCargando(true);

      const sesion =
        await autenticarUsuario({
          username:
            username.trim(),
          password,
        });

      setNombreUsuarioAcceso(
        sesion.usuario
          .nombreCompleto,
      );

      /*
       * Primera etapa:
       * los dos paneles se separan.
       */
      setFaseAcceso(
        "separando",
      );

      await esperar(
        DURACION_SEPARACION_MS,
      );

      /*
       * Segunda etapa:
       * aparece la pantalla central.
       */
      setFaseAcceso(
        "cargando",
      );

      await esperar(120);

      /*
       * Tercera etapa:
       * la barra avanza de 0 a 100.
       */
      await animarBarraCarga();

      /*
       * Cuarta etapa:
       * se muestra el nombre completo.
       */
      setFaseAcceso(
        "bienvenida",
      );

      await esperar(
        DURACION_BIENVENIDA_MS,
      );

      iniciarSesion(sesion);

      sessionStorage.setItem(
        "roma_animar_sidebar",
        "1",
      );

      navigate(
        estadoNavegacion?.desde ||
          "/dashboard",
        {
          replace: true,
        },
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión.";

      setErrorGeneral(mensaje);
      setCargando(false);
      setFaseAcceso(
        "formulario",
      );
      setProgresoCarga(0);
      setNombreUsuarioAcceso("");
    }
  }

  return (
    <main
      className={`
        login-root
        relative min-h-dvh
        overflow-x-hidden
        bg-slate-950
        lg:h-dvh
        lg:overflow-hidden
        ${
          animandoAcceso
            ? "login-opening"
            : ""
        }
      `}
    >
      {/*
        Estas reglas garantizan que
        los dos paneles salgan realmente
        en direcciones opuestas.
      */}
      <style>
        {`
          .login-panel-left,
          .login-panel-right {
            will-change: transform, opacity;
            transition:
              transform 1100ms cubic-bezier(0.22, 1, 0.36, 1),
              opacity 700ms ease;
          }

          .login-root.login-opening
          .login-panel-left {
            transform: translate3d(-115%, 0, 0);
            opacity: 0;
          }

          .login-root.login-opening
          .login-panel-right {
            transform: translate3d(115%, 0, 0);
            opacity: 0;
          }

          .login-central-panel {
            will-change: transform, opacity;
            transition:
              transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
              opacity 550ms ease;
          }

          @media (max-width: 1023px) {
            .login-root.login-opening
            .login-panel-left {
              transform: translate3d(-115vw, 0, 0);
            }

            .login-root.login-opening
            .login-panel-right {
              transform: translate3d(115vw, 0, 0);
            }
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .login-panel-left,
            .login-panel-right,
            .login-central-panel {
              transition-duration: 1ms;
            }
          }
        `}
      </style>

      {/* Fondo principal */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(190,18,60,0.22),transparent_29%),radial-gradient(circle_at_center_right,rgba(30,41,59,0.42),transparent_36%),linear-gradient(135deg,#020617_0%,#020617_42%,#030b24_100%)]
        "
      />

      <div
        className="
          pointer-events-none
          absolute left-[48%]
          top-1/2
          h-144 w-xl
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-roma-900/10
          blur-3xl
        "
      />

      {/* Pantalla central */}
      <section
        aria-live="polite"
        aria-hidden={
          !mostrarPantallaCentral
        }
        className={`
          login-central-panel
          absolute inset-x-0
          bottom-10 top-0
          z-40 flex
          items-center
          justify-center
          px-5
          ${
            mostrarPantallaCentral
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0"
          }
        `}
      >
        <div
          className="
            w-full max-w-136
            rounded-4xl
            border border-white/15
            bg-white/10
            p-8 text-white
            shadow-2xl
            backdrop-blur-xl
            sm:p-10
          "
        >
          <div
            className={`
              mx-auto flex
              h-20 w-20
              items-center
              justify-center
              rounded-full
              transition-all
              duration-500
              ${
                cargaCompleta
                  ? "scale-110 bg-emerald-400/20 text-emerald-300"
                  : "bg-roma-400/15 text-roma-300"
              }
            `}
          >
            {cargaCompleta ? (
              <CheckCircle2
                size={40}
                className="
                  animate-pulse
                "
              />
            ) : (
              <LoaderCircle
                size={38}
                className="
                  animate-spin
                "
              />
            )}
          </div>

          <p
            className={`
              mt-6 text-center
              text-xs font-bold
              uppercase
              tracking-[0.24em]
              transition-colors
              duration-500
              ${
                cargaCompleta
                  ? "text-emerald-300"
                  : "text-roma-300"
              }
            `}
          >
            {cargaCompleta
              ? "Identidad confirmada"
              : "Acceso autorizado"}
          </p>

          <h1
            className="
              mt-3 text-center
              text-3xl font-black
              tracking-tight
              text-white
              transition-all
              duration-500
              sm:text-4xl
            "
          >
            {cargaCompleta
              ? `Bienvenido, ${nombreUsuarioAcceso}`
              : "Ingresando al sistema…"}
          </h1>

          <p
            className="
              mx-auto mt-3
              max-w-md
              text-center text-sm
              leading-relaxed
              text-slate-300
              transition-all
              duration-500
            "
          >
            {cargaCompleta
              ? "El entorno está listo. Ingresando al panel principal."
              : obtenerEstadoCarga()}
          </p>

          <div
            className="
              mt-8 rounded-2xl
              border border-white/10
              bg-slate-950/35
              p-4
            "
          >
            <div
              className="
                flex items-center
                justify-between
                gap-4
                text-xs font-semibold
                text-slate-300
              "
            >
              <span>
                {obtenerEstadoCarga()}
              </span>

              <span
                className="
                  min-w-11
                  text-right
                  font-black
                  text-white
                "
              >
                {progresoCarga}%
              </span>
            </div>

            <div
              className="
                mt-3 h-2.5
                overflow-hidden
                rounded-full
                bg-white/10
              "
            >
              <div
                className="
                  h-full rounded-full
                  bg-linear-to-r
                  from-roma-600
                  via-roma-400
                  to-emerald-400
                  shadow-[0_0_18px_rgba(251,113,133,0.35)]
                "
                style={{
                  width:
                    `${progresoCarga}%`,
                }}
              />
            </div>

            <div
              className="
                mt-4 grid
                grid-cols-3 gap-2
              "
            >
              <div
                className={`
                  rounded-xl border
                  p-2.5 text-center
                  transition-all
                  duration-300
                  ${
                    progresoCarga >= 25
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-500"
                  }
                `}
              >
                <p
                  className="
                    text-[10px]
                    font-bold uppercase
                    tracking-wide
                  "
                >
                  Perfil
                </p>
              </div>

              <div
                className={`
                  rounded-xl border
                  p-2.5 text-center
                  transition-all
                  duration-300
                  ${
                    progresoCarga >= 55
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-500"
                  }
                `}
              >
                <p
                  className="
                    text-[10px]
                    font-bold uppercase
                    tracking-wide
                  "
                >
                  Permisos
                </p>
              </div>

              <div
                className={`
                  rounded-xl border
                  p-2.5 text-center
                  transition-all
                  duration-300
                  ${
                    progresoCarga >= 100
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-500"
                  }
                `}
              >
                <p
                  className="
                    text-[10px]
                    font-bold uppercase
                    tracking-wide
                  "
                >
                  Módulos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Área principal */}
      <div
        className="
          relative z-20
          min-h-[calc(100dvh-2.5rem)]
          lg:h-[calc(100dvh-2.5rem)]
        "
      >
        {/* Panel izquierdo */}
        <section
          className="
            login-panel-left
            flex min-h-[42vh]
            items-center
            justify-center
            px-6 py-7
            text-white
            sm:px-8
            lg:absolute
            lg:inset-y-0
            lg:left-0
            lg:min-h-0
            lg:w-1/2
            lg:px-12
            lg:py-6
            xl:px-16
          "
        >
          <div
            className="
              mx-auto flex
              w-full max-w-2xl
              flex-col items-center
              text-center
            "
          >
            <div
              className="
                relative flex
                flex-col items-center
              "
            >
              <div
                className="
                  absolute
                  -inset-x-14
                  top-1/2
                  h-28
                  -translate-y-1/2
                  rounded-full
                  bg-roma-700/15
                  blur-3xl
                "
              />

              <p
                className="
                  relative
                  text-[clamp(4.8rem,9vw,8.8rem)]
                  font-black
                  leading-[0.74]
                  tracking-[-0.075em]
                  text-white
                  drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)]
                "
              >
                ROMA
              </p>

              <div
                className="
                  relative mt-4
                  flex items-center
                  gap-4
                "
              >
                <span
                  className="
                    h-px w-10
                    bg-roma-400/70
                    sm:w-16
                  "
                />

                <p
                  className="
                    text-lg font-black
                    tracking-[0.38em]
                    text-roma-300
                    sm:text-xl
                    xl:text-2xl
                  "
                >
                  FAST FOOD
                </p>

                <span
                  className="
                    h-px w-10
                    bg-roma-400/70
                    sm:w-16
                  "
                />
              </div>
            </div>

            <div
              className="
                mt-8 max-w-xl
                sm:mt-10
                lg:mt-8
              "
            >
              <p
                className="
                  text-xs font-bold
                  uppercase
                  tracking-[0.24em]
                  text-roma-300
                "
              >
                Plataforma interna
              </p>

              <h2
                className="
                  mt-3 text-2xl
                  font-black
                  leading-tight
                  tracking-tight
                  text-white
                  sm:text-3xl
                  xl:text-4xl
                "
              >
                Gestión operativa y
                financiera del restaurante
              </h2>

              <p
                className="
                  mx-auto mt-3
                  max-w-lg text-sm
                  leading-relaxed
                  text-slate-400
                "
              >
                Ventas, caja e inventario
                integrados en un mismo entorno.
              </p>
            </div>

            <div
              className="
                mt-7 grid w-full
                max-w-lg
                grid-cols-3 gap-3
                lg:mt-6
              "
            >
              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  px-3 py-4
                  backdrop-blur-sm
                  transition-colors
                  hover:bg-white/8
                "
              >
                <ShoppingCart
                  size={25}
                  className="
                    mx-auto
                    text-roma-300
                  "
                />

                <p
                  className="
                    mt-2.5
                    text-xs font-bold
                    text-white
                    sm:text-sm
                  "
                >
                  Ventas
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  px-3 py-4
                  backdrop-blur-sm
                  transition-colors
                  hover:bg-white/8
                "
              >
                <WalletCards
                  size={25}
                  className="
                    mx-auto
                    text-blue-300
                  "
                />

                <p
                  className="
                    mt-2.5
                    text-xs font-bold
                    text-white
                    sm:text-sm
                  "
                >
                  Caja
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  px-3 py-4
                  backdrop-blur-sm
                  transition-colors
                  hover:bg-white/8
                "
              >
                <Package
                  size={25}
                  className="
                    mx-auto
                    text-amber-300
                  "
                />

                <p
                  className="
                    mt-2.5
                    text-xs font-bold
                    text-white
                    sm:text-sm
                  "
                >
                  Inventario
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Panel derecho */}
        <section
          className="
            login-panel-right
            flex items-center
            justify-center
            px-5 py-7
            sm:px-8
            lg:absolute
            lg:inset-y-0
            lg:right-0
            lg:w-1/2
            lg:px-10
            lg:py-6
            xl:px-14
          "
        >
          <div
            className="
              w-full max-w-lg
              rounded-4xl
              border border-white/10
              bg-white/97
              p-6 shadow-2xl
              shadow-black/25
              backdrop-blur-xl
              sm:p-8 lg:p-9
            "
          >
            <div className="text-center">
              <p
                className="
                  text-xs font-bold
                  uppercase
                  tracking-[0.22em]
                  text-roma-700
                "
              >
                Identificación de usuario
              </p>

              <h1
                className="
                  mt-2.5 text-3xl
                  font-black
                  tracking-tight
                  text-slate-900
                  sm:text-4xl
                "
              >
                Iniciar sesión
              </h1>

              <p
                className="
                  mx-auto mt-2.5
                  max-w-sm text-sm
                  leading-relaxed
                  text-slate-500
                "
              >
                Acceda con las credenciales
                asignadas a su cuenta.
              </p>
            </div>

            {errorGeneral && (
              <div
                role="alert"
                className="
                  mt-5 rounded-2xl
                  border border-red-200
                  bg-red-50 p-4
                  text-sm text-red-700
                "
              >
                <div
                  className="
                    flex items-start
                    gap-3
                  "
                >
                  <ShieldCheck
                    size={18}
                    className="
                      mt-0.5
                      shrink-0
                    "
                  />

                  <div>
                    <p className="font-bold">
                      Acceso no autorizado
                    </p>

                    <p
                      className="
                        mt-1 text-xs
                        leading-relaxed
                      "
                    >
                      {errorGeneral}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={ingresar}
              noValidate
              autoComplete="off"
              className="
                mt-7 space-y-4
              "
            >
              <CampoFormulario
                id="username"
                label="Usuario"
                value={username}
                placeholder="Ingrese su usuario"
                icono={UserRound}
                autoComplete="off"
                disabled={
                  interfazBloqueada
                }
                error={
                  errores.username
                }
                onChange={(valor) => {
                  setUsername(valor);

                  if (
                    errores.username
                  ) {
                    setErrores(
                      (actuales) => ({
                        ...actuales,
                        username:
                          undefined,
                      }),
                    );
                  }
                }}
              />

              <CampoFormulario
                id="password"
                label="Contraseña"
                value={password}
                placeholder="Ingrese su contraseña"
                icono={LockKeyhole}
                type={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                disabled={
                  interfazBloqueada
                }
                error={
                  errores.password
                }
                onChange={(valor) => {
                  setPassword(valor);

                  if (
                    errores.password
                  ) {
                    setErrores(
                      (actuales) => ({
                        ...actuales,
                        password:
                          undefined,
                      }),
                    );
                  }
                }}
                botonFinal={
                  <button
                    type="button"
                    disabled={
                      interfazBloqueada
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    title={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onClick={() =>
                      setMostrarPassword(
                        (estado) =>
                          !estado,
                      )
                    }
                    className="
                      rounded-lg p-2
                      text-slate-400
                      transition-colors
                      hover:bg-slate-100
                      hover:text-slate-700
                      disabled:opacity-50
                    "
                  >
                    {mostrarPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={
                  interfazBloqueada
                }
                className="
                  flex h-12 w-full
                  items-center
                  justify-center gap-2
                  rounded-2xl
                  bg-roma-700 px-5
                  text-sm font-bold
                  text-white
                  shadow-lg
                  shadow-roma-900/20
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-roma-800
                  focus-visible:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-roma-200
                  disabled:translate-y-0
                  disabled:cursor-not-allowed
                  disabled:bg-roma-400
                  disabled:shadow-none
                "
              >
                {cargando ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="
                        animate-spin
                      "
                    />

                    Validando acceso…
                  </>
                ) : (
                  <>
                    <LogIn size={19} />

                    Ingresar al sistema
                  </>
                )}
              </button>
            </form>

            <p
              className="
                mt-5 text-center
                text-[11px]
                text-slate-400
              "
            >
              Uso exclusivo del personal
              autorizado.
            </p>
          </div>
        </section>
      </div>

      {/* Firma institucional */}
      <footer
        className={`
          absolute inset-x-0
          bottom-0 z-30
          h-10 border-t
          border-white/10
          bg-slate-950/50
          backdrop-blur-sm
          transition-opacity
          duration-500
          ${
            animandoAcceso
              ? "opacity-0"
              : "opacity-100"
          }
        `}
      >
        <div
          className="
            mx-auto grid h-full
            max-w-[110rem]
            grid-cols-3
            items-center
            divide-x
            divide-white/10
            px-3 text-center
            text-[9px]
            font-semibold uppercase
            tracking-[0.13em]
            text-slate-500
            sm:text-[10px]
          "
        >
          <span
            className="
              truncate px-2
            "
          >
            Erick Nick Torrez Arratia
          </span>

          <span
            className="
              truncate px-2
            "
          >
            Universidad Privada Domingo Savio
          </span>

          <span
            className="
              truncate px-2
            "
          >
            Tarija · Bolivia · 2026
          </span>
        </div>
      </footer>
    </main>
  );
}

export default Login;