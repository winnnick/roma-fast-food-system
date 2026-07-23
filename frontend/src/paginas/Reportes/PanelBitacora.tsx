import { CircleAlert, FileJson, SearchX, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import Modal from "../../shared/ui/Modal";
import type { ModuloAuditoria, NivelAuditoria, RegistroAuditoria } from "../../tipos/auditoria";

interface Props {
  registros: RegistroAuditoria[];
  filtroModulo: "Todos" | ModuloAuditoria;
  filtroNivel: "Todos" | NivelAuditoria;
  alCambiarModulo: (valor: "Todos" | ModuloAuditoria) => void;
  alCambiarNivel: (valor: "Todos" | NivelAuditoria) => void;
}

const MODULOS: ModuloAuditoria[] = ["Autenticación","Usuarios","Roles y permisos","Productos","Clientes","Ventas","Preparación","Caja","Inventario","Recetas","Conteos físicos","Reportes","Configuración","Sistema"];
function fecha(valor:string):string { return new Intl.DateTimeFormat("es-BO", { dateStyle:"short", timeStyle:"medium" }).format(new Date(valor)); }
function estiloNivel(nivel:NivelAuditoria):string { return nivel === "Crítico" ? "bg-red-50 text-red-700" : nivel === "Advertencia" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"; }
function json(valor:unknown):string { if (valor === null) return "Sin información"; try { return JSON.stringify(valor,null,2); } catch { return String(valor); } }

function PanelBitacora({ registros, filtroModulo, filtroNivel, alCambiarModulo, alCambiarNivel }: Props) {
  const [seleccionado,setSeleccionado] = useState<RegistroAuditoria | null>(null);
  const resumen = useMemo(()=>({ info: registros.filter(r=>r.nivel === "Información").length, advertencia: registros.filter(r=>r.nivel === "Advertencia").length, critico: registros.filter(r=>r.nivel === "Crítico").length, usuarios: new Set(registros.map(r=>r.usuarioId).filter(id=>id!==null)).size }),[registros]);

  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><ShieldCheck size={22} className="text-blue-700"/><p className="mt-4 text-sm font-bold text-slate-500">Eventos</p><p className="mt-1 text-2xl font-black text-slate-900">{registros.length}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><CircleAlert size={22} className="text-amber-700"/><p className="mt-4 text-sm font-bold text-slate-500">Advertencias</p><p className="mt-1 text-2xl font-black text-slate-900">{resumen.advertencia}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><CircleAlert size={22} className="text-red-700"/><p className="mt-4 text-sm font-bold text-slate-500">Críticos</p><p className="mt-1 text-2xl font-black text-slate-900">{resumen.critico}</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><ShieldCheck size={22} className="text-violet-700"/><p className="mt-4 text-sm font-bold text-slate-500">Usuarios registrados</p><p className="mt-1 text-2xl font-black text-slate-900">{resumen.usuarios}</p><p className="mt-2 text-xs text-slate-500">{resumen.info} eventos informativos</p></article>
    </section>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck size={20} className="text-roma-700"/><h2 className="text-lg font-black text-slate-900">Bitácora administrativa</h2></div><p className="mt-1 text-sm text-slate-500">Registro inmutable de acciones realizadas desde la activación de la auditoría.</p></div><div className="grid gap-3 sm:grid-cols-2"><label><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Módulo</span><select value={filtroModulo} onChange={(e)=>alCambiarModulo(e.target.value as "Todos" | ModuloAuditoria)} className="mt-1.5 h-11 min-w-56 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-600 focus:ring-4 focus:ring-roma-100"><option value="Todos">Todos</option>{MODULOS.map(m=><option key={m} value={m}>{m}</option>)}</select></label><label><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Nivel</span><select value={filtroNivel} onChange={(e)=>alCambiarNivel(e.target.value as "Todos" | NivelAuditoria)} className="mt-1.5 h-11 min-w-48 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-600 focus:ring-4 focus:ring-roma-100"><option value="Todos">Todos</option><option value="Información">Información</option><option value="Advertencia">Advertencia</option><option value="Crítico">Crítico</option></select></label></div></div>
      {registros.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><SearchX size={36} className="text-slate-300"/><p className="mt-4 font-black text-slate-800">La bitácora todavía no tiene eventos</p><p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-500">La auditoría no inventa acciones anteriores. Empezará a registrar operaciones reales después del bloque de integración transversal.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1350px]"><thead><tr className="bg-slate-50">{["Fecha","Usuario","Rol","Módulo","Acción","Entidad","Descripción","Nivel","Origen","Detalle"].map(h=><th key={h} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{registros.map(r=><tr key={r.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-sm text-slate-600">{fecha(r.fechaHora)}</td><td className="px-5 py-4 font-black text-slate-900">{r.usuarioNombre}</td><td className="px-5 py-4 text-sm text-slate-600">{r.usuarioRol ?? "Sistema"}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{r.modulo}</span></td><td className="px-5 py-4 text-sm font-bold text-slate-700">{r.accion}</td><td className="px-5 py-4 text-sm text-slate-600">{r.entidad}{r.entidadId !== null ? ` #${r.entidadId}` : ""}</td><td className="max-w-[360px] px-5 py-4 text-sm leading-relaxed text-slate-600">{r.descripcion}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${estiloNivel(r.nivel)}`}>{r.nivel}</span></td><td className="px-5 py-4 text-sm text-slate-600">{r.origen}</td><td className="px-5 py-4"><button type="button" onClick={()=>setSeleccionado(r)} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><FileJson size={15}/>Ver</button></td></tr>)}</tbody></table></div>}
    </section>

    <Modal abierto={seleccionado !== null} titulo={seleccionado ? `${seleccionado.modulo}: ${seleccionado.accion}` : "Detalle de auditoría"} descripcion="Comparación de información anterior y posterior registrada de forma segura." ancho="grande" alCerrar={()=>setSeleccionado(null)}>{seleccionado && <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"><section><h3 className="font-black text-slate-900">Datos anteriores</h3><pre className="mt-3 max-h-[480px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">{json(seleccionado.datosAnteriores)}</pre></section><section><h3 className="font-black text-slate-900">Datos posteriores</h3><pre className="mt-3 max-h-[480px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">{json(seleccionado.datosPosteriores)}</pre></section></div>}</Modal>
  </div>;
}

export default PanelBitacora;
