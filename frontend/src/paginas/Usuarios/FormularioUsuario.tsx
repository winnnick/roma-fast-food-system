import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Save,
  UserRound,
} from "lucide-react";

import {
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
  rol?: string;
  password?: string;
  confirmarPassword?: string;
}

const rolesDisponibles: RolUsuario[] = [
  "Administrador",
  "Cajero",
  "Inventario",
];

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

const [rol, setRol] =
  useState<RolUsuario>(
    () => usuario?.rol ?? "Cajero",
  );

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

    if (!rol) {
      nuevosErrores.rol =
        "Seleccione un rol.";
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

    if (editando) {
      const datos: ActualizarUsuarioDto = {
        nombreCompleto,
        username,
        rol,
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
      rol,
      password,
    });
  }

  return (
    <form
      onSubmit={enviarFormulario}
      noValidate
    >
      <div className="space-y-5 p-5 sm:p-6">
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

        <div>
          <label
            htmlFor="rol"
            className="
              mb-2 block text-sm
              font-semibold text-slate-700
            "
          >
            Rol asignado
          </label>

          <select
            id="rol"
            value={rol}
            disabled={cargando}
            onChange={(evento) => {
              setRol(
                evento.target
                  .value as RolUsuario,
              );

              setErrores((actuales) => ({
                ...actuales,
                rol: undefined,
              }));
            }}
            className={`
              h-12 w-full rounded-xl
              border bg-white px-4
              text-sm text-slate-900
              outline-none transition-all
              focus:border-roma-500
              focus:ring-4
              focus:ring-roma-100
              disabled:bg-slate-100
              ${
                errores.rol
                  ? "border-red-400"
                  : "border-slate-300"
              }
            `}
          >
            {rolesDisponibles.map(
              (rolDisponible) => (
                <option
                  key={rolDisponible}
                  value={rolDisponible}
                >
                  {rolDisponible}
                </option>
              ),
            )}
          </select>

          {errores.rol && (
            <p
              className="
                mt-2 text-xs
                font-medium text-red-600
              "
            >
              {errores.rol}
            </p>
          )}
        </div>

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
              : "Ingrese una contraseña"
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

      <div
        className="
          flex flex-col-reverse gap-3
          border-t border-slate-100
          bg-slate-50 px-5 py-4
          sm:flex-row sm:justify-end
          sm:px-6
        "
      >
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="
            rounded-xl border
            border-slate-300
            bg-white px-5 py-3
            text-sm font-bold
            text-slate-700
            transition-colors
            hover:bg-slate-100
            disabled:opacity-50
          "
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl bg-roma-700
            px-5 py-3
            text-sm font-bold
            text-white
            transition-colors
            hover:bg-roma-800
            disabled:cursor-not-allowed
            disabled:bg-roma-400
          "
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