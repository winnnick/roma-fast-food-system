import {
  Boxes,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import CampoFormulario from "../../shared/ui/CampoFormulario";

import type {
  RolUsuario,
} from "../../tipos/auth";

import type {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  Usuario,
} from "../../tipos/usuario";

interface FormularioUsuarioProps {
  usuario: Usuario | null;
  cargando: boolean;
  alGuardar: (
    datos:
      | CrearUsuarioDto
      | ActualizarUsuarioDto,
  ) => Promise<void>;
  alCancelar: () => void;
}

interface ErroresFormulario {
  nombreCompleto?: string;
  username?: string;
  roles?: string;
  password?: string;
  confirmarPassword?: string;
}

function IconoCajaRegistradora({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 3h6v6H5V3Zm9 1h5v4h-5V4ZM4 9h15a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 1-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6 12h3M6 15h3M12 12h1M16 12h1M12 15h1M16 15h1M2.5 19h19v2h-19v-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ConfiguracionRol {
  rol: RolUsuario;
  titulo: string;
  descripcion: string;
  icono:
    | LucideIcon
    | typeof IconoCajaRegistradora;
  clasesSeleccionado: string;
  clasesIcono: string;
}

const configuracionesRoles: ConfiguracionRol[] = [
  {
    rol: "Administrador",
    titulo: "Administrador",
    descripcion: "Control completo del sistema.",
    icono: ShieldCheck,
    clasesSeleccionado:
      "border-roma-500 bg-roma-50 ring-2 ring-roma-100 dark:border-roma-600 dark:bg-roma-950/35 dark:ring-roma-950/60",
    clasesIcono:
      "bg-roma-100 text-roma-700 dark:bg-roma-950/60 dark:text-roma-300",
  },
  {
    rol: "Cajero",
    titulo: "Cajero",
    descripcion: "Ventas, cobros y caja.",
    icono: IconoCajaRegistradora,
    clasesSeleccionado:
      "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-600 dark:bg-blue-950/35 dark:ring-blue-950/60",
    clasesIcono:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
  {
    rol: "Inventario",
    titulo: "Inventario",
    descripcion: "Stock, recetas y conteos.",
    icono: Boxes,
    clasesSeleccionado:
      "border-amber-500 bg-amber-50 ring-2 ring-amber-100 dark:border-amber-600 dark:bg-amber-950/35 dark:ring-amber-950/60",
    clasesIcono:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
];

function ordenarRoles(
  roles: RolUsuario[],
): RolUsuario[] {
  const orden: RolUsuario[] = [
    "Administrador",
    "Cajero",
    "Inventario",
  ];

  return orden.filter((rol) =>
    roles.includes(rol),
  );
}

function obtenerRolPrincipal(
  roles: RolUsuario[],
): RolUsuario {
  if (roles.includes("Administrador")) {
    return "Administrador";
  }

  if (roles.includes("Cajero")) {
    return "Cajero";
  }

  return "Inventario";
}

function FormularioUsuario({
  usuario,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioUsuarioProps) {
  const [nombreCompleto, setNombreCompleto] =
    useState(
      () => usuario?.nombreCompleto ?? "",
    );

  const [username, setUsername] =
    useState(
      () => usuario?.username ?? "",
    );

  const [roles, setRoles] =
    useState<RolUsuario[]>(() => {
      if (
        usuario?.roles &&
        usuario.roles.length > 0
      ) {
        return ordenarRoles(usuario.roles);
      }

      return [usuario?.rol ?? "Cajero"];
    });

  const [password, setPassword] =
    useState("");

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [errores, setErrores] =
    useState<ErroresFormulario>({});

  const editando = Boolean(usuario);

  const esAdministrador =
    roles.includes("Administrador");

  const esMultirrol =
    !esAdministrador && roles.length > 1;

  const resumenRoles = useMemo(() => {
    if (roles.length === 0) {
      return "Seleccione al menos un rol operativo.";
    }

    if (esAdministrador) {
      return "Administrador incluye todos los permisos y se mantiene como rol exclusivo.";
    }

    if (esMultirrol) {
      return `Permisos combinados: ${roles.join(" + ")}.`;
    }

    return `Rol asignado: ${roles[0]}.`;
  }, [
    roles,
    esAdministrador,
    esMultirrol,
  ]);

  function alternarRol(
    rol: RolUsuario,
  ) {
    if (cargando) {
      return;
    }

    setRoles((actuales) => {
      if (rol === "Administrador") {
        return actuales.includes(
          "Administrador",
        )
          ? []
          : ["Administrador"];
      }

      const sinAdministrador =
        actuales.filter(
          (actual) =>
            actual !== "Administrador",
        );

      if (sinAdministrador.includes(rol)) {
        return sinAdministrador.filter(
          (actual) => actual !== rol,
        );
      }

      return ordenarRoles([
        ...sinAdministrador,
        rol,
      ]);
    });

    setErrores((actuales) => ({
      ...actuales,
      roles: undefined,
    }));
  }

  function validar(): boolean {
    const nuevosErrores: ErroresFormulario = {};

    if (
      nombreCompleto.trim().length < 3
    ) {
      nuevosErrores.nombreCompleto =
        "Ingrese el nombre completo del usuario.";
    }

    if (username.trim().length < 3) {
      nuevosErrores.username =
        "El usuario debe contener al menos 3 caracteres.";
    } else if (
      !/^[a-zA-Z0-9._-]+$/.test(
        username.trim(),
      )
    ) {
      nuevosErrores.username =
        "Utilice únicamente letras, números, puntos, guiones o guion bajo.";
    }

    if (roles.length === 0) {
      nuevosErrores.roles =
        "Seleccione al menos un rol para la cuenta.";
    }

    if (!editando && !password) {
      nuevosErrores.password =
        "Ingrese una contraseña.";
    }

    if (
      password &&
      password.length < 8
    ) {
      nuevosErrores.password =
        "La contraseña debe contener al menos 8 caracteres.";
    }

    if (
      password &&
      password !== confirmarPassword
    ) {
      nuevosErrores.confirmarPassword =
        "Las contraseñas no coinciden.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores).length === 0
    );
  }

  async function enviarFormulario(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (!validar()) {
      return;
    }

    const rolesOrdenados =
      ordenarRoles(roles);

    const rolPrincipal =
      obtenerRolPrincipal(rolesOrdenados);

    if (editando) {
      const datos: ActualizarUsuarioDto = {
        nombreCompleto,
        username,
        rol: rolPrincipal,
        roles: rolesOrdenados,
      };

      if (password) {
        datos.password = password;
      }

      await alGuardar(datos);
      return;
    }

    await alGuardar({
      nombreCompleto,
      username,
      rol: rolPrincipal,
      roles: rolesOrdenados,
      password,
    });
  }

  return (
    <form
      onSubmit={enviarFormulario}
      noValidate
      className="flex min-h-0 flex-col"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <section>
          <div className="grid gap-4 lg:grid-cols-2">
            <CampoFormulario
              id="nombreCompleto"
              label="Nombre completo"
              value={nombreCompleto}
              placeholder="Ejemplo: María Fernández"
              icono={UserRound}
              disabled={cargando}
              error={errores.nombreCompleto}
              onChange={(valor) => {
                setNombreCompleto(valor);
                setErrores((actuales) => ({
                  ...actuales,
                  nombreCompleto: undefined,
                }));
              }}
            />

            <CampoFormulario
              id="username"
              label="Nombre de usuario"
              value={username}
              placeholder="Ejemplo: maria.fernandez"
              icono={UserRound}
              autoComplete="username"
              disabled={cargando}
              error={errores.username}
              onChange={(valor) => {
                setUsername(valor);
                setErrores((actuales) => ({
                  ...actuales,
                  username: undefined,
                }));
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/35">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <UsersRound size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Roles operativos
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Un empleado puede combinar Cajero e Inventario. Administrador ya incluye acceso completo.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {configuracionesRoles.map(
              (configuracion) => {
                const seleccionado =
                  roles.includes(
                    configuracion.rol,
                  );
                const Icono =
                  configuracion.icono;

                return (
                  <button
                    key={configuracion.rol}
                    type="button"
                    disabled={cargando}
                    aria-pressed={seleccionado}
                    onClick={() =>
                      alternarRol(
                        configuracion.rol,
                      )
                    }
                    className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roma-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                      seleccionado
                        ? configuracion.clasesSeleccionado
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${configuracion.clasesIcono}`}
                    >
                      <Icono size={19} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-black text-slate-900 dark:text-white">
                        {configuracion.titulo}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        {configuracion.descripcion}
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div
            className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
              errores.roles
                ? "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300"
                : esMultirrol
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-950/35 dark:text-violet-300"
                  : "bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            {errores.roles ?? resumenRoles}
          </div>
        </section>

        <section>
          <div className="grid gap-4 lg:grid-cols-2">
            <CampoFormulario
              id="passwordUsuario"
              label={
                editando
                  ? "Nueva contraseña (opcional)"
                  : "Contraseña"
              }
              value={password}
              placeholder={
                editando
                  ? "Dejar vacío para conservarla"
                  : "Mínimo 8 caracteres"
              }
              icono={LockKeyhole}
              type={
                mostrarPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              disabled={cargando}
              error={errores.password}
              onChange={(valor) => {
                setPassword(valor);
                setErrores((actuales) => ({
                  ...actuales,
                  password: undefined,
                }));
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
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {mostrarPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              }
            />

            {(password || !editando) && (
              <CampoFormulario
                id="confirmarPassword"
                label="Confirmar contraseña"
                value={confirmarPassword}
                placeholder="Repita la contraseña"
                icono={LockKeyhole}
                type={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                disabled={cargando}
                error={
                  errores.confirmarPassword
                }
                onChange={(valor) => {
                  setConfirmarPassword(valor);
                  setErrores((actuales) => ({
                    ...actuales,
                    confirmarPassword:
                      undefined,
                  }));
                }}
              />
            )}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-950/90">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-roma-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-roma-800 disabled:cursor-not-allowed disabled:bg-roma-400"
        >
          {cargando ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          {editando
            ? "Guardar cambios"
            : "Registrar usuario"}
        </button>
      </div>
    </form>
  );
}

export default FormularioUsuario;
