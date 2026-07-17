import {
  ArrowLeft,
  ShieldX,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

function SinPermiso() {
  return (
    <section
      className="
        flex min-h-[65vh]
        items-center justify-center
      "
    >
      <div
        className="
          w-full max-w-xl
          rounded-3xl
          border border-slate-200
          bg-white p-8
          text-center shadow-panel
          sm:p-10
        "
      >
        <div
          className="
            mx-auto flex
            h-16 w-16
            items-center justify-center
            rounded-2xl
            bg-red-100 text-red-700
          "
        >
          <ShieldX size={32} />
        </div>

        <p
          className="
            mt-6 text-sm
            font-bold uppercase
            tracking-wider
            text-red-700
          "
        >
          Acceso restringido
        </p>

        <h1
          className="
            mt-2 text-3xl
            font-black
            text-slate-900
          "
        >
          No tiene autorización
        </h1>

        <p
          className="
            mt-3 leading-relaxed
            text-slate-500
          "
        >
          Su cuenta no posee el permiso
          requerido para acceder a este
          módulo. Consulte con un
          administrador si considera que
          necesita esta función.
        </p>

        <Link
          to="/dashboard"
          className="
            mt-7 inline-flex
            items-center justify-center
            gap-2 rounded-xl
            bg-roma-700
            px-5 py-3
            text-sm font-bold
            text-white
            transition-colors
            hover:bg-roma-800
          "
        >
          <ArrowLeft size={18} />

          Volver al Dashboard
        </Link>
      </div>
    </section>
  );
}

export default SinPermiso;