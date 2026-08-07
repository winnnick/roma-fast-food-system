import {
  BadgeDollarSign,
  LoaderCircle,
  PackagePlus,
  Save,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  InsumoInventario,
  RegistrarEntradaInventarioDto,
} from "../../tipos/inventario";

interface Props {
  insumo: InsumoInventario;
  cargando: boolean;
  alGuardar: (datos: RegistrarEntradaInventarioDto) => Promise<void>;
  alCancelar: () => void;
}

function numero(valor: string): number {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function cantidadEntera(valor: number): boolean {
  return Math.abs(valor - Math.round(valor)) < 0.000001;
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

function FormularioEntradaInventario({
  insumo,
  cargando,
  alGuardar,
  alCancelar,
}: Props) {
  const [cantidad, setCantidad] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [referencia, setReferencia] = useState("");
  const [motivo, setMotivo] = useState("Compra o recepción de insumos");
  const [error, setError] = useState<string | null>(null);

  const cantidadBase = useMemo(
    () => numero(cantidad) * insumo.factorConversionCompra,
    [cantidad, insumo.factorConversionCompra],
  );

  const stockResultante = Math.round(insumo.stockActual) + Math.round(cantidadBase);
  const costoUnitario = cantidadBase > 0 ? numero(costoTotal) / cantidadBase : 0;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const cantidadPresentaciones = numero(cantidad);
    const costo = numero(costoTotal);
    const motivoLimpio = motivo.trim();

    if (cantidadPresentaciones <= 0) {
      setError("La cantidad de entrada debe ser mayor que cero.");
      return;
    }

    if (!cantidadEntera(cantidadBase)) {
      setError(
        `La entrada debe equivaler a una cantidad entera de ${insumo.unidadBase}. Por ejemplo: ${formatearCantidadOperativa(Math.max(1, Math.round(cantidadBase)), insumo.unidadBase)}.`,
      );
      return;
    }

    if (insumo.controlEconomico && costo <= 0) {
      setError("Ingresa el costo total de la compra para actualizar el costo promedio.");
      return;
    }

    if (motivoLimpio.length < 5) {
      setError("El motivo debe contener al menos 5 caracteres.");
      return;
    }

    setError(null);

    await alGuardar({
      insumoId: insumo.id,
      cantidadPresentaciones,
      costoTotal: insumo.controlEconomico ? costo : null,
      referencia: referencia.trim() || null,
      motivo: motivoLimpio,
    });
  }

  const claseInput =
    "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-950/50 dark:disabled:bg-slate-800";

  return (
    <form onSubmit={enviar} noValidate>
      <div className="space-y-4 p-5 sm:p-6">
        <section className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <PackagePlus size={22} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
            <div className="min-w-0">
              <p className="font-black text-blue-950 dark:text-blue-100">{insumo.nombre}</p>
              <p className="mt-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
                Stock actual: {formatearCantidadOperativa(insumo.stockActual, insumo.unidadBase)}
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                1 {insumo.presentacionCompra} equivale a {formatearCantidadOperativa(insumo.factorConversionCompra, insumo.unidadBase)}.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cantidad-entrada" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Cantidad de {insumo.presentacionCompra}
            </label>
            <input
              id="cantidad-entrada"
              type="number"
              value={cantidad}
              disabled={cargando}
              min="0"
              step={1 / Math.max(1, insumo.factorConversionCompra)}
              inputMode="decimal"
              placeholder="Ej.: 2"
              onChange={(e) => {
                setCantidad(e.target.value);
                setError(null);
              }}
              className={claseInput}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Equivale a {formatearCantidadOperativa(cantidadBase, insumo.unidadBase)}.
            </p>
          </div>

          {insumo.controlEconomico ? (
            <div>
              <label htmlFor="costo-entrada" className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Costo total de la entrada
              </label>
              <div className="relative mt-2">
                <BadgeDollarSign size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="costo-entrada"
                  type="number"
                  value={costoTotal}
                  disabled={cargando}
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00"
                  onChange={(e) => {
                    setCostoTotal(e.target.value);
                    setError(null);
                  }}
                  className={`${claseInput} mt-0 pl-11 pr-12 font-bold`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400">Bs</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Costo por {insumo.unidadBase}: {moneda(costoUnitario)}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Solo cantidades</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Este insumo no calcula valoración económica.</p>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Entrada al inventario</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              +{formatearCantidadOperativa(cantidadBase, insumo.unidadBase)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Stock resultante</p>
            <p className="mt-1 text-xl font-black text-emerald-950 dark:text-emerald-100">
              {formatearCantidadOperativa(stockResultante, insumo.unidadBase)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="referencia-entrada" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Referencia <span className="font-normal text-slate-400">Opcional</span>
            </label>
            <input
              id="referencia-entrada"
              value={referencia}
              disabled={cargando}
              maxLength={100}
              placeholder="Factura, proveedor o nota"
              onChange={(e) => setReferencia(e.target.value)}
              className={claseInput}
            />
          </div>
          <div>
            <label htmlFor="motivo-entrada" className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Motivo
            </label>
            <input
              id="motivo-entrada"
              value={motivo}
              disabled={cargando}
              maxLength={200}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError(null);
              }}
              className={claseInput}
            />
          </div>
        </div>

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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {cargando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          Registrar entrada
        </button>
      </footer>
    </form>
  );
}

export default FormularioEntradaInventario;
