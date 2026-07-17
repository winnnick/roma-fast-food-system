function PiePagina() {
  const gestionActual = new Date().getFullYear();

  return (
    <footer
      className="
        border-t border-slate-200
        bg-white px-4 py-4
        sm:px-6 lg:px-8
      "
    >
      <div
        className="
          mx-auto flex max-w-[1600px]
          flex-col gap-2
          text-xs text-slate-500
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <p>
          © {gestionActual} Roma Fast Food ·
          Sistema interno de gestión
        </p>

        <div className="flex items-center gap-2">
          <span
            className="
              h-2 w-2 rounded-full
              bg-amber-500
            "
          />

          <span>Entorno de desarrollo</span>

          <span className="text-slate-300">
            |
          </span>

          <span>v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}

export default PiePagina;