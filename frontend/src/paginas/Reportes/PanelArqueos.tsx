import {
  AlertTriangle,
  Banknote,
  CircleCheckBig,
  Clock3,
  SearchX,
  WalletCards,
} from "lucide-react";

import type {
  ArqueoAdministrativo,
  ResumenConciliacionCaja,
} from "../../servicios/conciliacionServicio";

interface PanelArqueosProps {
  conciliacion: ResumenConciliacionCaja;
  arqueos: ArqueoAdministrativo[];
}

function moneda(valor: number | null): string {
  if (valor === null) return "—";
  return `Bs ${new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)}`;
}

function fecha(valor: string | null): string {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
}

function duracion(minutos: number | null): string {
  if (minutos === null) return "Sesión abierta";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas} h ${resto} min` : `${resto} min`;
}

function PanelArqueos({ conciliacion, arqueos }: PanelArqueosProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <WalletCards size={22} className="text-blue-700" />
          <p className="mt-4 text-sm font-bold text-slate-500">Sesiones</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{conciliacion.totalSesiones}</p>
          <p className="mt-2 text-xs text-slate-500">{conciliacion.sesionesAbiertas} abiertas</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <CircleCheckBig size={22} className="text-emerald-700" />
          <p className="mt-4 text-sm font-bold text-slate-500">Conciliadas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{conciliacion.sesionesConciliadas}</p>
          <p className="mt-2 text-xs text-slate-500">Sin diferencias administrativas</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <AlertTriangle size={22} className="text-red-700" />
          <p className="mt-4 text-sm font-bold text-slate-500">Con diferencias</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{conciliacion.sesionesConDiferencias}</p>
          <p className="mt-2 text-xs text-slate-500">{conciliacion.diasConFaltante} faltantes · {conciliacion.diasConSobrante} sobrantes</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <Banknote size={22} className="text-violet-700" />
          <p className="mt-4 text-sm font-bold text-slate-500">Diferencia acumulada</p>
          <p className={`mt-1 text-2xl font-black ${conciliacion.diferenciaAcumulada < 0 ? "text-red-700" : "text-slate-900"}`}>{moneda(conciliacion.diferenciaAcumulada)}</p>
          <p className="mt-2 text-xs text-slate-500">Total cobrado: {moneda(conciliacion.totalCobrado)}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <WalletCards size={20} className="text-roma-700" />
            <h2 className="text-lg font-black text-slate-900">Historial de arqueos y conciliación</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Comparación entre pagos, movimientos de caja y cierre declarado.</p>
        </div>

        {arqueos.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <SearchX size={36} className="text-slate-300" />
            <p className="mt-4 font-black text-slate-800">Sin arqueos</p>
            <p className="mt-1 text-sm text-slate-500">No existen sesiones que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1750px]">
              <thead><tr className="bg-slate-50">{["Sesión","Apertura","Cierre","Duración","Responsables","Inicial","Pagos","Efectivo","QR","Ingresos","Egresos","Esperado","Contado","Diferencia","Conciliación","Alertas"].map((h)=><th key={h} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {arqueos.map((arqueo)=><tr key={arqueo.sesionCajaId} className="hover:bg-slate-50">
                  <td className="px-5 py-4"><p className="font-black text-slate-900">#{arqueo.sesionCajaId}</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${arqueo.estadoCaja === "Abierta" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{arqueo.estadoCaja}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{fecha(arqueo.fechaHoraApertura)}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{fecha(arqueo.fechaHoraCierre)}</td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600"><Clock3 size={14}/>{duracion(arqueo.duracionMinutos)}</span></td>
                  <td className="px-5 py-4 text-sm"><p className="font-bold text-slate-700">Abrió: {arqueo.usuarioAperturaNombre}</p><p className="mt-1 text-slate-500">Cerró: {arqueo.usuarioCierreNombre ?? "—"}</p></td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">{moneda(arqueo.montoInicial)}</td>
                  <td className="px-5 py-4"><p className="text-sm font-black text-slate-900">{moneda(arqueo.totalPagos)}</p><p className="mt-1 text-xs text-slate-400">{arqueo.cantidadPagos} pagos</p></td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-700">{moneda(arqueo.totalPagosEfectivo)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-blue-700">{moneda(arqueo.totalPagosQr)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-700">{moneda(arqueo.ingresosManuales)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-red-700">{moneda(arqueo.egresosManuales)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">{moneda(arqueo.efectivoEsperadoCalculado)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">{moneda(arqueo.montoContado)}</td>
                  <td className={`px-5 py-4 text-sm font-black ${(arqueo.diferenciaRegistrada ?? 0) < 0 ? "text-red-700" : (arqueo.diferenciaRegistrada ?? 0) > 0 ? "text-blue-700" : "text-emerald-700"}`}>{moneda(arqueo.diferenciaRegistrada)}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${arqueo.estadoConciliacion === "Conciliada" ? "bg-emerald-50 text-emerald-700" : arqueo.estadoConciliacion === "Abierta" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>{arqueo.estadoConciliacion}</span></td>
                  <td className="max-w-[340px] px-5 py-4">{arqueo.alertas.length === 0 ? <span className="text-xs font-bold text-emerald-700">Sin alertas</span> : <ul className="space-y-1 text-xs text-red-700">{arqueo.alertas.map((alerta)=><li key={alerta}>• {alerta}</li>)}</ul>}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default PanelArqueos;
