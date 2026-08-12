import {
  Info,
} from "lucide-react";

import {
  useAuth,
} from "../../contextos/AuthContext";

import GestionProductos from "./GestionProductos";

function Productos() {
  const { usuario } = useAuth();

  const puedeCrear =
    usuario?.permisos.includes(
      "PRODUCTOS_CREAR",
    ) ?? false;

  const puedeEditar =
    usuario?.permisos.includes(
      "PRODUCTOS_EDITAR",
    ) ?? false;

  const puedeCambiarEstado =
    usuario?.permisos.includes(
      "PRODUCTOS_DESACTIVAR",
    ) ?? false;

  const puedeGestionarRecetas =
    usuario?.permisos.includes(
      "INVENTARIO_RECETAS_GESTIONAR",
    ) ?? false;

  const puedeGestionarCategorias =
    usuario?.permisos.includes(
      "CATEGORIAS_GESTIONAR",
    ) ?? false;

  const tieneAcciones =
    puedeCrear ||
    puedeEditar ||
    puedeCambiarEstado ||
    puedeGestionarRecetas ||
    puedeGestionarCategorias;

  return (
    <div className="space-y-4">
      {!tieneAcciones && (
        <div
          className="
            flex items-start gap-3
            rounded-2xl border
            border-blue-200 bg-blue-50
            p-4 dark:border-blue-900/60
            dark:bg-blue-950/35
          "
        >
          <Info
            size={20}
            className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
          />

          <div>
            <p className="text-sm font-black text-blue-950 dark:text-blue-100">
              Modo de consulta
            </p>

            <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
              Tu rol puede consultar el catálogo, las categorías y la configuración de inventario, pero no realizar cambios.
            </p>
          </div>
        </div>
      )}

      <GestionProductos
        puedeCrear={puedeCrear}
        puedeEditar={puedeEditar}
        puedeCambiarEstado={
          puedeCambiarEstado
        }
        puedeGestionarRecetas={
          puedeGestionarRecetas
        }
        puedeGestionarCategorias={
          puedeGestionarCategorias
        }
      />
    </div>
  );
}

export default Productos;
