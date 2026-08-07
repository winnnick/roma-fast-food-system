import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  ArrowLeftRight,
  BellRing,
  CircleOff,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Edit3,
  FilterX,
  Package,
  PackageCheck,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../contextos/AuthContext";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  actualizarInsumoInventario,
  calcularNivelStockInsumo,
  cambiarEstadoInsumoInventario,
  crearInsumoInventario,
  formatearCantidadInventario,
  listarInsumosInventario,
  obtenerResumenInventario,
  registrarAjusteManualInventario,
  registrarEntradaInventario,
} from "../../servicios/inventarioServicio";

import type {
  InsumoInventario,
  NivelStockInventario,
  RegistrarAjusteManualInventarioDto,
  RegistrarEntradaInventarioDto,
  ResumenInventario,
} from "../../tipos/inventario";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import FormularioAjusteInventario from "./FormularioAjusteInventario";
import FormularioEntradaInventario from "./FormularioEntradaInventario";
import FormularioInsumo, {
  type DatosFormularioInsumo,
} from "./FormularioInsumo";

import PanelConteos from "./PanelConteos";
import PanelMovimientos from "./PanelMovimientos";
import PanelRecetas from "./PanelRecetas";

type Pestana =
  | "resumen"
  | "insumos"
  | "recetas"
  | "movimientos"
  | "conteos";
type FiltroEstado = "Todos" | "Activo" | "Inactivo";
type FiltroNivel = "Todos" | NivelStockInventario;

const INSUMOS_POR_PAGINA = 5;

interface AccionEstado {
  insumo: InsumoInventario;
  nuevoEstado: "Activo" | "Inactivo";
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function fechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

function formatearCantidadOperativa(
  valor: number,
  unidad: InsumoInventario["unidadBase"],
): string {
  const cantidad = new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 0,
  }).format(Math.round(valor));

  return `${cantidad} ${unidad}`;
}

