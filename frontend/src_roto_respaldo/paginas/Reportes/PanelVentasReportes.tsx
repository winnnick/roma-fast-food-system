import {
  CircleDollarSign,
  Clock3,
  CreditCard,
  ReceiptText,
  SearchX,
  ShoppingBag,
} from "lucide-react";

import type {
  MetodoPago,
} from "../../tipos/caja";

import type {
  EstadoCobro,
  EstadoPreparacion,
} from "../../tipos/venta";

import type {
  FilaReporteVenta,
} from "../../tipos/reportes";

interface PanelVentasReportesProps {
  ventas: FilaReporteVenta[];

  filtroCobro: "Todos" | EstadoCobro;
  filtroPreparacion:
    | "Todos"
    | EstadoPreparacion;
  filtroMetodo:
    | "Todos"
    | MetodoPago;

  alCambiarCobro: (
    valor: "Todos" | EstadoCobro,
  ) => void;

  alCambiarPreparacion: (
    valor:
      | "Todos"
      | EstadoPreparacion,
  ) => void;

  alCambiarMetodo: (
    valor: "Todos" | MetodoPago,
  ) => void;
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
      "bg-amber-50 text-amber-700",
    Cobrada:
      "bg-emerald-50 text-emerald-700",
    Anulada:
      "bg-red-50 text-red-700",
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
    "En preparación":
      "bg-blue-50 text-blue-700",
    Listo:
      "bg-violet-50 text-violet-700",
    Entregado:
      "bg-emerald-50 text-emerald-700",
    Anulado:
      "bg-red-50 text-red-700",
  };

  return estilos[estado];
}

