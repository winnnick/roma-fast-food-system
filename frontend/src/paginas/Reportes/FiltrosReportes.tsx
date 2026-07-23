import {
  CalendarDays,
  Download,
  Filter,
  LoaderCircle,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";

import type {
  FiltroPeriodoAnalitica,
  PeriodoRapidoAnalitica,
} from "../../tipos/analitica";

interface FiltrosReportesProps {
  periodoRapido: PeriodoRapidoAnalitica;
  filtro: FiltroPeriodoAnalitica;
  texto: string;

  cargando: boolean;
  cantidadRegistros: number;
  etiquetaExportacion: string;

  alSeleccionarPeriodo: (
    periodo: PeriodoRapidoAnalitica,
  ) => void;

  alCambiarFiltro: (
    filtro: FiltroPeriodoAnalitica,
  ) => void;

  alCambiarTexto: (texto: string) => void;
  alAplicar: () => void;
  alActualizar: () => void;
  alExportar: () => void;
  alImprimir: () => void;
}

const PERIODOS_RAPIDOS:
  PeriodoRapidoAnalitica[] = [
    "Hoy",
    "Últimos 7 días",
    "Este mes",
    "Mes anterior",
  ];

function FiltrosReportes({
  periodoRapido,
  filtro,
  texto,
  cargando,
  cantidadRegistros,
  etiquetaExportacion,
  alSeleccionarPeriodo,
  alCambiarFiltro,
  alCambiarTexto,
  alAplicar,
  alActualizar,
  alExportar,
  alImprimir,
}: FiltrosReportesProps) {
  const sinRegistros =
    cantidadRegistros === 0;

  return (
    <section
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
          flex flex-col gap-5
          2xl:flex-row
          2xl:items-end
          2xl:justify-between
        "
      >
        <div className="min-w-0">
          <div
            className="
              flex items-center gap-2
              text-sm font-black
              text-slate-900
            "
          >
            <Filter
              size={18}
              className="text-roma-700"
            />

            Periodo del reporte
          </div>

          <div
            className="
              mt-3 flex flex-wrap gap-2
            "
          >
            {PERIODOS_RAPIDOS.map(
              (periodo) => (
                <button
                  key={periodo}
                  type="button"
                  disabled={cargando}
                  onClick={() =>
                    alSeleccionarPeriodo(
                      periodo,
                    )
                  }
                  className={`
                    rounded-xl border
                    px-3.5 py-2
                    text-xs font-bold
                    transition-colors
                    sm:text-sm
                    ${
                      periodoRapido ===
                      periodo
                        ? "border-roma-700 bg-roma-700 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-roma-200 hover:bg-roma-50 hover:text-roma-700"
                    }
                    disabled:opacity-50
                  `}
                >
                  {periodo}
                </button>
              ),
            )}
          </div>
        </div>

        <div
          className="
            grid gap-3
            sm:grid-cols-2
            xl:grid-cols-[170px_170px_minmax(230px,1fr)_auto_auto_auto]
            2xl:w-[1050px]
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
              Fecha inicial
            </span>

            <div className="relative mt-1.5">
              <CalendarDays
                size={17}
                className="
                  pointer-events-none
                  absolute left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="date"
                value={filtro.fechaDesde}
                disabled={cargando}
                onChange={(evento) =>
                  alCambiarFiltro({
                    ...filtro,
                    fechaDesde:
                      evento.target.value,
                  })
                }
                className="
                  h-11 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white pl-10 pr-3
                  text-sm font-semibold
                  text-slate-700
                  outline-none
                  focus:border-roma-600
                  focus:ring-4
                  focus:ring-roma-100
                  disabled:bg-slate-100
                "
              />
            </div>
          </label>

          <label>
            <span
              className="
                text-xs font-bold
                uppercase tracking-wide
                text-slate-500
              "
            >
              Fecha final
            </span>

            <div className="relative mt-1.5">
              <CalendarDays
                size={17}
                className="
                  pointer-events-none
                  absolute left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="date"
                value={filtro.fechaHasta}
                disabled={cargando}
                onChange={(evento) =>
                  alCambiarFiltro({
                    ...filtro,
                    fechaHasta:
                      evento.target.value,
                  })
                }
                className="
                  h-11 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white pl-10 pr-3
                  text-sm font-semibold
                  text-slate-700
                  outline-none
                  focus:border-roma-600
                  focus:ring-4
                  focus:ring-roma-100
                  disabled:bg-slate-100
                "
              />
            </div>
          </label>

          <label>
            <span
              className="
                text-xs font-bold
                uppercase tracking-wide
                text-slate-500
              "
            >
              Buscar en la sección
            </span>

            <div className="relative mt-1.5">
              <Search
                size={17}
                className="
                  pointer-events-none
                  absolute left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="search"
                value={texto}
                disabled={cargando}
                placeholder="Pedido, usuario, insumo..."
                onChange={(evento) =>
                  alCambiarTexto(
                    evento.target.value,
                  )
                }
                className="
                  h-11 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white pl-10 pr-3
                  text-sm font-semibold
                  text-slate-700
                  outline-none
                  focus:border-roma-600
                  focus:ring-4
                  focus:ring-roma-100
                  disabled:bg-slate-100
                "
              />
            </div>
          </label>

          <button
            type="button"
            disabled={cargando}
            onClick={alAplicar}
            className="
              inline-flex h-11
              items-center
              justify-center gap-2
              self-end rounded-xl
              bg-slate-900 px-4
              text-sm font-bold
              text-white
              hover:bg-slate-800
              disabled:opacity-50
            "
          >
            {cargando ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Filter size={17} />
            )}

            Aplicar
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={alActualizar}
            className="
              inline-flex h-11
              items-center
              justify-center gap-2
              self-end rounded-xl
              border border-slate-300
              bg-white px-4
              text-sm font-bold
              text-slate-700
              hover:bg-slate-100
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={
                cargando
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar
          </button>

          <div
            className="
              flex items-end gap-2
              sm:col-span-2
              xl:col-span-1
            "
          >
            <button
              type="button"
              disabled={
                cargando || sinRegistros
              }
              title={`Exportar ${etiquetaExportacion} en CSV`}
              onClick={alExportar}
              className="
                inline-flex h-11
                flex-1 items-center
                justify-center gap-2
                rounded-xl
                bg-emerald-600 px-3
                text-sm font-bold
                text-white
                hover:bg-emerald-700
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <Download size={17} />
              CSV
            </button>

            <button
              type="button"
              disabled={
                cargando || sinRegistros
              }
              title={`Imprimir ${etiquetaExportacion}`}
              onClick={alImprimir}
              className="
                inline-flex h-11
                flex-1 items-center
                justify-center gap-2
                rounded-xl
                border border-slate-300
                bg-white px-3
                text-sm font-bold
                text-slate-700
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <Printer size={17} />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div
        className="
          mt-4 flex flex-wrap
          items-center justify-between
          gap-3 border-t
          border-slate-100 pt-4
        "
      >
        <p
          className="
            text-xs text-slate-500
          "
        >
          La descarga CSV puede abrirse
          directamente en Excel.
        </p>

        <span
          className="
            rounded-full
            bg-slate-100 px-3 py-1
            text-xs font-black
            text-slate-700
          "
        >
          {cantidadRegistros}{" "}
          {cantidadRegistros === 1
            ? "registro"
            : "registros"}
        </span>
      </div>
    </section>
  );
}

export default FiltrosReportes;
