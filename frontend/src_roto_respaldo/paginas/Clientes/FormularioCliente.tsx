import {
  Building2,
  ExternalLink,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Navigation,
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
  telefono: string;
  correo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string;
  zona: string;
  referenciaDireccion: string;
  ubicacionUrl: string;
  indicacionesEntrega: string;
  observaciones: string;
}

interface ErroresFormularioCliente {
  nombreCompleto?: string;
  telefono?: string;
  correo?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  direccion?: string;
  zona?: string;
  referenciaDireccion?: string;
  ubicacionUrl?: string;
  indicacionesEntrega?: string;
  observaciones?: string;
}

function obtenerEstadoInicial(
  cliente: Cliente | null,
): EstadoFormularioCliente {
  return {
    nombreCompleto:
      cliente?.nombreCompleto ?? "",
    telefono: cliente?.telefono ?? "",
    correo: cliente?.correo ?? "",
    tipoDocumento:
      cliente?.tipoDocumento ?? "",
    numeroDocumento:
      cliente?.numeroDocumento ?? "",
    direccion:
      cliente?.direccion ?? "",
    zona: cliente?.zona ?? "",
    referenciaDireccion:
      cliente?.referenciaDireccion ?? "",
    ubicacionUrl:
      cliente?.ubicacionUrl ?? "",
    indicacionesEntrega:
      cliente?.indicacionesEntrega ?? "",
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

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
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
    documento.trim().toUpperCase(),
  );
}

function esUrlValida(
  valor: string,
): boolean {
  const limpio = valor.trim();

  if (!limpio) {
    return true;
  }

  try {
    const normalizado = /^https?:\/\//i.test(
      limpio,
    )
      ? limpio
      : `https://${limpio}`;

    new URL(normalizado);
    return true;
  } catch {
    return false;
  }
}

const claseCampo =
  "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-950/60";

