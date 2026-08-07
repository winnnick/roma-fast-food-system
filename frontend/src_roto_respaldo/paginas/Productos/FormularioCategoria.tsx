import {
  LoaderCircle,
  Save,
  X,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  CategoriaProducto,
  CrearCategoriaDto,
} from "../../tipos/producto";

interface FormularioCategoriaProps {
  categoria: CategoriaProducto | null;
  cargando: boolean;
  alGuardar: (
    datos: CrearCategoriaDto,
  ) => Promise<void>;
  alCancelar: () => void;
}

interface ErroresCategoria {
  nombre?: string;
  descripcion?: string;
}

function FormularioCategoria({
  categoria,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioCategoriaProps) {
  const [nombre, setNombre] =
    useState(
      categoria?.nombre ?? "",
    );

  const [descripcion, setDescripcion] =
    useState(
      categoria?.descripcion ?? "",
    );

  const [errores, setErrores] =
    useState<ErroresCategoria>({});

  function validar(): boolean {
    const nuevosErrores:
      ErroresCategoria = {};

    const nombreLimpio =
      nombre.trim();

    const descripcionLimpia =
      descripcion.trim();

    if (nombreLimpio.length < 3) {
      nuevosErrores.nombre =
        "El nombre debe contener al menos 3 caracteres.";
    }

    if (nombreLimpio.length > 60) {
      nuevosErrores.nombre =
        "El nombre no puede superar los 60 caracteres.";
    }

    if (
      descripcionLimpia.length < 5
    ) {
      nuevosErrores.descripcion =
        "La descripción debe contener al menos 5 caracteres.";
    }

    if (
      descripcionLimpia.length > 180
    ) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 180 caracteres.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores)
        .length === 0
    );
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (!validar()) {
      return;
    }

    await alGuardar({
      nombre: nombre.trim(),
      descripcion:
        descripcion.trim(),
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div className="grid gap-4 p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="nombre-categoria"
              className="text-sm font-black text-slate-700 dark:text-slate-200"
            >
              Nombre
            </label>

            <span className="text-xs text-slate-400 dark:text-slate-500">
              {nombre.length}/60
            </span>
          </div>

          <input
            id="nombre-categoria"
            type="text"
            value={nombre}
            maxLength={60}
            disabled={cargando}
            autoFocus
            placeholder="Ej.: Hamburguesas"
            onChange={(evento) => {
              setNombre(
                evento.target.value,
              );

              if (errores.nombre) {
                setErrores(
                  (actuales) => ({
                    ...actuales,
                    nombre: undefined,
                  }),
                );
              }
            }}
            className={`
              mt-2 w-full rounded-xl
              border bg-white px-4 py-3
              text-sm text-slate-900
              outline-none transition
              placeholder:text-slate-400
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:bg-slate-950
              dark:text-slate-100
              dark:placeholder:text-slate-600
              ${
                errores.nombre
                  ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                  : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
              }
            `}
          />

          {errores.nombre && (
            <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
              {errores.nombre}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="descripcion-categoria"
              className="text-sm font-black text-slate-700 dark:text-slate-200"
            >
              Descripción
            </label>

            <span className="text-xs text-slate-400 dark:text-slate-500">
              {descripcion.length}/180
            </span>
          </div>

          <textarea
            id="descripcion-categoria"
            value={descripcion}
            rows={3}
            maxLength={180}
            disabled={cargando}
            placeholder="Describe brevemente los productos que reúne."
            onChange={(evento) => {
              setDescripcion(
                evento.target.value,
              );

              if (
                errores.descripcion
              ) {
                setErrores(
                  (actuales) => ({
                    ...actuales,
                    descripcion:
                      undefined,
                  }),
                );
              }
            }}
            className={`
              mt-2 w-full resize-none
              rounded-xl border bg-white
              px-4 py-3 text-sm
              leading-relaxed text-slate-900
              outline-none transition
              placeholder:text-slate-400
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:bg-slate-950
              dark:text-slate-100
              dark:placeholder:text-slate-600
              ${
                errores.descripcion
                  ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                  : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
              }
            `}
          />

          {errores.descripcion && (
            <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
              {errores.descripcion}
            </p>
          )}
        </div>
      </div>

      <div
        className="
          sticky bottom-0 z-20
          flex flex-col-reverse gap-3
          border-t border-slate-200
          bg-slate-50/95 px-5 py-4 shadow-[0_-10px_24px_-18px_rgba(15,23,42,.55)] backdrop-blur
          sm:flex-row sm:justify-end
          dark:border-slate-800
          dark:bg-slate-950/95
        "
      >
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="
            inline-flex min-w-32
            items-center justify-center
            gap-2 rounded-xl border
            border-slate-300 bg-white
            px-5 py-2.5 text-sm
            font-bold text-slate-700
            transition-colors
            hover:bg-slate-100
            disabled:opacity-50
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-200
            dark:hover:bg-slate-800
          "
        >
          <X size={17} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="
            inline-flex min-w-40
            items-center justify-center
            gap-2 rounded-xl
            bg-red-600 px-5 py-2.5
            text-sm font-black
            text-white shadow-sm
            transition-colors
            hover:bg-red-700
            disabled:cursor-not-allowed
            disabled:opacity-60
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

          {categoria
            ? "Guardar cambios"
            : "Crear categoría"}
        </button>
      </div>
    </form>
  );
}

export default FormularioCategoria;
