import {
  useEffect,
  type ReactNode,
} from "react";

import { X } from "lucide-react";

interface ModalProps {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  alCerrar: () => void;
  ancho?: "mediano" | "grande";
}

const anchos = {
  mediano: "max-w-xl",
  grande: "max-w-5xl",
};

function Modal({
  abierto,
  titulo,
  descripcion,
  children,
  alCerrar,
  ancho = "mediano",
}: ModalProps) {
  useEffect(() => {
    if (!abierto) {
      return;
    }

    function cerrarConEscape(
      evento: KeyboardEvent,
    ) {
      if (evento.key === "Escape") {
        alCerrar();
      }
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    document.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      document.removeEventListener(
        "keydown",
        cerrarConEscape,
      );
    };
  }, [abierto, alCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-70
        flex items-center justify-center
        p-4 sm:p-6
      "
    >
      <button
        type="button"
        aria-label="Cerrar ventana"
        onClick={alCerrar}
        className="
          absolute inset-0
          bg-slate-950/65
          backdrop-blur-sm
        "
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        className={`
          relative z-10
          flex max-h-[90vh]
          w-full flex-col
          overflow-hidden
          rounded-3xl
          border border-slate-200
          bg-white
          shadow-flotante
          ${anchos[ancho]}
        `}
      >
        <header
          className="
            flex items-start
            justify-between gap-4
            border-b border-slate-100
            px-5 py-5 sm:px-6
          "
        >
          <div>
            <h2
              id="titulo-modal"
              className="
                text-xl font-black
                text-slate-900
              "
            >
              {titulo}
            </h2>

            {descripcion && (
              <p
                className="
                  mt-1 text-sm
                  leading-relaxed
                  text-slate-500
                "
              >
                {descripcion}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="
              rounded-xl p-2
              text-slate-400
              transition-colors
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X size={21} />
          </button>
        </header>

        <div className="overflow-y-auto">
          {children}
        </div>
      </section>
    </div>
  );
}

export default Modal;