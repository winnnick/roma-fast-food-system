import {
  ArrowDownCircle,
  ArrowUpCircle,
  LoaderCircle,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  RegistrarMovimientoManualDto,
} from "../../tipos/caja";

interface FormularioMovimientoProps {
  cargando: boolean;

  alGuardar: (
    datos:
      RegistrarMovimientoManualDto,
  ) => Promise<void>;

  alCancelar: () => void;
}

function FormularioMovimiento({
  cargando,
  alGuardar,
  alCancelar,
}: FormularioMovimientoProps) {
  const [tipo, setTipo] =
    useState<
      "Ingreso" | "Egreso"
    >("Ingreso");

  const [
    concepto,
    setConcepto,
  ] = useState("");

  const [monto, setMonto] =
    useState("");

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    await alGuardar({
      tipo,
      concepto:
        concepto.trim(),

      monto:
        Number(monto) || 0,
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
            grid gap-3
            sm:grid-cols-2
          "
        >
          <button
            type="button"
            disabled={cargando}
            onClick={() =>
              setTipo("Ingreso")
            }
            className={`
              flex items-center
              justify-center gap-2
              rounded-xl border
              px-4 py-3
              text-sm font-bold
              ${
                tipo === "Ingreso"
                  ? `
                    border-emerald-600
                    bg-emerald-50
                    text-emerald-700
                  `
                  : `
                    border-slate-300
                    text-slate-600
                  `
              }
            `}
          >
            <ArrowUpCircle
              size={18}
            />
            Ingreso
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={() =>
              setTipo("Egreso")
            }
            className={`
              flex items-center
              justify-center gap-2
              rounded-xl border
              px-4 py-3
              text-sm font-bold
              ${
                tipo === "Egreso"
                  ? `
                    border-red-600
                    bg-red-50
                    text-red-700
                  `
                  : `
                    border-slate-300
                    text-slate-600
                  `
              }
            `}
          >
            <ArrowDownCircle
              size={18}
            />
            Egreso
          </button>
        </div>

        <div className="mt-5">
          <label
            htmlFor="concepto-movimiento"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Concepto
          </label>

          <input
            id="concepto-movimiento"
            type="text"
            value={concepto}
            disabled={cargando}
            maxLength={120}
            placeholder={
              tipo === "Ingreso"
                ? "Ej.: Dinero adicional"
                : "Ej.: Compra de insumos"
            }
            onChange={(evento) =>
              setConcepto(
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
            htmlFor="monto-movimiento"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Monto en efectivo
          </label>

          <input
            id="monto-movimiento"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            disabled={cargando}
            placeholder="0.00"
            onChange={(evento) =>
              setMonto(
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
            bg-red-700 px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-red-800
            disabled:opacity-50
          "
        >
          {cargando && (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          )}

          Registrar movimiento
        </button>
      </div>
    </form>
  );
}

export default FormularioMovimiento;