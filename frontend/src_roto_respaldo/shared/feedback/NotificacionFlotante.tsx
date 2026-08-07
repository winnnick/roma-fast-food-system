import { X } from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export interface DatosNotificacion {
  tipo: "exito" | "error" | "info";
  titulo: string;
  mensaje: string;
}

interface NotificacionFlotanteProps {
  notificacion: DatosNotificacion | null;
  alCerrar: () => void;
  duracionMs?: number;
  modoRapido?: boolean;
}

interface PosicionAlerta {
  x: number;
  y: number;
}

interface DatosArrastre {
  punteroX: number;
  punteroY: number;
  origenX: number;
  origenY: number;
}

interface AlertaVisibleProps {
  notificacion: DatosNotificacion;
  alCerrar: () => void;
  modoRapido: boolean;
}

function IconoAnimado({
  tipo,
}: {
  tipo: DatosNotificacion["tipo"];
}) {
  const configuracion = {
    exito: {
      color:
        "text-emerald-500 dark:text-emerald-400",
      fondo:
        "bg-emerald-50 dark:bg-emerald-950/45",
      etiqueta: "Operación exitosa",
    },
    error: {
      color: "text-red-500 dark:text-red-400",
      fondo: "bg-red-50 dark:bg-red-950/45",
      etiqueta: "Ocurrió un error",
    },
    info: {
      color: "text-blue-500 dark:text-blue-400",
      fondo: "bg-blue-50 dark:bg-blue-950/45",
      etiqueta: "Información",
    },
  }[tipo];

  return (
    <div
      className={`roma-alerta-icono-contenedor mx-auto flex h-28 w-28 items-center justify-center rounded-full ${configuracion.fondo}`}
      aria-label={configuracion.etiqueta}
    >
      <svg
        viewBox="0 0 80 80"
        aria-hidden="true"
        className={`h-24 w-24 overflow-visible ${configuracion.color}`}
      >
        <circle
          cx="40"
          cy="40"
          r="30"
          className="roma-alerta-circulo-base"
        />

        <circle
          cx="40"
          cy="40"
          r="30"
          pathLength="100"
          className="roma-alerta-circulo-trazo"
        />

        {tipo === "exito" && (
          <path
            d="M25 41.5 35 51.5 56 29.5"
            pathLength="100"
            className="roma-alerta-simbolo roma-alerta-check"
          />
        )}

        {tipo === "error" && (
          <>
            <path
              d="M29 29 51 51"
              pathLength="100"
              className="roma-alerta-simbolo roma-alerta-error-uno"
            />
            <path
              d="M51 29 29 51"
              pathLength="100"
              className="roma-alerta-simbolo roma-alerta-error-dos"
            />
          </>
        )}

        {tipo === "info" && (
          <>
            <path
              d="M40 36 40 54"
              pathLength="100"
              className="roma-alerta-simbolo roma-alerta-info-linea"
            />
            <circle
              cx="40"
              cy="27"
              r="2.8"
              className="roma-alerta-info-punto"
            />
          </>
        )}
      </svg>
    </div>
  );
}

function AlertaVisible({
  notificacion,
  alCerrar,
  modoRapido,
}: AlertaVisibleProps) {
  const [posicion, setPosicion] =
    useState<PosicionAlerta>({
      x: 0,
      y: 0,
    });

  const arrastre =
    useRef<DatosArrastre | null>(
      null,
    );

  function iniciarArrastre(
    evento: ReactPointerEvent<HTMLElement>,
  ) {
    if (evento.button !== 0) {
      return;
    }

    evento.currentTarget.setPointerCapture(
      evento.pointerId,
    );

    arrastre.current = {
      punteroX: evento.clientX,
      punteroY: evento.clientY,
      origenX: posicion.x,
      origenY: posicion.y,
    };
  }

  function moverAlerta(
    evento: ReactPointerEvent<HTMLElement>,
  ) {
    if (!arrastre.current) {
      return;
    }

    const margen = 32;
    const limiteX = Math.max(
      0,
      window.innerWidth / 2 - margen,
    );
    const limiteY = Math.max(
      0,
      window.innerHeight / 2 - margen,
    );

    setPosicion({
      x: Math.min(
        limiteX,
        Math.max(
          -limiteX,
          arrastre.current.origenX +
            evento.clientX -
            arrastre.current.punteroX,
        ),
      ),
      y: Math.min(
        limiteY,
        Math.max(
          -limiteY,
          arrastre.current.origenY +
            evento.clientY -
            arrastre.current.punteroY,
        ),
      ),
    });
  }

  function finalizarArrastre() {
    arrastre.current = null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
    >
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={alCerrar}
        className="absolute inset-0 cursor-default"
      />

      <section
        onPointerDown={iniciarArrastre}
        onPointerMove={moverAlerta}
        onPointerUp={finalizarArrastre}
        onPointerCancel={finalizarArrastre}
        style={{
          transform: `translate3d(${posicion.x}px, ${posicion.y}px, 0)`,
          touchAction: "none",
        }}
        className={`roma-alerta-entrada relative z-10 w-full max-w-md select-none rounded-[2rem] border border-slate-200 bg-white px-8 py-9 text-center shadow-[0_34px_90px_-28px_rgba(15,23,42,0.58)] dark:border-slate-700 dark:bg-slate-900 sm:px-10 sm:py-10 ${modoRapido ? "roma-alerta-modo-rapido" : ""}`}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onPointerDown={(evento) =>
            evento.stopPropagation()
          }
          onClick={alCerrar}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X size={19} />
        </button>

        <IconoAnimado
          tipo={notificacion.tipo}
        />

        <div className="roma-alerta-contenido">
          <h2 className="mt-6 text-2xl font-black text-slate-950 dark:text-white sm:text-[1.7rem]">
            {notificacion.titulo}
          </h2>

          <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {notificacion.mensaje}
          </p>
        </div>
      </section>
    </div>
  );
}

function NotificacionFlotante({
  notificacion,
  alCerrar,
  duracionMs,
  modoRapido = false,
}: NotificacionFlotanteProps) {
  useEffect(() => {
    if (!notificacion) {
      return;
    }

    const duracion =
      duracionMs ??
      (notificacion.tipo === "error"
        ? 3600
        : 3100);

    const temporizador =
      window.setTimeout(() => {
        alCerrar();
      }, duracion);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [
    notificacion,
    alCerrar,
    duracionMs,
  ]);

  if (!notificacion) {
    return null;
  }

  const clave = `${notificacion.tipo}-${notificacion.titulo}-${notificacion.mensaje}`;

  return (
    <AlertaVisible
      key={clave}
      notificacion={notificacion}
      alCerrar={alCerrar}
      modoRapido={modoRapido}
    />
  );
}

export default NotificacionFlotante;
