import {
  BadgeDollarSign,
  BellRing,
  LoaderCircle,
  Save,
  Scale,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  InsumoInventario,
  PoliticaFaltanteInventario,
  UnidadBaseInventario,
} from "../../tipos/inventario";

export interface DatosFormularioInsumo {
  codigo: string;
  nombre: string;
  categoria: string;
  unidadBase: UnidadBaseInventario;
  presentacionCompra: string;
  factorConversionCompra: number;
  stockInicialCompra: number;
  controlarStockBajo: boolean;
  stockMinimo: number;
  politicaFaltante: PoliticaFaltanteInventario;
  controlEconomico: boolean;
  costoPorPresentacion: number | null;
}

interface Props {
  insumo: InsumoInventario | null;
  cargando: boolean;
  alGuardar: (datos: DatosFormularioInsumo) => Promise<void>;
  alCancelar: () => void;
}

interface EstadoFormulario {
  codigo: string;
  nombre: string;
  categoria: string;
  unidadBase: UnidadBaseInventario;
  presentacionCompra: string;
  factorConversionCompra: string;
  stockInicialCompra: string;
  controlarStockBajo: boolean;
  stockMinimo: string;
  politicaFaltante: PoliticaFaltanteInventario;
  controlEconomico: boolean;
  costoPorPresentacion: string;
}

function numero(valor: string): number {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
}

function esEntero(valor: number): boolean {
  return Math.abs(valor - Math.round(valor)) < 0.000001;
}

function estadoInicial(insumo: InsumoInventario | null): EstadoFormulario {
  const costoPresentacion =
    insumo?.controlEconomico && insumo.costoPromedioUnidadBase !== null
      ? (insumo.costoPromedioUnidadBase * insumo.factorConversionCompra).toFixed(2)
      : "";

  return {
    codigo: insumo?.codigo ?? "",
    nombre: insumo?.nombre ?? "",
    categoria: insumo?.categoria ?? "",
    unidadBase: insumo?.unidadBase ?? "g",
    presentacionCompra: insumo?.presentacionCompra ?? "kg",
    factorConversionCompra: insumo?.factorConversionCompra.toString() ?? "1000",
    stockInicialCompra: "0",
    controlarStockBajo: insumo?.controlarStockBajo ?? true,
    stockMinimo: Math.round(insumo?.stockMinimo ?? 0).toString(),
    politicaFaltante: insumo?.politicaFaltante ?? "Permitir con advertencia",
    controlEconomico: insumo?.controlEconomico ?? false,
    costoPorPresentacion: costoPresentacion,
  };
}