function claseNivel(nivel: NivelStockInventario): string {
  if (nivel === "Negativo") return "bg-red-50 text-red-700";
  if (nivel === "Bajo") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

function textoNivel(nivel: NivelStockInventario): string {
  if (nivel === "Negativo") return "Stock negativo";
  if (nivel === "Bajo") return "Stock bajo";
  return "Stock normal";
}

function Inventario() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.permisos.includes("INVENTARIO_GESTIONAR") ?? false;

  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [resumen, setResumen] = useState<ResumenInventario | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<DatosNotificacion | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [estado, setEstado] = useState<FiltroEstado>("Todos");
  const [nivel, setNivel] = useState<FiltroNivel>("Todos");
  const [paginaInsumos, setPaginaInsumos] = useState(1);

  const [modalInsumo, setModalInsumo] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<InsumoInventario | null>(null);
  const [insumoEntrada, setInsumoEntrada] = useState<InsumoInventario | null>(null);
  const [insumoAjuste, setInsumoAjuste] = useState<InsumoInventario | null>(null);
  const [accionEstado, setAccionEstado] = useState<AccionEstado | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setErrorCarga(null);
      const [lista, datosResumen] = await Promise.all([
        listarInsumosInventario(),
        obtenerResumenInventario(),
      ]);
      setInsumos(lista);
      setResumen(datosResumen);
    } catch (error: unknown) {
      setErrorCarga(mensajeError(error));
    }
  }, []);

  useEffect(() => {
    let activo = true;

    Promise.all([listarInsumosInventario(), obtenerResumenInventario()])
      .then(([lista, datosResumen]) => {
        if (!activo) return;
        setInsumos(lista);
        setResumen(datosResumen);
        setErrorCarga(null);
      })
      .catch((error: unknown) => {
        if (activo) setErrorCarga(mensajeError(error));
      })
      .finally(() => {
        if (activo) setCargandoInicial(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const categorias = useMemo(
    () => [
      "Todas",
      ...Array.from(new Set(insumos.map((insumo) => insumo.categoria))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    ],
    [insumos],
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");

    return insumos.filter((insumo) => {
      const coincideTexto =
        !texto ||
        insumo.nombre.toLocaleLowerCase("es").includes(texto) ||
        insumo.codigo.toLocaleLowerCase("es").includes(texto) ||
        insumo.categoria.toLocaleLowerCase("es").includes(texto);
      const coincideCategoria = categoria === "Todas" || insumo.categoria === categoria;
      const coincideEstado = estado === "Todos" || insumo.estado === estado;
      const coincideNivel = nivel === "Todos" || calcularNivelStockInsumo(insumo) === nivel;

      return coincideTexto && coincideCategoria && coincideEstado && coincideNivel;
    });
  }, [insumos, busqueda, categoria, estado, nivel]);

  const totalPaginasInsumos = Math.max(
    1,
    Math.ceil(filtrados.length / INSUMOS_POR_PAGINA),
  );

  const paginaInsumosSegura = Math.min(
    paginaInsumos,
    totalPaginasInsumos,
  );

  const insumosPagina = filtrados.slice(
    (paginaInsumosSegura - 1) * INSUMOS_POR_PAGINA,
    paginaInsumosSegura * INSUMOS_POR_PAGINA,
  );

  function abrirNuevo() {
    if (!puedeGestionar) return;
    setInsumoSeleccionado(null);
    setModalInsumo(true);
  }

  function abrirEditar(insumo: InsumoInventario) {
    if (!puedeGestionar) return;
    setInsumoSeleccionado(insumo);
    setModalInsumo(true);
  }

  function cerrarInsumo() {
    if (procesando) return;
    setModalInsumo(false);
    setInsumoSeleccionado(null);
  }

  async function guardarInsumo(datos: DatosFormularioInsumo) {
    if (!usuario || !puedeGestionar) return;

    try {
      setProcesando(true);

      if (insumoSeleccionado) {
        const actualizado = await actualizarInsumoInventario(
          insumoSeleccionado.id,
          {
            codigo: datos.codigo,
            nombre: datos.nombre,
            categoria: datos.categoria,
            unidadBase: datos.unidadBase,
            presentacionCompra: datos.presentacionCompra,
            factorConversionCompra: datos.factorConversionCompra,
            controlarStockBajo: datos.controlarStockBajo,
            stockMinimo: datos.stockMinimo,
            politicaFaltante: datos.politicaFaltante,
            controlEconomico: datos.controlEconomico,
            costoPorPresentacionActual: datos.costoPorPresentacion,
          },
          usuario,
        );

        await auditarAccion(
          {
            modulo: "Inventario",
            accion: "Actualizar insumo",
            entidad: "Insumo",
            entidadId: actualizado.id,
            descripcion: `${actualizado.nombre} fue actualizado.`,
            datosAnteriores:
              insumoSeleccionado,
            datosPosteriores:
              actualizado,
          },
          usuario,
        );

        setNotificacion({
          tipo: "exito",
          titulo: "Insumo actualizado",
          mensaje: `${actualizado.nombre} fue actualizado correctamente.`,
        });
      } else {
        const creado = await crearInsumoInventario(
          {
            codigo: datos.codigo,
            nombre: datos.nombre,
            categoria: datos.categoria,
            unidadBase: datos.unidadBase,
            presentacionCompra: datos.presentacionCompra,
            factorConversionCompra: datos.factorConversionCompra,
            stockInicialCompra: datos.stockInicialCompra,
            controlarStockBajo: datos.controlarStockBajo,
            stockMinimo: datos.stockMinimo,
            politicaFaltante: datos.politicaFaltante,
            controlEconomico: datos.controlEconomico,
            costoPorPresentacionInicial: datos.costoPorPresentacion,
          },
          usuario,
        );

        await auditarAccion(
          {
            modulo: "Inventario",
            accion: "Crear insumo",
            entidad: "Insumo",
            entidadId: creado.id,
            descripcion: `${creado.nombre} fue registrado en el inventario.`,
            datosPosteriores: creado,
          },
          usuario,
        );

        setNotificacion({
          tipo: "exito",
          titulo: "Insumo registrado",
          mensaje: `${creado.nombre} ya forma parte del inventario.`,
        });
      }

      setModalInsumo(false);
      setInsumoSeleccionado(null);
      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo guardar el insumo",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function guardarEntrada(datos: RegistrarEntradaInventarioDto) {
    if (!usuario || !puedeGestionar) return;

    try {
      setProcesando(true);
      const movimiento = await registrarEntradaInventario(datos, usuario);

      await auditarAccion(
        {
          modulo: "Inventario",
          accion: "Registrar entrada",
          entidad: "Movimiento de inventario",
          entidadId: movimiento.id,
          descripcion:
            `${usuario.nombreCompleto} registró una entrada de ${formatearCantidadInventario(movimiento.cantidad, movimiento.unidadBase)} para ${movimiento.insumoNombre}.`,
          datosPosteriores: movimiento,
        },
        usuario,
      );

      setInsumoEntrada(null);
      setNotificacion({
        tipo: "exito",
        titulo: "Entrada registrada",
        mensaje: `${movimiento.insumoNombre} quedó con ${formatearCantidadOperativa(
          movimiento.stockPosterior,
          movimiento.unidadBase,
        )}.`,
      });
      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo registrar la entrada",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function guardarAjuste(datos: RegistrarAjusteManualInventarioDto) {
    if (!usuario || !puedeGestionar) return;

    try {
      setProcesando(true);
      const movimiento = await registrarAjusteManualInventario(datos, usuario);

      await auditarAccion(
        {
          modulo: "Inventario",
          accion: "Registrar ajuste",
          entidad: "Movimiento de inventario",
          entidadId: movimiento.id,
          descripcion:
            `${usuario.nombreCompleto} ajustó ${movimiento.insumoNombre} en ${formatearCantidadInventario(movimiento.cantidad, movimiento.unidadBase)}.`,
          datosPosteriores: movimiento,
          nivel: "Advertencia",
        },
        usuario,
      );

      setInsumoAjuste(null);
      setNotificacion({
        tipo: "exito",
        titulo: "Ajuste registrado",
        mensaje: `${movimiento.insumoNombre} quedó con ${formatearCantidadOperativa(
          movimiento.stockPosterior,
          movimiento.unidadBase,
        )}.`,
      });
      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo registrar el ajuste",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEstado() {
    if (!usuario || !accionEstado || !puedeGestionar) return;

    try {
      setProcesando(true);
      const actualizado = await cambiarEstadoInsumoInventario(
        accionEstado.insumo.id,
        accionEstado.nuevoEstado,
        usuario,
      );
      await auditarAccion(
        {
          modulo: "Inventario",
          accion:
            actualizado.estado === "Activo"
              ? "Activar insumo"
              : "Desactivar insumo",
          entidad: "Insumo",
          entidadId: actualizado.id,
          descripcion:
            `${actualizado.nombre} fue ${actualizado.estado === "Activo" ? "activado" : "desactivado"}.`,
          datosAnteriores:
            accionEstado.insumo,
          datosPosteriores:
            actualizado,
          nivel:
            actualizado.estado === "Inactivo"
              ? "Advertencia"
              : "Información",
        },
        usuario,
      );

      setAccionEstado(null);
      setNotificacion({
        tipo: "exito",
        titulo: actualizado.estado === "Activo" ? "Insumo activado" : "Insumo desactivado",
        mensaje: `${actualizado.nombre} ahora está ${actualizado.estado.toLocaleLowerCase("es")}.`,
      });
      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo cambiar el estado",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCategoria("Todas");
    setEstado("Todos");
    setNivel("Todos");
    setPaginaInsumos(1);
  }

  if (cargandoInicial) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-[34rem] rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-[34rem] rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (errorCarga || !resumen) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/60 dark:bg-slate-900">
        <AlertTriangle size={38} className="mx-auto text-red-600" />
        <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">No se pudo cargar el inventario</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{errorCarga ?? "No existe información disponible."}</p>
        <button
          type="button"
          onClick={() => void cargarDatos()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800"
        >
          <RefreshCw size={18} /> Volver a intentar
        </button>
      </section>
    );
  }

  const alertasOrdenadas = [...resumen.alertas].sort((a, b) => {
    const prioridad: Record<NivelStockInventario, number> = {
      Negativo: 0,
      Bajo: 1,
      Normal: 2,
    };
    return prioridad[calcularNivelStockInsumo(a)] - prioridad[calcularNivelStockInsumo(b)];
  });

  const pestanas = [
    { id: "resumen" as const, etiqueta: "Resumen", icono: Activity, contador: resumen.alertas.length },
    { id: "insumos" as const, etiqueta: "Insumos", icono: Package, contador: insumos.length },
    { id: "recetas" as const, etiqueta: "Recetas", icono: ClipboardList },
    { id: "movimientos" as const, etiqueta: "Movimientos", icono: ArrowDownUp },
    { id: "conteos" as const, etiqueta: "Conteos físicos", icono: ClipboardCheck },
  ];

  return (
    <div className="space-y-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() => setNotificacion(null)}
      />

      {!puedeGestionar && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/30">
          <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Modo de consulta</p>
          <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
            Tu rol puede revisar existencias, pero no registrar ni modificar movimientos.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-950/50" aria-label="Secciones del inventario">
          {pestanas.map((item) => {
            const Icono = item.icono;
            const activa = pestana === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPestana(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                  activa
                    ? "bg-red-700 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <Icono size={17} />
                {item.etiqueta}
                {item.contador !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activa ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {item.contador}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {pestana === "resumen" && (
          <div className="grid min-h-[36rem] gap-4 p-4 xl:grid-cols-2">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/25">
              <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                    <BellRing size={19} className="text-amber-600" /> Alertas de existencias
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Prioriza los insumos bajo el límite o con saldo negativo.</p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {alertasOrdenadas.length}
                </span>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {alertasOrdenadas.length === 0 ? (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <PackageCheck size={34} className="text-emerald-500" />
                    <p className="mt-3 font-black text-slate-900 dark:text-white">Existencias dentro de los límites</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No existen alertas que requieran atención.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alertasOrdenadas.map((insumo) => {
                      const estadoStock = calcularNivelStockInsumo(insumo);
                      const negativo = estadoStock === "Negativo";
                      const bajo = estadoStock === "Bajo";
                      const proporcion = insumo.controlarStockBajo && insumo.stockMinimo > 0
                        ? Math.max(0, Math.min(100, (insumo.stockActual / insumo.stockMinimo) * 100))
                        : 100;
                      return (
                        <article
                          key={insumo.id}
                          className={`grid gap-3 rounded-2xl border bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-center ${
                            negativo
                              ? "border-red-200 dark:border-red-900/70"
                              : "border-amber-200 dark:border-amber-900/70"
                          }`}
                        >
                          <div className="min-w-0 border-l-4 border-amber-500 pl-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-black text-slate-900 dark:text-white">{insumo.nombre}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${negativo ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>
                                {textoNivel(estadoStock)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-400">{insumo.codigo} · {insumo.categoria}</p>
                          </div>

                          <div>
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className={`text-lg font-black ${negativo ? "text-red-700 dark:text-red-300" : bajo ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>
                                  {formatearCantidadOperativa(insumo.stockActual, insumo.unidadBase)}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Límite: {formatearCantidadOperativa(insumo.stockMinimo, insumo.unidadBase)}
                                </p>
                              </div>
                              <span className="text-xs font-black text-slate-400">{Math.round(proporcion)}%</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full ${negativo ? "bg-red-600" : "bg-amber-500"}`}
                                style={{ width: `${Math.max(4, proporcion)}%` }}
                              />
                            </div>
                          </div>

                          {puedeGestionar && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                title="Registrar entrada"
                                aria-label={`Registrar entrada de ${insumo.nombre}`}
                                disabled={insumo.estado === "Inactivo"}
                                onClick={() => setInsumoEntrada(insumo)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <PackagePlus size={17} />
                              </button>
                              <button
                                type="button"
                                title="Configurar insumo"
                                aria-label={`Configurar ${insumo.nombre}`}
                                onClick={() => abrirEditar(insumo)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                              >
                                <Edit3 size={17} />
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/25">
              <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                    <ArrowDownUp size={19} className="text-blue-600" /> Movimientos recientes
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Últimos cambios de existencias registrados.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPestana("movimientos")}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Ver todos
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {resumen.movimientosRecientes.length === 0 ? (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <ArrowDownUp size={34} className="text-slate-300" />
                    <p className="mt-3 font-black text-slate-900 dark:text-white">Sin movimientos recientes</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                    {resumen.movimientosRecientes.map((movimiento) => (
                      <article key={movimiento.id} className="grid gap-2 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/70 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-black text-slate-900 dark:text-white">{movimiento.insumoNombre}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{movimiento.tipo}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {fechaHora(movimiento.fechaHora)} · {movimiento.usuarioNombre}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={`font-black ${movimiento.cantidad < 0 ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
                            {movimiento.cantidad > 0 ? "+" : ""}{formatearCantidadInventario(movimiento.cantidad, movimiento.unidadBase)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">Saldo: {formatearCantidadInventario(movimiento.stockPosterior, movimiento.unidadBase)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {pestana === "insumos" && (
          <div className="min-h-[34rem]">
            <header className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Insumos</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Existencias, límites y acciones frecuentes en una sola lista.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  title="Actualizar"
                  aria-label="Actualizar inventario"
                  onClick={() => void cargarDatos()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <RefreshCw size={18} />
                </button>
                {puedeGestionar && (
                  <button
                    type="button"
                    onClick={abrirNuevo}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800"
                  >
                    <Plus size={18} /> Nuevo insumo
                  </button>
                )}
              </div>
            </header>

            <div className="grid gap-2 border-b border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-950/30 xl:grid-cols-[minmax(260px,1fr)_210px_170px_170px_48px]">
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={busqueda}
                  placeholder="Buscar nombre, código o categoría"
                  onChange={(evento) => { setBusqueda(evento.target.value); setPaginaInsumos(1); }}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
                />
              </div>
              <select value={categoria} onChange={(evento) => { setCategoria(evento.target.value); setPaginaInsumos(1); }} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                {categorias.map((item) => <option key={item} value={item}>{item === "Todas" ? "Todas las categorías" : item}</option>)}
              </select>
              <select value={nivel} onChange={(evento) => { setNivel(evento.target.value as FiltroNivel); setPaginaInsumos(1); }} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                <option value="Todos">Todos los niveles</option>
                <option value="Normal">Stock normal</option>
                <option value="Bajo">Stock bajo</option>
                <option value="Negativo">Stock negativo</option>
              </select>
              <select value={estado} onChange={(evento) => { setEstado(evento.target.value as FiltroEstado); setPaginaInsumos(1); }} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
              <button type="button" title="Limpiar filtros" aria-label="Limpiar filtros" onClick={limpiarFiltros} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                <FilterX size={17} />
              </button>
            </div>

            {filtrados.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                <Search size={35} className="text-slate-300" />
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">No existen resultados</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Modifica los filtros o registra un nuevo insumo.</p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-[minmax(210px,0.85fr)_minmax(390px,1.6fr)_96px_190px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:grid">
                  <span>Insumo</span>
                  <span>Existencia y límite</span>
                  <span className="text-center">Control</span>
                  <span className="text-center">Acciones</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {insumosPagina.map((insumo) => {
                    const estadoStock = calcularNivelStockInsumo(insumo);
                    const negativo = estadoStock === "Negativo";
                    const bajo = estadoStock === "Bajo";
                    const relacion = insumo.controlarStockBajo && insumo.stockMinimo > 0
                      ? Math.max(0, Math.min(100, (insumo.stockActual / insumo.stockMinimo) * 100))
                      : 100;
                    return (
                      <article key={insumo.id} className={`grid min-h-[5.75rem] gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 lg:grid-cols-[minmax(210px,0.85fr)_minmax(390px,1.6fr)_96px_190px] lg:items-center ${insumo.estado === "Inactivo" ? "opacity-65" : ""}`}>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-900 dark:text-white">{insumo.nombre}</p>
                            {insumo.estado === "Inactivo" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">Inactivo</span>}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-400">{insumo.codigo} · {insumo.categoria}</p>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                              <p className={`text-lg font-black ${negativo ? "text-red-700 dark:text-red-300" : bajo ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>
                                {formatearCantidadOperativa(insumo.stockActual, insumo.unidadBase)}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {insumo.controlarStockBajo ? `Límite ${formatearCantidadOperativa(insumo.stockMinimo, insumo.unidadBase)}` : "Sin límite configurado"}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${claseNivel(estadoStock)} dark:bg-opacity-20`}>
                              {textoNivel(estadoStock)}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full rounded-full ${negativo ? "bg-red-600" : bajo ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(4, relacion)}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <span title={insumo.politicaFaltante === "Bloquear" ? "Bloquea ventas con faltantes" : "Permite ventas con advertencia"} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${insumo.politicaFaltante === "Bloquear" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"}`}>
                            <ShieldAlert size={16} />
                          </span>
                          <span title={insumo.controlEconomico && insumo.costoPromedioUnidadBase !== null ? `Valorado: Bs ${insumo.costoPromedioUnidadBase.toFixed(4)} / ${insumo.unidadBase}` : "Sin valoración económica"} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${insumo.controlEconomico ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                            <DollarSign size={16} />
                          </span>
                        </div>

                        <div className="flex items-center justify-start gap-2 lg:justify-center">
                          {puedeGestionar ? (
                            <>
                              <button type="button" title="Registrar entrada" aria-label={`Registrar entrada de ${insumo.nombre}`} disabled={insumo.estado === "Inactivo"} onClick={() => setInsumoEntrada(insumo)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"><PackagePlus size={17} /></button>
                              <button type="button" title="Registrar ajuste" aria-label={`Registrar ajuste de ${insumo.nombre}`} onClick={() => setInsumoAjuste(insumo)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"><ArrowLeftRight size={17} /></button>
                              <button type="button" title="Configurar insumo" aria-label={`Configurar ${insumo.nombre}`} onClick={() => abrirEditar(insumo)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"><Edit3 size={17} /></button>
                              <button type="button" title={insumo.estado === "Activo" ? "Desactivar insumo" : "Activar insumo"} aria-label={`${insumo.estado === "Activo" ? "Desactivar" : "Activar"} ${insumo.nombre}`} onClick={() => setAccionEstado({ insumo, nuevoEstado: insumo.estado === "Activo" ? "Inactivo" : "Activo" })} className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition ${insumo.estado === "Activo" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                                {insumo.estado === "Activo" ? <CircleOff size={17} /> : <PackageCheck size={17} />}
                              </button>
                            </>
                          ) : <span className="text-xs font-semibold text-slate-400">Solo consulta</span>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span>
                  Mostrando <strong className="text-slate-800 dark:text-white">{insumosPagina.length}</strong> de <strong className="text-slate-800 dark:text-white">{filtrados.length}</strong> resultado(s).
                </span>
                <span className="inline-flex items-center gap-2 text-xs">
                  <TrendingDown size={14} /> Los saldos negativos se conservan hasta regularizarse.
                </span>
              </div>

              {totalPaginasInsumos > 1 && (
                <div className="flex items-center gap-2">
                  <span className="mr-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    Página {paginaInsumosSegura} de {totalPaginasInsumos}
                  </span>
                  <button
                    type="button"
                    disabled={paginaInsumosSegura === 1}
                    onClick={() => setPaginaInsumos((pagina) => Math.max(1, pagina - 1))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaInsumosSegura === totalPaginasInsumos}
                    onClick={() => setPaginaInsumos((pagina) => Math.min(totalPaginasInsumos, pagina + 1))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </footer>
          </div>
        )}

        {pestana === "recetas" && (
          <PanelRecetas puedeGestionar={puedeGestionar} alNotificar={setNotificacion} alCambio={cargarDatos} />
        )}

        {pestana === "movimientos" && (
          <PanelMovimientos alNotificar={setNotificacion} />
        )}

        {pestana === "conteos" && (
          <PanelConteos puedeGestionar={puedeGestionar} alNotificar={setNotificacion} alCambio={cargarDatos} />
        )}
      </section>

      <Modal
        abierto={modalInsumo}
        titulo={insumoSeleccionado ? `Editar ${insumoSeleccionado.nombre}` : "Registrar insumo"}
        descripcion="Configura unidad, límite, política de faltantes y valoración."
        ancho="grande"
        alCerrar={cerrarInsumo}
      >
        <FormularioInsumo
          key={insumoSeleccionado?.id ?? "nuevo"}
          insumo={insumoSeleccionado}
          cargando={procesando}
          alGuardar={guardarInsumo}
          alCancelar={cerrarInsumo}
        />
      </Modal>

      <Modal
        abierto={Boolean(insumoEntrada)}
        titulo={insumoEntrada ? `Entrada de ${insumoEntrada.nombre}` : "Registrar entrada"}
        descripcion="La cantidad se suma incluso si el saldo actual es negativo."
        ancho="mediano"
        alCerrar={() => { if (!procesando) setInsumoEntrada(null); }}
      >
        {insumoEntrada && (
          <FormularioEntradaInventario
            key={insumoEntrada.id}
            insumo={insumoEntrada}
            cargando={procesando}
            alGuardar={guardarEntrada}
            alCancelar={() => setInsumoEntrada(null)}
          />
        )}
      </Modal>

      <Modal
        abierto={Boolean(insumoAjuste)}
        titulo={insumoAjuste ? `Ajustar ${insumoAjuste.nombre}` : "Registrar ajuste"}
        descripcion="El ajuste genera un movimiento trazable; no reemplaza silenciosamente la existencia."
        ancho="mediano"
        alCerrar={() => { if (!procesando) setInsumoAjuste(null); }}
      >
        {insumoAjuste && (
          <FormularioAjusteInventario
            key={insumoAjuste.id}
            insumo={insumoAjuste}
            cargando={procesando}
            alGuardar={guardarAjuste}
            alCancelar={() => setInsumoAjuste(null)}
          />
        )}
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(accionEstado)}
        titulo={accionEstado?.nuevoEstado === "Inactivo" ? "Desactivar insumo" : "Activar insumo"}
        descripcion={accionEstado?.nuevoEstado === "Inactivo" ? `¿Confirmas la desactivación de ${accionEstado.insumo.nombre}? No podrá usarse en nuevas recetas ni entradas.` : `¿Confirmas la activación de ${accionEstado?.insumo.nombre ?? "este insumo"}?`}
        textoConfirmar={accionEstado?.nuevoEstado === "Inactivo" ? "Sí, desactivar" : "Sí, activar"}
        centrarIcono
        variante={accionEstado?.nuevoEstado === "Inactivo" ? "peligro" : "activar"}
        cargando={procesando}
        alConfirmar={() => void confirmarEstado()}
        alCancelar={() => { if (!procesando) setAccionEstado(null); }}
      />
    </div>
  );
}

export default Inventario;
