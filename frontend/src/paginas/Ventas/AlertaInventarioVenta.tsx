import {
  AlertTriangle,
  Ban,
  Boxes,
  LoaderCircle,
  ShieldAlert,
  X,
} from "lucide-react";

import type {
  EvaluacionInventarioVenta,
  ProyeccionInsumoVenta,
} from "../../tipos/inventario";

import {
  formatearCantidadInventario,
} from "../../servicios/inventarioServicio";

interface AlertaInventarioVentaProps {
  evaluacion:
    EvaluacionInventarioVenta;
  cargando: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
}

function obtenerClaseNivel(
  item: ProyeccionInsumoVenta,
): string {
  if (
    item.nivel === "Bloqueado" ||
    item.nivel ===
      "Insumo inactivo"
  ) {
    return "border-red-300 bg-red-50";
  }

  if (item.nivel === "Negativo") {
    return "border-orange-300 bg-orange-50";
  }

  return "border-amber-200 bg-amber-50";
}

function obtenerEtiquetaNivel(
  item: ProyeccionInsumoVenta,
): string {
  if (
    item.nivel === "Bloqueado"
  ) {
    return "Venta bloqueada";
  }

  if (
    item.nivel ===
    "Insumo inactivo"
  ) {
    return "Insumo inactivo";
  }

  if (item.nivel === "Negativo") {
    return "Quedará negativo";
  }

  return "Quedará en stock bajo";
}

function AlertaInventarioVenta({
  evaluacion,
  cargando,
  alConfirmar,
  alCancelar,
}: AlertaInventarioVentaProps) {
  const bloqueada =
    evaluacion.bloqueada;

  const alertasImportantes =
    evaluacion.alertas.filter(
      (item) =>
        item.nivel !== "Normal",
    );

  return (
    <div>
      <div className="space-y-5 p-5 sm:p-6">
        <section
          className={`
            rounded-2xl border p-4
            ${
              bloqueada
                ? "border-red-200 bg-red-50"
                : "border-orange-200 bg-orange-50"
            }
          `}
        >
          <div className="flex items-start gap-3">
            {bloqueada ? (
              <Ban
                size={24}
                className="mt-0.5 shrink-0 text-red-700"
              />
            ) : (
              <ShieldAlert
                size={24}
                className="mt-0.5 shrink-0 text-orange-700"
              />
            )}

            <div>
              <h3
                className={`
                  font-black
                  ${
                    bloqueada
                      ? "text-red-950"
                      : "text-orange-950"
                  }
                `}
              >
                {bloqueada
                  ? "El pedido no puede registrarse"
                  : "El pedido excederá el inventario teórico"}
              </h3>

              <p
                className={`
                  mt-1 text-sm leading-relaxed
                  ${
                    bloqueada
                      ? "text-red-700"
                      : "text-orange-700"
                  }
                `}
              >
                {bloqueada
                  ? "Existe un insumo inactivo o configurado para bloquear ventas con faltantes."
                  : "Puedes continuar. Los saldos negativos quedarán registrados para regularizarlos posteriormente mediante una entrada, ajuste o conteo físico."}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          {alertasImportantes.map(
            (item) => (
              <article
                key={item.insumoId}
                className={`
                  rounded-2xl border p-4
                  ${obtenerClaseNivel(
                    item,
                  )}
                `}
              >
                <div
                  className="
                    flex flex-col gap-4
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                  "
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Boxes
                        size={18}
                        className="text-slate-600"
                      />

                      <p className="font-black text-slate-900">
                        {item.insumoNombre}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.insumoCodigo} · {item.productosRelacionados.join(", ")}
                    </p>
                  </div>

                  <span
                    className="
                      w-fit rounded-full
                      bg-white px-3 py-1
                      text-xs font-black
                      text-slate-700
                      shadow-sm
                    "
                  >
                    {obtenerEtiquetaNivel(
                      item,
                    )}
                  </span>
                </div>

                <div
                  className="
                    mt-4 grid gap-3
                    sm:grid-cols-3
                  "
                >
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Disponible
                    </p>

                    <p className="mt-1 font-black text-slate-900">
                      {formatearCantidadInventario(
                        item.cantidadDisponible,
                        item.unidadBase,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Requerido
                    </p>

                    <p className="mt-1 font-black text-slate-900">
                      {formatearCantidadInventario(
                        item.cantidadRequerida,
                        item.unidadBase,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Saldo resultante
                    </p>

                    <p
                      className={`
                        mt-1 font-black
                        ${
                          item.saldoResultante < 0
                            ? "text-red-700"
                            : "text-amber-700"
                        }
                      `}
                    >
                      {formatearCantidadInventario(
                        item.saldoResultante,
                        item.unidadBase,
                      )}
                    </p>
                  </div>
                </div>

                {item.stockMinimo !== null && (
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Límite configurado: {formatearCantidadInventario(
                      item.stockMinimo,
                      item.unidadBase,
                    )}
                  </p>
                )}
              </article>
            ),
          )}
        </div>

        {evaluacion.productosSinReceta.length > 0 && (
          <section
            className="
              rounded-2xl border
              border-blue-200
              bg-blue-50 p-4
            "
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={21}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <div>
                <p className="text-sm font-black text-blue-950">
                  Productos sin receta técnica
                </p>

                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  {evaluacion.productosSinReceta.join(", ")}. Estos productos no descontarán insumos hasta que se configure su receta.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      <footer
        className="
          flex flex-col-reverse gap-3
          border-t border-slate-100
          bg-slate-50 px-5 py-4
          sm:flex-row sm:justify-end
          sm:px-6
        "
      >
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl border
            border-slate-300
            bg-white px-5 py-3
            text-sm font-bold
            text-slate-700
            hover:bg-slate-100
            disabled:opacity-50
          "
        >
          <X size={18} />
          {bloqueada
            ? "Cerrar"
            : "Revisar pedido"}
        </button>

        {!bloqueada && (
          <button
            type="button"
            disabled={cargando}
            onClick={alConfirmar}
            className="
              inline-flex items-center
              justify-center gap-2
              rounded-xl bg-orange-600
              px-5 py-3 text-sm
              font-bold text-white
              hover:bg-orange-700
              disabled:opacity-50
            "
          >
            {cargando ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <ShieldAlert size={18} />
            )}

            Registrar de todos modos
          </button>
        )}
      </footer>
    </div>
  );
}

export default AlertaInventarioVenta;
