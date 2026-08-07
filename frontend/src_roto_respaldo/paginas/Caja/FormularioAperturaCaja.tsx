import {
  LoaderCircle,
  LockOpen,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  AbrirCajaDto,
} from "../../tipos/caja";

interface FormularioAperturaCajaProps {
  cargando: boolean;

  alGuardar: (
    datos: AbrirCajaDto,
  ) => Promise<void>;

  alCancelar: () => void;
}

function FormularioAperturaCaja({
  cargando,
  alGuardar,
  alCancelar,
}: FormularioAperturaCajaProps) {
  const [
    montoInicial,
    setMontoInicial,
  ] = useState("");

  const [
    observacion,
    setObservacion,
  ] = useState("");

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    await alGuardar({
      montoInicial:
        Number(montoInicial) || 0,
      observacion:
        observacion.trim() || null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/70 dark:bg-blue-950/40">
          <LockOpen
            size={20}
            className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
          />

          <div>
            <p className="font-black text-blue-950 dark:text-blue-100">
              Inicio de tu turno
            </p>
            <p className="mt-1 text-sm leading-relaxed text-blue-700 dark:text-blue-300">
              Este fondo y todos los cobros posteriores pertenecerán exclusivamente a tu caja.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <label
              htmlFor="monto-inicial"
              className="text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Monto inicial
            </label>

            <input
              id="monto-inicial"
              type="number"
              min="0"
              step="0.01"
              value={montoInicial}
              disabled={cargando}
              placeholder="0.00"
              autoFocus
              onChange={(evento) =>
                setMontoInicial(
                  evento.target.value,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/60"
            />
          </div>

          <div>
            <label
              htmlFor="observacion-apertura"
              className="text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Observación
              <span className="ml-1 font-normal text-slate-400">
                opcional
              </span>
            </label>

            <textarea
              id="observacion-apertura"
              value={observacion}
              disabled={cargando}
              maxLength={300}
              rows={2}
              placeholder="Ej.: Cambio de turno"
              onChange={(evento) =>
                setObservacion(
                  evento.target.value,
                )
              }
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/60"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {cargando && (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          )}
          <LockOpen size={17} />
          Abrir mi caja
        </button>
      </div>
    </form>
  );
}

export default FormularioAperturaCaja;
