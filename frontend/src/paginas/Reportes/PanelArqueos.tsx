import {
  AlertTriangle,
  Eye,
  SearchX,
  WalletCards,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  ArqueoAdministrativo,
  ResumenConciliacionCaja,
} from "../../servicios/conciliacionServicio";

import Modal from "../../shared/ui/Modal";

interface PanelArqueosProps {
  conciliacion: ResumenConciliacionCaja;
  arqueos: ArqueoAdministrativo[];
  pagina: number;
  porPagina: number;
}

function moneda(valor: number | null): string {
  if (valor === null) {
    return "—";
  }

  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function fecha(valor: string | null): string {
  if (!valor) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(valor));
}

function duracion(minutos: number | null): string {
  if (minutos === null) {
    return "En curso";
  }

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  return horas > 0
    ? `${horas} h ${resto} min`
    : `${resto} min`;
}

function estilosEstado(
  estado: ArqueoAdministrativo["estadoConciliacion"],
): string {
  if (estado === "Conciliada") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300";
  }

  if (estado === "Abierta") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300";
  }

  return "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300";
}

function estilosDiferencia(
  valor: number | null,
): string {
  if (valor === null) {
    return "text-slate-500 dark:text-slate-400";
  }

  if (valor < -0.009) {
    return "text-red-700 dark:text-red-300";
  }

  if (valor > 0.009) {
    return "text-blue-700 dark:text-blue-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

function DatoDetalle({
  etiqueta,
  valor,
  destacar = false,
}: {
  etiqueta: string;
  valor: string;
  destacar?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {etiqueta}
      </dt>
      <dd
        className={`max-w-[60%] text-right text-xs font-black ${
          destacar
            ? "text-slate-900 dark:text-white"
            : "text-slate-700 dark:text-slate-200"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function PanelArqueos({
  conciliacion,
  arqueos,
  pagina,
  porPagina,
}: PanelArqueosProps) {
  const [seleccionado, setSeleccionado] =
    useState<ArqueoAdministrativo | null>(
      null,
    );

  const arqueosPagina = arqueos.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina,
  );

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-roma-50 text-roma-700 dark:bg-roma-950/40 dark:text-roma-300">
                <WalletCards size={18} />
              </span>

              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Arqueos y control de caja
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Revisión de aperturas, cobros y resultado de cada cierre de caja.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {arqueos.length}
                </strong>{" "}
                sesiones mostradas
              </span>
              <span>
                <strong className="text-blue-700 dark:text-blue-300">
                  {conciliacion.sesionesAbiertas}
                </strong>{" "}
                abiertas
              </span>
              <span>
                <strong
                  className={
                    conciliacion.sesionesConDiferencias > 0
                      ? "text-red-700 dark:text-red-300"
                      : "text-emerald-700 dark:text-emerald-300"
                  }
                >
                  {conciliacion.sesionesConDiferencias}
                </strong>{" "}
                cierres con diferencia
              </span>
              <span>
                Diferencia acumulada{" "}
                <strong
                  className={estilosDiferencia(
                    conciliacion.diferenciaAcumulada,
                  )}
                >
                  {moneda(
                    conciliacion.diferenciaAcumulada,
                  )}
                </strong>
              </span>
            </div>
          </div>

        </header>

        {arqueos.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <SearchX
              size={34}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">
              No hay sesiones de caja para mostrar
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Cambia el periodo o la búsqueda para consultar otros arqueos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-245">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/55">
                  {[
                    "Sesión",
                    "Apertura",
                    "Responsable",
                    "Total cobrado",
                    "Diferencia",
                    "Estado",
                    "Detalle",
                  ].map((encabezado) => (
                    <th
                      key={encabezado}
                      className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {encabezado}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {arqueosPagina.map((arqueo) => (
                  <tr
                    key={arqueo.sesionCajaId}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                  >
                    <td className="px-5 py-4 align-middle font-black text-slate-900 dark:text-white">
                      #{arqueo.sesionCajaId}
                    </td>

                    <td className="px-5 py-4 align-middle text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {fecha(arqueo.fechaHoraApertura)}
                    </td>

                    <td className="px-5 py-4 align-middle text-xs font-bold text-slate-700 dark:text-slate-200">
                      {arqueo.usuarioAperturaNombre}
                    </td>

                    <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                      {moneda(arqueo.totalPagos)}
                    </td>

                    <td
                      className={`px-5 py-4 align-middle text-sm font-black ${estilosDiferencia(
                        arqueo.diferenciaRegistrada,
                      )}`}
                    >
                      {arqueo.estadoCaja === "Abierta"
                        ? "En curso"
                        : moneda(
                            arqueo.diferenciaRegistrada,
                          )}
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${estilosEstado(
                          arqueo.estadoConciliacion,
                        )}`}
                      >
                        {arqueo.estadoConciliacion === "Conciliada"
                          ? "Sin diferencia"
                          : arqueo.estadoConciliacion}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          setSeleccionado(arqueo)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-roma-300 hover:bg-roma-50 hover:text-roma-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roma-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-roma-700 dark:hover:bg-roma-950/35 dark:hover:text-roma-200"
                      >
                        <Eye size={14} />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        abierto={seleccionado !== null}
        titulo={
          seleccionado
            ? `Detalle de caja #${seleccionado.sesionCajaId}`
            : "Detalle de arqueo"
        }
        descripcion="Desglose de cobros, movimientos y resultado del cierre seleccionado."
        ancho="grande"
        alCerrar={() => setSeleccionado(null)}
      >
        {seleccionado && (
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Sesión y responsables
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle etiqueta="Apertura" valor={fecha(seleccionado.fechaHoraApertura)} />
                <DatoDetalle etiqueta="Responsable de apertura" valor={seleccionado.usuarioAperturaNombre} />
                <DatoDetalle etiqueta="Cierre" valor={seleccionado.fechaHoraCierre ? fecha(seleccionado.fechaHoraCierre) : "Sesión aún abierta"} />
                <DatoDetalle etiqueta="Responsable de cierre" valor={seleccionado.usuarioCierreNombre ?? "Aún no registrado"} />
                <DatoDetalle etiqueta="Duración" valor={duracion(seleccionado.duracionMinutos)} />
                <DatoDetalle etiqueta="Monto inicial" valor={moneda(seleccionado.montoInicial)} destacar />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cobros registrados
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle etiqueta="Cantidad de pagos" valor={String(seleccionado.cantidadPagos)} />
                <DatoDetalle etiqueta="Total cobrado" valor={moneda(seleccionado.totalPagos)} destacar />
                <DatoDetalle etiqueta="Efectivo" valor={moneda(seleccionado.totalPagosEfectivo)} />
                <DatoDetalle etiqueta="QR" valor={moneda(seleccionado.totalPagosQr)} />
                <DatoDetalle etiqueta="Ingresos manuales" valor={moneda(seleccionado.ingresosManuales)} />
                <DatoDetalle etiqueta="Egresos manuales" valor={moneda(seleccionado.egresosManuales)} />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Resultado del cierre
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle etiqueta="Efectivo esperado calculado" valor={moneda(seleccionado.efectivoEsperadoCalculado)} destacar />
                <DatoDetalle etiqueta="Efectivo esperado registrado" valor={seleccionado.efectivoEsperadoRegistrado === null ? "Aún no registrado" : moneda(seleccionado.efectivoEsperadoRegistrado)} />
                <DatoDetalle etiqueta="Monto contado" valor={seleccionado.montoContado === null ? "Aún no registrado" : moneda(seleccionado.montoContado)} destacar />
                <DatoDetalle etiqueta="Diferencia del cierre" valor={seleccionado.diferenciaRegistrada === null ? "Aún no calculada" : moneda(seleccionado.diferenciaRegistrada)} destacar />
                <DatoDetalle etiqueta="Estado" valor={seleccionado.estadoConciliacion === "Conciliada" ? "Cierre sin diferencia" : seleccionado.estadoConciliacion} />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Comprobaciones automáticas del cierre
              </h3>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Estas comparaciones permiten detectar si los cobros y los movimientos de caja coinciden. Un resultado de Bs 0,00 significa que no se encontró diferencia.
              </p>
              <dl className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle etiqueta="Diferencia entre cobros y movimientos de venta" valor={moneda(seleccionado.diferenciaPagosVsMovimientos)} />
                <DatoDetalle etiqueta="Diferencia de efectivo entre cobros y movimientos" valor={moneda(seleccionado.diferenciaEfectivoPagosVsMovimientos)} />
                <DatoDetalle etiqueta="Diferencia de QR entre cobros y movimientos" valor={moneda(seleccionado.diferenciaQrPagosVsMovimientos)} />
                <DatoDetalle etiqueta="Diferencia entre efectivo esperado calculado y registrado" valor={seleccionado.diferenciaEsperadoCalculadoVsRegistrado === null ? "Aún no disponible" : moneda(seleccionado.diferenciaEsperadoCalculadoVsRegistrado)} />
              </dl>

              {(seleccionado.observacionApertura ||
                seleccionado.observacionCierre) && (
                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                  {seleccionado.observacionApertura && (
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      <strong>Observación de apertura:</strong>{" "}
                      {seleccionado.observacionApertura}
                    </p>
                  )}
                  {seleccionado.observacionCierre && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      <strong>Observación de cierre:</strong>{" "}
                      {seleccionado.observacionCierre}
                    </p>
                  )}
                </div>
              )}
            </section>

            {seleccionado.alertas.length > 0 && (
              <section className="lg:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/25">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle size={17} />
                  <h3 className="text-xs font-black uppercase tracking-wide">
                    Alertas detectadas
                  </h3>
                </div>
                <ul className="mt-3 space-y-2">
                  {seleccionado.alertas.map((alerta) => (
                    <li
                      key={alerta}
                      className="text-xs leading-relaxed text-amber-800 dark:text-amber-200"
                    >
                      • {alerta}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default PanelArqueos;
