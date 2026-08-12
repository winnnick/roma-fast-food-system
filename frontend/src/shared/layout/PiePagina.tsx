function PiePagina() {
  return (
    <footer
      className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
    >
      <div
        className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 text-[11px] text-slate-400"
      >
        <p className="truncate">
          Roma Fast Food · Sistema interno
        </p>

        <p className="hidden truncate text-center sm:block">
          Proyecto de grado · Universidad Privada Domingo Savio
        </p>

        <p className="shrink-0">
          Tarija · 2026 · v0.1.0
        </p>
      </div>
    </footer>
  );
}

export default PiePagina;
