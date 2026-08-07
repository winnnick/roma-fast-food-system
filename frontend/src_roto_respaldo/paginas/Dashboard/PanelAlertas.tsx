import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BellRing,
  Boxes,
  CircleCheckBig,
  Clock3,
  ReceiptText,
  UtensilsCrossed,
} from "lucide-react";

import { Link } from "react-router-dom";

import type {
  AlertaAdministrativa,
  PrioridadAlertaAdministrativa,
  TipoAlertaAdministrativa,
} from "../../tipos/analitica";

interface PanelAlertasProps {
  alertas: AlertaAdministrativa[];
}

function obtenerIcono(
  tipo: TipoAlertaAdministrativa,
) {
  const iconos = {
    Caja: Banknote,
    Cobros: Clock3,
    Inventario: Boxes,
    Recetas: UtensilsCrossed,
    Arqueos: ReceiptText,
    Descuentos: BellRing,
  };

  return iconos[tipo];
}

function obtenerEstilos(
  prioridad: PrioridadAlertaAdministrativa,
): {
  contenedor: string;
  icono: string;
  etiqueta: string;
} {
  const estilos: Record<
    PrioridadAlertaAdministrativa,
    {
      contenedor: string;
      icono: string;
      etiqueta: string;
    }
  > = {
    Baja: {
      contenedor:
        "border-blue-200 bg-blue-50/60",
      icono:
        "bg-blue-100 text-blue-700",
      etiqueta:
        "bg-blue-100 text-blue-700",
    },

    Media: {
      contenedor:
        "border-amber-200 bg-amber-50/60",
      icono:
        "bg-amber-100 text-amber-700",
      etiqueta:
        "bg-amber-100 text-amber-700",
    },

    Alta: {
      contenedor:
        "border-orange-200 bg-orange-50/60",
      icono:
        "bg-orange-100 text-orange-700",
      etiqueta:
        "bg-orange-100 text-orange-700",
    },

    Crítica: {
      contenedor:
        "border-red-200 bg-red-50/70",
      icono:
        "bg-red-100 text-red-700",
      etiqueta:
        "bg-red-100 text-red-700",
    },
  };

  return estilos[prioridad];
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

function PanelAlertas({
  alertas,
}: PanelAlertasProps) {
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
            <AlertTriangle
              size={20}
              className="text-amber-600"
            />

            <h2
              className="
                text-lg font-black
                text-slate-900
              "
            >
              Centro de alertas
            </h2>
          </div>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Situaciones que requieren
            revisión administrativa.
          </p>
        </div>

        <span
          className="
            rounded-full
            bg-slate-100
            px-3 py-1
            text-sm font-black
            text-slate-700
          "
        >
          {alertas.length}
        </span>
      </div>

      {alertas.length === 0 ? (
        <div
          className="
            mt-5 rounded-2xl
            border border-dashed
            border-emerald-300
            bg-emerald-50/50
            p-8 text-center
          "
        >
          <CircleCheckBig
            size={34}
            className="
              mx-auto text-emerald-600
            "
          />

          <p
            className="
              mt-3 font-black
              text-emerald-900
            "
          >
            Sin alertas administrativas
          </p>

          <p
            className="
              mt-1 text-sm
              text-emerald-700
            "
          >
            Los módulos no reportan
            situaciones críticas en este
            momento.
          </p>
        </div>
      ) : (
        <div
          className="
            mt-5 max-h-[540px]
            space-y-3 overflow-y-auto
            pr-1
          "
        >
          {alertas.map((alerta) => {
            const Icono =
              obtenerIcono(
                alerta.tipo,
              );

            const estilos =
              obtenerEstilos(
                alerta.prioridad,
              );

            return (
              <Link
                key={alerta.id}
                to={alerta.ruta}
                className={`
                  group block rounded-2xl
                  border p-4
                  transition-all
                  hover:-translate-y-0.5
                  hover:shadow-md
                  ${estilos.contenedor}
                `}
              >
                <div
                  className="
                    flex items-start gap-3
                  "
                >
                  <div
                    className={`
                      flex h-10 w-10
                      shrink-0 items-center
                      justify-center
                      rounded-xl
                      ${estilos.icono}
                    `}
                  >
                    <Icono size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        flex flex-wrap
                        items-center
                        justify-between gap-2
                      "
                    >
                      <p
                        className="
                          font-black
                          text-slate-900
                        "
                      >
                        {alerta.titulo}
                      </p>

                      <span
                        className={`
                          rounded-full
                          px-2.5 py-1
                          text-[11px]
                          font-black
                          ${estilos.etiqueta}
                        `}
                      >
                        {alerta.prioridad}
                      </span>
                    </div>

                    <p
                      className="
                        mt-1 text-sm
                        leading-relaxed
                        text-slate-600
                      "
                    >
                      {alerta.descripcion}
                    </p>

                    <div
                      className="
                        mt-3 flex flex-wrap
                        items-center gap-3
                        text-xs font-bold
                        text-slate-500
                      "
                    >
                      {alerta.cantidad !==
                        null && (
                        <span>
                          {alerta.cantidad}{" "}
                          registros
                        </span>
                      )}

                      {alerta.monto !==
                        null && (
                        <span>
                          {formatearMoneda(
                            alerta.monto,
                          )}
                        </span>
                      )}

                      <span
                        className="
                          ml-auto inline-flex
                          items-center gap-1
                          text-slate-700
                          transition-colors
                          group-hover:text-roma-700
                        "
                      >
                        Revisar
                        <ArrowRight
                          size={14}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PanelAlertas;
