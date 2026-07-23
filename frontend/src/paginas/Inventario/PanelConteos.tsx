import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  Scale,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../../contextos/AuthContext";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  formatearCantidadInventario,
  listarConteosFisicosInventario,
  listarInsumosInventario,
  registrarConteoFisicoInventario,
} from "../../servicios/inventarioServicio";

import type {
  ConteoFisicoInventario,
  InsumoInventario,
  RegistrarConteoFisicoDto,
} from "../../tipos/inventario";

import type {
  DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import FormularioConteoFisico from "./FormularioConteoFisico";

interface PanelConteosProps {
  puedeGestionar: boolean;
  alNotificar: (
    notificacion: DatosNotificacion,
  ) => void;
  alCambio: () => Promise<void>;
}

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function fechaHora(fechaIso: string): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fechaIso));
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function PanelConteos({
  puedeGestionar,
  alNotificar,
  alCambio,
}: PanelConteosProps) {
  const { usuario } = useAuth();

  const [insumos, setInsumos] =
    useState<InsumoInventario[]>([]);

  const [conteos, setConteos] =
    useState<ConteoFisicoInventario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const [listaInsumos, listaConteos] =
        await Promise.all([
          listarInsumosInventario(),
          listarConteosFisicosInventario(),
        ]);

      setInsumos(listaInsumos);
      setConteos(listaConteos);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo:
          "No se pudieron cargar los conteos",
        mensaje: mensajeError(error),
      });
    } finally {
      setCargando(false);
    }
  }, [alNotificar]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargar();
    }, 0);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [cargar]);

  async function guardar(
    datos: RegistrarConteoFisicoDto,
  ) {
    if (
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesando(true);

      const conteo =
        await registrarConteoFisicoInventario(
          datos,
          usuario,
        );

      const diferencias =
        conteo.detalles.filter(
          (detalle) =>
            detalle.variacion !== 0,
        ).length;

      await auditarAccion(
        {
          modulo: "Conteos físicos",
          accion: "Registrar conteo físico",
          entidad: "Conteo físico",
          entidadId: conteo.id,
          descripcion:
            `${usuario.nombreCompleto} registró un conteo de ${conteo.detalles.length} insumos con ${diferencias} diferencias.`,
          datosPosteriores: conteo,
          nivel:
            diferencias > 0
              ? "Advertencia"
              : "Información",
        },
        usuario,
      );

      setModalAbierto(false);

      alNotificar({
        tipo: "exito",
        titulo:
          "Conteo físico registrado",
        mensaje: `${conteo.detalles.length} insumos revisados y ${diferencias} diferencias regularizadas.`,
      });

      await Promise.all([
        cargar(),
        alCambio(),
      ]);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo:
          "No se pudo registrar el conteo",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Conteos físicos y variaciones
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Compara la existencia calculada
            con lo que realmente se pesa o
            cuenta al cierre.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void cargar()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>

          {puedeGestionar && (
            <button
              type="button"
              onClick={() =>
                setModalAbierto(true)
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white hover:bg-red-800"
            >
              <Plus size={18} />
              Nuevo conteo
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="space-y-4 p-5 sm:p-6">
          {Array.from({
            length: 4,
          }).map((_, indice) => (
            <div
              key={indice}
              className="h-44 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : conteos.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <ClipboardCheck
            size={42}
            className="text-slate-300"
          />

          <h3 className="mt-4 text-lg font-black text-slate-900">
            Todavía no existen conteos
          </h3>

          <p className="mt-1 max-w-md text-sm text-slate-500">
            Registra el primer conteo físico
            para comparar existencias y
            generar ajustes trazables.
          </p>
        </div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          {conteos.map((conteo) => {
            const diferencias =
              conteo.detalles.filter(
                (detalle) =>
                  detalle.variacion !== 0,
              );

            const impacto =
              diferencias.reduce(
                (acumulado, detalle) =>
                  acumulado +
                  (detalle.impactoEconomico ??
                    0),
                0,
              );

            return (
              <article
                key={conteo.id}
                className="overflow-hidden rounded-2xl border border-slate-200"
              >
                <div className="flex flex-col gap-4 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Scale size={22} />
                    </div>

                    <div>
                      <p className="font-black text-slate-900">
                        Conteo #{conteo.id}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {fechaHora(
                          conteo.fechaHora,
                        )} · {conteo.usuarioNombre}
                      </p>

                      {conteo.observaciones && (
                        <p className="mt-2 text-sm text-slate-600">
                          {conteo.observaciones}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Revisados
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        {conteo.detalles.length}
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-amber-600">
                        Diferencias
                      </p>
                      <p className="mt-1 font-black text-amber-900">
                        {diferencias.length}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Impacto
                      </p>
                      <p
                        className={`mt-1 font-black ${
                          impacto < 0
                            ? "text-red-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {moneda(impacto)}
                      </p>
                    </div>
                  </div>
                </div>

                {diferencias.length === 0 ? (
                  <div className="p-5 text-sm font-semibold text-emerald-700">
                    No se encontraron diferencias
                    entre el stock teórico y el
                    físico.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-white">
                          {[
                            "Insumo",
                            "Teórico",
                            "Físico",
                            "Variación",
                            "Impacto",
                            "Motivo",
                          ].map((encabezado) => (
                            <th
                              key={encabezado}
                              className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                              {encabezado}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {diferencias.map(
                          (detalle) => (
                            <tr
                              key={detalle.insumoId}
                            >
                              <td className="px-5 py-3">
                                <p className="font-bold text-slate-800">
                                  {detalle.insumoNombre}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {detalle.insumoCodigo}
                                </p>
                              </td>

                              <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                                {formatearCantidadInventario(
                                  detalle.stockTeorico,
                                  detalle.unidadBase,
                                )}
                              </td>

                              <td className="px-5 py-3 text-sm font-semibold text-slate-800">
                                {formatearCantidadInventario(
                                  detalle.stockFisico,
                                  detalle.unidadBase,
                                )}
                              </td>

                              <td className="px-5 py-3">
                                <p
                                  className={`font-black ${
                                    detalle.variacion < 0
                                      ? "text-red-700"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {detalle.variacion > 0
                                    ? "+"
                                    : ""}
                                  {formatearCantidadInventario(
                                    detalle.variacion,
                                    detalle.unidadBase,
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-3">
                                {detalle.impactoEconomico ===
                                null ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                    Sin valoración
                                  </span>
                                ) : (
                                  <p
                                    className={`font-black ${
                                      detalle.impactoEconomico < 0
                                        ? "text-red-700"
                                        : "text-emerald-700"
                                    }`}
                                  >
                                    {moneda(
                                      detalle.impactoEconomico,
                                    )}
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-3 text-sm text-slate-600">
                                {detalle.motivo}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        abierto={modalAbierto}
        titulo="Registrar conteo físico"
        descripcion="Ingresa las cantidades encontradas y justifica cada diferencia."
        ancho="grande"
        alCerrar={() => {
          if (!procesando) {
            setModalAbierto(false);
          }
        }}
      >
        <FormularioConteoFisico
          key={modalAbierto ? "abierto" : "cerrado"}
          insumos={insumos}
          cargando={procesando}
          alGuardar={guardar}
          alCancelar={() =>
            setModalAbierto(false)
          }
        />
      </Modal>
    </div>
  );
}

export default PanelConteos;
