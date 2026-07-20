import {
  Ban,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  EstadoCobro,
  EstadoPreparacion,
  Venta,
} from "../../tipos/venta";

interface HistorialVentasProps {
  ventas: Venta[];
  puedeGestionar: boolean;

  alAnular: (
    venta: Venta,
  ) => void;
}

const REGISTROS_POR_PAGINA = 8;

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

function clasePreparacion(
  estado: EstadoPreparacion,
): string {
  const clases:
    Record<
      EstadoPreparacion,
      string
    > = {
    "En preparación":
      "bg-amber-50 text-amber-700",

    Listo:
      "bg-emerald-50 text-emerald-700",

    Entregado:
      "bg-blue-50 text-blue-700",

    Anulado:
      "bg-red-50 text-red-700",
  };

  return clases[estado];
}

function claseCobro(
  estado: EstadoCobro,
): string {
  const clases:
    Record<
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

  return clases[estado];
}

function resumenProductos(
  venta: Venta,
): string {
  const productos =
    venta.detalles
      .slice(0, 2)
      .map(
        (detalle) =>
          `${detalle.cantidad}× ${detalle.nombreProducto}`,
      )
      .join(", ");

  if (
    venta.detalles.length <= 2
  ) {
    return productos;
  }

  return `${productos} y ${
    venta.detalles.length - 2
  } más`;
}

