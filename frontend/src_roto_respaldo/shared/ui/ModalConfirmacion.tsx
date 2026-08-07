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
  textoCancelar?: string;
  centrarIcono?: boolean;
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
  textoCancelar = "Cancelar",
  centrarIcono = false,
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
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            centrarIcono ? "mx-auto" : ""
          } ${
            variante === "peligro"
              ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          }`}
        >
          <Icono size={27} />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {descripcion}
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={cargando}
            onClick={alCancelar}
            className="min-w-32 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={alConfirmar}
            className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              variante === "peligro"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
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
