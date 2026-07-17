import {
  AlertTriangle,
  LoaderCircle,
  Power,
} from "lucide-react";

import Modal from "./Modal";

interface ModalConfirmacionProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  variante: "peligro" | "activar";
  cargando: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
}

function ModalConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  variante,
  cargando,
  alConfirmar,
  alCancelar,
}: ModalConfirmacionProps) {
  const Icono =
    variante === "peligro"
      ? AlertTriangle
      : Power;

  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      alCerrar={
        cargando
          ? () => undefined
          : alCancelar
      }
    >
      <div className="p-6">
        <div
          className={`
            flex h-14 w-14
            items-center justify-center
            rounded-2xl
            ${
              variante === "peligro"
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }
          `}
        >
          <Icono size={27} />
        </div>

        <p
          className="
            mt-5 text-sm
            leading-relaxed
            text-slate-600
          "
        >
          {descripcion}
        </p>

        <div
          className="
            mt-7 flex flex-col-reverse
            gap-3 sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            disabled={cargando}
            onClick={alCancelar}
            className="
              rounded-xl border
              border-slate-300
              px-5 py-3
              text-sm font-bold
              text-slate-700
              transition-colors
              hover:bg-slate-100
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={alConfirmar}
            className={`
              inline-flex items-center
              justify-center gap-2
              rounded-xl px-5 py-3
              text-sm font-bold
              text-white transition-colors
              disabled:cursor-not-allowed
              disabled:opacity-60
              ${
                variante === "peligro"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            `}
          >
            {cargando && (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            )}

            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ModalConfirmacion;