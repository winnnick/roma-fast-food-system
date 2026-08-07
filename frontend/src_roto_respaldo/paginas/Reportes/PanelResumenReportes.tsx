import {
  AlertTriangle,
  Banknote,
  Boxes,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ReceiptText,
  Scale,
  ShoppingBag,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import type {
  PanelAdministrativo,
} from "../../tipos/analitica";

import type {
  ResumenConciliacionCaja,
} from "../../servicios/conciliacionServicio";

interface PanelResumenReportesProps {
  panel: PanelAdministrativo;
  conciliacion: ResumenConciliacionCaja;
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

function formatearPorcentaje(
  valor: number,
): string {
  return `${new Intl.NumberFormat(
    "es-BO",
    {
      maximumFractionDigits: 1,
    },
  ).format(valor)}%`;
}

function PanelResumenReportes({
  panel,
  conciliacion,
}: PanelResumenReportesProps) {
  const totalAlertasInventario =
    panel.inventario.insumosStockBajo +
    panel.inventario.insumosStockNegativo;

  const metodosPago =
    panel.metodosPago.reduce(
      (acumulado, metodo) => ({
        efectivo:
          acumulado.efectivo +
          metodo.montoEfectivo,
        qr:
          acumulado.qr +
          metodo.montoQr,
      }),
      {
        efectivo: 0,
        qr: 0,
      },
    );

  return (
    <div className="space-y-6">
      <section
        className="
          grid gap-5
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <TarjetaMetrica
          titulo="Ventas netas"
          valor={formatearMoneda(
            panel.comerciales.ventasNetas,
          )}
          descripcion="Importe cobrado en el periodo"
          icono={CircleDollarSign}
          tono="roma"
          variacion={
            panel.comerciales
              .variacionVentas.porcentaje
          }
        />

        <TarjetaMetrica
          titulo="Pedidos registrados"
          valor={String(
            panel.comerciales
              .pedidosRegistrados,
          )}
          descripcion={`${panel.comerciales.pedidosCobrados} cobrados`}
          icono={ReceiptText}
          tono="azul"
          variacion={
            panel.comerciales
              .variacionPedidos.porcentaje
          }
        />

        <TarjetaMetrica
          titulo="Ticket promedio"
          valor={formatearMoneda(
            panel.comerciales.ticketPromedio,
          )}
          descripcion="Promedio por pago cobrado"
          icono={ShoppingBag}
          tono="verde"
          variacion={
            panel.comerciales
              .variacionTicket.porcentaje
          }
        />

        <TarjetaMetrica
          titulo="Pendiente de cobro"
          valor={formatearMoneda(
            panel.comerciales
              .ventasPendientes,
          )}
          descripcion={`${panel.comerciales.pedidosPendientes} pedidos pendientes`}
          icono={Clock3}
          tono="ambar"
        />
      </section>

      <section
        className="
          grid gap-5
          md:grid-cols-2
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
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-emerald-100
                text-emerald-700
              "
            >
              <Banknote size={22} />
            </div>

            <span
              className="
                rounded-full
                bg-emerald-50
                px-3 py-1
                text-xs font-black
                text-emerald-700
              "
            >
              Efectivo
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Cobros en efectivo
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              metodosPago.efectivo,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            Incluye componentes en efectivo
            de pagos mixtos.
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
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-700
              "
            >
              <CreditCard size={22} />
            </div>

            <span
              className="
                rounded-full
                bg-blue-50 px-3 py-1
                text-xs font-black
                text-blue-700
              "
            >
              QR
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Cobros mediante QR
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              metodosPago.qr,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            Incluye componentes QR de pagos
            mixtos.
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
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-amber-100
                text-amber-700
              "
            >
              <Boxes size={22} />
            </div>

            <span
              className={`
                rounded-full px-3 py-1
                text-xs font-black
                ${
                  totalAlertasInventario > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }
              `}
            >
              {totalAlertasInventario} alertas
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Estado del inventario
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {
              panel.inventario
                .insumosStockNegativo
            }{" "}
            negativos
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            {
              panel.inventario
                .insumosStockBajo
            }{" "}
            insumos con stock bajo.
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
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-100
                text-violet-700
              "
            >
              <Scale size={22} />
            </div>

            <span
              className="
                rounded-full
                bg-violet-50
                px-3 py-1
                text-xs font-black
                text-violet-700
              "
            >
              Cobertura
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Valoración económica
          </p>

          <p
            className="
              mt-1 text-2xl font-black
              text-slate-900
            "
          >
            {formatearPorcentaje(
              panel.inventario
                .coberturaValoracionPorcentaje,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            Costo de consumo valorado:{" "}
            {formatearMoneda(
              panel.inventario
                .costoConsumoValorado,
            )}
          </p>
        </article>
      </section>

      <section
        className="
          grid gap-6
          xl:grid-cols-2
        "
      >
        <article
          className="
            rounded-3xl border
            border-slate-200
            bg-white p-5
            shadow-panel
            sm:p-6
          "
        >
          <div
            className="
              flex items-center gap-2
            "
          >
            <WalletCards
              size={21}
              className="text-blue-700"
            />

            <h2
              className="
                text-lg font-black
                text-slate-900
              "
            >
              Resumen de arqueos
            </h2>
          </div>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Conciliación entre cobros,
            movimientos y cierres de caja.
          </p>

          <div
            className="
              mt-5 grid gap-3
              sm:grid-cols-2
            "
          >
            <div
              className="
                rounded-2xl bg-slate-50 p-4
              "
            >
              <p
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-slate-500
                "
              >
                Sesiones conciliadas
              </p>

              <p
                className="
                  mt-1 text-2xl font-black
                  text-emerald-700
                "
              >
                {
                  conciliacion
                    .sesionesConciliadas
                }
              </p>
            </div>

            <div
              className="
                rounded-2xl bg-red-50 p-4
              "
            >
              <p
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-red-600
                "
              >
                Con diferencias
              </p>

              <p
                className="
                  mt-1 text-2xl font-black
                  text-red-800
                "
              >
                {
                  conciliacion
                    .sesionesConDiferencias
                }
              </p>
            </div>

            <div
              className="
                rounded-2xl bg-amber-50 p-4
              "
            >
              <p
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-amber-600
                "
              >
                Días con faltante
              </p>

              <p
                className="
                  mt-1 text-2xl font-black
                  text-amber-800
                "
              >
                {
                  conciliacion
                    .diasConFaltante
                }
              </p>
            </div>

            <div
              className="
                rounded-2xl bg-blue-50 p-4
              "
            >
              <p
                className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-blue-600
                "
              >
                Diferencia acumulada
              </p>

              <p
                className={`
                  mt-1 text-2xl font-black
                  ${
                    conciliacion
                      .diferenciaAcumulada < 0
                      ? "text-red-800"
                      : "text-blue-800"
                  }
                `}
              >
                {formatearMoneda(
                  conciliacion
                    .diferenciaAcumulada,
                )}
              </p>
            </div>
          </div>
        </article>

        <article
          className="
            rounded-3xl border
            border-slate-200
            bg-white p-5
            shadow-panel
            sm:p-6
          "
        >
          <div
            className="
              flex items-center gap-2
            "
          >
            <AlertTriangle
              size={21}
              className="text-amber-700"
            />

            <h2
              className="
                text-lg font-black
                text-slate-900
              "
            >
              Riesgos administrativos
            </h2>
          </div>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Indicadores que requieren
            seguimiento del administrador.
          </p>

          <div className="mt-5 space-y-3">
            <div
              className="
                flex items-center
                justify-between gap-4
                rounded-2xl
                bg-slate-50 p-4
              "
            >
              <div
                className="
                  flex items-center gap-3
                "
              >
                <TrendingDown
                  size={19}
                  className="text-red-700"
                />

                <span
                  className="
                    text-sm font-bold
                    text-slate-700
                  "
                >
                  Pedidos anulados
                </span>
              </div>

              <span
                className="
                  font-black text-red-700
                "
              >
                {
                  panel.comerciales
                    .pedidosAnulados
                }
              </span>
            </div>

            <div
              className="
                flex items-center
                justify-between gap-4
                rounded-2xl
                bg-slate-50 p-4
              "
            >
              <div
                className="
                  flex items-center gap-3
                "
              >
                <ReceiptText
                  size={19}
                  className="text-amber-700"
                />

                <span
                  className="
                    text-sm font-bold
                    text-slate-700
                  "
                >
                  Descuentos otorgados
                </span>
              </div>

              <span
                className="
                  font-black
                  text-amber-700
                "
              >
                {formatearMoneda(
                  panel.comerciales
                    .descuentosOtorgados,
                )}
              </span>
            </div>

            <div
              className="
                flex items-center
                justify-between gap-4
                rounded-2xl
                bg-slate-50 p-4
              "
            >
              <div
                className="
                  flex items-center gap-3
                "
              >
                <Boxes
                  size={19}
                  className="text-orange-700"
                />

                <span
                  className="
                    text-sm font-bold
                    text-slate-700
                  "
                >
                  Productos sin receta
                </span>
              </div>

              <span
                className="
                  font-black
                  text-orange-700
                "
              >
                {
                  panel.inventario
                    .productosActivosSinReceta
                }
              </span>
            </div>

            <div
              className="
                flex items-center
                justify-between gap-4
                rounded-2xl
                bg-slate-50 p-4
              "
            >
              <div
                className="
                  flex items-center gap-3
                "
              >
                <CircleDollarSign
                  size={19}
                  className="text-violet-700"
                />

                <span
                  className="
                    text-sm font-bold
                    text-slate-700
                  "
                >
                  Mermas valoradas
                </span>
              </div>

              <span
                className="
                  font-black
                  text-violet-700
                "
              >
                {formatearMoneda(
                  panel.inventario
                    .costoMermasValoradas,
                )}
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

export default PanelResumenReportes;
