import {
  BadgeDollarSign,
  Image,
  LoaderCircle,
  PackageCheck,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  CategoriaProducto,
  CrearProductoDto,
  ProductoMenu,
} from "../../tipos/producto";

interface FormularioProductoProps {
  producto: ProductoMenu | null;
  categorias: CategoriaProducto[];
  cargando: boolean;
  alGuardar: (
    datos: CrearProductoDto,
  ) => Promise<void>;
  alCancelar: () => void;
}

interface EstadoFormularioProducto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  precio: string;
  disponible: boolean;
  destacado: boolean;
  imagenUrl: string;
}

interface ErroresFormularioProducto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  categoriaId?: string;
  precio?: string;
  imagenUrl?: string;
}

function obtenerEstadoInicial(
  producto: ProductoMenu | null,
): EstadoFormularioProducto {
  return {
    codigo: producto?.codigo ?? "",
    nombre: producto?.nombre ?? "",
    descripcion:
      producto?.descripcion ?? "",
    categoriaId:
      producto?.categoriaId.toString() ??
      "",
    precio:
      producto?.precio.toString() ?? "",
    disponible:
      producto?.disponible ?? true,
    destacado:
      producto?.destacado ?? false,
    imagenUrl:
      producto?.imagenUrl ?? "",
  };
}

