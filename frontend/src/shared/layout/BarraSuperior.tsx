import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contextos/AuthContext";

interface BarraSuperiorProps {
  titulo: string;
  descripcion: string;
  seccion: string;
  contraida: boolean;
  alAlternarBarra: () => void;
  alAbrirMenuMovil: () => void;
}

function BarraSuperior({
  titulo,
  descripcion,
  seccion,
  contraida,
  alAlternarBarra,
  alAbrirMenuMovil,
}: BarraSuperiorProps) {
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] =
    useState(false);

  const contenedorMenuRef =
    useRef<HTMLDivElement>(null);

  const { usuario, cerrarSesion } = useAuth();

  const navigate = useNavigate();

  const nombreUsuario =
    usuario?.nombreCompleto ||
    usuario?.username ||
    "Usuario";

  const inicialUsuario =
    nombreUsuario.charAt(0).toUpperCase();

  const fechaFormateada =
    new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());

  useEffect(() => {
    function cerrarAlHacerClickFuera(
      evento: MouseEvent,
    ) {
      const elemento = evento.target as Node;

      if (
        contenedorMenuRef.current &&
        !contenedorMenuRef.current.contains(elemento)
      ) {
        setMenuUsuarioAbierto(false);
      }
    }

    function cerrarConEscape(
      evento: KeyboardEvent,
    ) {
      if (evento.key === "Escape") {
        setMenuUsuarioAbierto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      cerrarAlHacerClickFuera,
    );

    document.addEventListener(
      "keydown",
      cerrarConEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarAlHacerClickFuera,
      );

      document.removeEventListener(
        "keydown",
        cerrarConEscape,
      );
    };
  }, []);

  function salir() {
    setMenuUsuarioAbierto(false);
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-18 items-center justify-between
        border-b border-slate-200/80
        bg-white/95 px-4
        backdrop-blur-xl
        sm:px-6 lg:px-8
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Menú móvil */}
        <button
          type="button"
          onClick={alAbrirMenuMovil}
          aria-label="Abrir menú lateral"
          className="
            rounded-xl border border-slate-200
            bg-white p-2.5 text-slate-600
            shadow-sm transition-colors
            hover:bg-slate-100 hover:text-slate-900
            lg:hidden
          "
        >
          <Menu size={20} />
        </button>

        {/* Contraer o expandir en escritorio */}
        <button
          type="button"
          onClick={alAlternarBarra}
          aria-label={
            contraida
              ? "Expandir barra lateral"
              : "Contraer barra lateral"
          }
          title={
            contraida
              ? "Expandir barra lateral"
              : "Contraer barra lateral"
          }
          className="
            hidden rounded-xl border border-slate-200
            bg-white p-2.5 text-slate-600
            shadow-sm transition-colors
            hover:bg-slate-100 hover:text-slate-900
            lg:inline-flex
          "
        >
          {contraida ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>

        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span>{seccion}</span>
            <span>/</span>
            <span className="font-medium text-slate-700">
              {titulo}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div>
              <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {titulo}
              </h2>

              <p className="hidden truncate text-xs text-slate-500 xl:block">
                {descripcion}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-sm capitalize text-slate-500 xl:block">
          {fechaFormateada}
        </p>

        <div
          ref={contenedorMenuRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              setMenuUsuarioAbierto(
                (estadoActual) => !estadoActual,
              )
            }
            aria-haspopup="menu"
            aria-expanded={menuUsuarioAbierto}
            className="
              flex items-center gap-3 rounded-xl
              border border-transparent p-1.5
              transition-colors
              hover:border-slate-200 hover:bg-slate-50
            "
          >
            <div
              className="
                flex h-9 w-9 items-center justify-center
                rounded-xl
                bg-linear-to-br from-roma-500 to-roma-800
                text-sm font-bold text-white
                shadow-md shadow-roma-900/20
              "
            >
              {inicialUsuario}
            </div>

            <div className="hidden max-w-40 text-left md:block">
              <p className="truncate text-sm font-semibold text-slate-900">
                {nombreUsuario}
              </p>

              <p className="truncate text-xs text-slate-500">
                {usuario?.rol || "Sin rol"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`
                hidden text-slate-400
                transition-transform duration-200
                md:block
                ${
                  menuUsuarioAbierto
                    ? "rotate-180"
                    : ""
                }
              `}
            />
          </button>

          {menuUsuarioAbierto && (
            <div
              role="menu"
              className="
                absolute right-0 top-full mt-2
                w-72 overflow-hidden
                rounded-2xl border border-slate-200
                bg-white shadow-flotante
              "
            >
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-11 w-11 items-center justify-center
                      rounded-xl bg-roma-100
                      font-bold text-roma-700
                    "
                  >
                    {inicialUsuario}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {nombreUsuario}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {usuario?.rol || "Sin rol asignado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck
                    size={15}
                    className="text-emerald-600"
                  />

                  <span>Sesión activa y protegida</span>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={salir}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-left text-sm font-medium
                    text-red-600 transition-colors
                    hover:bg-red-50
                  "
                >
                  <LogOut size={18} />

                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default BarraSuperior;