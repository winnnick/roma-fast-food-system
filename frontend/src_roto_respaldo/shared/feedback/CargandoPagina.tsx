function CargandoPagina() {
  return (
    <div
      className="
        flex min-h-screen items-center
        justify-center bg-slate-100 p-6
      "
      role="status"
      aria-live="polite"
      aria-label="Cargando página"
    >
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
          <div
            className="
              absolute inset-0 rounded-2xl
              bg-roma-200
              animate-ping opacity-40
            "
          />

          <div
            className="
              relative flex h-16 w-16
              items-center justify-center
              rounded-2xl
              bg-linear-to-br
              from-roma-500 to-roma-800
              text-2xl font-black text-white
              shadow-lg shadow-roma-900/25
            "
          >
            R
          </div>
        </div>

        <p className="mt-5 text-sm font-bold text-slate-800">
          Roma Fast Food
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-roma-700 [animation-delay:-0.3s]" />

          <span className="h-2 w-2 animate-bounce rounded-full bg-roma-700 [animation-delay:-0.15s]" />

          <span className="h-2 w-2 animate-bounce rounded-full bg-roma-700" />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Cargando información…
        </p>
      </div>
    </div>
  );
}

export default CargandoPagina;