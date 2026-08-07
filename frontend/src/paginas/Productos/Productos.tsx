import {
  Info,
} from "lucide-react";

import {
  useAuth,
} from "../../contextos/AuthContext";

import GestionProductos from "./GestionProductos";

function Productos() {
  const { usuario } = useAuth();

  const puedeGestionar =
    usuario?.permisos.includes(
      "PRODUCTOS_GESTIONAR",
    ) ?? false;

  return (
    <div className="space-y-4">
      {!puedeGestionar && (
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
        puedeGestionar={puedeGestionar}
      />
    </div>
  );
}

export default Productos;
