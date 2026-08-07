import {
  useEffect,
  useState,
} from "react";

function PiePagina() {
  const [
    visible,
    setVisible,
  ] = useState(false);

  useEffect(() => {
    const cuadro =
      window.requestAnimationFrame(
        () => {
          setVisible(true);
        },
      );

    return () => {
      window.cancelAnimationFrame(
        cuadro,
      );
    };
  }, []);

  return (
    <footer
      className={`
        border-t
        border-slate-200
        bg-white px-4 py-3
        transition-all
        duration-700
        ease-[cubic-bezier(0.22,1,0.36,1)]
        sm:px-6 lg:px-8
        ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }
      `}
    >
      <div
        className="
          mx-auto flex
          max-w-[1600px]
          items-center
          justify-between gap-4
          text-[11px]
          text-slate-400
        "
      >
        <p className="truncate">
          Roma Fast Food · Sistema interno
        </p>

        <p
          className="
            hidden truncate
            text-center sm:block
          "
        >
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