const claseArea =
  "mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-950/60";

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
    valor: EstadoFormularioCliente[Campo],
  ) {
    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor,
      }),
    );

    setErrores(
      (actuales) => ({
        ...actuales,
        [campo]: undefined,
      }),
    );
  }

  function cambiarTipoDocumento(
    valor: string,
  ) {
    setFormulario(
      (actual) => ({
        ...actual,
        tipoDocumento: valor,
        numeroDocumento:
          valor
            ? actual.numeroDocumento
            : "",
      }),
    );

    setErrores(
      (actuales) => ({
        ...actuales,
        tipoDocumento: undefined,
        numeroDocumento: undefined,
      }),
    );
  }

  function validarFormulario(): boolean {
    const nuevosErrores:
      ErroresFormularioCliente = {};

    const nombre =
      formulario.nombreCompleto.trim();
    const telefono =
      formulario.telefono.trim();
    const correo =
      formulario.correo.trim();
    const documento =
      formulario.numeroDocumento
        .trim()
        .toUpperCase();

    if (nombre.length < 3) {
      nuevosErrores.nombreCompleto =
        "Ingresa al menos 3 caracteres.";
    } else if (nombre.length > 120) {
      nuevosErrores.nombreCompleto =
        "El nombre no puede superar los 120 caracteres.";
    }

    if (
      telefono &&
      (
        telefono.length < 7 ||
        telefono.length > 20 ||
        !esTelefonoValido(telefono)
      )
    ) {
      nuevosErrores.telefono =
        "Ingresa un teléfono válido de 7 a 20 caracteres.";
    }

    if (!esCorreoValido(correo)) {
      nuevosErrores.correo =
        "Ingresa un correo válido.";
    }

    if (
      formulario.tipoDocumento &&
      !documento
    ) {
      nuevosErrores.numeroDocumento =
        "Ingresa el número de documento.";
    }

    if (
      !formulario.tipoDocumento &&
      documento
    ) {
      nuevosErrores.tipoDocumento =
        "Selecciona el tipo de documento.";
    }

    if (
      documento &&
      (
        documento.length < 4 ||
        documento.length > 30 ||
        !esDocumentoValido(documento)
      )
    ) {
      nuevosErrores.numeroDocumento =
        "Usa entre 4 y 30 caracteres válidos.";
    }

    if (
      formulario.direccion.trim().length >
      220
    ) {
      nuevosErrores.direccion =
        "La dirección no puede superar los 220 caracteres.";
    }

    if (
      formulario.zona.trim().length > 100
    ) {
      nuevosErrores.zona =
        "La zona no puede superar los 100 caracteres.";
    }

    if (
      formulario.referenciaDireccion
        .trim().length > 180
    ) {
      nuevosErrores.referenciaDireccion =
        "La referencia no puede superar los 180 caracteres.";
    }

    if (
      !esUrlValida(
        formulario.ubicacionUrl,
      )
    ) {
      nuevosErrores.ubicacionUrl =
        "Ingresa un enlace de ubicación válido.";
    }

    if (
      formulario.indicacionesEntrega
        .trim().length > 300
    ) {
      nuevosErrores.indicacionesEntrega =
        "Las indicaciones no pueden superar los 300 caracteres.";
    }

    if (
      formulario.observaciones.trim()
        .length > 300
    ) {
      nuevosErrores.observaciones =
        "Las observaciones no pueden superar los 300 caracteres.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores).length ===
      0
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
      nombreCompleto:
        formulario.nombreCompleto.trim(),
      telefono:
        formulario.telefono.trim() || null,
      correo:
        formulario.correo.trim() || null,
      tipoDocumento:
        formulario.tipoDocumento
          ? (
              formulario.tipoDocumento as TipoDocumentoCliente
            )
          : null,
      numeroDocumento:
        formulario.numeroDocumento
          .trim()
          .toUpperCase() || null,
      direccion:
        formulario.direccion.trim() || null,
      zona:
        formulario.zona.trim() || null,
      referenciaDireccion:
        formulario.referenciaDireccion
          .trim() || null,
      ubicacionUrl:
        formulario.ubicacionUrl.trim() ||
        null,
      indicacionesEntrega:
        formulario.indicacionesEntrega
          .trim() || null,
      observaciones:
        formulario.observaciones.trim() ||
        null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="flex min-h-0 flex-col"
    >
      <div className="grid gap-5 p-5 lg:grid-cols-2 lg:p-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/35">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300">
              <UserRound size={19} />
            </div>

            <div>
              <h3 className="font-black text-slate-950 dark:text-white">
                Datos del cliente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identificación y contacto principal.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Nombre completo
              <div className="relative">
                <UserRound
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={formulario.nombreCompleto}
                  disabled={cargando}
                  autoFocus
                  maxLength={120}
                  placeholder="Ej.: Juan Pérez"
                  onChange={(evento) =>
                    actualizarCampo(
                      "nombreCompleto",
                      evento.target.value,
                    )
                  }
                  className={`${claseCampo} pl-11`}
                />
              </div>
              {errores.nombreCompleto && (
                <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                  {errores.nombreCompleto}
                </span>
              )}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Teléfono / WhatsApp
                <div className="relative">
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={formulario.telefono}
                    disabled={cargando}
                    maxLength={20}
                    placeholder="Ej.: 75432109"
                    onChange={(evento) =>
                      actualizarCampo(
                        "telefono",
                        evento.target.value,
                      )
                    }
                    className={`${claseCampo} pl-11`}
                  />
                </div>
                {errores.telefono && (
                  <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                    {errores.telefono}
                  </span>
                )}
              </label>

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Correo
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={formulario.correo}
                    disabled={cargando}
                    maxLength={120}
                    placeholder="Opcional"
                    onChange={(evento) =>
                      actualizarCampo(
                        "correo",
                        evento.target.value,
                      )
                    }
                    className={`${claseCampo} pl-11`}
                  />
                </div>
                {errores.correo && (
                  <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                    {errores.correo}
                  </span>
                )}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Documento
                <select
                  value={formulario.tipoDocumento}
                  disabled={cargando}
                  onChange={(evento) =>
                    cambiarTipoDocumento(
                      evento.target.value,
                    )
                  }
                  className={claseCampo}
                >
                  <option value="">
                    Sin documento
                  </option>
                  <option value="CI">CI</option>
                  <option value="NIT">NIT</option>
                  <option value="Pasaporte">
                    Pasaporte
                  </option>
                  <option value="Otro">
                    Otro
                  </option>
                </select>
                {errores.tipoDocumento && (
                  <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                    {errores.tipoDocumento}
                  </span>
                )}
              </label>

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Número
                <div className="relative">
                  <FileText
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={formulario.numeroDocumento}
                    disabled={
                      cargando ||
                      !formulario.tipoDocumento
                    }
                    maxLength={30}
                    placeholder="Número de documento"
                    onChange={(evento) =>
                      actualizarCampo(
                        "numeroDocumento",
                        evento.target.value
                          .toUpperCase(),
                      )
                    }
                    className={`${claseCampo} pl-11`}
                  />
                </div>
                {errores.numeroDocumento && (
                  <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                    {errores.numeroDocumento}
                  </span>
                )}
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Observaciones internas
              <textarea
                value={formulario.observaciones}
                disabled={cargando}
                rows={3}
                maxLength={300}
                placeholder="Preferencias, facturación u otra información útil"
                onChange={(evento) =>
                  actualizarCampo(
                    "observaciones",
                    evento.target.value,
                  )
                }
                className={claseArea}
              />
              {errores.observaciones && (
                <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                  {errores.observaciones}
                </span>
              )}
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/35">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300">
              <MapPin size={19} />
            </div>

            <div>
              <h3 className="font-black text-slate-950 dark:text-white">
                Datos de entrega
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Opcionales, pero útiles para delivery.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Dirección
              <div className="relative">
                <Building2
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={formulario.direccion}
                  disabled={cargando}
                  maxLength={220}
                  placeholder="Calle, avenida, número o esquina"
                  onChange={(evento) =>
                    actualizarCampo(
                      "direccion",
                      evento.target.value,
                    )
                  }
                  className={`${claseCampo} pl-11`}
                />
              </div>
              {errores.direccion && (
                <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                  {errores.direccion}
                </span>
              )}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Barrio o zona
                <input
                  type="text"
                  value={formulario.zona}
                  disabled={cargando}
                  maxLength={100}
                  placeholder="Ej.: Zona Central"
                  onChange={(evento) =>
                    actualizarCampo(
                      "zona",
                      evento.target.value,
                    )
                  }
                  className={claseCampo}
                />
                {errores.zona && (
                  <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                    {errores.zona}
                  </span>
                )}
              </label>

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Enlace de ubicación
                <div className="relative">
                  <Navigation
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="url"
                    value={formulario.ubicacionUrl}
                    disabled={cargando}
                    maxLength={500}
                    placeholder="Google Maps u otro mapa"
                    onChange={(evento) =>
                      actualizarCampo(
                        "ubicacionUrl",
                        evento.target.value,
                      )
                    }
                    className={`${claseCampo} pl-11 pr-11`}
                  />
                  {formulario.ubicacionUrl &&
                    esUrlValida(
                      formulario.ubicacionUrl,
                    ) && (
                      <a
                        href={
                          /^https?:\/\//i.test(
                            formulario.ubicacionUrl,
                          )
                            ? formulario.ubicacionUrl
                            : `https://${formulario.ubicacionUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir ubicación"
                        className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                </div>
                {errores.ubicacionUrl && (
                  <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                    {errores.ubicacionUrl}
                  </span>
                )}
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Referencia del domicilio
              <textarea
                value={formulario.referenciaDireccion}
                disabled={cargando}
                rows={2}
                maxLength={180}
                placeholder="Ej.: Portón negro frente a la farmacia"
                onChange={(evento) =>
                  actualizarCampo(
                    "referenciaDireccion",
                    evento.target.value,
                  )
                }
                className={claseArea}
              />
              {errores.referenciaDireccion && (
                <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                  {errores.referenciaDireccion}
                </span>
              )}
            </label>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Indicaciones para la entrega
              <textarea
                value={formulario.indicacionesEntrega}
                disabled={cargando}
                rows={3}
                maxLength={300}
                placeholder="Ej.: Llamar al llegar, entregar en recepción"
                onChange={(evento) =>
                  actualizarCampo(
                    "indicacionesEntrega",
                    evento.target.value,
                  )
                }
                className={claseArea}
              />
              {errores.indicacionesEntrega && (
                <span className="mt-1 block text-xs font-bold text-red-600 dark:text-red-300">
                  {errores.indicacionesEntrega}
                </span>
              )}
            </label>
          </div>
        </section>
      </div>

      <footer className="sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6 dark:border-slate-700 dark:bg-slate-900/95">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex min-h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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
            : "Guardar cliente"}
        </button>
      </footer>
    </form>
  );
}

export default FormularioCliente;
