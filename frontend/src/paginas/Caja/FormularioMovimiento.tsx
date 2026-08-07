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
    datos: RegistrarMovimientoManualDto,
  ) => Promise<void>;

  alCancelar: () => void;
}

function FormularioMovimiento({
  cargando,
  alGuardar,
  alCancelar,
}: FormularioMovimientoProps) {
  const [tipo, setTipo] =
    useState<"Ingreso" | "Egreso">(
      "Ingreso",
    );

  const [concepto, setConcepto] =
    useState("");

  const [monto, setMonto] =
    useState("");

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    await alGuardar({
      tipo,
      concepto,
      monto: Number(monto) || 0,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={cargando}
            onClick={() =>
              setTipo("Ingreso")
            }
            className={`
              flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-colors disabled:opacity-50
              ${
                tipo === "Ingreso"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            `}
          >
            <ArrowUpCircle size={18} />
            Ingreso
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={() =>
              setTipo("Egreso")
            }
            className={`
              flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-colors disabled:opacity-50
              ${
                tipo === "Egreso"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            `}
          >
            <ArrowDownCircle size={18} />
            Egreso
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
          <div>
            <label
              htmlFor="concepto-movimiento"
              className="text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Concepto
            </label>

            <input
              id="concepto-movimiento"
              type="text"
              value={concepto}
              disabled={cargando}
              maxLength={120}
              autoFocus
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
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/60"
            />
          </div>

          <div>
            <label
              htmlFor="monto-movimiento"
              className="text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              Monto
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
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/60"
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-800 disabled:opacity-50"
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
