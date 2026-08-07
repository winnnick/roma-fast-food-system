import {
  ArrowLeft,
  FileQuestion,
} from "lucide-react";

import { Link } from "react-router-dom";

function NoEncontrado() {
  return (
    <main
      className="
        flex min-h-screen items-center
        justify-center bg-slate-100 p-5
      "
    >
      <section
        className="
          w-full max-w-lg rounded-3xl
          border border-slate-200
          bg-white p-8 text-center
          shadow-panel
        "
      >
        <div
          className="
            mx-auto flex h-16 w-16
            items-center justify-center
            rounded-2xl bg-roma-100
            text-roma-700
          "
        >
          <FileQuestion size={32} />
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-roma-700">
          Error 404
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Página no encontrada
        </h1>

        <p className="mt-3 leading-relaxed text-slate-500">
          La dirección ingresada no corresponde a
          ninguna sección disponible del sistema.
        </p>

        <Link
          to="/dashboard"
          className="
            mt-7 inline-flex items-center
            justify-center gap-2 rounded-xl
            bg-roma-700 px-5 py-3
            font-semibold text-white
            shadow-lg shadow-roma-900/20
            transition-colors
            hover:bg-roma-800
            focus-visible:outline-none
            focus-visible:ring-4
            focus-visible:ring-roma-200
          "
        >
          <ArrowLeft size={18} />

          Volver al dashboard
        </Link>
      </section>
    </main>
  );
}

export default NoEncontrado;