function esUrlValida(
  valor: string,
): boolean {
  if (!valor.trim()) {
    return true;
  }

  try {
    const url = new URL(valor);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function FormularioProducto({
  producto,
  categorias,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioProductoProps) {
  const [formulario, setFormulario] =
    useState<EstadoFormularioProducto>(
      () =>
        obtenerEstadoInicial(producto),
    );

  const [errores, setErrores] =
    useState<ErroresFormularioProducto>(
      {},
    );

  const productoInactivo =
    producto?.estado === "Inactivo";

  const categoriasDisponibles =
    useMemo(() => {
      return categorias.filter(
        (categoria) =>
          categoria.estado === "Activo" ||
          categoria.id ===
            producto?.categoriaId,
      );
    }, [
      categorias,
      producto?.categoriaId,
    ]);

  function actualizarCampo<
    Campo extends keyof EstadoFormularioProducto,
  >(
    campo: Campo,
    valor:
      EstadoFormularioProducto[Campo],
  ) {
    setFormulario(
      (formularioActual) => ({
        ...formularioActual,
        [campo]: valor,
      }),
    );

    if (
      campo in errores &&
      errores[
        campo as keyof ErroresFormularioProducto
      ]
    ) {
      setErrores(
        (erroresActuales) => ({
          ...erroresActuales,
          [campo]: undefined,
        }),
      );
    }
  }

  function validarFormulario(): boolean {
    const nuevosErrores:
      ErroresFormularioProducto = {};

    const codigo =
      formulario.codigo
        .trim()
        .toUpperCase();

    const nombre =
      formulario.nombre.trim();

    const descripcion =
      formulario.descripcion.trim();

    const precio =
      Number(formulario.precio);

    if (!codigo) {
      nuevosErrores.codigo =
        "El código es obligatorio.";
    } else if (
      codigo.length < 3 ||
      codigo.length > 20
    ) {
      nuevosErrores.codigo =
        "El código debe contener entre 3 y 20 caracteres.";
    } else if (
      !/^[A-Z0-9-]+$/.test(codigo)
    ) {
      nuevosErrores.codigo =
        "Utilice solamente letras, números y guiones.";
    }

    if (!nombre) {
      nuevosErrores.nombre =
        "El nombre es obligatorio.";
    } else if (nombre.length < 3) {
      nuevosErrores.nombre =
        "El nombre debe contener al menos 3 caracteres.";
    } else if (nombre.length > 100) {
      nuevosErrores.nombre =
        "El nombre no puede superar los 100 caracteres.";
    }

    if (!descripcion) {
      nuevosErrores.descripcion =
        "La descripción es obligatoria.";
    } else if (
      descripcion.length < 5
    ) {
      nuevosErrores.descripcion =
        "La descripción debe contener al menos 5 caracteres.";
    } else if (
      descripcion.length > 300
    ) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 300 caracteres.";
    }

    if (!formulario.categoriaId) {
      nuevosErrores.categoriaId =
        "Seleccione una categoría.";
    }

    if (!formulario.precio.trim()) {
      nuevosErrores.precio =
        "El precio es obligatorio.";
    } else if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      nuevosErrores.precio =
        "El precio debe ser mayor que cero.";
    } else if (precio > 100000) {
      nuevosErrores.precio =
        "El precio supera el límite permitido.";
    }

    if (
      !esUrlValida(
        formulario.imagenUrl,
      )
    ) {
      nuevosErrores.imagenUrl =
        "Ingrese una dirección web válida.";
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
      codigo:
        formulario.codigo
          .trim()
          .toUpperCase(),
      nombre:
        formulario.nombre.trim(),
      descripcion:
        formulario.descripcion.trim(),
      categoriaId: Number(
        formulario.categoriaId,
      ),
      precio: Number(
        formulario.precio,
      ),
      disponible:
        productoInactivo
          ? false
          : formulario.disponible,
      destacado:
        productoInactivo
          ? false
          : formulario.destacado,
      imagenUrl:
        formulario.imagenUrl.trim() ||
        null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div
        className="
          grid gap-6 p-5
          sm:p-6 lg:grid-cols-2
        "
      >
        <div className="space-y-5">
          <div
            className="
              grid gap-4
              sm:grid-cols-2
            "
          >
            <div>
              <label
                htmlFor="codigo-producto"
                className="
                  text-sm font-bold
                  text-slate-700
                "
              >
                Código interno
              </label>

              <input
                id="codigo-producto"
                type="text"
                value={formulario.codigo}
                disabled={cargando}
                maxLength={20}
                autoComplete="off"
                placeholder="Ej.: HAMB-001"
                onChange={(evento) =>
                  actualizarCampo(
                    "codigo",
                    evento.target.value
                      .toUpperCase(),
                  )
                }
                className={`
                  mt-2 w-full
                  rounded-xl border
                  bg-white px-4 py-3
                  text-sm font-semibold
                  uppercase text-slate-900
                  outline-none transition
                  placeholder:font-normal
                  placeholder:normal-case
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                  ${
                    errores.codigo
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

              {errores.codigo && (
                <p
                  className="
                    mt-1 text-xs
                    font-semibold
                    text-red-600
                  "
                >
                  {errores.codigo}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="precio-producto"
                className="
                  text-sm font-bold
                  text-slate-700
                "
              >
                Precio de venta
              </label>

              <div className="relative mt-2">
                <BadgeDollarSign
                  size={19}
                  className="
                    pointer-events-none
                    absolute left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  id="precio-producto"
                  type="number"
                  value={formulario.precio}
                  disabled={cargando}
                  min="0.01"
                  max="100000"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(evento) =>
                    actualizarCampo(
                      "precio",
                      evento.target.value,
                    )
                  }
                  className={`
                    w-full rounded-xl
                    border bg-white
                    py-3 pl-11 pr-14
                    text-sm font-bold
                    text-slate-900
                    outline-none transition
                    placeholder:text-slate-400
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                    ${
                      errores.precio
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

                <span
                  className="
                    pointer-events-none
                    absolute right-4
                    top-1/2
                    -translate-y-1/2
                    text-xs font-bold
                    text-slate-500
                  "
                >
                  Bs
                </span>
              </div>

              {errores.precio && (
                <p
                  className="
                    mt-1 text-xs
                    font-semibold
                    text-red-600
                  "
                >
                  {errores.precio}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="nombre-producto"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Nombre del producto
            </label>

            <input
              id="nombre-producto"
              type="text"
              value={formulario.nombre}
              disabled={cargando}
              maxLength={100}
              autoComplete="off"
              placeholder="Ej.: Hamburguesa clásica"
              onChange={(evento) =>
                actualizarCampo(
                  "nombre",
                  evento.target.value,
                )
              }
              className={`
                mt-2 w-full
                rounded-xl border
                bg-white px-4 py-3
                text-sm text-slate-900
                outline-none transition
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
                {formulario.nombre.length}
                /100
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="categoria-producto"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Categoría
            </label>

            <select
              id="categoria-producto"
              value={
                formulario.categoriaId
              }
              disabled={cargando}
              onChange={(evento) =>
                actualizarCampo(
                  "categoriaId",
                  evento.target.value,
                )
              }
              className={`
                mt-2 w-full
                rounded-xl border
                bg-white px-4 py-3
                text-sm font-semibold
                text-slate-700
                outline-none transition
                disabled:cursor-not-allowed
                disabled:bg-slate-100
                ${
                  errores.categoriaId
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
            >
              <option value="">
                Seleccione una categoría
              </option>

              {categoriasDisponibles.map(
                (categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nombre}
                    {categoria.estado ===
                    "Inactivo"
                      ? " — Inactiva"
                      : ""}
                  </option>
                ),
              )}
            </select>

            {errores.categoriaId && (
              <p
                className="
                  mt-1 text-xs
                  font-semibold
                  text-red-600
                "
              >
                {errores.categoriaId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="descripcion-producto"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Descripción
            </label>

            <textarea
              id="descripcion-producto"
              value={
                formulario.descripcion
              }
              disabled={cargando}
              maxLength={300}
              rows={5}
              placeholder="Describe los ingredientes o características principales del producto."
              onChange={(evento) =>
                actualizarCampo(
                  "descripcion",
                  evento.target.value,
                )
              }
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
                {
                  formulario.descripcion
                    .length
                }
                /300
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="imagen-producto"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Imagen mediante URL
              <span
                className="
                  ml-2 font-normal
                  text-slate-400
                "
              >
                Opcional
              </span>
            </label>

            <div className="relative mt-2">
              <Image
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-3.5
                  text-slate-400
                "
              />

              <input
                id="imagen-producto"
                type="url"
                value={
                  formulario.imagenUrl
                }
                disabled={cargando}
                placeholder="https://ejemplo.com/producto.jpg"
                onChange={(evento) =>
                  actualizarCampo(
                    "imagenUrl",
                    evento.target.value,
                  )
                }
                className={`
                  w-full rounded-xl
                  border bg-white
                  py-3 pl-11 pr-4
                  text-sm text-slate-900
                  outline-none transition
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                  ${
                    errores.imagenUrl
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
            </div>

            {errores.imagenUrl && (
              <p
                className="
                  mt-1 text-xs
                  font-semibold
                  text-red-600
                "
              >
                {errores.imagenUrl}
              </p>
            )}
          </div>

          <div
            className="
              flex min-h-52
              items-center justify-center
              overflow-hidden
              rounded-2xl
              border border-dashed
              border-slate-300
              bg-slate-50
            "
          >
            {formulario.imagenUrl.trim() &&
            esUrlValida(
              formulario.imagenUrl,
            ) ? (
              <img
                src={
                  formulario.imagenUrl
                }
                alt="Vista previa del producto"
                className="
                  h-52 w-full
                  object-cover
                "
                onError={(evento) => {
                  evento.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div
                className="
                  px-6 py-10
                  text-center
                "
              >
                <Image
                  size={36}
                  className="
                    mx-auto text-slate-300
                  "
                />

                <p
                  className="
                    mt-3 text-sm
                    font-bold
                    text-slate-600
                  "
                >
                  Vista previa
                </p>

                <p
                  className="
                    mt-1 text-xs
                    leading-relaxed
                    text-slate-400
                  "
                >
                  La carga real de archivos
                  se implementará cuando se
                  conecte el backend.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label
              className={`
                flex items-start gap-4
                rounded-2xl border
                p-4 transition-colors
                ${
                  productoInactivo
                    ? `
                      cursor-not-allowed
                      border-slate-200
                      bg-slate-100
                      opacity-60
                    `
                    : `
                      cursor-pointer
                      border-emerald-200
                      bg-emerald-50
                      hover:bg-emerald-100
                    `
                }
              `}
            >
              <input
                type="checkbox"
                checked={
                  formulario.disponible
                }
                disabled={
                  cargando ||
                  productoInactivo
                }
                onChange={(evento) =>
                  actualizarCampo(
                    "disponible",
                    evento.target.checked,
                  )
                }
                className="
                  mt-1 h-4 w-4
                  accent-emerald-600
                "
              />

              <PackageCheck
                size={22}
                className="
                  shrink-0 text-emerald-700
                "
              />

              <span>
                <span
                  className="
                    block text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  Disponible para pedidos
                </span>

                <span
                  className="
                    mt-1 block text-xs
                    leading-relaxed
                    text-slate-500
                  "
                >
                  Permite seleccionar el
                  producto durante el
                  registro de pedidos.
                </span>
              </span>
            </label>

            <label
              className={`
                flex items-start gap-4
                rounded-2xl border
                p-4 transition-colors
                ${
                  productoInactivo
                    ? `
                      cursor-not-allowed
                      border-slate-200
                      bg-slate-100
                      opacity-60
                    `
                    : `
                      cursor-pointer
                      border-amber-200
                      bg-amber-50
                      hover:bg-amber-100
                    `
                }
              `}
            >
              <input
                type="checkbox"
                checked={
                  formulario.destacado
                }
                disabled={
                  cargando ||
                  productoInactivo
                }
                onChange={(evento) =>
                  actualizarCampo(
                    "destacado",
                    evento.target.checked,
                  )
                }
                className="
                  mt-1 h-4 w-4
                  accent-amber-500
                "
              />

              <Sparkles
                size={22}
                className="
                  shrink-0 text-amber-700
                "
              />

              <span>
                <span
                  className="
                    block text-sm
                    font-bold
                    text-slate-800
                  "
                >
                  Producto destacado
                </span>

                <span
                  className="
                    mt-1 block text-xs
                    leading-relaxed
                    text-slate-500
                  "
                >
                  Aparecerá de forma
                  prioritaria en futuras
                  pantallas de pedidos.
                </span>
              </span>
            </label>
          </div>

          {productoInactivo && (
            <div
              className="
                rounded-2xl
                border border-amber-200
                bg-amber-50 p-4
              "
            >
              <p
                className="
                  text-sm font-bold
                  text-amber-800
                "
              >
                Producto inactivo
              </p>

              <p
                className="
                  mt-1 text-xs
                  leading-relaxed
                  text-amber-700
                "
              >
                Puede modificar sus datos,
                pero la disponibilidad y
                el indicador destacado
                permanecerán desactivados
                hasta que el producto sea
                reactivado.
              </p>
            </div>
          )}
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
          disabled={
            cargando ||
            categoriasDisponibles.length ===
              0
          }
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

          {producto
            ? "Guardar cambios"
            : "Registrar producto"}
        </button>
      </div>
    </form>
  );
}

export default FormularioProducto;