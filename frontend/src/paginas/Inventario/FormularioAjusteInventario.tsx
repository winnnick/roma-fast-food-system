import {
  ArrowDownCircle,
  ArrowUpCircle,
  LoaderCircle,
  Save,
  SlidersHorizontal,
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

import {
  formatearCantidadInventario,
} from "../../servicios/inventarioServicio";

interface Props {
  insumo: InsumoInventario;
  cargando: boolean;
  alGuardar: (datos: RegistrarAjusteManualInventarioDto) => Promise<void>;
  alCancelar: () => void;
}

type TipoAjuste = "Aumentar" | "Disminuir";

function numero(valor: string): number {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function FormularioAjusteInventario({
  insumo,
  cargando,
  alGuardar,
  alCancelar,
}: Props) {
  const [tipo, setTipo] = useState<TipoAjuste>("Aumentar");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cantidadNumerica = numero(cantidad);
  const cantidadFirmada = tipo === "Aumentar" ? cantidadNumerica : -cantidadNumerica;
  const stockResultante = useMemo(
    () => insumo.stockActual + cantidadFirmada,
    [insumo.stockActual, cantidadFirmada],
  );

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (cantidadNumerica <= 0) {
      setError("La cantidad del ajuste debe ser mayor que cero.");
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

  return (
    <form onSubmit={enviar} noValidate>
      <div className="space-y-5 p-5 sm:p-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <SlidersHorizontal size={22} className="mt-0.5 shrink-0 text-red-700" />
            <div>
              <p className="font-black text-slate-900">{insumo.nombre}</p>
              <p className="mt-1 text-xs text-slate-500">
                Stock teórico actual: {formatearCantidadInventario(insumo.stockActual, insumo.unidadBase)}
              </p>
            </div>
          </div>
        </section>

        <div>
          <p className="text-sm font-bold text-slate-700">Tipo de ajuste</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={cargando}
              onClick={() => {
                setTipo("Aumentar");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
                tipo === "Aumentar"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-600"
              }`}
            >
              <ArrowUpCircle size={18} /> Aumentar stock
            </button>
            <button
              type="button"
              disabled={cargando}
              onClick={() => {
                setTipo("Disminuir");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
                tipo === "Disminuir"
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-slate-300 bg-white text-slate-600"
              }`}
            >
              <ArrowDownCircle size={18} /> Disminuir stock
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="cantidad-ajuste" className="text-sm font-bold text-slate-700">
            Cantidad en {insumo.unidadBase}
          </label>
          <input
            id="cantidad-ajuste"
            type="number"
            value={cantidad}
            disabled={cargando}
            min="0.001"
            step="0.001"
            placeholder="Ej.: 250"
            onChange={(e) => {
              setCantidad(e.target.value);
              setError(null);
            }}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Ajuste</p>
            <p className={`mt-1 text-xl font-black ${cantidadFirmada < 0 ? "text-red-700" : "text-emerald-700"}`}>
              {cantidadFirmada > 0 ? "+" : ""}
              {formatearCantidadInventario(cantidadFirmada, insumo.unidadBase)}
            </p>
          </div>
          <div className={`rounded-xl p-4 ${stockResultante < 0 ? "bg-red-50" : "bg-blue-50"}`}>
            <p className={`text-xs font-bold uppercase ${stockResultante < 0 ? "text-red-600" : "text-blue-600"}`}>
              Stock resultante
            </p>
            <p className={`mt-1 text-xl font-black ${stockResultante < 0 ? "text-red-900" : "text-blue-900"}`}>
              {formatearCantidadInventario(stockResultante, insumo.unidadBase)}
            </p>
          </div>
        </div>

        {stockResultante < 0 && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            Este ajuste dejará el stock teórico en negativo. Se permitirá y aparecerá como alerta prioritaria.
          </p>
        )}

        <div>
          <label htmlFor="motivo-ajuste" className="text-sm font-bold text-slate-700">
            Motivo del ajuste
          </label>
          <textarea
            id="motivo-ajuste"
            value={motivo}
            disabled={cargando}
            maxLength={200}
            rows={4}
            placeholder="Ej.: Corrección por pesaje, merma detectada o entrada no registrada."
            onChange={(e) => {
              setMotivo(e.target.value);
              setError(null);
            }}
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <X size={18} /> Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {cargando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          Registrar ajuste
        </button>
      </footer>
    </form>
  );
}

export default FormularioAjusteInventario;
