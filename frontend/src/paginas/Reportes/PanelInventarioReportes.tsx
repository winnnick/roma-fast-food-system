import { Boxes, CircleDollarSign, SearchX, SlidersHorizontal } from "lucide-react";
import type { TipoMovimientoInventario } from "../../tipos/inventario";
import type { FilaReporteInventario } from "../../tipos/reportes";

interface Props {
  movimientos: FilaReporteInventario[];
  filtroTipo: "Todos" | TipoMovimientoInventario;
  alCambiarTipo: (valor: "Todos" | TipoMovimientoInventario) => void;
}

const TIPOS: TipoMovimientoInventario[] = ["Stock inicial","Entrada","Consumo automático","Reversión por anulación","Merma por anulación","Ajuste positivo","Ajuste negativo","Conteo físico"];

function fecha(valor: string): string { return new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)); }
function moneda(valor: number | null): string { return valor === null ? "Sin valoración" : `Bs ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)}`; }
function cantidad(valor: number, unidad: string): string { return `${valor > 0 ? "+" : ""}${new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 }).format(valor)} ${unidad}`; }

function PanelInventarioReportes({ movimientos, filtroTipo, alCambiarTipo }: Props) {
  const entradas = movimientos.filter((m)=>m.tipoMovimiento === "Entrada").length;
  const consumos = movimientos.filter((m)=>m.tipoMovimiento === "Consumo automático").length;
  const ajustes = movimientos.filter((m)=>m.tipoMovimiento === "Ajuste positivo" || m.tipoMovimiento === "Ajuste negativo" || m.tipoMovimiento === "Conteo físico").length;
  const impacto = movimientos.reduce((t,m)=>t + Math.abs(m.impactoEconomico ?? 0),0);

  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><Boxes size={22} className="text-blue-700"/><p className="mt-4 text-sm font-bold text-slate-500">Movimientos</p><p className="mt-1 text-2xl font-black text-slate-900">{movimientos.length}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><Boxes size={22} className="text-emerald-700"/><p className="mt-4 text-sm font-bold text-slate-500">Entradas</p><p className="mt-1 text-2xl font-black text-slate-900">{entradas}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><SlidersHorizontal size={22} className="text-amber-700"/><p className="mt-4 text-sm font-bold text-slate-500">Consumos / ajustes</p><p className="mt-1 text-2xl font-black text-slate-900">{consumos} / {ajustes}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><CircleDollarSign size={22} className="text-violet-700"/><p className="mt-4 text-sm font-bold text-slate-500">Impacto valorado</p><p className="mt-1 text-2xl font-black text-slate-900">{moneda(impacto)}</p></article>
    </section>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div><div className="flex items-center gap-2"><Boxes size={20} className="text-roma-700"/><h2 className="text-lg font-black text-slate-900">Movimientos de inventario</h2></div><p className="mt-1 text-sm text-slate-500">Trazabilidad de entradas, consumos, ajustes y conteos.</p></div>
        <label><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tipo</span><select value={filtroTipo} onChange={(e)=>alCambiarTipo(e.target.value as "Todos" | TipoMovimientoInventario)} className="mt-1.5 h-11 min-w-60 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-600 focus:ring-4 focus:ring-roma-100"><option value="Todos">Todos</option>{TIPOS.map((tipo)=><option key={tipo} value={tipo}>{tipo}</option>)}</select></label>
      </div>
      {movimientos.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><SearchX size={36} className="text-slate-300"/><p className="mt-4 font-black text-slate-800">Sin movimientos</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1450px]"><thead><tr className="bg-slate-50">{["Fecha","Insumo","Tipo","Cantidad","Stock anterior","Stock posterior","Usuario","Referencia","Motivo","Impacto"].map((h)=><th key={h} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{movimientos.map((m)=><tr key={m.movimientoId} className="hover:bg-slate-50"><td className="px-5 py-4 text-sm text-slate-600">{fecha(m.fechaHora)}</td><td className="px-5 py-4 font-black text-slate-900">{m.insumo}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{m.tipoMovimiento}</span></td><td className={`px-5 py-4 text-sm font-black ${m.cantidad < 0 ? "text-red-700" : "text-emerald-700"}`}>{cantidad(m.cantidad,m.unidad)}</td><td className="px-5 py-4 text-sm font-semibold text-slate-600">{cantidad(m.stockAnterior,m.unidad)}</td><td className={`px-5 py-4 text-sm font-black ${m.stockPosterior < 0 ? "text-red-700" : "text-slate-900"}`}>{cantidad(m.stockPosterior,m.unidad)}</td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{m.usuario}</td><td className="px-5 py-4 text-sm text-slate-600">{m.referencia ?? "—"}</td><td className="max-w-[360px] px-5 py-4 text-sm leading-relaxed text-slate-600">{m.motivo}</td><td className="px-5 py-4 text-sm font-bold text-slate-700">{moneda(m.impactoEconomico)}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

export default PanelInventarioReportes;
