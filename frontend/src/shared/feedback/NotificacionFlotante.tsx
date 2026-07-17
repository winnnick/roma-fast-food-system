import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

import { useEffect } from "react";

export interface DatosNotificacion {
  tipo: "exito" | "error" | "info";
  titulo: string;
  mensaje: string;
}

interface NotificacionFlotanteProps {
  notificacion: DatosNotificacion | null;
  alCerrar: () => void;
}

function NotificacionFlotante({
  notificacion,
  alCerrar,
}: NotificacionFlotanteProps) {
  useEffect(() => {
    if (!notificacion) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        alCerrar();
      }, 4000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [notificacion, alCerrar]);

  if (!notificacion) {
    return null;
  }

  const configuracion = {
    exito: {
      icono: CheckCircle2,
      estilos:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    error: {
      icono: AlertCircle,
      estilos:
        "border-red-200 bg-red-50 text-red-700",
    },

    info: {
      icono: Info,
      estilos:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
  }[notificacion.tipo];

  const Icono = configuracion.icono;

  return (
    <div
      role="status"
      className={`
        fixed right-4 top-4
        z-90 w-[calc(100%-2rem)]
        max-w-sm rounded-2xl
        border p-4
        shadow-flotante
        sm:right-6 sm:top-6
        ${configuracion.estilos}
      `}
    >
      <div className="flex items-start gap-3">
        <Icono
          size={21}
          className="mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {notificacion.titulo}
          </p>

          <p
            className="
              mt-1 text-sm
              leading-relaxed opacity-90
            "
          >
            {notificacion.mensaje}
          </p>
        </div>

        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar notificación"
          className="
            shrink-0 rounded-lg p-1
            transition-colors
            hover:bg-black/5
          "
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}

export default NotificacionFlotante;