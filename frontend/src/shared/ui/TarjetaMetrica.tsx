import {
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type TonoTarjeta =
  | "roma"
  | "azul"
  | "verde"
  | "ambar";

interface TarjetaMetricaProps {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: LucideIcon;
  tono: TonoTarjeta;
  variacion?: number;
}

const estilosPorTono: Record<
  TonoTarjeta,
  {
    icono: string;
    borde: string;
  }
> = {
  roma: {
    icono: "bg-roma-100 text-roma-700",
    borde: "group-hover:border-roma-200",
  },
  azul: {
    icono: "bg-blue-100 text-blue-700",
    borde: "group-hover:border-blue-200",
  },
  verde: {
    icono: "bg-emerald-100 text-emerald-700",
    borde: "group-hover:border-emerald-200",
  },
  ambar: {
    icono: "bg-amber-100 text-amber-700",
    borde: "group-hover:border-amber-200",
  },
};

function TarjetaMetrica({
  titulo,
  valor,
  descripcion,
  icono: Icono,
  tono,
  variacion,
}: TarjetaMetricaProps) {
  const estilos = estilosPorTono[tono];

  const variacionPositiva =
    variacion !== undefined && variacion > 0;

  const variacionNegativa =
    variacion !== undefined && variacion < 0;

  const IconoTendencia = variacionPositiva
    ? TrendingUp
    : variacionNegativa
      ? TrendingDown
      : Minus;

  return (
    <article
      className={`
        group rounded-2xl border border-slate-200
        bg-white p-5 shadow-panel
        transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-lg
        ${estilos.borde}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl
            ${estilos.icono}
          `}
        >
          <Icono size={22} />
        </div>

        {variacion !== undefined && (
          <div
            className={`
              flex items-center gap-1
              rounded-full px-2 py-1
              text-xs font-bold
              ${
                variacionPositiva
                  ? "bg-emerald-50 text-emerald-700"
                  : variacionNegativa
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
              }
            `}
          >
            <IconoTendencia size={14} />

            {Math.abs(variacion).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">
          {titulo}
        </p>

        <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          {valor}
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {descripcion}
        </p>
      </div>
    </article>
  );
}

export default TarjetaMetrica;