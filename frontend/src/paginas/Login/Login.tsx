import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  UtensilsCrossed,
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

  const [errores, setErrores] =
    useState<ErroresFormulario>({});

  const [
    errorGeneral,
    setErrorGeneral,
  ] = useState<string | null>(null);

  const { iniciarSesion } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const estadoNavegacion =
    location.state as EstadoNavegacion | null;

  function validarFormulario(): boolean {
    const nuevosErrores: ErroresFormulario = {};

    if (!username.trim()) {
      nuevosErrores.username =
        "Ingrese su nombre de usuario.";
    }

    if (!password) {
      nuevosErrores.password =
        "Ingrese su contraseña.";
    } else if (password.length < 6) {
      nuevosErrores.password =
        "La contraseña debe contener al menos 6 caracteres.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores).length === 0
    );
  }

  async function ingresar(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    setErrorGeneral(null);

    if (!validarFormulario()) {
      return;
    }

    try {
      setCargando(true);

      const sesion =
        await autenticarUsuario({
          username,
          password,
        });

      iniciarSesion(sesion);

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
    } finally {
      setCargando(false);
    }
  }

  function completarDemo() {
    setUsername("admin");
    setPassword("Roma2026*");
    setErrores({});
    setErrorGeneral(null);
  }

  return (
    <main
      className="
        grid min-h-screen
        bg-slate-100
        lg:grid-cols-[1.08fr_0.92fr]
      "
    >
      {/* Panel institucional */}
      <section
        className="
          relative hidden overflow-hidden
          bg-slate-950 p-10
          text-white lg:flex
          lg:flex-col lg:justify-between
        "
      >
        <div
          className="
            absolute -left-32 -top-32
            h-96 w-96 rounded-full
            bg-roma-600/30 blur-3xl
          "
        />

        <div
          className="
            absolute -bottom-40 -right-24
            h-107.5 w--107.5
            rounded-full
            bg-blue-600/15 blur-3xl
          "
        />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div
              className="
                flex h-14 w-14
                items-center justify-center
                rounded-2xl
                bg-linear-to-br
                from-roma-500 to-roma-800
                text-2xl font-black
                shadow-xl shadow-roma-950/40
              "
            >
              R
            </div>

            <div>
              <h1 className="text-xl font-black">
                Roma Fast Food
              </h1>

              <p className="text-sm text-slate-400">
                Sistema interno de gestión
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <p
            className="
              text-sm font-bold uppercase
              tracking-[0.18em]
              text-roma-300
            "
          >
            Control operativo centralizado
          </p>

          <h2
            className="
              mt-4 text-4xl font-black
              leading-tight tracking-tight
              xl:text-5xl
            "
          >
            Toda la operación del restaurante
            en un solo lugar.
          </h2>

          <p
            className="
              mt-5 max-w-lg
              leading-relaxed text-slate-300
            "
          >
            Administra pedidos, ventas, caja,
            inventario y usuarios mediante una
            plataforma diseñada para mejorar la
            precisión y agilidad de las operaciones.
          </p>

          <div
            className="
              mt-8 grid max-w-lg
              grid-cols-3 gap-3
            "
          >
            <div
              className="
                rounded-2xl border
                border-white/10
                bg-white/5 p-4
                backdrop-blur-sm
              "
            >
              <ShoppingCart
                size={22}
                className="text-roma-300"
              />

              <p className="mt-3 text-sm font-bold">
                Pedidos
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registro ágil
              </p>
            </div>

            <div
              className="
                rounded-2xl border
                border-white/10
                bg-white/5 p-4
                backdrop-blur-sm
              "
            >
              <WalletCards
                size={22}
                className="text-blue-300"
              />

              <p className="mt-3 text-sm font-bold">
                Caja
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Control diario
              </p>
            </div>

            <div
              className="
                rounded-2xl border
                border-white/10
                bg-white/5 p-4
                backdrop-blur-sm
              "
            >
              <UtensilsCrossed
                size={22}
                className="text-amber-300"
              />

              <p className="mt-3 text-sm font-bold">
                Inventario
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Insumos y stock
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            relative z-10 flex
            items-center gap-2
            text-xs text-slate-500
          "
        >
          <ShieldCheck
            size={15}
            className="text-emerald-400"
          />

          Acceso exclusivo para personal autorizado
        </div>
      </section>

      {/* Formulario */}
      <section
        className="
          flex min-h-screen
          items-center justify-center
          px-5 py-10
          sm:px-8 lg:px-12
        "
      >
        <div className="w-full max-w-md">
          {/* Marca visible en móvil */}
          <div
            className="
              mb-9 flex items-center
              gap-3 lg:hidden
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-xl
                bg-linear-to-br
                from-roma-500 to-roma-800
                font-black text-white
              "
            >
              R
            </div>

            <div>
              <p className="font-black text-slate-900">
                Roma Fast Food
              </p>

              <p className="text-xs text-slate-500">
                Sistema interno de gestión
              </p>
            </div>
          </div>

          <div>
            <p
              className="
                text-sm font-bold
                text-roma-700
              "
            >
              Bienvenido nuevamente
            </p>

            <h1
              className="
                mt-2 text-3xl font-black
                tracking-tight text-slate-900
                sm:text-4xl
              "
            >
              Iniciar sesión
            </h1>

            <p
              className="
                mt-3 text-sm
                leading-relaxed text-slate-500
              "
            >
              Ingrese sus credenciales para acceder
              a las funciones asignadas a su cuenta.
            </p>
          </div>

          {errorGeneral && (
            <div
              role="alert"
              className="
                mt-6 flex items-start gap-3
                rounded-xl border
                border-red-200 bg-red-50
                p-4 text-sm text-red-700
              "
            >
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-bold">
                  No se pudo iniciar sesión
                </p>

                <p className="mt-1 text-xs leading-relaxed">
                  {errorGeneral}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={ingresar}
            noValidate
            className="mt-7 space-y-5"
          >
            <CampoFormulario
              id="username"
              label="Usuario"
              value={username}
              placeholder="Ingrese su usuario"
              icono={UserRound}
              autoComplete="username"
              disabled={cargando}
              error={errores.username}
              onChange={(valor) => {
                setUsername(valor);

                if (errores.username) {
                  setErrores((actuales) => ({
                    ...actuales,
                    username: undefined,
                  }));
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
              autoComplete="current-password"
              disabled={cargando}
              error={errores.password}
              onChange={(valor) => {
                setPassword(valor);

                if (errores.password) {
                  setErrores((actuales) => ({
                    ...actuales,
                    password: undefined,
                  }));
                }
              }}
              botonFinal={
                <button
                  type="button"
                  disabled={cargando}
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
                      (estado) => !estado,
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
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              disabled={cargando}
              className="
                flex h-12 w-full
                items-center justify-center
                gap-2 rounded-xl
                bg-roma-700
                px-5 text-sm font-bold
                text-white
                shadow-lg shadow-roma-900/20
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
                    className="animate-spin"
                  />

                  Verificando credenciales…
                </>
              ) : (
                <>
                  <LogIn size={19} />

                  Ingresar al sistema
                </>
              )}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div
              className="
                mt-6 rounded-2xl
                border border-slate-200
                bg-white p-4 shadow-sm
              "
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={19}
                  className="
                    mt-0.5 shrink-0
                    text-emerald-600
                  "
                />

                <div className="flex-1">
                  <p
                    className="
                      text-sm font-bold
                      text-slate-800
                    "
                  >
                    Acceso de demostración
                  </p>

                  <p
                    className="
                      mt-1 text-xs
                      text-slate-500
                    "
                  >
                    Usuario: admin · Contraseña:
                    Roma2026*
                  </p>

                  <button
                    type="button"
                    onClick={completarDemo}
                    disabled={cargando}
                    className="
                      mt-3 text-xs font-bold
                      text-roma-700
                      hover:text-roma-800
                      disabled:opacity-50
                    "
                  >
                    Completar credenciales
                  </button>
                </div>
              </div>
            </div>
          )}

          <p
            className="
              mt-7 text-center
              text-xs text-slate-400
            "
          >
            Acceso restringido al personal autorizado
            de Roma Fast Food.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;