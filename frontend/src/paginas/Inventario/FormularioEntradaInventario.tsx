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

import {
  formatearCantidadInventario,
} from "../../servicios/inventarioServicio";

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

  const stockResultante = insumo.stockActual + cantidadBase;
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
    "mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100";

  return (
    <form onSubmit={enviar} noValidate>
      <div className="space-y-5 p-5 sm:p-6">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <PackagePlus size={22} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <p className="font-black text-blue-950">{insumo.nombre}</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                Stock actual: {formatearCantidadInventario(insumo.stockActual, insumo.unidadBase)}. 1 {insumo.presentacionCompra} equivale a {formatearCantidadInventario(insumo.factorConversionCompra, insumo.unidadBase)}.
              </p>
            </div>
          </div>
        </section>

        <div>
          <label htmlFor="cantidad-entrada" className="text-sm font-bold text-slate-700">
            Cantidad de {insumo.presentacionCompra}
          </label>
          <input
            id="cantidad-entrada"
            type="number"
            value={cantidad}
            disabled={cargando}
            min="0.001"
            step="0.001"
            placeholder="Ej.: 2"
            onChange={(e) => {
              setCantidad(e.target.value);
              setError(null);
            }}
            className={claseInput}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Entrada equivalente</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {formatearCantidadInventario(cantidadBase, insumo.unidadBase)}
            </p>
          </div>
          <div className={`rounded-xl p-4 ${stockResultante < 0 ? "bg-red-50" : "bg-emerald-50"}`}>
            <p className={`text-xs font-bold uppercase ${stockResultante < 0 ? "text-red-600" : "text-emerald-600"}`}>
              Stock resultante
            </p>
            <p className={`mt-1 text-xl font-black ${stockResultante < 0 ? "text-red-900" : "text-emerald-900"}`}>
              {formatearCantidadInventario(stockResultante, insumo.unidadBase)}
            </p>
          </div>
        </div>

        {insumo.controlEconomico ? (
          <div>
            <label htmlFor="costo-entrada" className="text-sm font-bold text-slate-700">
              Costo total de la entrada
            </label>
            <div className="relative mt-2">
              <BadgeDollarSign size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="costo-entrada"
                type="number"
                value={costoTotal}
                disabled={cargando}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                onChange={(e) => {
                  setCostoTotal(e.target.value);
                  setError(null);
                }}
                className="h-12 w-full rounded-xl border border-slate-300 py-3 pl-11 pr-14 text-sm font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Bs</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Costo de esta entrada por {insumo.unidadBase}: {moneda(costoUnitario)}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">Solo control de cantidades</p>
            <p className="mt-1 text-xs text-slate-500">
              La entrada actualizará existencias sin calcular costos.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="referencia-entrada" className="text-sm font-bold text-slate-700">
              Referencia <span className="font-normal text-slate-400">Opcional</span>
            </label>
            <input
              id="referencia-entrada"
              value={referencia}
              disabled={cargando}
              maxLength={100}
              placeholder="Factura o proveedor"
              onChange={(e) => setReferencia(e.target.value)}
              className={claseInput}
            />
          </div>
          <div>
            <label htmlFor="motivo-entrada" className="text-sm font-bold text-slate-700">
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {cargando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          Registrar entrada
        </button>
      </footer>
    </form>
  );
}

export default FormularioEntradaInventario;
