import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Plus,
  RefreshCw,
  Scale,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../contextos/AuthContext";
import { auditarAccion } from "../../servicios/auditoriaAccionesServicio";
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
import type { DatosNotificacion } from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import FormularioConteoFisico from "./FormularioConteoFisico";

interface PanelConteosProps {
  puedeGestionar: boolean;
  alNotificar: (notificacion: DatosNotificacion) => void;
  alCambio: () => Promise<void>;
}

const CONTEOS_POR_PAGINA = 4;

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

function fechaHora(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fechaIso));
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function cantidadConteo(
  valor: number,
  unidadBase: InsumoInventario["unidadBase"],
): string {
  return formatearCantidadInventario(
    Math.round(valor),
    unidadBase,
  );
}

function PanelConteos({
  puedeGestionar,
  alNotificar,
  alCambio,
}: PanelConteosProps) {
  const { usuario } = useAuth();
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [conteos, setConteos] = useState<ConteoFisicoInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);

      const [listaInsumos, listaConteos] = await Promise.all([
        listarInsumosInventario(),
        listarConteosFisicosInventario(),
      ]);

      setInsumos(listaInsumos);
      setConteos(listaConteos);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo: "No se pudieron cargar los conteos",
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

    return () => window.clearTimeout(temporizador);
  }, [cargar]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(conteos.length / CONTEOS_POR_PAGINA),
  );

  const paginaSegura = Math.min(pagina, totalPaginas);

  const conteosPagina = useMemo(
    () =>
      conteos.slice(
        (paginaSegura - 1) * CONTEOS_POR_PAGINA,
        paginaSegura * CONTEOS_POR_PAGINA,
      ),
    [conteos, paginaSegura],
  );

  async function guardar(datos: RegistrarConteoFisicoDto) {
    if (!usuario || !puedeGestionar) return;

    try {
      setProcesando(true);

      const conteo = await registrarConteoFisicoInventario(datos, usuario);
      const diferencias = conteo.detalles.filter(
        (detalle) => detalle.variacion !== 0,
      ).length;

      await auditarAccion(
        {
          modulo: "Conteos físicos",
          accion: "Registrar conteo físico",
          entidad: "Conteo físico",
          entidadId: conteo.id,
          descripcion: `${usuario.nombreCompleto} registró un conteo de ${conteo.detalles.length} insumos con ${diferencias} diferencias.`,
          datosPosteriores: conteo,
          nivel: diferencias > 0 ? "Advertencia" : "Información",
        },
        usuario,
      );

      setModalAbierto(false);
      setPagina(1);

      alNotificar({
        tipo: "exito",
        titulo: "Conteo físico registrado",
        mensaje: `${conteo.detalles.length} insumos revisados y ${diferencias} diferencias regularizadas.`,
      });

      await Promise.all([cargar(), alCambio()]);
    } catch (error: unknown) {
      alNotificar({
        tipo: "error",
        titulo: "No se pudo registrar el conteo",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="min-h-[34rem]">
      <header className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Conteos físicos y variaciones
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compara lo registrado por el sistema con lo encontrado físicamente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {conteos.length} conteos
          </span>

          <button
            type="button"
            title="Actualizar conteos"
            aria-label="Actualizar conteos"
            onClick={() => void cargar()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw size={17} />
          </button>

          {puedeGestionar && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Plus size={17} />
              Nuevo conteo
            </button>
          )}
        </div>
      </header>

      {cargando ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, indice) => (
            <div
              key={indice}
              className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : conteos.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <ClipboardCheck
            size={42}
            className="text-slate-300 dark:text-slate-600"
          />
          <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
            Todavía no existen conteos
          </h3>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Registra el primer conteo para comparar existencias y generar ajustes trazables.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[33rem] space-y-2.5 overflow-y-auto p-3">
            {conteosPagina.map((conteo) => {
              const diferencias = conteo.detalles.filter(
                (detalle) =>
                  Math.round(detalle.variacion) !== 0,
              );

              const impacto = diferencias.reduce(
                (acumulado, detalle) =>
                  acumulado + (detalle.impactoEconomico ?? 0),
                0,
              );

              return (
                <article
                  key={conteo.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="grid gap-2.5 border-b border-slate-100 bg-slate-50/70 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/30 lg:grid-cols-[minmax(250px,1fr)_auto] lg:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <Scale size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white">
                          Conteo #{conteo.id}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {fechaHora(conteo.fechaHora)} · {conteo.usuarioNombre}
                        </p>
                        {conteo.observaciones && (
                          <p className="mt-1.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                            {conteo.observaciones}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <span className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                        {conteo.detalles.length} revisados
                      </span>
                      <span className="rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/35 dark:text-amber-300 dark:ring-amber-900/60">
                        {diferencias.length} diferencias
                      </span>
                      <span
                        className={`rounded-xl px-2.5 py-1.5 text-xs font-black ring-1 ${
                          impacto < 0
                            ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/35 dark:text-red-300 dark:ring-red-900/60"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/35 dark:text-emerald-300 dark:ring-emerald-900/60"
                        }`}
                      >
                        {moneda(impacto)} impacto
                      </span>
                    </div>
                  </div>

                  {diferencias.length === 0 ? (
                    <div className="px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Sin diferencias entre el stock teórico y el físico.
                    </div>
                  ) : (
                    <div>
                      <div className="hidden grid-cols-[minmax(180px,1.1fr)_120px_120px_145px_minmax(170px,.8fr)] gap-3 border-b border-slate-100 bg-slate-50/60 px-3.5 py-2 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-950/20 md:grid">
                        <span>Insumo</span>
                        <span>Teórico</span>
                        <span>Físico</span>
                        <span>Variación</span>
                        <span className="text-right">Impacto / motivo</span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {diferencias.map((detalle) => (
                          <div
                            key={detalle.insumoId}
                            className="grid gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 md:grid-cols-[minmax(180px,1.1fr)_120px_120px_145px_minmax(170px,.8fr)] md:items-center"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-800 dark:text-white">
                                {detalle.insumoNombre}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {detalle.insumoCodigo}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 md:hidden">
                                Teórico
                              </p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {cantidadConteo(
                                  detalle.stockTeorico,
                                  detalle.unidadBase,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 md:hidden">
                                Físico
                              </p>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {cantidadConteo(
                                  detalle.stockFisico,
                                  detalle.unidadBase,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 md:hidden">
                                Variación
                              </p>
                              <p
                                className={`text-sm font-black ${
                                  detalle.variacion < 0
                                    ? "text-red-700 dark:text-red-300"
                                    : "text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                {detalle.variacion > 0 ? "+" : ""}
                                {cantidadConteo(
                                  detalle.variacion,
                                  detalle.unidadBase,
                                )}
                              </p>
                            </div>

                            <div className="md:text-right">
                              <p
                                className={`font-black ${
                                  detalle.impactoEconomico === null
                                    ? "text-slate-400"
                                    : detalle.impactoEconomico < 0
                                      ? "text-red-700 dark:text-red-300"
                                      : "text-emerald-700 dark:text-emerald-300"
                                }`}
                              >
                                {detalle.impactoEconomico === null
                                  ? "Sin valoración"
                                  : moneda(detalle.impactoEconomico)}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {detalle.motivo}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Página {paginaSegura} de {totalPaginas}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                title="Página anterior"
                aria-label="Página anterior"
                disabled={paginaSegura <= 1}
                onClick={() =>
                  setPagina((actual) => Math.max(1, actual - 1))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                title="Página siguiente"
                aria-label="Página siguiente"
                disabled={paginaSegura >= totalPaginas}
                onClick={() =>
                  setPagina((actual) => Math.min(totalPaginas, actual + 1))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </footer>
        </>
      )}

      <Modal
        abierto={modalAbierto}
        titulo="Registrar conteo físico"
        descripcion="Ingresa las cantidades encontradas y justifica únicamente las diferencias."
        ancho="grande"
        alCerrar={() => {
          if (!procesando) setModalAbierto(false);
        }}
      >
        <FormularioConteoFisico
          key={modalAbierto ? "abierto" : "cerrado"}
          insumos={insumos}
          cargando={procesando}
          alGuardar={guardar}
          alCancelar={() => setModalAbierto(false)}
        />
      </Modal>
    </div>
  );
}

export default PanelConteos;
