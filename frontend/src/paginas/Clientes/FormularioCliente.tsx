import {
  Building2,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  Cliente,
  CrearClienteDto,
  TipoDocumentoCliente,
} from "../../tipos/cliente";

interface FormularioClienteProps {
  cliente: Cliente | null;
  cargando: boolean;
  alGuardar: (
    datos: CrearClienteDto,
  ) => Promise<void>;
  alCancelar: () => void;
}

interface EstadoFormularioCliente {
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  correo: string;
  direccion: string;
  observaciones: string;
}

interface ErroresFormularioCliente {
  nombreCompleto?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  observaciones?: string;
}

function obtenerEstadoInicial(
  cliente: Cliente | null,
): EstadoFormularioCliente {
  return {
    nombreCompleto:
      cliente?.nombreCompleto ?? "",
    tipoDocumento:
      cliente?.tipoDocumento ?? "",
    numeroDocumento:
      cliente?.numeroDocumento ?? "",
    telefono:
      cliente?.telefono ?? "",
    correo:
      cliente?.correo ?? "",
    direccion:
      cliente?.direccion ?? "",
    observaciones:
      cliente?.observaciones ?? "",
  };
}

function esCorreoValido(
  correo: string,
): boolean {
  if (!correo.trim()) {
    return true;
  }

  const expresionCorreo =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return expresionCorreo.test(
    correo.trim(),
  );
}

function esTelefonoValido(
  telefono: string,
): boolean {
  if (!telefono.trim()) {
    return true;
  }

  return /^[0-9+\-\s()]+$/.test(
    telefono.trim(),
  );
}

function esDocumentoValido(
  documento: string,
): boolean {
  if (!documento.trim()) {
    return true;
  }

  return /^[A-Z0-9./-]+$/.test(
    documento
      .trim()
      .toUpperCase(),
  );
}

