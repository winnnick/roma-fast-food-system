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
    stockMinimo: insumo?.stockMinimo.toString() ?? "0",
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
  const [formulario, setFormulario] = useState<EstadoFormulario>(() =>
    estadoInicial(insumo),
  );
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
    }));
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
    if (!presentacion || factor <= 0) {
      setError("La presentación y su equivalencia deben ser válidas.");
      return;
    }
    if (!esEdicion && stockInicial < 0) {
      setError("El stock inicial no puede ser negativo.");
      return;
    }
    if (formulario.controlarStockBajo && stockMinimo < 0) {
      setError("El límite de stock bajo no puede ser negativo.");
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
    "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100";

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-black text-slate-900">Identificación del insumo</h3>
            <p className="mt-1 text-xs text-slate-500">
              Estos datos se utilizarán en recetas y movimientos.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="codigo-insumo" className="text-sm font-bold text-slate-700">
                  Código
                </label>
                <input
                  id="codigo-insumo"
                  value={formulario.codigo}
                  disabled={cargando}
                  maxLength={25}
                  placeholder="Ej.: CARNE-HAMB"
                  onChange={(e) => actualizar("codigo", e.target.value.toUpperCase())}
                  className={`${claseInput} uppercase font-semibold`}
                />
              </div>

              <div>
                <label htmlFor="categoria-insumo" className="text-sm font-bold text-slate-700">
                  Categoría
                </label>
                <input
                  id="categoria-insumo"
                  value={formulario.categoria}
                  disabled={cargando}
                  maxLength={60}
                  placeholder="Ej.: Carnes"
                  onChange={(e) => actualizar("categoria", e.target.value)}
                  className={claseInput}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="nombre-insumo" className="text-sm font-bold text-slate-700">
                Nombre
              </label>
              <input
                id="nombre-insumo"
                value={formulario.nombre}
                disabled={cargando}
                maxLength={100}
                placeholder="Ej.: Carne de hamburguesa"
                onChange={(e) => actualizar("nombre", e.target.value)}
                className={claseInput}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <Scale size={21} className="text-red-700" />
              <div>
                <h3 className="font-black text-slate-900">Unidad y conversión</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Toda existencia se guarda en la unidad base.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(["g", "ml", "unidad"] as UnidadBaseInventario[]).map((unidad) => (
                <button
                  key={unidad}
                  type="button"
                  disabled={cargando || esEdicion}
                  onClick={() => cambiarUnidad(unidad)}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-65 ${
                    formulario.unidadBase === unidad
                      ? "border-red-700 bg-red-50 text-red-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {unidad === "g" ? "Gramos" : unidad === "ml" ? "Mililitros" : "Unidades"}
                </button>
              ))}
            </div>

            {esEdicion && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                La unidad base no puede cambiarse porque podría alterar recetas y movimientos históricos.
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="presentacion" className="text-sm font-bold text-slate-700">
                  Presentación de compra
                </label>
                <input
                  id="presentacion"
                  value={formulario.presentacionCompra}
                  disabled={cargando}
                  maxLength={40}
                  placeholder="kg, paquete, caja"
                  onChange={(e) => actualizar("presentacionCompra", e.target.value)}
                  className={claseInput}
                />
              </div>

              <div>
                <label htmlFor="factor" className="text-sm font-bold text-slate-700">
                  Equivalencia en {formulario.unidadBase}
                </label>
                <input
                  id="factor"
                  type="number"
                  value={formulario.factorConversionCompra}
                  disabled={cargando}
                  min="0.001"
                  step="0.001"
                  onChange={(e) => actualizar("factorConversionCompra", e.target.value)}
                  className={claseInput}
                />
              </div>
            </div>

            <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700">
              1 {formulario.presentacionCompra || "presentación"} = {factor || 0} {formulario.unidadBase}.
            </p>

            {!esEdicion && (
              <div className="mt-4">
                <label htmlFor="stock-inicial" className="text-sm font-bold text-slate-700">
                  Stock inicial en {formulario.presentacionCompra || "presentaciones"}
                </label>
                <input
                  id="stock-inicial"
                  type="number"
                  value={formulario.stockInicialCompra}
                  disabled={cargando}
                  min="0"
                  step="0.001"
                  onChange={(e) => actualizar("stockInicialCompra", e.target.value)}
                  className={claseInput}
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Equivale a {stockInicialBase} {formulario.unidadBase}.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-center gap-3">
              <BellRing size={21} className="text-amber-700" />
              <div>
                <h3 className="font-black text-slate-900">Alerta de stock bajo</h3>
                <p className="mt-1 text-xs text-slate-600">
                  El límite se configura individualmente para este insumo.
                </p>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white p-4">
              <input
                type="checkbox"
                checked={formulario.controlarStockBajo}
                disabled={cargando}
                onChange={(e) => actualizar("controlarStockBajo", e.target.checked)}
                className="mt-1 h-4 w-4 accent-amber-600"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">Controlar stock bajo</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  Al desactivarlo, solo se alertará si el saldo llega a ser negativo.
                </span>
              </span>
            </label>

            {formulario.controlarStockBajo && (
              <div className="mt-4">
                <label htmlFor="stock-minimo" className="text-sm font-bold text-slate-700">
                  Mostrar alerta desde
                </label>
                <div className="relative mt-2">
                  <input
                    id="stock-minimo"
                    type="number"
                    value={formulario.stockMinimo}
                    disabled={cargando}
                    min="0"
                    step="0.001"
                    placeholder="Ej.: 500"
                    onChange={(e) => actualizar("stockMinimo", e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-20 text-sm font-bold outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {formulario.unidadBase}
                  </span>
                </div>
                <p className="mt-2 text-xs text-amber-700">
                  Con 500 g, la alerta se activa cuando el stock llega a 500 g o menos.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert size={21} className="text-red-700" />
              <div>
                <h3 className="font-black text-slate-900">Política ante faltantes</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Define qué ocurrirá si una venta deja el saldo en negativo.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(["Permitir con advertencia", "Bloquear"] as PoliticaFaltanteInventario[]).map(
                (politica) => (
                  <label
                    key={politica}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                      formulario.politicaFaltante === politica
                        ? "border-red-600 bg-red-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="politica"
                      checked={formulario.politicaFaltante === politica}
                      disabled={cargando}
                      onChange={() => actualizar("politicaFaltante", politica)}
                      className="mt-1 accent-red-700"
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-800">{politica}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {politica === "Permitir con advertencia"
                          ? "El cajero podrá confirmar la venta y el stock teórico quedará negativo."
                          : "La venta no podrá continuar hasta regularizar el insumo."}
                      </span>
                    </span>
                  </label>
                ),
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="flex items-center gap-3">
              <BadgeDollarSign size={21} className="text-emerald-700" />
              <div>
                <h3 className="font-black text-slate-900">Valoración económica</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Puede activarse o desactivarse en cualquier momento.
                </p>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4">
              <input
                type="checkbox"
                checked={formulario.controlEconomico}
                disabled={cargando}
                onChange={(e) => actualizar("controlEconomico", e.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">Calcular impacto económico</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  Si está desactivado, se controlarán cantidades sin calcular costos o pérdidas.
                </span>
              </span>
            </label>

            {formulario.controlEconomico && (
              <div className="mt-4">
                <label htmlFor="costo-presentacion" className="text-sm font-bold text-slate-700">
                  Costo por {formulario.presentacionCompra || "presentación"}
                </label>
                <div className="relative mt-2">
                  <input
                    id="costo-presentacion"
                    type="number"
                    value={formulario.costoPorPresentacion}
                    disabled={cargando}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => actualizar("costoPorPresentacion", e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-14 text-sm font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Bs</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Costo por {formulario.unidadBase}: Bs {costoBase.toFixed(6)}
                </p>
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>
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
          {esEdicion ? "Guardar cambios" : "Registrar insumo"}
        </button>
      </footer>
    </form>
  );
}

export default FormularioInsumo;
