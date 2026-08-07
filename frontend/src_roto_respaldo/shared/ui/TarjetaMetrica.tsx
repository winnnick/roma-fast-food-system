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
  | "ambar"
  | "violeta"
  | "rosa"
  | "neutro";

type VarianteTarjeta =
  | "normal"
  | "compacta"
  | "principal";

interface TarjetaMetricaProps {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: LucideIcon;
  tono: TonoTarjeta;
  variacion?: number;
  variante?: VarianteTarjeta;
  insignia?: string;
  className?: string;
}

const estilosPorTono: Record<
  TonoTarjeta,
  {
    icono: string;
    borde: string;
    insignia: string;
  }
> = {
  roma: {
    icono:
      "bg-roma-50 text-roma-700 dark:bg-roma-950/45 dark:text-roma-300",
    borde:
      "hover:border-roma-300 dark:hover:border-roma-800",
    insignia:
      "bg-roma-50 text-roma-700 dark:bg-roma-950/45 dark:text-roma-300",
  },
  azul: {
    icono:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300",
    borde:
      "hover:border-blue-300 dark:hover:border-blue-800",
    insignia:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300",
  },
  verde: {
    icono:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300",
    borde:
      "hover:border-emerald-300 dark:hover:border-emerald-800",
    insignia:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300",
  },
  ambar: {
    icono:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300",
    borde:
      "hover:border-amber-300 dark:hover:border-amber-800",
    insignia:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300",
  },
  violeta: {
    icono:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300",
    borde:
      "hover:border-violet-300 dark:hover:border-violet-800",
    insignia:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300",
  },
  rosa: {
    icono:
      "bg-pink-50 text-pink-700 dark:bg-pink-950/45 dark:text-pink-300",
    borde:
      "hover:border-pink-300 dark:hover:border-pink-800",
    insignia:
      "bg-pink-50 text-pink-700 dark:bg-pink-950/45 dark:text-pink-300",
  },
  neutro: {
    icono:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    borde:
      "hover:border-slate-400 dark:hover:border-slate-600",
    insignia:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

const estilosPorVariante: Record<
  VarianteTarjeta,
  {
    contenedor: string;
    icono: string;
    valor: string;
    titulo: string;
    descripcion: string;
  }
> = {
  normal: {
    contenedor: "min-h-36 p-5",
    icono: "h-11 w-11 rounded-xl",
    valor: "text-2xl",
    titulo: "mt-4 text-xs",
    descripcion: "mt-2 text-xs",
  },
  compacta: {
    contenedor: "min-h-28 p-4",
    icono: "h-10 w-10 rounded-xl",
    valor: "text-xl",
    titulo: "mt-3 text-[10px]",
    descripcion: "mt-1.5 text-[11px]",
  },
  principal: {
    contenedor: "min-h-40 p-5",
    icono: "h-11 w-11 rounded-2xl",
    valor: "text-[1.75rem]",
    titulo: "mt-4 text-xs",
    descripcion: "mt-2 text-xs",
  },
};

function TarjetaMetrica({
  titulo,
  valor,
  descripcion,
  icono: Icono,
  tono,
  variacion,
  variante = "normal",
  insignia,
  className = "",
}: TarjetaMetricaProps) {
  const estilos = estilosPorTono[tono];
  const medidas = estilosPorVariante[variante];

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
        group min-w-0 rounded-3xl border
        border-slate-200 bg-white shadow-panel
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-lg
        dark:border-slate-700 dark:bg-slate-900
        ${medidas.contenedor}
        ${estilos.borde}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`
            flex shrink-0 items-center justify-center
            ${medidas.icono}
            ${estilos.icono}
          `}
        >
          <Icono
            size={
              variante === "compacta"
                ? 19
                : 21
            }
          />
        </div>

        {insignia ? (
          <span
            className={`
              rounded-full px-2.5 py-1
              text-[10px] font-black
              uppercase tracking-wide
              ${estilos.insignia}
            `}
          >
            {insignia}
          </span>
        ) : variacion !== undefined ? (
          <div
            className={`
              flex items-center gap-1
              rounded-full px-2 py-1
              text-xs font-bold
              ${
                variacionPositiva
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300"
                  : variacionNegativa
                    ? "bg-red-50 text-red-700 dark:bg-red-950/45 dark:text-red-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }
            `}
          >
            <IconoTendencia size={14} />
            {Math.abs(variacion).toFixed(1)}%
          </div>
        ) : null}
      </div>

      <p
        className={`
          font-black uppercase tracking-wide
          text-slate-500 dark:text-slate-400
          ${medidas.titulo}
        `}
      >
        {titulo}
      </p>

      <p
        className={`
          mt-1 truncate font-black tracking-tight
          text-slate-950 dark:text-white
          ${medidas.valor}
        `}
        title={valor}
      >
        {valor}
      </p>

      <p
        className={`
          leading-relaxed text-slate-500
          dark:text-slate-400
          ${medidas.descripcion}
        `}
      >
        {descripcion}
      </p>
    </article>
  );
}

export default TarjetaMetrica;
