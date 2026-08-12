import {
  ArrowDownCircle,
  ArrowUpCircle,
  LoaderCircle,
  Save,
  Scale,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  InsumoInventario,
  RegistrarAjusteManualInventarioDto,
} from "../../tipos/inventario";

interface Props {
  insumo: InsumoInventario;
  cargando: boolean;
  puedeAumentar: boolean;
  puedeDisminuir: boolean;
  alGuardar: (datos: RegistrarAjusteManualInventarioDto) => Promise<void>;
  alCancelar: () => void;
}

type TipoAjuste = "Aumentar" | "Disminuir";

function numero(valor: string): number {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function formatearCantidadOperativa(
  valor: number,
  unidad: InsumoInventario["unidadBase"],
): string {
  const cantidad = new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 0,
  }).format(Math.round(valor));

  return `${cantidad} ${unidad}`;
}

function FormularioAjusteInventario({
  insumo,
  cargando,
  puedeAumentar,
  puedeDisminuir,
  alGuardar,
  alCancelar,
}: Props) {
  const [tipo, setTipo] = useState<TipoAjuste>(
    puedeAumentar ? "Aumentar" : "Disminuir",
  );
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cantidadNumerica = numero(cantidad);
  const cantidadFirmada = tipo === "Aumentar" ? cantidadNumerica : -cantidadNumerica;
  const stockResultante = useMemo(
    () => Math.round(insumo.stockActual) + cantidadFirmada,
    [insumo.stockActual, cantidadFirmada],
  );

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!Number.isInteger(cantidadNumerica) || cantidadNumerica <= 0) {
      setError(`La cantidad debe ser un número entero mayor que cero en ${insumo.unidadBase}.`);
      return;
    }

    if (
      (tipo === "Aumentar" && !puedeAumentar) ||
      (tipo === "Disminuir" && !puedeDisminuir)
    ) {
      setError("Tu rol no tiene permiso para realizar este tipo de ajuste.");
      return;
    }

    if (motivo.trim().length < 5) {
      setError("Explica el motivo del ajuste con al menos 5 caracteres.");
      return;
    }

    setError(null);

    await alGuardar({
      insumoId: insumo.id,
      cantidadAjuste: cantidadFirmada,
      motivo: motivo.trim(),
    });
  }

  const claseInput =
    "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-950/50 dark:disabled:bg-slate-800";

  return (
    <form onSubmit={enviar} noValidate>
      <div className="space-y-4 p-5 sm:p-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-start gap-3">
            <Scale size={22} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" />
            <div>
              <p className="font-black text-slate-900 dark:text-white">{insumo.nombre}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Stock teórico actual: {formatearCantidadOperativa(insumo.stockActual, insumo.unidadBase)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Los ajustes se registran directamente en {insumo.unidadBase} y quedan auditados.
              </p>
            </div>
          </div>
        </section>

        <div className={`grid gap-3 ${puedeAumentar && puedeDisminuir ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {puedeAumentar && (
            <button
              type="button"
              disabled={cargando}
              onClick={() => {
                setTipo("Aumentar");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                tipo === "Aumentar"
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <ArrowUpCircle size={18} /> Aumentar stock
            </button>
          )}

          {puedeDisminuir && (
            <button
              type="button"
              disabled={cargando}
              onClick={() => {
                setTipo("Disminuir");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                tipo === "Disminuir"
                  ? "border-red-600 bg-red-600 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <ArrowDownCircle size={18} /> Disminuir stock
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <label htmlFor="cantidad-ajuste" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Cantidad en {insumo.unidadBase}
            </label>
            <input
              id="cantidad-ajuste"
              type="number"
              value={cantidad}
              disabled={cargando}
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Ej.: 250"
              onChange={(e) => {
                setCantidad(e.target.value);
                setError(null);
              }}
              className={claseInput}
            />
          </div>

          <div>
            <label htmlFor="motivo-ajuste" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Motivo del ajuste
            </label>
            <input
              id="motivo-ajuste"
              value={motivo}
              disabled={cargando}
              maxLength={200}
              placeholder="Ej.: Corrección por pesaje o merma detectada"
              onChange={(e) => {
                setMotivo(e.target.value);
                setError(null);
              }}
              className={claseInput}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Movimiento</p>
            <p className={`mt-1 text-xl font-black ${cantidadFirmada < 0 ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
              {cantidadFirmada > 0 ? "+" : ""}{formatearCantidadOperativa(cantidadFirmada, insumo.unidadBase)}
            </p>
          </div>
          <div className={`rounded-xl border p-3 ${stockResultante < 0 ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30" : "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30"}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wide ${stockResultante < 0 ? "text-red-600 dark:text-red-300" : "text-blue-600 dark:text-blue-300"}`}>
              Stock resultante
            </p>
            <p className={`mt-1 text-xl font-black ${stockResultante < 0 ? "text-red-950 dark:text-red-100" : "text-blue-950 dark:text-blue-100"}`}>
              {formatearCantidadOperativa(stockResultante, insumo.unidadBase)}
            </p>
          </div>
        </div>

        {stockResultante < 0 && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            Este ajuste dejará el stock teórico en negativo y aparecerá como alerta prioritaria.
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <X size={18} /> Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          Registrar ajuste
        </button>
      </footer>
    </form>
  );
}

export default FormularioAjusteInventario;
