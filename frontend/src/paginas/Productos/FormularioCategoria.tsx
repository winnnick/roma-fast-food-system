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

interface ErroresFormularioCategoria {
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
    useState(categoria?.nombre ?? "");

  const [descripcion, setDescripcion] =
    useState(
      categoria?.descripcion ?? "",
    );

  const [errores, setErrores] =
    useState<ErroresFormularioCategoria>(
      {},
    );

  function validarFormulario(): boolean {
    const nuevosErrores:
      ErroresFormularioCategoria = {};

    const nombreLimpio =
      nombre.trim();

    const descripcionLimpia =
      descripcion.trim();

    if (!nombreLimpio) {
      nuevosErrores.nombre =
        "El nombre es obligatorio.";
    } else if (
      nombreLimpio.length < 3
    ) {
      nuevosErrores.nombre =
        "El nombre debe contener al menos 3 caracteres.";
    } else if (
      nombreLimpio.length > 60
    ) {
      nuevosErrores.nombre =
        "El nombre no puede superar los 60 caracteres.";
    }

    if (!descripcionLimpia) {
      nuevosErrores.descripcion =
        "La descripción es obligatoria.";
    } else if (
      descripcionLimpia.length < 5
    ) {
      nuevosErrores.descripcion =
        "La descripción debe contener al menos 5 caracteres.";
    } else if (
      descripcionLimpia.length > 250
    ) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 250 caracteres.";
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

    if (!validarFormulario()) {
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
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <label
            htmlFor="nombre-categoria"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Nombre de la categoría
          </label>

          <input
            id="nombre-categoria"
            type="text"
            value={nombre}
            disabled={cargando}
            maxLength={60}
            autoComplete="off"
            placeholder="Ej.: Hamburguesas"
            onChange={(evento) => {
              setNombre(
                evento.target.value,
              );

              if (errores.nombre) {
                setErrores(
                  (erroresActuales) => ({
                    ...erroresActuales,
                    nombre: undefined,
                  }),
                );
              }
            }}
            className={`
              mt-2 w-full rounded-xl
              border bg-white
              px-4 py-3
              text-sm text-slate-900
              outline-none
              transition
              placeholder:text-slate-400
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              ${
                errores.nombre
                  ? `
                    border-red-400
                    ring-4 ring-red-100
                  `
                  : `
                    border-slate-300
                    focus:border-red-600
                    focus:ring-4
                    focus:ring-red-100
                  `
              }
            `}
          />

          <div
            className="
              mt-1 flex items-start
              justify-between gap-3
            "
          >
            <div>
              {errores.nombre && (
                <p
                  className="
                    text-xs font-semibold
                    text-red-600
                  "
                >
                  {errores.nombre}
                </p>
              )}
            </div>

            <span
              className="
                shrink-0 text-xs
                text-slate-400
              "
            >
              {nombre.length}/60
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="descripcion-categoria"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Descripción
          </label>

          <textarea
            id="descripcion-categoria"
            value={descripcion}
            disabled={cargando}
            maxLength={250}
            rows={5}
            placeholder="Describe los productos que pertenecerán a esta categoría."
            onChange={(evento) => {
              setDescripcion(
                evento.target.value,
              );

              if (
                errores.descripcion
              ) {
                setErrores(
                  (erroresActuales) => ({
                    ...erroresActuales,
                    descripcion:
                      undefined,
                  }),
                );
              }
            }}
            className={`
              mt-2 w-full resize-none
              rounded-xl border
              bg-white px-4 py-3
              text-sm leading-relaxed
              text-slate-900
              outline-none transition
              placeholder:text-slate-400
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              ${
                errores.descripcion
                  ? `
                    border-red-400
                    ring-4 ring-red-100
                  `
                  : `
                    border-slate-300
                    focus:border-red-600
                    focus:ring-4
                    focus:ring-red-100
                  `
              }
            `}
          />

          <div
            className="
              mt-1 flex items-start
              justify-between gap-3
            "
          >
            <div>
              {errores.descripcion && (
                <p
                  className="
                    text-xs font-semibold
                    text-red-600
                  "
                >
                  {
                    errores.descripcion
                  }
                </p>
              )}
            </div>

            <span
              className="
                shrink-0 text-xs
                text-slate-400
              "
            >
              {descripcion.length}/250
            </span>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border border-blue-200
            bg-blue-50 p-4
          "
        >
          <p
            className="
              text-sm font-bold
              text-blue-800
            "
          >
            Organización del menú
          </p>

          <p
            className="
              mt-1 text-xs
              leading-relaxed
              text-blue-700
            "
          >
            Las categorías permiten
            agrupar los productos y
            facilitan su localización
            durante el registro de un
            pedido.
          </p>
        </div>
      </div>

      <div
        className="
          flex flex-col-reverse gap-3
          border-t border-slate-100
          bg-slate-50 px-5 py-4
          sm:flex-row
          sm:justify-end sm:px-6
        "
      >
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl
            border border-slate-300
            bg-white px-5 py-3
            text-sm font-bold
            text-slate-700
            transition-colors
            hover:bg-slate-100
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl
            bg-red-700 px-5 py-3
            text-sm font-bold
            text-white
            transition-colors
            hover:bg-red-800
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
            : "Registrar categoría"}
        </button>
      </div>
    </form>
  );
}

export default FormularioCategoria;