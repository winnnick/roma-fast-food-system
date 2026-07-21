import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock3,
  PackageCheck,
  WalletCards,
} from "lucide-react";

import type {
  EstadoPreparacion,
  Venta,
} from "../../tipos/venta";

interface PanelPreparacionProps {
  ventas: Venta[];
  puedeGestionar: boolean;
  puedeCobrar: boolean;

  alCambiarEstado: (
    venta: Venta,
    estado: EstadoPreparacion,
  ) => void;

  alAnular: (
    venta: Venta,
  ) => void;

  alCobrar: (
    venta: Venta,
  ) => void;
}

interface TarjetaPedidoProps {
  venta: Venta;
  puedeGestionar: boolean;
  puedeCobrar: boolean;

  alCambiarEstado: (
    venta: Venta,
    estado: EstadoPreparacion,
  ) => void;

  alAnular: (
    venta: Venta,
  ) => void;

  alCobrar: (
    venta: Venta,
  ) => void;
}

function formatearHora(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(fecha));
}

function formatearMoneda(
  valor: number,
): string {
  const monto =
    new Intl.NumberFormat(
      "es-BO",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(valor);

  return `Bs ${monto}`;
}

function obtenerResumenProductos(
  venta: Venta,
): string {
  const productos =
    venta.detalles
      .slice(0, 3)
      .map(
        (detalle) =>
          `${detalle.cantidad}× ${detalle.nombreProducto}`,
      )
      .join(", ");

  if (
    venta.detalles.length <= 3
  ) {
    return productos;
  }

  return `${productos} y ${
    venta.detalles.length - 3
  } más`;
}

function TarjetaPedido({
  venta,
  puedeGestionar,
  puedeCobrar,
  alCambiarEstado,
  alAnular,
  alCobrar,
}: TarjetaPedidoProps) {
  const estaListo =
    venta.estadoPreparacion ===
    "Listo";

  const puedeMostrarAcciones =
    puedeGestionar ||
    (puedeCobrar &&
      venta.estadoCobro ===
        "Pendiente de cobro");

  return (
    <article
      className={`
        overflow-hidden rounded-3xl
        border bg-white
        shadow-sm transition-shadow
        hover:shadow-md
        ${
          estaListo
            ? "border-emerald-200"
            : "border-amber-200"
        }
      `}
    >
      <div
        className={`
          flex items-center
          justify-between gap-4
          px-5 py-4
          ${
            estaListo
              ? "bg-emerald-50"
              : "bg-amber-50"
          }
        `}
      >
        <div>
          <p
            className="
              text-xs font-bold
              uppercase tracking-wider
              text-slate-500
            "
          >
            N.º de pedido
          </p>

          <h3
            className="
              mt-1 text-2xl
              font-black
              text-slate-950
            "
          >
            {venta.numeroPedido}
          </h3>
        </div>

        <div
          className={`
            flex h-12 w-12
            items-center
            justify-center
            rounded-2xl
            ${
              estaListo
                ? "bg-emerald-600 text-white"
                : "bg-amber-500 text-white"
            }
          `}
        >
          {estaListo ? (
            <CheckCircle2 size={24} />
          ) : (
            <ChefHat size={24} />
          )}
        </div>
      </div>

      <div className="p-5">
        <div
          className="
            flex flex-wrap
            items-center gap-3
          "
        >
          <span
            className={`
              inline-flex rounded-full
              px-3 py-1
              text-xs font-bold
              ${
                estaListo
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }
            `}
          >
            {venta.estadoPreparacion}
          </span>

          <span
            className={`
              inline-flex rounded-full
              px-3 py-1
              text-xs font-bold
              ${
                venta.estadoCobro ===
                "Cobrada"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-700"
              }
            `}
          >
            {venta.estadoCobro}
          </span>

          <span
            className="
              inline-flex items-center
              gap-1.5 text-xs
              font-semibold
              text-slate-500
            "
          >
            <Clock3 size={14} />

            {formatearHora(
              estaListo &&
                venta.fechaHoraListo
                ? venta.fechaHoraListo
                : venta
                    .fechaHoraInicioPreparacion,
            )}
          </span>
        </div>

        <p
          className="
            mt-4 font-bold
            text-slate-900
          "
        >
          {venta.clienteNombre}
        </p>

        <p
          className="
            mt-2 text-sm
            leading-relaxed
            text-slate-600
          "
        >
          {obtenerResumenProductos(
            venta,
          )}
        </p>

        {venta.observaciones && (
          <p
            className="
              mt-3 rounded-xl
              bg-slate-50 p-3
              text-xs italic
              leading-relaxed
              text-slate-500
            "
          >
            {venta.observaciones}
          </p>
        )}

        <div
          className="
            mt-5 flex items-center
            justify-between gap-3
            border-t border-slate-100
            pt-4
          "
        >
          <span
            className="
              text-xs font-semibold
              text-slate-500
            "
          >
            Total
          </span>

          <strong
            className="
              text-lg font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              venta.total,
            )}
          </strong>
        </div>

        {puedeMostrarAcciones ? (
          <div
            className="
              mt-5 grid gap-2
              sm:grid-cols-2
            "
          >
            {puedeGestionar &&
              venta.estadoPreparacion ===
                "En preparación" && (
                <button
                  type="button"
                  onClick={() =>
                    alCambiarEstado(
                      venta,
                      "Listo",
                    )
                  }
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    rounded-xl
                    bg-emerald-600
                    px-4 py-3
                    text-sm font-bold
                    text-white
                    hover:bg-emerald-700
                  "
                >
                  <CheckCircle2
                    size={17}
                  />

                  Marcar listo
                </button>
              )}

            {puedeGestionar &&
              venta.estadoPreparacion ===
                "Listo" && (
                <button
                  type="button"
                  onClick={() =>
                    alCambiarEstado(
                      venta,
                      "Entregado",
                    )
                  }
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    rounded-xl
                    bg-blue-600
                    px-4 py-3
                    text-sm font-bold
                    text-white
                    hover:bg-blue-700
                  "
                >
                  <PackageCheck
                    size={17}
                  />

                  Marcar entregado
                </button>
              )}

            {puedeCobrar &&
              venta.estadoCobro ===
                "Pendiente de cobro" && (
                <button
                  type="button"
                  onClick={() =>
                    alCobrar(venta)
                  }
                  className="
                    inline-flex items-center
                    justify-center gap-2
                    rounded-xl
                    bg-indigo-600
                    px-4 py-3
                    text-sm font-bold
                    text-white
                    hover:bg-indigo-700
                  "
                >
                  <WalletCards
                    size={17}
                  />

                  Cobrar
                </button>
              )}

            {puedeGestionar && (
              <button
                type="button"
                onClick={() =>
                  alAnular(venta)
                }
                className="
                  inline-flex items-center
                  justify-center gap-2
                  rounded-xl
                  bg-red-50
                  px-4 py-3
                  text-sm font-bold
                  text-red-700
                  hover:bg-red-100
                "
              >
                <Ban size={17} />

                Anular
              </button>
            )}
          </div>
        ) : (
          <p
            className="
              mt-5 text-center
              text-xs font-semibold
              text-slate-400
            "
          >
            Modo de consulta
          </p>
        )}
      </div>
    </article>
  );
}

function PanelPreparacion({
  ventas,
  puedeGestionar,
  puedeCobrar,
  alCambiarEstado,
  alAnular,
  alCobrar,
}: PanelPreparacionProps) {
  const ventasEnPreparacion =
    ventas
      .filter(
        (venta) =>
          venta.estadoPreparacion ===
          "En preparación",
      )
      .sort(
        (ventaA, ventaB) =>
          new Date(
            ventaA.fechaHoraRegistro,
          ).getTime() -
          new Date(
            ventaB.fechaHoraRegistro,
          ).getTime(),
      );

  const ventasListas =
    ventas
      .filter(
        (venta) =>
          venta.estadoPreparacion ===
          "Listo",
      )
      .sort(
        (ventaA, ventaB) =>
          new Date(
            ventaA.fechaHoraListo ??
              ventaA.fechaHoraRegistro,
          ).getTime() -
          new Date(
            ventaB.fechaHoraListo ??
              ventaB.fechaHoraRegistro,
          ).getTime(),
      );

  return (
    <div className="p-5 sm:p-6">
      <div
        className="
          grid gap-8
          2xl:grid-cols-2
        "
      >
        <section>
          <div
            className="
              flex items-center
              justify-between gap-4
            "
          >
            <div>
              <h2
                className="
                  text-xl font-black
                  text-slate-900
                "
              >
                En preparación
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-slate-500
                "
              >
                Pedidos que actualmente
                están siendo preparados.
              </p>
            </div>

            <span
              className="
                rounded-full
                bg-amber-100
                px-3 py-1
                text-sm font-black
                text-amber-700
              "
            >
              {
                ventasEnPreparacion.length
              }
            </span>
          </div>

          {ventasEnPreparacion.length ===
          0 ? (
            <div
              className="
                mt-5 rounded-3xl
                border border-dashed
                border-slate-300
                p-10 text-center
              "
            >
              <ChefHat
                size={34}
                className="
                  mx-auto text-slate-300
                "
              />

              <p
                className="
                  mt-4 font-bold
                  text-slate-700
                "
              >
                No hay pedidos en
                preparación
              </p>
            </div>
          ) : (
            <div
              className="
                mt-5 grid gap-4
                xl:grid-cols-2
                2xl:grid-cols-1
              "
            >
              {ventasEnPreparacion.map(
                (venta) => (
                  <TarjetaPedido
                    key={venta.id}
                    venta={venta}
                    puedeGestionar={
                      puedeGestionar
                    }
                    puedeCobrar={
                      puedeCobrar
                    }
                    alCambiarEstado={
                      alCambiarEstado
                    }
                    alAnular={
                      alAnular
                    }
                    alCobrar={
                      alCobrar
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>

        <section>
          <div
            className="
              flex items-center
              justify-between gap-4
            "
          >
            <div>
              <h2
                className="
                  text-xl font-black
                  text-slate-900
                "
              >
                Listos para entregar
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-slate-500
                "
              >
                Pedidos terminados que
                esperan ser recogidos.
              </p>
            </div>

            <span
              className="
                rounded-full
                bg-emerald-100
                px-3 py-1
                text-sm font-black
                text-emerald-700
              "
            >
              {ventasListas.length}
            </span>
          </div>

          {ventasListas.length === 0 ? (
            <div
              className="
                mt-5 rounded-3xl
                border border-dashed
                border-slate-300
                p-10 text-center
              "
            >
              <CheckCircle2
                size={34}
                className="
                  mx-auto text-slate-300
                "
              />

              <p
                className="
                  mt-4 font-bold
                  text-slate-700
                "
              >
                No hay pedidos listos
              </p>
            </div>
          ) : (
            <div
              className="
                mt-5 grid gap-4
                xl:grid-cols-2
                2xl:grid-cols-1
              "
            >
              {ventasListas.map(
                (venta) => (
                  <TarjetaPedido
                    key={venta.id}
                    venta={venta}
                    puedeGestionar={
                      puedeGestionar
                    }
                    puedeCobrar={
                      puedeCobrar
                    }
                    alCambiarEstado={
                      alCambiarEstado
                    }
                    alAnular={
                      alAnular
                    }
                    alCobrar={
                      alCobrar
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PanelPreparacion;