function FormularioCliente({
  cliente,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioClienteProps) {
  const [formulario, setFormulario] =
    useState<EstadoFormularioCliente>(
      () => obtenerEstadoInicial(cliente),
    );

  const [errores, setErrores] =
    useState<ErroresFormularioCliente>(
      {},
    );

  function actualizarCampo<
    Campo extends keyof EstadoFormularioCliente,
  >(
    campo: Campo,
    valor:
      EstadoFormularioCliente[Campo],
  ) {
    setFormulario(
      (formularioActual) => ({
        ...formularioActual,
        [campo]: valor,
      }),
    );

    setErrores(
      (erroresActuales) => ({
        ...erroresActuales,
        [campo]: undefined,
      }),
    );
  }

  function cambiarTipoDocumento(
    valor: string,
  ) {
    setFormulario(
      (formularioActual) => ({
        ...formularioActual,
        tipoDocumento: valor,
        numeroDocumento:
          valor === ""
            ? ""
            : formularioActual
                .numeroDocumento,
      }),
    );

    setErrores(
      (erroresActuales) => ({
        ...erroresActuales,
        tipoDocumento: undefined,
        numeroDocumento: undefined,
      }),
    );
  }

  function validarFormulario(): boolean {
    const nuevosErrores:
      ErroresFormularioCliente = {};

    const nombreCompleto =
      formulario.nombreCompleto.trim();

    const numeroDocumento =
      formulario.numeroDocumento
        .trim()
        .toUpperCase();

    const telefono =
      formulario.telefono.trim();

    const correo =
      formulario.correo
        .trim()
        .toLowerCase();

    const direccion =
      formulario.direccion.trim();

    const observaciones =
      formulario.observaciones.trim();

    if (!nombreCompleto) {
      nuevosErrores.nombreCompleto =
        "El nombre del cliente es obligatorio.";
    } else if (
      nombreCompleto.length < 3
    ) {
      nuevosErrores.nombreCompleto =
        "El nombre debe contener al menos 3 caracteres.";
    } else if (
      nombreCompleto.length > 120
    ) {
      nuevosErrores.nombreCompleto =
        "El nombre no puede superar los 120 caracteres.";
    }

    if (
      formulario.tipoDocumento &&
      !numeroDocumento
    ) {
      nuevosErrores.numeroDocumento =
        "Ingrese el número de documento.";
    }

    if (
      !formulario.tipoDocumento &&
      numeroDocumento
    ) {
      nuevosErrores.tipoDocumento =
        "Seleccione el tipo de documento.";
    }

    if (
      numeroDocumento &&
      (
        numeroDocumento.length < 4 ||
        numeroDocumento.length > 30
      )
    ) {
      nuevosErrores.numeroDocumento =
        "El documento debe contener entre 4 y 30 caracteres.";
    } else if (
      numeroDocumento &&
      !esDocumentoValido(
        numeroDocumento,
      )
    ) {
      nuevosErrores.numeroDocumento =
        "Utilice solamente letras, números, puntos, diagonales o guiones.";
    }

    if (
      telefono &&
      (
        telefono.length < 7 ||
        telefono.length > 20
      )
    ) {
      nuevosErrores.telefono =
        "El teléfono debe contener entre 7 y 20 caracteres.";
    } else if (
      telefono &&
      !esTelefonoValido(telefono)
    ) {
      nuevosErrores.telefono =
        "El teléfono contiene caracteres no permitidos.";
    }

    if (
      correo &&
      !esCorreoValido(correo)
    ) {
      nuevosErrores.correo =
        "Ingrese un correo electrónico válido.";
    } else if (
      correo.length > 120
    ) {
      nuevosErrores.correo =
        "El correo no puede superar los 120 caracteres.";
    }

    if (direccion.length > 200) {
      nuevosErrores.direccion =
        "La dirección no puede superar los 200 caracteres.";
    }

    if (
      observaciones.length > 300
    ) {
      nuevosErrores.observaciones =
        "Las observaciones no pueden superar los 300 caracteres.";
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

    const tipoDocumento =
      formulario.tipoDocumento
        ? (
            formulario.tipoDocumento as TipoDocumentoCliente
          )
        : null;

    await alGuardar({
      nombreCompleto:
        formulario.nombreCompleto.trim(),
      tipoDocumento,
      numeroDocumento:
        formulario.numeroDocumento
          .trim()
          .toUpperCase() || null,
      telefono:
        formulario.telefono.trim() ||
        null,
      correo:
        formulario.correo
          .trim()
          .toLowerCase() || null,
      direccion:
        formulario.direccion.trim() ||
        null,
      observaciones:
        formulario.observaciones
          .trim() || null,
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
          <div>
            <label
              htmlFor="nombre-cliente"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Nombre completo o razón
              social
            </label>

            <div className="relative mt-2">
              <UserRound
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                id="nombre-cliente"
                type="text"
                value={
                  formulario.nombreCompleto
                }
                disabled={cargando}
                maxLength={120}
                autoComplete="name"
                placeholder="Ej.: María López"
                onChange={(evento) =>
                  actualizarCampo(
                    "nombreCompleto",
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
                    errores.nombreCompleto
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

            <div
              className="
                mt-1 flex items-start
                justify-between gap-3
              "
            >
              <div>
                {errores.nombreCompleto && (
                  <p
                    className="
                      text-xs font-semibold
                      text-red-600
                    "
                  >
                    {
                      errores.nombreCompleto
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
                  formulario.nombreCompleto
                    .length
                }
                /120
              </span>
            </div>
          </div>

          <div
            className="
              grid gap-4
              sm:grid-cols-2
            "
          >
            <div>
              <label
                htmlFor="tipo-documento"
                className="
                  text-sm font-bold
                  text-slate-700
                "
              >
                Tipo de documento
              </label>

              <select
                id="tipo-documento"
                value={
                  formulario.tipoDocumento
                }
                disabled={cargando}
                onChange={(evento) =>
                  cambiarTipoDocumento(
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
                    errores.tipoDocumento
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
                  Sin documento
                </option>

                <option value="CI">
                  Cédula de identidad
                </option>

                <option value="NIT">
                  NIT
                </option>

                <option value="Pasaporte">
                  Pasaporte
                </option>

                <option value="Otro">
                  Otro
                </option>
              </select>

              {errores.tipoDocumento && (
                <p
                  className="
                    mt-1 text-xs
                    font-semibold
                    text-red-600
                  "
                >
                  {
                    errores.tipoDocumento
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="numero-documento"
                className="
                  text-sm font-bold
                  text-slate-700
                "
              >
                Número de documento
              </label>

              <div className="relative mt-2">
                <FileText
                  size={19}
                  className="
                    pointer-events-none
                    absolute left-4 top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  id="numero-documento"
                  type="text"
                  value={
                    formulario.numeroDocumento
                  }
                  disabled={
                    cargando ||
                    !formulario.tipoDocumento
                  }
                  maxLength={30}
                  autoComplete="off"
                  placeholder={
                    formulario.tipoDocumento
                      ? "Ej.: 7123456"
                      : "Seleccione un tipo"
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "numeroDocumento",
                      evento.target.value
                        .toUpperCase(),
                    )
                  }
                  className={`
                    w-full rounded-xl
                    border bg-white
                    py-3 pl-11 pr-4
                    text-sm font-semibold
                    uppercase text-slate-900
                    outline-none transition
                    placeholder:font-normal
                    placeholder:normal-case
                    placeholder:text-slate-400
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                    ${
                      errores.numeroDocumento
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

              {errores.numeroDocumento && (
                <p
                  className="
                    mt-1 text-xs
                    font-semibold
                    text-red-600
                  "
                >
                  {
                    errores.numeroDocumento
                  }
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="telefono-cliente"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Teléfono
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
              <Phone
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                id="telefono-cliente"
                type="tel"
                value={formulario.telefono}
                disabled={cargando}
                maxLength={20}
                inputMode="tel"
                autoComplete="tel"
                placeholder="Ej.: 72900101"
                onChange={(evento) =>
                  actualizarCampo(
                    "telefono",
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
                    errores.telefono
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

            {errores.telefono && (
              <p
                className="
                  mt-1 text-xs
                  font-semibold
                  text-red-600
                "
              >
                {errores.telefono}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="correo-cliente"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Correo electrónico
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
              <Mail
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                id="correo-cliente"
                type="email"
                value={formulario.correo}
                disabled={cargando}
                maxLength={120}
                autoComplete="email"
                placeholder="cliente@correo.com"
                onChange={(evento) =>
                  actualizarCampo(
                    "correo",
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
                    errores.correo
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

            {errores.correo && (
              <p
                className="
                  mt-1 text-xs
                  font-semibold
                  text-red-600
                "
              >
                {errores.correo}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="direccion-cliente"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Dirección
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
              <MapPin
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-3.5
                  text-slate-400
                "
              />

              <textarea
                id="direccion-cliente"
                value={formulario.direccion}
                disabled={cargando}
                maxLength={200}
                rows={4}
                autoComplete="street-address"
                placeholder="Ej.: Barrio San Martín, calle principal"
                onChange={(evento) =>
                  actualizarCampo(
                    "direccion",
                    evento.target.value,
                  )
                }
                className={`
                  w-full resize-none
                  rounded-xl border
                  bg-white py-3
                  pl-11 pr-4
                  text-sm leading-relaxed
                  text-slate-900
                  outline-none transition
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                  ${
                    errores.direccion
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

            <div
              className="
                mt-1 flex items-start
                justify-between gap-3
              "
            >
              <div>
                {errores.direccion && (
                  <p
                    className="
                      text-xs font-semibold
                      text-red-600
                    "
                  >
                    {errores.direccion}
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
                  formulario.direccion
                    .length
                }
                /200
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="observaciones-cliente"
              className="
                text-sm font-bold
                text-slate-700
              "
            >
              Observaciones
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
              <Building2
                size={19}
                className="
                  pointer-events-none
                  absolute left-4 top-3.5
                  text-slate-400
                "
              />

              <textarea
                id="observaciones-cliente"
                value={
                  formulario.observaciones
                }
                disabled={cargando}
                maxLength={300}
                rows={6}
                placeholder="Ej.: Cliente frecuente, solicita factura o prefiere contacto por WhatsApp."
                onChange={(evento) =>
                  actualizarCampo(
                    "observaciones",
                    evento.target.value,
                  )
                }
                className={`
                  w-full resize-none
                  rounded-xl border
                  bg-white py-3
                  pl-11 pr-4
                  text-sm leading-relaxed
                  text-slate-900
                  outline-none transition
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                  ${
                    errores.observaciones
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

            <div
              className="
                mt-1 flex items-start
                justify-between gap-3
              "
            >
              <div>
                {errores.observaciones && (
                  <p
                    className="
                      text-xs font-semibold
                      text-red-600
                    "
                  >
                    {
                      errores.observaciones
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
                  formulario.observaciones
                    .length
                }
                /300
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
                text-blue-900
              "
            >
              Registro flexible
            </p>

            <p
              className="
                mt-1 text-xs
                leading-relaxed
                text-blue-700
              "
            >
              Para registrar un cliente,
              solamente el nombre es
              obligatorio. El documento,
              teléfono, correo y dirección
              pueden completarse cuando
              estén disponibles.
            </p>
          </div>
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

          {cliente
            ? "Guardar cambios"
            : "Registrar cliente"}
        </button>
      </div>
    </form>
  );
}

export default FormularioCliente;