function HistorialVentas({
  ventas,
  puedeGestionar,
  alAnular,
}: HistorialVentasProps) {
  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroPreparacion,
    setFiltroPreparacion,
  ] = useState<
    "Todos" | EstadoPreparacion
  >("Todos");

  const [
    filtroCobro,
    setFiltroCobro,
  ] = useState<
    "Todos" | EstadoCobro
  >("Todos");

  const [pagina, setPagina] =
    useState(1);

  const ventasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLocaleLowerCase("es");

      return ventas.filter(
        (venta) => {
          const coincideBusqueda =
            !texto ||
            venta.numeroPedido
              .toLocaleLowerCase("es")
              .includes(texto) ||
            venta.clienteNombre
              .toLocaleLowerCase("es")
              .includes(texto) ||
            venta.detalles.some(
              (detalle) =>
                detalle.nombreProducto
                  .toLocaleLowerCase(
                    "es",
                  )
                  .includes(texto),
            );

          const coincidePreparacion =
            filtroPreparacion ===
              "Todos" ||
            venta.estadoPreparacion ===
              filtroPreparacion;

          const coincideCobro =
            filtroCobro === "Todos" ||
            venta.estadoCobro ===
              filtroCobro;

          return (
            coincideBusqueda &&
            coincidePreparacion &&
            coincideCobro
          );
        },
      );
    }, [
      ventas,
      busqueda,
      filtroPreparacion,
      filtroCobro,
    ]);

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

  const ventasPagina =
    useMemo(() => {
      const inicio =
        (paginaSegura - 1) *
        REGISTROS_POR_PAGINA;

      return ventasFiltradas.slice(
        inicio,
        inicio +
          REGISTROS_POR_PAGINA,
      );
    }, [
      ventasFiltradas,
      paginaSegura,
    ]);

  return (
    <div>
      <div
        className="
          grid gap-3
          border-b border-slate-100
          p-5
          sm:p-6
          xl:grid-cols-[minmax(0,1fr)_220px_220px]
        "
      >
        <div className="relative">
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
            placeholder="Buscar por número, cliente o producto..."
            onChange={(evento) => {
              setBusqueda(
                evento.target.value,
              );

              setPagina(1);
            }}
            className="
              h-12 w-full
              rounded-xl border
              border-slate-300
              pl-11 pr-4
              text-sm outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
            "
          />
        </div>

        <select
          value={filtroPreparacion}
          onChange={(evento) => {
            setFiltroPreparacion(
              evento.target.value as
                | "Todos"
                | EstadoPreparacion,
            );

            setPagina(1);
          }}
          className="
            h-12 rounded-xl
            border border-slate-300
            bg-white px-4
            text-sm font-semibold
            text-slate-700
            outline-none
            focus:border-red-600
            focus:ring-4
            focus:ring-red-100
          "
        >
          <option value="Todos">
            Toda preparación
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

        <select
          value={filtroCobro}
          onChange={(evento) => {
            setFiltroCobro(
              evento.target.value as
                | "Todos"
                | EstadoCobro,
            );

            setPagina(1);
          }}
          className="
            h-12 rounded-xl
            border border-slate-300
            bg-white px-4
            text-sm font-semibold
            text-slate-700
            outline-none
            focus:border-red-600
            focus:ring-4
            focus:ring-red-100
          "
        >
          <option value="Todos">
            Todos los cobros
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
      </div>

      {ventasPagina.length === 0 ? (
        <div
          className="
            flex min-h-72
            flex-col items-center
            justify-center
            p-8 text-center
          "
        >
          <Search
            size={34}
            className="text-slate-300"
          />

          <h3
            className="
              mt-4 text-lg
              font-black
              text-slate-900
            "
          >
            No existen resultados
          </h3>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Modifica los filtros de
            búsqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="
              w-full min-w-300
            "
          >
            <thead>
              <tr className="bg-slate-50">
                {[
                  "N.º de pedido",
                  "Cliente",
                  "Productos",
                  "Total",
                  "Preparación",
                  "Cobro",
                  "Registro",
                  "Acciones",
                ].map(
                  (encabezado) => (
                    <th
                      key={encabezado}
                      className="
                        px-5 py-4
                        text-left text-xs
                        font-bold uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      {encabezado}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody
              className="
                divide-y
                divide-slate-100
              "
            >
              {ventasPagina.map(
                (venta) => {
                  const puedeAnular =
                    puedeGestionar &&
                    venta.estadoCobro ===
                      "Pendiente de cobro" &&
                    venta.estadoPreparacion !==
                      "Entregado" &&
                    venta.estadoPreparacion !==
                      "Anulado";

                  return (
                    <tr
                      key={venta.id}
                      className="
                        hover:bg-slate-50/70
                      "
                    >
                      <td className="px-5 py-4">
                        <p
                          className="
                            font-black
                            text-slate-900
                          "
                        >
                          {
                            venta.numeroPedido
                          }
                        </p>
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {
                          venta.clienteNombre
                        }
                      </td>

                      <td
                        className="
                          max-w-sm
                          px-5 py-4
                          text-sm
                          text-slate-600
                        "
                      >
                        {resumenProductos(
                          venta,
                        )}

                        {venta.motivoAnulacion && (
                          <p
                            className="
                              mt-1 text-xs
                              font-semibold
                              text-red-600
                            "
                          >
                            Motivo:{" "}
                            {
                              venta.motivoAnulacion
                            }
                          </p>
                        )}
                      </td>

                      <td
                        className="
                          px-5 py-4
                          font-black
                          text-slate-900
                        "
                      >
                        {formatearMoneda(
                          venta.total,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-3 py-1
                            text-xs font-bold
                            ${clasePreparacion(
                              venta.estadoPreparacion,
                            )}
                          `}
                        >
                          {
                            venta.estadoPreparacion
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-3 py-1
                            text-xs font-bold
                            ${claseCobro(
                              venta.estadoCobro,
                            )}
                          `}
                        >
                          {venta.estadoCobro}
                        </span>
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm
                          text-slate-600
                        "
                      >
                        {formatearFechaHora(
                          venta.fechaHoraRegistro,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {puedeAnular ? (
                          <button
                            type="button"
                            onClick={() =>
                              alAnular(
                                venta,
                              )
                            }
                            className="
                              inline-flex
                              items-center gap-2
                              rounded-xl
                              bg-red-50
                              px-3 py-2
                              text-xs font-bold
                              text-red-700
                              hover:bg-red-100
                            "
                          >
                            <Ban size={15} />
                            Anular
                          </button>
                        ) : (
                          <span
                            className="
                              text-xs
                              font-semibold
                              text-slate-400
                            "
                          >
                            Sin acciones
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="
          flex flex-col gap-4
          border-t border-slate-100
          px-5 py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <p
          className="
            text-sm text-slate-500
          "
        >
          Página{" "}
          <strong
            className="text-slate-800"
          >
            {paginaSegura}
          </strong>{" "}
          de{" "}
          <strong
            className="text-slate-800"
          >
            {totalPaginas}
          </strong>
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={
              paginaSegura === 1
            }
            onClick={() =>
              setPagina(
                (paginaActual) =>
                  Math.max(
                    1,
                    paginaActual - 1,
                  ),
              )
            }
            className="
              rounded-xl border
              border-slate-300
              px-4 py-2
              text-sm font-bold
              text-slate-700
              hover:bg-slate-100
              disabled:opacity-40
            "
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={
              paginaSegura ===
              totalPaginas
            }
            onClick={() =>
              setPagina(
                (paginaActual) =>
                  Math.min(
                    totalPaginas,
                    paginaActual + 1,
                  ),
              )
            }
            className="
              rounded-xl border
              border-slate-300
              px-4 py-2
              text-sm font-bold
              text-slate-700
              hover:bg-slate-100
              disabled:opacity-40
            "
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistorialVentas;