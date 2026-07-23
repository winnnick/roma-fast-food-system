import {
  Activity,
  Banknote,
  Boxes,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  ReceiptText,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import type {
  ActividadOperativa,
  ModuloActividadOperativa,
  NivelActividadOperativa,
} from "../../tipos/analitica";

interface ActividadRecienteProps {
  actividades: ActividadOperativa[];
}

function obtenerIcono(
  modulo: ModuloActividadOperativa,
) {
  const iconos = {
    Ventas: ReceiptText,
    Caja: Banknote,
    Inventario: Boxes,
    Recetas: UtensilsCrossed,
    Auditoría: ShieldCheck,
  };

  return iconos[modulo];
}

function obtenerEstiloNivel(
  nivel: NivelActividadOperativa,
): string {
  const estilos: Record<
    NivelActividadOperativa,
    string
  > = {
    Normal:
      "bg-emerald-100 text-emerald-700",
    Atención:
      "bg-amber-100 text-amber-700",
    Crítico:
      "bg-red-100 text-red-700",
  };

  return estilos[nivel];
}

function formatearFechaHora(
  fechaHora: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(fechaHora));
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

function ActividadReciente({
  actividades,
}: ActividadRecienteProps) {
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
          flex items-start
          justify-between gap-4
        "
      >
        <div>
          <div
            className="
              flex items-center gap-2
            "
          >
            <Activity
              size={20}
              className="text-blue-700"
            />

            <h2
              className="
                text-lg font-black
                text-slate-900
              "
            >
              Actividad reciente
            </h2>
          </div>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Movimientos detectados en
            ventas, caja e inventario.
          </p>
        </div>

        <Clock3
          size={20}
          className="text-slate-300"
        />
      </div>

      {actividades.length === 0 ? (
        <div
          className="
            mt-5 rounded-2xl
            border border-dashed
            border-slate-300
            p-8 text-center
          "
        >
          <CircleCheckBig
            size={32}
            className="
              mx-auto text-slate-300
            "
          />

          <p
            className="
              mt-3 text-sm
              font-bold
              text-slate-600
            "
          >
            Sin actividad en el periodo
          </p>
        </div>
      ) : (
        <div
          className="
            mt-5 max-h-[540px]
            space-y-1 overflow-y-auto
            pr-1
          "
        >
          {actividades.map(
            (actividad) => {
              const Icono =
                obtenerIcono(
                  actividad.modulo,
                );

              return (
                <article
                  key={actividad.id}
                  className="
                    flex items-start gap-3
                    rounded-2xl p-3
                    transition-colors
                    hover:bg-slate-50
                  "
                >
                  <div
                    className={`
                      flex h-10 w-10
                      shrink-0 items-center
                      justify-center
                      rounded-xl
                      ${obtenerEstiloNivel(
                        actividad.nivel,
                      )}
                    `}
                  >
                    <Icono size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        flex flex-wrap
                        items-center gap-x-2
                        gap-y-1
                      "
                    >
                      <p
                        className="
                          text-sm font-black
                          text-slate-900
                        "
                      >
                        {actividad.accion}
                      </p>

                      {actividad.nivel !==
                        "Normal" && (
                        <span
                          className={`
                            inline-flex
                            items-center gap-1
                            rounded-full
                            px-2 py-0.5
                            text-[10px]
                            font-black
                            ${obtenerEstiloNivel(
                              actividad.nivel,
                            )}
                          `}
                        >
                          <CircleAlert
                            size={11}
                          />
                          {actividad.nivel}
                        </span>
                      )}
                    </div>

                    <p
                      className="
                        mt-1 text-sm
                        leading-relaxed
                        text-slate-600
                      "
                    >
                      {actividad.descripcion}
                    </p>

                    <div
                      className="
                        mt-2 flex flex-wrap
                        items-center gap-x-3
                        gap-y-1
                        text-xs
                        text-slate-400
                      "
                    >
                      <span
                        className="
                          font-semibold
                          text-slate-500
                        "
                      >
                        {
                          actividad.usuarioNombre
                        }
                      </span>

                      <span>
                        {formatearFechaHora(
                          actividad.fechaHora,
                        )}
                      </span>

                      {actividad.referencia && (
                        <span
                          className="
                            rounded-full
                            bg-slate-100
                            px-2 py-0.5
                            font-bold
                            text-slate-600
                          "
                        >
                          {
                            actividad.referencia
                          }
                        </span>
                      )}

                      {actividad.monto !==
                        null && (
                        <span
                          className="
                            font-black
                            text-slate-700
                          "
                        >
                          {formatearMoneda(
                            actividad.monto,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

export default ActividadReciente;
