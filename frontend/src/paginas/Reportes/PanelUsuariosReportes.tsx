import {
  Eye,
  SearchX,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  FilaReporteUsuario,
} from "../../tipos/reportes";

import Modal from "../../shared/ui/Modal";

interface PanelUsuariosReportesProps {
  usuarios: FilaReporteUsuario[];
  pagina: number;
  porPagina: number;
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
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

function PanelUsuariosReportes({
  usuarios,
  pagina,
  porPagina,
}: PanelUsuariosReportesProps) {
  const [seleccionado, setSeleccionado] =
    useState<FilaReporteUsuario | null>(
      null,
    );

  const usuariosOrdenados = useMemo(
    () =>
      [...usuarios].sort(
        (a, b) =>
          b.totalAcciones - a.totalAcciones ||
          a.usuario.localeCompare(
            b.usuario,
            "es",
          ),
      ),
    [usuarios],
  );

  const totalVentas = usuarios.reduce(
    (total, usuario) =>
      total + usuario.ventasRegistradas,
    0,
  );

  const totalCobros = usuarios.reduce(
    (total, usuario) =>
      total + usuario.cobrosRealizados,
    0,
  );

  const totalAcciones = usuarios.reduce(
    (total, usuario) =>
      total + usuario.totalAcciones,
    0,
  );

  const usuariosPagina = usuariosOrdenados.slice(
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
                <UsersRound size={18} />
              </span>

              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Actividad por usuario
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Operaciones atribuidas a cada responsable durante el periodo consultado.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {usuarios.length}
                </strong>{" "}
                usuarios con actividad
              </span>
              <span>
                <strong className="text-roma-700 dark:text-roma-300">
                  {totalVentas}
                </strong>{" "}
                ventas
              </span>
              <span>
                <strong className="text-emerald-700 dark:text-emerald-300">
                  {totalCobros}
                </strong>{" "}
                cobros
              </span>
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {totalAcciones}
                </strong>{" "}
                acciones registradas
              </span>
            </div>
          </div>
        </header>

        {usuariosOrdenados.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <SearchX
              size={34}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">
              No hay actividad atribuida
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Cambia el periodo o la búsqueda para consultar la actividad de otros usuarios.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-260">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/55">
                  {[
                    "Usuario",
                    "Ventas",
                    "Cobros",
                    "Inventario",
                    "Caja",
                    "Acciones registradas",
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
                {usuariosPagina.map(
                  (usuario) => (
                    <tr
                      key={`${usuario.usuarioId ?? "sin-id"}-${usuario.usuario}`}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                    >
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <UserRoundCheck size={17} />
                          </span>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {usuario.usuario}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                        {usuario.ventasRegistradas}
                      </td>

                      <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                        {usuario.cobrosRealizados}
                      </td>

                      <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                        {usuario.movimientosInventario}
                      </td>

                      <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                        {usuario.movimientosCaja +
                          usuario.aperturasCaja +
                          usuario.cierresCaja}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white dark:bg-slate-100 dark:text-slate-900">
                          {usuario.totalAcciones}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            setSeleccionado(usuario)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-roma-300 hover:bg-roma-50 hover:text-roma-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roma-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-roma-700 dark:hover:bg-roma-950/35 dark:hover:text-roma-200"
                        >
                          <Eye size={14} />
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        abierto={seleccionado !== null}
        titulo={
          seleccionado
            ? `Actividad de ${seleccionado.usuario}`
            : "Detalle de actividad"
        }
        descripcion="Desglose de las operaciones atribuidas al responsable seleccionado."
        ancho="grande"
        alCerrar={() =>
          setSeleccionado(null)
        }
      >
        {seleccionado && (
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Responsable
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Usuario"
                  valor={seleccionado.usuario}
                  destacar
                />
                <DatoDetalle
                  etiqueta="Identificador"
                  valor={
                    seleccionado.usuarioId === null
                      ? "Usuario del sistema"
                      : String(
                          seleccionado.usuarioId,
                        )
                  }
                />
                <DatoDetalle
                  etiqueta="Acciones registradas"
                  valor={String(
                    seleccionado.totalAcciones,
                  )}
                  destacar
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Ventas y cobros
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Ventas registradas"
                  valor={String(
                    seleccionado.ventasRegistradas,
                  )}
                />
                <DatoDetalle
                  etiqueta="Monto de esas ventas"
                  valor={moneda(
                    seleccionado.montoVentasRegistradas,
                  )}
                />
                <DatoDetalle
                  etiqueta="Cobros realizados"
                  valor={String(
                    seleccionado.cobrosRealizados,
                  )}
                />
                <DatoDetalle
                  etiqueta="Monto cobrado"
                  valor={moneda(
                    seleccionado.montoCobrado,
                  )}
                  destacar
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Inventario y caja
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Movimientos de inventario"
                  valor={String(
                    seleccionado.movimientosInventario,
                  )}
                />
                <DatoDetalle
                  etiqueta="Movimientos manuales de caja"
                  valor={String(
                    seleccionado.movimientosCaja,
                  )}
                />
                <DatoDetalle
                  etiqueta="Aperturas de caja"
                  valor={String(
                    seleccionado.aperturasCaja,
                  )}
                />
                <DatoDetalle
                  etiqueta="Cierres de caja"
                  valor={String(
                    seleccionado.cierresCaja,
                  )}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Trazabilidad
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Eventos registrados en bitácora"
                  valor={String(
                    seleccionado.eventosAuditoria,
                  )}
                />
                <DatoDetalle
                  etiqueta="Total de acciones"
                  valor={String(
                    seleccionado.totalAcciones,
                  )}
                  destacar
                />
              </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                El total reúne ventas, cobros, inventario, operaciones de caja y eventos de bitácora atribuidos a este usuario.
              </p>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}

export default PanelUsuariosReportes;
