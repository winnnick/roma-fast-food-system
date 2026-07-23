import { Banknote, Boxes, ReceiptText, SearchX, UserRoundCheck, UsersRound } from "lucide-react";
import type { FilaReporteUsuario } from "../../tipos/reportes";

interface Props { usuarios: FilaReporteUsuario[]; }
function moneda(valor: number): string { return `Bs ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)}`; }

function PanelUsuariosReportes({ usuarios }: Props) {
  const totalVentas = usuarios.reduce((t,u)=>t+u.ventasRegistradas,0);
  const totalInventario = usuarios.reduce((t,u)=>t+u.movimientosInventario,0);
  const totalCaja = usuarios.reduce((t,u)=>t+u.movimientosCaja+u.aperturasCaja+u.cierresCaja,0);

  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><UsersRound size={22} className="text-violet-700"/><p className="mt-4 text-sm font-bold text-slate-500">Usuarios con actividad</p><p className="mt-1 text-2xl font-black text-slate-900">{usuarios.length}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><ReceiptText size={22} className="text-roma-700"/><p className="mt-4 text-sm font-bold text-slate-500">Ventas atribuidas</p><p className="mt-1 text-2xl font-black text-slate-900">{totalVentas}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><Boxes size={22} className="text-amber-700"/><p className="mt-4 text-sm font-bold text-slate-500">Movimientos de inventario</p><p className="mt-1 text-2xl font-black text-slate-900">{totalInventario}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><Banknote size={22} className="text-blue-700"/><p className="mt-4 text-sm font-bold text-slate-500">Acciones de caja</p><p className="mt-1 text-2xl font-black text-slate-900">{totalCaja}</p></article>
    </section>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex items-center gap-2"><UsersRound size={20} className="text-violet-700"/><h2 className="text-lg font-black text-slate-900">Actividad por usuario</h2></div><p className="mt-1 text-sm text-slate-500">Resumen neutral de operaciones; no representa una evaluación de desempeño.</p></div>
      {usuarios.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><SearchX size={36} className="text-slate-300"/><p className="mt-4 font-black text-slate-800">Sin actividad atribuida</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1200px]"><thead><tr className="bg-slate-50">{["Usuario","Ventas","Monto registrado","Cobros","Monto cobrado","Inventario","Movimientos caja","Aperturas","Cierres","Total acciones"].map((h)=><th key={h} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{usuarios.map((u)=><tr key={`${u.usuarioId ?? "sin-id"}-${u.usuario}`} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><UserRoundCheck size={18}/></div><div><p className="font-black text-slate-900">{u.usuario}</p><p className="mt-1 text-xs text-slate-400">ID {u.usuarioId ?? "no disponible"}</p></div></div></td><td className="px-5 py-4 text-sm font-black text-slate-900">{u.ventasRegistradas}</td><td className="px-5 py-4 text-sm font-bold text-slate-700">{moneda(u.montoVentasRegistradas)}</td><td className="px-5 py-4 text-sm font-black text-slate-900">{u.cobrosRealizados}</td><td className="px-5 py-4 text-sm font-bold text-emerald-700">{moneda(u.montoCobrado)}</td><td className="px-5 py-4 text-sm font-black text-slate-700">{u.movimientosInventario}</td><td className="px-5 py-4 text-sm font-black text-slate-700">{u.movimientosCaja}</td><td className="px-5 py-4 text-sm font-black text-blue-700">{u.aperturasCaja}</td><td className="px-5 py-4 text-sm font-black text-blue-700">{u.cierresCaja}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">{u.totalAcciones}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

export default PanelUsuariosReportes;