function FormularioInsumo({
  insumo,
  cargando,
  alGuardar,
  alCancelar,
}: Props) {
  const [formulario, setFormulario] = useState<EstadoFormulario>(() => estadoInicial(insumo));
  const [error, setError] = useState<string | null>(null);
  const esEdicion = insumo !== null;

  const factor = numero(formulario.factorConversionCompra);
  const stockInicialBase = numero(formulario.stockInicialCompra) * factor;
  const costoBase = useMemo(() => {
    if (!formulario.controlEconomico || factor <= 0) return 0;
    return numero(formulario.costoPorPresentacion) / factor;
  }, [formulario.controlEconomico, formulario.costoPorPresentacion, factor]);

  function actualizar<Campo extends keyof EstadoFormulario>(
    campo: Campo,
    valor: EstadoFormulario[Campo],
  ) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setError(null);
  }

  function cambiarUnidad(unidadBase: UnidadBaseInventario) {
    if (esEdicion) return;

    const porPeso = unidadBase === "g";
    const porVolumen = unidadBase === "ml";

    setFormulario((actual) => ({
      ...actual,
      unidadBase,
      presentacionCompra: porPeso ? "kg" : porVolumen ? "litro" : "unidad",
      factorConversionCompra: porPeso || porVolumen ? "1000" : "1",
      stockMinimo: "0",
      stockInicialCompra: "0",
    }));
    setError(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const codigo = formulario.codigo.trim().toUpperCase();
    const nombre = formulario.nombre.trim();
    const categoria = formulario.categoria.trim();
    const presentacion = formulario.presentacionCompra.trim();
    const stockInicial = numero(formulario.stockInicialCompra);
    const stockMinimo = numero(formulario.stockMinimo);
    const costoPresentacion = numero(formulario.costoPorPresentacion);

    if (!/^[A-Z0-9-]{3,25}$/.test(codigo)) {
      setError("El código debe tener entre 3 y 25 caracteres y usar solo letras, números o guiones.");
      return;
    }
    if (nombre.length < 3 || nombre.length > 100) {
      setError("El nombre debe contener entre 3 y 100 caracteres.");
      return;
    }
    if (categoria.length < 3 || categoria.length > 60) {
      setError("La categoría debe contener entre 3 y 60 caracteres.");
      return;
    }
    if (!presentacion || factor <= 0 || !esEntero(factor)) {
      setError(`La equivalencia debe ser una cantidad entera de ${formulario.unidadBase}.`);
      return;
    }
    if (!esEdicion && (stockInicial < 0 || !esEntero(stockInicialBase))) {
      setError(`El stock inicial debe equivaler a una cantidad entera de ${formulario.unidadBase}.`);
      return;
    }
    if (formulario.controlarStockBajo && (stockMinimo < 0 || !Number.isInteger(stockMinimo))) {
      setError(`El límite de stock debe ser un número entero en ${formulario.unidadBase}.`);
      return;
    }
    if (formulario.controlEconomico && costoPresentacion <= 0) {
      setError("Ingresa el costo actual de una presentación.");
      return;
    }

    await alGuardar({
      codigo,
      nombre,
      categoria,
      unidadBase: formulario.unidadBase,
      presentacionCompra: presentacion,
      factorConversionCompra: factor,
      stockInicialCompra: esEdicion ? 0 : stockInicial,
      controlarStockBajo: formulario.controlarStockBajo,
      stockMinimo: formulario.controlarStockBajo ? stockMinimo : 0,
      politicaFaltante: formulario.politicaFaltante,
      controlEconomico: formulario.controlEconomico,
      costoPorPresentacion: formulario.controlEconomico ? costoPresentacion : null,
    });
  }

  const claseInput =
    "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-950/50 dark:disabled:bg-slate-800";

  const claseTarjeta =
    "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900";

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
        <div className="space-y-4">
          <section className={claseTarjeta}>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">Datos del insumo</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Información que se verá en recetas, alertas y movimientos.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="codigo-insumo" className="text-sm font-bold text-slate-700 dark:text-slate-200">Código</label>
                <input
                  id="codigo-insumo"
                  value={formulario.codigo}
                  disabled={cargando}
                  maxLength={25}
                  placeholder="CARNE-HAMB"
                  onChange={(e) => actualizar("codigo", e.target.value.toUpperCase())}
                  className={`${claseInput} uppercase font-semibold`}
                />
              </div>
              <div>
                <label htmlFor="categoria-insumo" className="text-sm font-bold text-slate-700 dark:text-slate-200">Categoría</label>
                <input
                  id="categoria-insumo"
                  value={formulario.categoria}
                  disabled={cargando}
                  maxLength={60}
                  placeholder="Carnes"
                  onChange={(e) => actualizar("categoria", e.target.value)}
                  className={claseInput}
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="nombre-insumo" className="text-sm font-bold text-slate-700 dark:text-slate-200">Nombre</label>
              <input
                id="nombre-insumo"
                value={formulario.nombre}
                disabled={cargando}
                maxLength={100}
                placeholder="Carne de hamburguesa"
                onChange={(e) => actualizar("nombre", e.target.value)}
                className={claseInput}
              />
            </div>
          </section>

          <section className={claseTarjeta}>
            <div className="flex items-center gap-3">
              <Scale size={20} className="text-blue-600 dark:text-blue-300" />
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Unidad de control</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  El stock se almacena en una unidad base y las compras pueden usar otra presentación.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(["g", "ml", "unidad"] as UnidadBaseInventario[]).map((unidad) => (
                <button
                  key={unidad}
                  type="button"
                  disabled={cargando || esEdicion}
                  onClick={() => cambiarUnidad(unidad)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    formulario.unidadBase === unidad
                      ? "border-red-600 bg-red-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {unidad === "g" ? "Gramos" : unidad === "ml" ? "Mililitros" : "Unidades"}
                </button>
              ))}
            </div>

            {esEdicion && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                La unidad base queda bloqueada para proteger recetas y movimientos históricos.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="presentacion" className="text-sm font-bold text-slate-700 dark:text-slate-200">Presentación de compra</label>
                <input
                  id="presentacion"
                  value={formulario.presentacionCompra}
                  disabled={cargando}
                  maxLength={40}
                  placeholder="kg, litro, caja..."
                  onChange={(e) => actualizar("presentacionCompra", e.target.value)}
                  className={claseInput}
                />
              </div>
              <div>
                <label htmlFor="factor" className="text-sm font-bold text-slate-700 dark:text-slate-200">Equivalencia</label>
                <div className="relative">
                  <input
                    id="factor"
                    type="number"
                    value={formulario.factorConversionCompra}
                    disabled={cargando}
                    min="1"
                    step="1"
                    inputMode="numeric"
                    onChange={(e) => actualizar("factorConversionCompra", e.target.value)}
                    className={`${claseInput} pr-20`}
                  />
                  <span className="absolute bottom-3 right-4 text-xs font-bold text-slate-400">{formulario.unidadBase}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              1 {formulario.presentacionCompra || "presentación"} = {Math.round(factor || 0).toLocaleString("es-BO")} {formulario.unidadBase}
            </p>

            {!esEdicion && (
              <div className="mt-3">
                <label htmlFor="stock-inicial" className="text-sm font-bold text-slate-700 dark:text-slate-200">Stock inicial en {formulario.presentacionCompra || "presentaciones"}</label>
                <input
                  id="stock-inicial"
                  type="number"
                  value={formulario.stockInicialCompra}
                  disabled={cargando}
                  min="0"
                  step={1 / Math.max(1, factor || 1)}
                  inputMode="decimal"
                  onChange={(e) => actualizar("stockInicialCompra", e.target.value)}
                  className={claseInput}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Stock base resultante: {Math.round(stockInicialBase).toLocaleString("es-BO")} {formulario.unidadBase}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <BellRing size={20} className="text-amber-700 dark:text-amber-300" />
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Alerta de existencias</h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Define desde qué cantidad quieres recibir una alerta.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formulario.controlarStockBajo}
                  disabled={cargando}
                  onChange={(e) => actualizar("controlarStockBajo", e.target.checked)}
                  className="h-4 w-4 accent-amber-600"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Avisarme cuando llegue al límite</span>
              </label>

              {formulario.controlarStockBajo && (
                <div className="relative w-full sm:w-48">
                  <input
                    id="stock-minimo"
                    type="number"
                    value={formulario.stockMinimo}
                    disabled={cargando}
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="500"
                    onChange={(e) => actualizar("stockMinimo", e.target.value)}
                    className="h-10 w-full rounded-xl border border-amber-300 bg-white px-3 pr-16 text-sm font-bold text-slate-900 outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-white dark:focus:ring-amber-950/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{formulario.unidadBase}</span>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
              {formulario.controlarStockBajo
                ? `La alerta aparecerá cuando el stock llegue a ${Math.round(numero(formulario.stockMinimo)).toLocaleString("es-BO")} ${formulario.unidadBase} o menos.`
                : "Solo se mostrará una alerta si el saldo se vuelve negativo."}
            </p>
          </section>

          <section className={claseTarjeta}>
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-red-600 dark:text-red-300" />
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Si falta stock</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Esta regla se usa cuando una venta llevaría el saldo por debajo de cero.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(["Permitir con advertencia", "Bloquear"] as PoliticaFaltanteInventario[]).map((politica) => (
                <label
                  key={politica}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    formulario.politicaFaltante === politica
                      ? politica === "Bloquear"
                        ? "border-red-600 bg-red-50 dark:bg-red-950/30"
                        : "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="politica"
                      checked={formulario.politicaFaltante === politica}
                      disabled={cargando}
                      onChange={() => actualizar("politicaFaltante", politica)}
                      className="mt-1 accent-red-700"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{politica}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {politica === "Permitir con advertencia"
                          ? "Permite confirmar la venta y registra el saldo negativo."
                          : "Impide confirmar la venta hasta regularizar el insumo."}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <BadgeDollarSign size={20} className="text-emerald-700 dark:text-emerald-300" />
              <div>
                <h3 className="font-black text-slate-900 dark:text-white">Valoración económica</h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Úsala para estimar costo de recetas, mermas y diferencias.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formulario.controlEconomico}
                  disabled={cargando}
                  onChange={(e) => actualizar("controlEconomico", e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Calcular costos</span>
              </label>

              {formulario.controlEconomico && (
                <div className="relative w-full sm:w-52">
                  <input
                    id="costo-presentacion"
                    type="number"
                    value={formulario.costoPorPresentacion}
                    disabled={cargando}
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    onChange={(e) => actualizar("costoPorPresentacion", e.target.value)}
                    className="h-10 w-full rounded-xl border border-emerald-300 bg-white px-3 pr-12 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-white dark:focus:ring-emerald-950/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Bs</span>
                </div>
              )}
            </div>

            {formulario.controlEconomico && (
              <p className="mt-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Costo aproximado por {formulario.unidadBase}: Bs {costoBase.toFixed(4)}
              </p>
            )}
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50"
        >
          {cargando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          {esEdicion ? "Guardar cambios" : "Registrar insumo"}
        </button>
      </footer>
    </form>
  );
}

export default FormularioInsumo;
