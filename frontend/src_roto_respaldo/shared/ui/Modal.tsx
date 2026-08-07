import {
  useEffect,
  useId,
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
  const identificadorReact = useId();
  const identificadorModal =
    `modal-${identificadorReact.replace(/:/g, "")}`;
  const identificadorTitulo =
    `${identificadorModal}-titulo`;
  const identificadorDescripcion =
    `${identificadorModal}-descripcion`;

  useEffect(() => {
    if (!abierto) {
      return;
    }

    function cerrarConEscape(
      evento: KeyboardEvent,
    ) {
      if (evento.key !== "Escape") {
        return;
      }

      const modalesAbiertos =
        document.querySelectorAll<HTMLElement>(
          '[data-modal-roma="true"]',
        );

      const modalSuperior =
        modalesAbiertos.item(
          modalesAbiertos.length - 1,
        );

      if (
        modalSuperior?.id ===
        identificadorModal
      ) {
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
  }, [
    abierto,
    alCerrar,
    identificadorModal,
  ]);

  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar ventana"
        onClick={alCerrar}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <section
        id={identificadorModal}
        data-modal-roma="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby={identificadorTitulo}
        aria-describedby={
          descripcion
            ? identificadorDescripcion
            : undefined
        }
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-flotante dark:border-slate-800 dark:bg-slate-900 ${anchos[ancho]}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="min-w-0">
            <h2
              id={identificadorTitulo}
              className="text-xl font-black text-slate-900 dark:text-white"
            >
              {titulo}
            </h2>

            {descripcion && (
              <p
                id={identificadorDescripcion}
                className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
              >
                {descripcion}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={21} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </section>
    </div>
  );
}

export default Modal;
