import {
  Boxes,
  Eye,
  SearchX,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  TipoMovimientoInventario,
} from "../../tipos/inventario";

import type {
  FilaReporteInventario,
} from "../../tipos/reportes";

import Modal from "../../shared/ui/Modal";

interface PanelInventarioReportesProps {
  movimientos: FilaReporteInventario[];
  pagina: number;
  porPagina: number;
}


function fecha(valor: string): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(valor));
}

function moneda(
  valor: number | null,
): string {
  if (valor === null) {
    return "Sin costo registrado";
  }

  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function cantidad(
  valor: number,
  unidad: string,
  conSigno = false,
): string {
  const numero = new Intl.NumberFormat(
    "es-BO",
    {
      maximumFractionDigits: 3,
    },
  ).format(valor);

  return `${
    conSigno && valor > 0 ? "+" : ""
  }${numero} ${unidad}`;
}

function estilosMovimiento(
  tipo: TipoMovimientoInventario,
): string {
  const estilos: Record<
    TipoMovimientoInventario,
    string
  > = {
    "Stock inicial":
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    Entrada:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
    "Consumo automático":
      "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300",
    "Reversión por anulación":
      "bg-violet-50 text-violet-700 dark:bg-violet-950/35 dark:text-violet-300",
    "Merma por anulación":
      "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300",
    "Ajuste positivo":
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
    "Ajuste negativo":
      "bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300",
    "Conteo físico":
      "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/35 dark:text-cyan-300",
  };

  return estilos[tipo];
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
        className={`max-w-[62%] text-right text-xs font-black ${
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

function PanelInventarioReportes({
  movimientos,
  pagina,
  porPagina,
}: PanelInventarioReportesProps) {
  const [seleccionado, setSeleccionado] =
    useState<FilaReporteInventario | null>(
      null,
    );

  const movimientosPagina = movimientos.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina,
  );

  const entradas = movimientos.filter(
    (movimiento) =>
      movimiento.tipoMovimiento === "Entrada",
  ).length;

  const consumos = movimientos.filter(
    (movimiento) =>
      movimiento.tipoMovimiento ===
      "Consumo automático",
  ).length;

  const ajustesYConteos =
    movimientos.filter((movimiento) =>
      [
        "Ajuste positivo",
        "Ajuste negativo",
        "Conteo físico",
      ].includes(movimiento.tipoMovimiento),
    ).length;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-roma-50 text-roma-700 dark:bg-roma-950/40 dark:text-roma-300">
                <Boxes size={18} />
              </span>

              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Movimientos de inventario
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Entradas, consumos, ajustes y conteos registrados durante el periodo.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {movimientos.length}
                </strong>{" "}
                movimientos
              </span>
              <span>
                <strong className="text-emerald-700 dark:text-emerald-300">
                  {entradas}
                </strong>{" "}
                entradas
              </span>
              <span>
                <strong className="text-blue-700 dark:text-blue-300">
                  {consumos}
                </strong>{" "}
                consumos
              </span>
              <span>
                <strong className="text-amber-700 dark:text-amber-300">
                  {ajustesYConteos}
                </strong>{" "}
                ajustes o conteos
              </span>
            </div>
          </div>

        </header>

        {movimientos.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <SearchX
              size={34}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">
              No hay movimientos para mostrar
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Cambia el periodo, la búsqueda o el tipo de movimiento seleccionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-270">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/55">
                  {[
                    "Fecha",
                    "Insumo",
                    "Movimiento",
                    "Variación",
                    "Existencia resultante",
                    "Responsable",
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
                {movimientosPagina.map(
                  (movimiento) => (
                    <tr
                      key={movimiento.movimientoId}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                    >
                      <td className="px-5 py-4 align-middle text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {fecha(movimiento.fechaHora)}
                      </td>

                      <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                        {movimiento.insumo}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${estilosMovimiento(
                            movimiento.tipoMovimiento,
                          )}`}
                        >
                          {movimiento.tipoMovimiento}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`text-sm font-black ${
                            movimiento.cantidad < 0
                              ? "text-red-700 dark:text-red-300"
                              : movimiento.cantidad > 0
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {cantidad(
                            movimiento.cantidad,
                            movimiento.unidad,
                            true,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`text-sm font-black ${
                            movimiento.stockPosterior < 0
                              ? "text-red-700 dark:text-red-300"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {cantidad(
                            movimiento.stockPosterior,
                            movimiento.unidad,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle text-xs font-bold text-slate-700 dark:text-slate-200">
                        {movimiento.usuario}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            setSeleccionado(
                              movimiento,
                            )
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
            ? `Movimiento #${seleccionado.movimientoId}`
            : "Detalle de inventario"
        }
        descripcion="Información completa del movimiento de inventario seleccionado."
        ancho="grande"
        alCerrar={() =>
          setSeleccionado(null)
        }
      >
        {seleccionado && (
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Movimiento
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Insumo"
                  valor={seleccionado.insumo}
                  destacar
                />
                <DatoDetalle
                  etiqueta="Tipo"
                  valor={
                    seleccionado.tipoMovimiento
                  }
                />
                <DatoDetalle
                  etiqueta="Fecha y hora"
                  valor={fecha(
                    seleccionado.fechaHora,
                  )}
                />
                <DatoDetalle
                  etiqueta="Responsable"
                  valor={seleccionado.usuario}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cambio de existencia
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Existencia antes"
                  valor={cantidad(
                    seleccionado.stockAnterior,
                    seleccionado.unidad,
                  )}
                />
                <DatoDetalle
                  etiqueta="Variación registrada"
                  valor={cantidad(
                    seleccionado.cantidad,
                    seleccionado.unidad,
                    true,
                  )}
                  destacar
                />
                <DatoDetalle
                  etiqueta="Existencia después"
                  valor={cantidad(
                    seleccionado.stockPosterior,
                    seleccionado.unidad,
                  )}
                  destacar
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Origen del movimiento
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Referencia"
                  valor={
                    seleccionado.referencia ??
                    "Sin referencia asociada"
                  }
                />
                <DatoDetalle
                  etiqueta="Motivo"
                  valor={seleccionado.motivo}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Costo asociado
              </h3>
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                <DatoDetalle
                  etiqueta="Valor del movimiento"
                  valor={moneda(
                    seleccionado.impactoEconomico,
                  )}
                  destacar={
                    seleccionado.impactoEconomico !==
                    null
                  }
                />
              </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Si aparece “Sin costo registrado”, el movimiento se controló por cantidad pero no tenía un costo disponible para calcular su valor.
              </p>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}

export default PanelInventarioReportes;
