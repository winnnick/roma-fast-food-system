import {
  Eye,
  ReceiptText,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  Venta,
} from "../../tipos/venta";

interface HistorialVentasProps {
  ventas: Venta[];

  alVisualizarTicket: (
    venta: Venta,
  ) => void;
}

const REGISTROS_POR_PAGINA = 8;

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
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fecha));
}

function HistorialVentas({
  ventas,
  alVisualizarTicket,
}: HistorialVentasProps) {
  const [busqueda, setBusqueda] =
    useState("");

  const [pagina, setPagina] =
    useState(1);

  const ventasOrdenadas = useMemo(
    () =>
      [...ventas].sort(
        (ventaA, ventaB) =>
          new Date(
            ventaB.fechaHoraRegistro,
          ).getTime() -
          new Date(
            ventaA.fechaHoraRegistro,
          ).getTime(),
      ),
    [ventas],
  );

  const ventasFiltradas = useMemo(
    () => {
      const texto = busqueda
        .trim()
        .toLocaleLowerCase("es");

      if (!texto) {
        return ventasOrdenadas;
      }

      return ventasOrdenadas.filter(
        (venta) =>
          venta.numeroPedido
            .toLocaleLowerCase("es")
            .includes(texto) ||
          venta.clienteNombre
            .toLocaleLowerCase("es")
            .includes(texto),
      );
    }, [busqueda, ventasOrdenadas],
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      ventasFiltradas.length /
        REGISTROS_POR_PAGINA,
    ),
  );

  const paginaSegura = Math.min(
    pagina,
    totalPaginas,
  );

  const ventasPagina = useMemo(
    () => {
      const inicio =
        (paginaSegura - 1) *
        REGISTROS_POR_PAGINA;

      return ventasFiltradas.slice(
        inicio,
        inicio +
          REGISTROS_POR_PAGINA,
      );
    }, [
      paginaSegura,
      ventasFiltradas,
    ],
  );

  return (
    <div className="p-4 sm:p-5">
      <div
        className="
          flex flex-col gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="
              pointer-events-none
              absolute left-4 top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="search"
            value={busqueda}
            placeholder="Buscar por número o cliente..."
            onChange={(evento) => {
              setBusqueda(
                evento.target.value,
              );
              setPagina(1);
            }}
            className="
              h-11 w-full rounded-xl
              border border-slate-300
              bg-white pl-11 pr-4
              text-sm font-semibold
              text-slate-800 outline-none
              transition
              placeholder:text-slate-400
              focus:border-roma-500
              focus:ring-4
              focus:ring-roma-100
              [.tema-oscuro_&]:border-slate-700
              [.tema-oscuro_&]:bg-slate-900
              [.tema-oscuro_&]:text-slate-100
              [.tema-oscuro_&]:placeholder:text-slate-500
            "
          />
        </div>

        <span
          className="
            shrink-0 rounded-full
            border border-slate-300
            bg-slate-50 px-3 py-2
            text-xs font-black
            text-slate-600
          "
        >
          {ventasFiltradas.length}
          {" "}
          registro(s)
        </span>
      </div>

      {ventasPagina.length === 0 ? (
        <div
          className="
            mt-4 flex min-h-64
            flex-col items-center
            justify-center rounded-2xl
            border border-dashed
            border-slate-300 p-6
            text-center
          "
        >
          <ReceiptText
            size={32}
            className="text-slate-300"
          />

          <p
            className="
              mt-3 font-black
              text-slate-800
            "
          >
            No hay registros
          </p>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            No existen pedidos que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {ventasPagina.map(
            (venta) => (
              <article
                key={venta.id}
                className="
                  grid gap-3 rounded-2xl
                  border border-slate-200
                  bg-slate-50 p-4
                  md:grid-cols-[120px_minmax(0,1fr)_130px_190px_150px]
                  md:items-center
                "
              >
                <div>
                  <p
                    className="
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-slate-400
                    "
                  >
                    Pedido
                  </p>

                  <p
                    className="
                      mt-1 font-black
                      text-slate-900
                    "
                  >
                    {venta.numeroPedido}
                  </p>
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-slate-400
                    "
                  >
                    Cliente
                  </p>

                  <p
                    className="
                      mt-1 truncate
                      font-bold text-slate-800
                    "
                    title={
                      venta.clienteNombre
                    }
                  >
                    {venta.clienteNombre}
                  </p>
                </div>

                <div>
                  <p
                    className="
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-slate-400
                    "
                  >
                    Total
                  </p>

                  <p
                    className="
                      mt-1 font-black
                      text-slate-900
                    "
                  >
                    {formatearMoneda(
                      venta.total,
                    )}
                  </p>
                </div>

                <div>
                  <p
                    className="
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-slate-400
                    "
                  >
                    Fecha y hora
                  </p>

                  <p
                    className="
                      mt-1 text-sm
                      font-semibold
                      text-slate-600
                    "
                  >
                    {formatearFechaHora(
                      venta.fechaHoraRegistro,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    alVisualizarTicket(
                      venta,
                    )
                  }
                  className="
                    inline-flex h-10
                    items-center justify-center
                    gap-2 rounded-xl
                    border border-slate-300
                    bg-white px-3
                    text-xs font-bold
                    text-slate-700
                    transition-colors
                    hover:bg-slate-100
                    hover:text-slate-900
                  "
                >
                  <Eye size={16} />
                  Visualizar ticket
                </button>
              </article>
            ),
          )}
        </div>
      )}

      {totalPaginas > 1 && (
        <div
          className="
            mt-5 flex flex-col
            items-center justify-between
            gap-3 border-t
            border-slate-200 pt-4
            sm:flex-row
          "
        >
          <p
            className="
              text-xs font-semibold
              text-slate-500
            "
          >
            Página {paginaSegura} de {totalPaginas}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                paginaSegura <= 1
              }
              onClick={() =>
                setPagina(
                  (actual) =>
                    Math.max(
                      1,
                      actual - 1,
                    ),
                )
              }
              className="
                rounded-xl border
                border-slate-300
                bg-white px-4 py-2
                text-xs font-bold
                text-slate-700
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={
                paginaSegura >=
                totalPaginas
              }
              onClick={() =>
                setPagina(
                  (actual) =>
                    Math.min(
                      totalPaginas,
                      actual + 1,
                    ),
                )
              }
              className="
                rounded-xl border
                border-slate-300
                bg-white px-4 py-2
                text-xs font-bold
                text-slate-700
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialVentas;
