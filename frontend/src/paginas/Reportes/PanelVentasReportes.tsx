import {
  CreditCard,
  Eye,
  ReceiptText,
  SearchX,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  FilaReporteVenta,
} from "../../tipos/reportes";

import type {
  EstadoCobro,
  EstadoPreparacion,
} from "../../tipos/venta";

import Modal from "../../shared/ui/Modal";

interface PanelVentasReportesProps {
  ventas: FilaReporteVenta[];
  pagina: number;
  porPagina: number;
}

function formatearMoneda(
  valor: number,
): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function formatearFechaHora(
  fecha: string | null,
): string {
  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(fecha));
}

function estilosCobro(
  estado: EstadoCobro,
): string {
  const estilos: Record<
    EstadoCobro,
    string
  > = {
    "Pendiente de cobro":
      "bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300",
    Cobrada:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
    "Pendiente de liquidación":
      "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/35 dark:text-fuchsia-300",
    Liquidada:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/35 dark:text-violet-300",
    Anulada:
      "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300",
  };

  return estilos[estado];
}

function estilosPreparacion(
  estado: EstadoPreparacion,
): string {
  const estilos: Record<
    EstadoPreparacion,
    string
  > = {
    "En cola":
      "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    "En preparación":
      "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300",
    "Entrega directa":
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/35 dark:text-indigo-300",
    Listo:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/35 dark:text-violet-300",
    Entregado:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
    Anulado:
      "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300",
  };

  return estilos[estado];
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

function PanelVentasReportes({
  ventas,
  pagina,
  porPagina,
}: PanelVentasReportesProps) {
  const [seleccionada, setSeleccionada] =
    useState<FilaReporteVenta | null>(
      null,
    );

  const ventasCobradas =
    ventas.filter(
      (venta) =>
        venta.estadoCobro === "Cobrada",
    );

  const ventasPendientes =
    ventas.filter(
      (venta) =>
        venta.estadoCobro ===
        "Pendiente de cobro",
    );

  const pedidosYaPendientes =
    ventas.filter(
      (venta) =>
        venta.estadoCobro ===
        "Pendiente de liquidación",
    );

  const totalCobrado =
    ventasCobradas.reduce(
      (total, venta) =>
        total + venta.total,
      0,
    );

  const totalPendiente =
    ventasPendientes.reduce(
      (total, venta) =>
        total + venta.total,
      0,
    );

  const totalPedidosYaPendiente =
    pedidosYaPendientes.reduce(
      (total, venta) => total + venta.total,
      0,
    );

  const totalDescuentos =
    ventas.reduce(
      (total, venta) =>
        total + venta.descuento,
      0,
    );

  const ventasPagina = ventas.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina,
  );

  return (
    <>
      <section
        className="
          overflow-hidden rounded-2xl
          border border-slate-200
          bg-white shadow-panel
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        <header
          className="
            border-b border-slate-100
            px-5 py-4 sm:px-6
            dark:border-slate-800
          "
        >
          <div
            className="
              flex flex-col gap-3
              xl:flex-row xl:items-start
              xl:justify-between
            "
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg bg-roma-50
                    text-roma-700
                    dark:bg-roma-950/40
                    dark:text-roma-300
                  "
                >
                  <ReceiptText size={18} />
                </span>

                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Detalle de ventas
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Consulta de pedidos, cobros y estado de preparación del periodo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {ventas.length}
                </strong>{" "}
                pedidos
              </span>
              <span>
                <strong className="text-emerald-700 dark:text-emerald-300">
                  {formatearMoneda(totalCobrado)}
                </strong>{" "}
                cobrados
              </span>
              <span>
                <strong
                  className={
                    totalPendiente > 0
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-slate-900 dark:text-white"
                  }
                >
                  {formatearMoneda(totalPendiente)}
                </strong>{" "}
                pendientes
              </span>
              {pedidosYaPendientes.length > 0 && (
                <span>
                  <strong className="text-fuchsia-700 dark:text-fuchsia-300">
                    {formatearMoneda(totalPedidosYaPendiente)}
                  </strong>{" "}
                  pendientes en PedidosYa
                </span>
              )}
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {formatearMoneda(totalDescuentos)}
                </strong>{" "}
                en descuentos
              </span>
            </div>
          </div>

        </header>

        {ventas.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <SearchX
              size={34}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">
              No hay ventas para mostrar
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Cambia el periodo, la búsqueda o los filtros de esta sección.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-7xl">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/55">
                  {[
                    "Pedido",
                    "Registro",
                    "Cliente",
                    "Canal",
                    "Total",
                    "Pago",
                    "Cobro",
                    "Preparación",
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
                {ventasPagina.map((venta) => (
                  <tr
                    key={venta.ventaId}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                  >
                    <td className="px-5 py-4 align-middle font-black text-slate-900 dark:text-white">
                      {venta.numeroPedido}
                    </td>

                    <td className="px-5 py-4 align-middle text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {formatearFechaHora(
                        venta.fechaHoraRegistro,
                      )}
                    </td>

                    <td className="px-5 py-4 align-middle text-sm font-bold text-slate-800 dark:text-slate-100">
                      {venta.cliente}
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                        venta.canalVenta === "PedidosYa"
                          ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/35 dark:text-fuchsia-300"
                          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      }`}>
                        {venta.canalVenta}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                      {formatearMoneda(
                        venta.total,
                      )}
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <CreditCard size={13} />
                        {venta.canalVenta === "PedidosYa"
                          ? "PedidosYa"
                          : venta.metodoPago ?? "Sin pago"}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${estilosCobro(
                          venta.estadoCobro,
                        )}`}
                      >
                        {venta.estadoCobro}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${estilosPreparacion(
                          venta.estadoPreparacion,
                        )}`}
                      >
                        {venta.estadoPreparacion}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          setSeleccionada(venta)
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
        abierto={seleccionada !== null}
        titulo={
          seleccionada
            ? `Detalle de ${seleccionada.numeroPedido}`
            : "Detalle de venta"
        }
        descripcion="Información completa del pedido seleccionado."
        ancho="grande"
        alCerrar={() =>
          setSeleccionada(null)
        }
      >
        {seleccionada && (
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Pedido
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Número de pedido"
                  valor={seleccionada.numeroPedido}
                  destacar
                />
                <DatoDetalle
                  etiqueta="Identificador interno"
                  valor={String(
                    seleccionada.ventaId,
                  )}
                />
                <DatoDetalle
                  etiqueta="Fecha de registro"
                  valor={formatearFechaHora(
                    seleccionada.fechaHoraRegistro,
                  )}
                />
                <DatoDetalle
                  etiqueta="Cliente"
                  valor={seleccionada.cliente}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Importes
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Subtotal"
                  valor={formatearMoneda(
                    seleccionada.subtotal,
                  )}
                />
                <DatoDetalle
                  etiqueta="Descuento aplicado"
                  valor={formatearMoneda(
                    seleccionada.descuento,
                  )}
                />
                <DatoDetalle
                  etiqueta="Total"
                  valor={formatearMoneda(
                    seleccionada.total,
                  )}
                  destacar
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cobro
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Estado del cobro"
                  valor={seleccionada.estadoCobro}
                  destacar
                />
                <DatoDetalle
                  etiqueta="Canal de venta"
                  valor={seleccionada.canalVenta}
                />
                {seleccionada.referenciaPedidosYa && (
                  <DatoDetalle
                    etiqueta="Referencia PedidosYa"
                    valor={seleccionada.referenciaPedidosYa}
                  />
                )}

                <DatoDetalle
                  etiqueta={seleccionada.canalVenta === "PedidosYa" ? "Forma de cobro" : "Método de pago"}
                  valor={
                    seleccionada.canalVenta === "PedidosYa"
                      ? "Liquidación administrativa de PedidosYa"
                      : seleccionada.metodoPago ?? "Aún no registrado"
                  }
                />
                <DatoDetalle
                  etiqueta={seleccionada.canalVenta === "PedidosYa" ? "Estado de la liquidación" : "Fecha del cobro"}
                  valor={
                    seleccionada.canalVenta === "PedidosYa"
                      ? seleccionada.estadoCobro
                      : seleccionada.fechaHoraCobro
                        ? formatearFechaHora(seleccionada.fechaHoraCobro)
                        : "Aún no cobrado"
                  }
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Preparación
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Estado del pedido"
                  valor={
                    seleccionada.estadoPreparacion
                  }
                  destacar
                />
              </dl>
            </section>

            <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Productos del pedido
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {seleccionada.productos}
              </p>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}

export default PanelVentasReportes;