function PanelVentasReportes({
  ventas,
  filtroCobro,
  filtroPreparacion,
  filtroMetodo,
  alCambiarCobro,
  alCambiarPreparacion,
  alCambiarMetodo,
}: PanelVentasReportesProps) {
  const ventasCobradas =
    ventas.filter(
      (venta) =>
        venta.estadoCobro === "Cobrada",
    );

  const totalCobrado =
    ventasCobradas.reduce(
      (total, venta) =>
        total + venta.total,
      0,
    );

  const totalDescuentos =
    ventas.reduce(
      (total, venta) =>
        total + venta.descuento,
      0,
    );

  const ticketPromedio =
    ventasCobradas.length > 0
      ? totalCobrado /
        ventasCobradas.length
      : 0;

  return (
    <div className="space-y-5">
      <section
        className="
          grid gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <ReceiptText
            size={22}
            className="text-blue-700"
          />

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Pedidos mostrados
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {ventas.length}
          </p>
        </article>

        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <CircleDollarSign
            size={22}
            className="text-emerald-700"
          />

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Total cobrado
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              totalCobrado,
            )}
          </p>
        </article>

        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <ShoppingBag
            size={22}
            className="text-violet-700"
          />

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Ticket promedio
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              ticketPromedio,
            )}
          </p>
        </article>

        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <Clock3
            size={22}
            className="text-amber-700"
          />

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Descuentos
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              totalDescuentos,
            )}
          </p>
        </article>
      </section>

      <section
        className="
          overflow-hidden
          rounded-3xl border
          border-slate-200
          bg-white shadow-panel
        "
      >
        <div
          className="
            flex flex-col gap-4
            border-b border-slate-100
            p-5 sm:p-6
            xl:flex-row
            xl:items-end
            xl:justify-between
          "
        >
          <div>
            <div
              className="
                flex items-center gap-2
              "
            >
              <ReceiptText
                size={20}
                className="text-roma-700"
              />

              <h2
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Detalle de ventas
              </h2>
            </div>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Pedidos registrados dentro
              del periodo seleccionado.
            </p>
          </div>

          <div
            className="
              grid gap-3
              sm:grid-cols-3
            "
          >
            <label>
              <span
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-slate-500
                "
              >
                Estado de cobro
              </span>

              <select
                value={filtroCobro}
                onChange={(evento) =>
                  alCambiarCobro(
                    evento.target.value as
                      | "Todos"
                      | EstadoCobro,
                  )
                }
                className="
                  mt-1.5 h-11 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white px-3
                  text-sm font-semibold
                  text-slate-700
                  outline-none
                  focus:border-roma-600
                  focus:ring-4
                  focus:ring-roma-100
                "
              >
                <option value="Todos">
                  Todos
                </option>
                <option value="Pendiente de cobro">
                  Pendiente de cobro
                </option>
                <option value="Cobrada">
                  Cobrada
                </option>
                <option value="Anulada">
                  Anulada
                </option>
              </select>
            </label>

            <label>
              <span
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-slate-500
                "
              >
                Preparación
              </span>

              <select
                value={filtroPreparacion}
                onChange={(evento) =>
                  alCambiarPreparacion(
                    evento.target.value as
                      | "Todos"
                      | EstadoPreparacion,
                  )
                }
                className="
                  mt-1.5 h-11 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white px-3
                  text-sm font-semibold
                  text-slate-700
                  outline-none
                  focus:border-roma-600
                  focus:ring-4
                  focus:ring-roma-100
                "
              >
                <option value="Todos">
                  Todos
                </option>
                <option value="En preparación">
                  En preparación
                </option>
                <option value="Listo">
                  Listo
                </option>
                <option value="Entregado">
                  Entregado
                </option>
                <option value="Anulado">
                  Anulado
                </option>
              </select>
            </label>

            <label>
              <span
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-slate-500
                "
              >
                Método de pago
              </span>

              <select
                value={filtroMetodo}
                onChange={(evento) =>
                  alCambiarMetodo(
                    evento.target.value as
                      | "Todos"
                      | MetodoPago,
                  )
                }
                className="
                  mt-1.5 h-11 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white px-3
                  text-sm font-semibold
                  text-slate-700
                  outline-none
                  focus:border-roma-600
                  focus:ring-4
                  focus:ring-roma-100
                "
              >
                <option value="Todos">
                  Todos
                </option>
                <option value="Efectivo">
                  Efectivo
                </option>
                <option value="QR">
                  QR
                </option>
                <option value="Mixto">
                  Mixto
                </option>
              </select>
            </label>
          </div>
        </div>

        {ventas.length === 0 ? (
          <div
            className="
              flex min-h-72
              flex-col items-center
              justify-center
              p-8 text-center
            "
          >
            <SearchX
              size={36}
              className="text-slate-300"
            />

            <p
              className="
                mt-4 font-black
                text-slate-800
              "
            >
              No existen ventas
            </p>

            <p
              className="
                mt-1 max-w-md
                text-sm text-slate-500
              "
            >
              No hay registros que
              coincidan con el periodo y
              los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
                w-full min-w-[1450px]
              "
            >
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "Pedido",
                    "Registro",
                    "Cliente",
                    "Productos",
                    "Subtotal",
                    "Descuento",
                    "Total",
                    "Pago",
                    "Cobro",
                    "Preparación",
                  ].map((encabezado) => (
                    <th
                      key={encabezado}
                      className="
                        px-5 py-4
                        text-left
                        text-xs font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      {encabezado}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody
                className="
                  divide-y divide-slate-100
                "
              >
                {ventas.map((venta) => (
                  <tr
                    key={venta.ventaId}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p
                        className="
                          font-black
                          text-slate-900
                        "
                      >
                        {venta.numeroPedido}
                      </p>

                      <p
                        className="
                          mt-1 text-xs
                          text-slate-400
                        "
                      >
                        ID {venta.ventaId}
                      </p>
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm text-slate-600
                      "
                    >
                      {formatearFechaHora(
                        venta.fechaHoraRegistro,
                      )}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-semibold
                        text-slate-700
                      "
                    >
                      {venta.cliente}
                    </td>

                    <td
                      className="
                        max-w-[340px]
                        px-5 py-4
                        text-sm leading-relaxed
                        text-slate-600
                      "
                    >
                      {venta.productos}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-bold
                        text-slate-700
                      "
                    >
                      {formatearMoneda(
                        venta.subtotal,
                      )}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-bold
                        text-amber-700
                      "
                    >
                      {formatearMoneda(
                        venta.descuento,
                      )}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-black
                        text-slate-900
                      "
                    >
                      {formatearMoneda(
                        venta.total,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className="
                          inline-flex items-center
                          gap-2 rounded-full
                          bg-slate-100
                          px-3 py-1
                          text-xs font-bold
                          text-slate-700
                        "
                      >
                        <CreditCard size={13} />
                        {venta.metodoPago ??
                          "Sin pago"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`
                          rounded-full
                          px-3 py-1
                          text-xs font-bold
                          ${estilosCobro(
                            venta.estadoCobro,
                          )}
                        `}
                      >
                        {venta.estadoCobro}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`
                          rounded-full
                          px-3 py-1
                          text-xs font-bold
                          ${estilosPreparacion(
                            venta.estadoPreparacion,
                          )}
                        `}
                      >
                        {
                          venta.estadoPreparacion
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default PanelVentasReportes;
