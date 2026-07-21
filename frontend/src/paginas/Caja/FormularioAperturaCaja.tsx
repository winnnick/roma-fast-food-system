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
        observacion.trim() ||
        null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div className="p-5 sm:p-6">
        <div
          className="
            rounded-2xl
            border border-blue-200
            bg-blue-50 p-4
          "
        >
          <div
            className="
              flex items-start gap-3
            "
          >
            <LockOpen
              size={21}
              className="
                mt-0.5 shrink-0
                text-blue-700
              "
            />

            <div>
              <p
                className="
                  font-bold
                  text-blue-900
                "
              >
                Inicio de jornada
              </p>

              <p
                className="
                  mt-1 text-sm
                  leading-relaxed
                  text-blue-700
                "
              >
                Registra el dinero
                disponible antes de
                realizar el primer
                cobro.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="monto-inicial"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Monto inicial en efectivo
          </label>

          <input
            id="monto-inicial"
            type="number"
            min="0"
            step="0.01"
            value={montoInicial}
            disabled={cargando}
            placeholder="0.00"
            onChange={(evento) =>
              setMontoInicial(
                evento.target.value,
              )
            }
            className="
              mt-2 h-12 w-full
              rounded-xl border
              border-slate-300
              px-4 text-sm
              outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
            "
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="observacion-apertura"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Observación
          </label>

          <textarea
            id="observacion-apertura"
            value={observacion}
            disabled={cargando}
            maxLength={300}
            rows={3}
            placeholder="Opcional"
            onChange={(evento) =>
              setObservacion(
                evento.target.value,
              )
            }
            className="
              mt-2 w-full resize-none
              rounded-xl border
              border-slate-300
              px-4 py-3 text-sm
              outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
            "
          />
        </div>
      </div>

      <div
        className="
          flex flex-col-reverse
          gap-3 border-t
          border-slate-100
          bg-slate-50
          px-5 py-4
          sm:flex-row
          sm:justify-end sm:px-6
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
            rounded-xl
            bg-emerald-600
            px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-emerald-700
            disabled:opacity-50
          "
        >
          {cargando && (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          )}

          <LockOpen size={17} />
          Abrir caja
        </button>
      </div>
    </form>
  );
}

export default FormularioAperturaCaja;