import {
  Boxes,
  Info,
  PackageSearch,
  Tags,
} from "lucide-react";

import { useState } from "react";

import {
  useAuth,
} from "../../contextos/AuthContext";

import GestionCategorias from "./GestionCategorias";
import GestionProductos from "./GestionProductos";

type PestañaCatalogo =
  | "productos"
  | "categorias";

function Productos() {
  const { usuario } = useAuth();

  const [pestañaActiva, setPestañaActiva] =
    useState<PestañaCatalogo>(
      "productos",
    );

  const puedeGestionar =
    usuario?.permisos.includes(
      "PRODUCTOS_GESTIONAR",
    ) ?? false;

  return (
    <div className="space-y-6">
      <header
        className="
          relative overflow-hidden
          rounded-3xl
          bg-linear-to-br
          from-slate-950
          via-slate-900
          to-red-950
          p-6 text-white
          shadow-flotante
          sm:p-8
        "
      >
        <div
          className="
            absolute -right-16
            -top-16 h-48 w-48
            rounded-full
            bg-red-600/20 blur-3xl
          "
        />

        <div
          className="
            relative flex flex-col
            gap-5 lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <div
              className="
                inline-flex items-center
                gap-2 rounded-full
                border border-white/15
                bg-white/10
                px-3 py-1.5
                text-xs font-bold
                text-red-100
                backdrop-blur
              "
            >
              <Boxes size={15} />
              Gestión del menú
            </div>

            <h1
              className="
                mt-4 text-3xl
                font-black tracking-tight
                sm:text-4xl
              "
            >
              Productos y categorías
            </h1>

            <p
              className="
                mt-3 max-w-2xl
                text-sm leading-relaxed
                text-slate-300
                sm:text-base
              "
            >
              Administra la información
              comercial de los productos
              ofrecidos por Roma Fast
              Food y organiza el menú
              mediante categorías.
            </p>
          </div>

          <div
            className="
              flex h-20 w-20
              items-center
              justify-center
              rounded-3xl
              border border-white/15
              bg-white/10
              backdrop-blur
            "
          >
            <PackageSearch
              size={38}
              className="text-red-200"
            />
          </div>
        </div>
      </header>

      {!puedeGestionar && (
        <div
          className="
            flex items-start gap-3
            rounded-2xl
            border border-blue-200
            bg-blue-50 p-4
          "
        >
          <Info
            size={21}
            className="
              mt-0.5 shrink-0
              text-blue-700
            "
          />

          <div>
            <p
              className="
                text-sm font-bold
                text-blue-900
              "
            >
              Modo de consulta
            </p>

            <p
              className="
                mt-1 text-xs
                leading-relaxed
                text-blue-700
              "
            >
              Tu rol puede consultar el
              catálogo, pero no registrar,
              editar, activar o desactivar
              productos y categorías.
            </p>
          </div>
        </div>
      )}

      <div
        className="
          inline-flex w-full
          rounded-2xl
          border border-slate-200
          bg-white p-1.5
          shadow-sm sm:w-auto
        "
      >
        <button
          type="button"
          onClick={() =>
            setPestañaActiva(
              "productos",
            )
          }
          className={`
            inline-flex flex-1
            items-center justify-center
            gap-2 rounded-xl
            px-5 py-3
            text-sm font-bold
            transition-colors
            sm:flex-none
            ${
              pestañaActiva ===
              "productos"
                ? `
                  bg-slate-900
                  text-white
                  shadow-sm
                `
                : `
                  text-slate-600
                  hover:bg-slate-100
                `
            }
          `}
        >
          <Boxes size={18} />
          Productos
        </button>

        <button
          type="button"
          onClick={() =>
            setPestañaActiva(
              "categorias",
            )
          }
          className={`
            inline-flex flex-1
            items-center justify-center
            gap-2 rounded-xl
            px-5 py-3
            text-sm font-bold
            transition-colors
            sm:flex-none
            ${
              pestañaActiva ===
              "categorias"
                ? `
                  bg-red-700
                  text-white
                  shadow-sm
                `
                : `
                  text-slate-600
                  hover:bg-slate-100
                `
            }
          `}
        >
          <Tags size={18} />
          Categorías
        </button>
      </div>

      {pestañaActiva ===
      "productos" ? (
        <GestionProductos
          puedeGestionar={
            puedeGestionar
          }
        />
      ) : (
        <GestionCategorias
          puedeGestionar={
            puedeGestionar
          }
        />
      )}
    </div>
  );
}

export default Productos;