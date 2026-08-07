import {
  CalendarDays,
  Filter,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import type {
  FiltroPeriodoAnalitica,
  PeriodoRapidoAnalitica,
} from "../../tipos/analitica";

interface FiltrosDashboardProps {
  periodoRapido:
    PeriodoRapidoAnalitica;

  filtro:
    FiltroPeriodoAnalitica;

  cargando: boolean;

  alSeleccionarPeriodo: (
    periodo: PeriodoRapidoAnalitica,
  ) => void;

  alCambiarFiltro: (
    filtro: FiltroPeriodoAnalitica,
  ) => void;

  alAplicar: () => void;
  alActualizar: () => void;
}

const PERIODOS_RAPIDOS:
  PeriodoRapidoAnalitica[] = [
    "Hoy",
    "Últimos 7 días",
    "Este mes",
    "Mes anterior",
  ];

function FiltrosDashboard({
  periodoRapido,
  filtro,
  cargando,
  alSeleccionarPeriodo,
  alCambiarFiltro,
  alAplicar,
  alActualizar,
}: FiltrosDashboardProps) {
  return (
    <section
      className="
        rounded-2xl border
        border-slate-200
        bg-white p-4
        shadow-panel
      "
    >
      <div
        className="
          flex flex-col gap-4
          xl:flex-row
          xl:items-end
          xl:justify-between
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

            Periodo de análisis
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
            xl:grid-cols-[170px_170px_auto_auto]
          "
        >
          <label>
            <span
              className="
                text-xs font-bold
                uppercase
                tracking-wide
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
                uppercase
                tracking-wide
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
              transition-colors
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
              transition-colors
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
        </div>
      </div>
    </section>
  );
}

export default FiltrosDashboard;
