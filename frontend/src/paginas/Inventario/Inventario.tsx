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
  FileDown,
  FilterX,
  Package,
  PackageCheck,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Square,
  CheckSquare,
  X,
  TrendingDown,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../contextos/AuthContext";

import { auditarAccion } from "../../servicios/auditoriaAccionesServicio";

import { descargarPdfReporte } from "../../servicios/exportacionServicio";

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

import type { ColumnaExportacion } from "../../tipos/reportes";

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

type Pestana = "resumen" | "insumos" | "recetas" | "movimientos" | "conteos";
type FiltroEstado = "Todos" | "Activo" | "Inactivo";
type FiltroNivel = "Todos" | NivelStockInventario;

const INSUMOS_POR_PAGINA = 5;
const CLAVE_PESTANA_INVENTARIO = "roma-inventario-pestana-ui-v1";

const PESTANAS_INVENTARIO: Pestana[] = [
  "resumen",
  "insumos",
  "recetas",
  "movimientos",
  "conteos",
];

function leerPestanaInventario(): Pestana {
  try {
    const guardada = window.sessionStorage.getItem(CLAVE_PESTANA_INVENTARIO);

    return PESTANAS_INVENTARIO.includes(guardada as Pestana)
      ? (guardada as Pestana)
      : "resumen";
  } catch {
    return "resumen";
  }
}

function guardarPestanaInventario(pestana: Pestana): void {
  try {
    window.sessionStorage.setItem(CLAVE_PESTANA_INVENTARIO, pestana);
  } catch {
    // El estado de navegación es opcional; Inventario sigue funcionando sin sessionStorage.
  }
}

function normalizarPestanaInventario(
  pestana: Pestana,
  puedeVerRecetas: boolean,
  puedeVerMovimientos: boolean,
  puedeVerConteos: boolean,
): Pestana {
  const permitida =
    pestana === "resumen" ||
    pestana === "insumos" ||
    (pestana === "recetas" && puedeVerRecetas) ||
    (pestana === "movimientos" && puedeVerMovimientos) ||
    (pestana === "conteos" && puedeVerConteos);

  return permitida ? pestana : "resumen";
}

interface AccionEstado {
  insumo: InsumoInventario;
  nuevoEstado: "Activo" | "Inactivo";
}

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
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

interface FilaReporteExistencias {
  codigo: string;
  nombre: string;
  categoria: string;
  existencia: string;
  minimo: string;
  estado: string;
  faltante: string;
  compraSugerida: string;
}

const COLUMNAS_REPORTE_EXISTENCIAS: ColumnaExportacion<FilaReporteExistencias>[] =
  [
    {
      encabezado: "Código",
      obtenerValor: (fila) => fila.codigo,
      peso: 0.7,
    },
    {
      encabezado: "Insumo",
      obtenerValor: (fila) => fila.nombre,
      peso: 1.35,
    },
    {
      encabezado: "Categoría",
      obtenerValor: (fila) => fila.categoria,
      peso: 0.9,
    },
    {
      encabezado: "Existencia",
      obtenerValor: (fila) => fila.existencia,
      peso: 0.85,
    },
    {
      encabezado: "Mínimo",
      obtenerValor: (fila) => fila.minimo,
      peso: 0.8,
    },
    {
      encabezado: "Estado",
      obtenerValor: (fila) => fila.estado,
      peso: 0.85,
    },
    {
      encabezado: "Faltante para mínimo",
      obtenerValor: (fila) => fila.faltante,
      peso: 1.0,
    },
    {
      encabezado: "Compra mínima sugerida",
      obtenerValor: (fila) => fila.compraSugerida,
      peso: 1.15,
    },
  ];

interface FormularioReporteExistenciasProps {
  insumos: InsumoInventario[];
  alCancelar: () => void;
}

function FormularioReporteExistencias({
  insumos,
  alCancelar,
}: FormularioReporteExistenciasProps) {
  const activos = useMemo(
    () => insumos.filter((insumo) => insumo.estado === "Activo"),
    [insumos],
  );

  const [busquedaReporte, setBusquedaReporte] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<number>>(
    () => new Set<number>(),
  );
  const [errorReporte, setErrorReporte] = useState<string | null>(null);

  const visiblesReporte = useMemo(() => {
    const texto = busquedaReporte.trim().toLocaleLowerCase("es");

    return activos.filter(
      (insumo) =>
        !texto ||
        insumo.nombre.toLocaleLowerCase("es").includes(texto) ||
        insumo.codigo.toLocaleLowerCase("es").includes(texto) ||
        insumo.categoria.toLocaleLowerCase("es").includes(texto),
    );
  }, [activos, busquedaReporte]);

  const insumosSeleccionados = activos.filter((insumo) =>
    seleccionados.has(insumo.id),
  );

  const requierenReposicion = insumosSeleccionados.filter(
    (insumo) =>
      insumo.controlarStockBajo && insumo.stockActual < insumo.stockMinimo,
  );

  function alternarSeleccion(insumoId: number) {
    setSeleccionados((actuales) => {
      const siguientes = new Set(actuales);

      if (siguientes.has(insumoId)) {
        siguientes.delete(insumoId);
      } else {
        siguientes.add(insumoId);
      }

      return siguientes;
    });
    setErrorReporte(null);
  }

  function alternarTodosReporte() {
    const todosSeleccionados =
      activos.length > 0 &&
      activos.every((insumo) => seleccionados.has(insumo.id));

    setSeleccionados(
      todosSeleccionados
        ? new Set<number>()
        : new Set(activos.map((insumo) => insumo.id)),
    );
    setErrorReporte(null);
  }

  function generarReporteExistencias() {
    if (insumosSeleccionados.length === 0) {
      setErrorReporte("Selecciona al menos un insumo para generar el reporte.");
      return;
    }

    const registros: FilaReporteExistencias[] = insumosSeleccionados.map(
      (insumo) => {
        const nivelStock = calcularNivelStockInsumo(insumo);
        const faltante = insumo.controlarStockBajo
          ? Math.max(0, insumo.stockMinimo - insumo.stockActual)
          : 0;

        const presentaciones =
          faltante > 0 && insumo.factorConversionCompra > 0
            ? Math.ceil(faltante / insumo.factorConversionCompra)
            : 0;

        return {
          codigo: insumo.codigo,
          nombre: insumo.nombre,
          categoria: insumo.categoria,
          existencia: formatearCantidadOperativa(
            insumo.stockActual,
            insumo.unidadBase,
          ),
          minimo: insumo.controlarStockBajo
            ? formatearCantidadOperativa(insumo.stockMinimo, insumo.unidadBase)
            : "Sin límite",
          estado: insumo.controlarStockBajo
            ? textoNivel(nivelStock)
            : "Sin control de mínimo",
          faltante: !insumo.controlarStockBajo
            ? "No calculado"
            : faltante > 0
              ? formatearCantidadOperativa(faltante, insumo.unidadBase)
              : "No requiere",
          compraSugerida: !insumo.controlarStockBajo
            ? "No calculada"
            : presentaciones > 0
              ? `${presentaciones} × ${insumo.presentacionCompra}`
              : "No requiere",
        };
      },
    );

    const fecha = new Date();
    const nombreFecha = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0"),
    ].join("-");

    descargarPdfReporte({
      nombreArchivo: `existencias-inventario-${nombreFecha}`,
      titulo: "Roma Fast Food - Existencias de inventario",
      descripcion:
        "Existencias registradas actualmente en el sistema para los insumos seleccionados. La reposición sugerida indica la compra mínima necesaria para alcanzar el stock mínimo configurado; no sustituye un conteo físico.",
      registros,
      columnas: COLUMNAS_REPORTE_EXISTENCIAS,
      auditoria: {
        modulo: "Inventario",
        accion: "Generar PDF de existencias",
        entidad: "Insumos",
      },
      resumen: [
        {
          etiqueta: "Insumos incluidos",
          valor: String(registros.length),
        },
        {
          etiqueta: "Requieren reposición",
          valor: String(requierenReposicion.length),
        },
        {
          etiqueta: "Sin reposición",
          valor: String(registros.length - requierenReposicion.length),
        },
      ],
    });

    setErrorReporte(null);
  }

  return (
    <div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200">
          <p className="font-black">Qué muestra este reporte</p>
          <p className="mt-1 leading-relaxed">
            Usa las existencias registradas por el sistema. Para saber la
            cantidad física exacta debe realizarse y confirmarse un conteo
            físico.
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busquedaReporte}
              placeholder="Buscar por nombre, código o categoría"
              onChange={(evento) => setBusquedaReporte(evento.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
            />
          </div>

          <button
            type="button"
            onClick={alternarTodosReporte}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {activos.length > 0 && seleccionados.size === activos.length ? (
              <CheckSquare size={17} />
            ) : (
              <Square size={17} />
            )}
            {activos.length > 0 && seleccionados.size === activos.length
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {insumosSeleccionados.length} seleccionados
          </span>
          <span className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">
            {requierenReposicion.length} requieren reposición
          </span>
        </div>

        <div className="max-h-[44vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="sticky top-0 z-10 hidden grid-cols-[34px_minmax(210px,1.25fr)_150px_150px_165px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:grid">
            <span />
            <span>Insumo</span>
            <span>Existencia</span>
            <span>Stock mínimo</span>
            <span>Reposición</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visiblesReporte.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                No hay insumos que coincidan con la búsqueda.
              </div>
            ) : (
              visiblesReporte.map((insumo) => {
                const seleccionado = seleccionados.has(insumo.id);
                const faltante = insumo.controlarStockBajo
                  ? Math.max(0, insumo.stockMinimo - insumo.stockActual)
                  : 0;
                const nivelStock = calcularNivelStockInsumo(insumo);

                return (
                  <label
                    key={insumo.id}
                    className={`grid cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 lg:grid-cols-[34px_minmax(210px,1.25fr)_150px_150px_165px] lg:items-center ${
                      seleccionado ? "" : "opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      onChange={() => alternarSeleccion(insumo.id)}
                      className="h-4 w-4 accent-red-700"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900 dark:text-white">
                        {insumo.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {insumo.codigo} · {insumo.categoria}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">
                        Existencia
                      </p>
                      <p className="font-black text-slate-800 dark:text-slate-100">
                        {formatearCantidadOperativa(
                          insumo.stockActual,
                          insumo.unidadBase,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">
                        Stock mínimo
                      </p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {insumo.controlarStockBajo
                          ? formatearCantidadOperativa(
                              insumo.stockMinimo,
                              insumo.unidadBase,
                            )
                          : "Sin límite"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">
                        Reposición
                      </p>
                      {insumo.controlarStockBajo ? (
                        faltante > 0 ? (
                          <div>
                            <p className="font-black text-amber-700 dark:text-amber-300">
                              {formatearCantidadOperativa(
                                faltante,
                                insumo.unidadBase,
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              para alcanzar el mínimo
                            </p>
                          </div>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${claseNivel(nivelStock)} dark:bg-opacity-20`}
                          >
                            No requiere
                          </span>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          No calculada
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {errorReporte && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {errorReporte}
          </div>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-700 dark:bg-slate-950/95">
        <button
          type="button"
          onClick={alCancelar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="button"
          disabled={insumosSeleccionados.length === 0}
          onClick={generarReporteExistencias}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown size={18} />
          Generar PDF
        </button>
      </footer>
    </div>
  );
}

function Inventario() {
  const { usuario } = useAuth();

  const puedeCrearInsumos =
    usuario?.permisos.includes("INVENTARIO_INSUMOS_CREAR") ?? false;

  const puedeEditarInsumos =
    usuario?.permisos.includes("INVENTARIO_INSUMOS_EDITAR") ?? false;

  const puedeCambiarEstadoInsumos =
    usuario?.permisos.includes("INVENTARIO_ESTADO_INSUMO") ?? false;

  const puedeRegistrarEntradas =
    usuario?.permisos.includes("INVENTARIO_ENTRADAS") ?? false;

  const puedeAumentarStock =
    usuario?.permisos.includes("INVENTARIO_AJUSTES_AUMENTAR") ?? false;

  const puedeDisminuirStock =
    usuario?.permisos.includes("INVENTARIO_AJUSTES_DISMINUIR") ?? false;

  const puedeVerRecetas =
    usuario?.permisos.includes("INVENTARIO_RECETAS_VER") ?? false;

  const puedeGestionarRecetas =
    usuario?.permisos.includes("INVENTARIO_RECETAS_GESTIONAR") ?? false;

  const puedeVerMovimientos =
    usuario?.permisos.includes("INVENTARIO_MOVIMIENTOS_VER") ?? false;

  const puedeVerConteos =
    usuario?.permisos.includes("INVENTARIO_CONTEOS_VER") ?? false;

  const puedeRegistrarConteos =
    usuario?.permisos.includes("INVENTARIO_CONTEOS_REGISTRAR") ?? false;

  const puedeExportarReportes =
    usuario?.permisos.includes("REPORTES_EXPORTAR") ?? false;

  const puedeAjustarStock = puedeAumentarStock || puedeDisminuirStock;

  const tieneAccionesInsumo =
    puedeRegistrarEntradas ||
    puedeAjustarStock ||
    puedeEditarInsumos ||
    puedeCambiarEstadoInsumos;

  const [pestana, setPestana] = useState<Pestana>(() =>
    normalizarPestanaInventario(
      leerPestanaInventario(),
      puedeVerRecetas,
      puedeVerMovimientos,
      puedeVerConteos,
    ),
  );

  const pestanaActiva = normalizarPestanaInventario(
    pestana,
    puedeVerRecetas,
    puedeVerMovimientos,
    puedeVerConteos,
  );

  const cambiarPestana = (nuevaPestana: Pestana) => {
    const normalizada = normalizarPestanaInventario(
      nuevaPestana,
      puedeVerRecetas,
      puedeVerMovimientos,
      puedeVerConteos,
    );

    guardarPestanaInventario(normalizada);
    setPestana(normalizada);
  };
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [resumen, setResumen] = useState<ResumenInventario | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<DatosNotificacion | null>(
    null,
  );

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [estado, setEstado] = useState<FiltroEstado>("Todos");
  const [nivel, setNivel] = useState<FiltroNivel>("Todos");
  const [paginaInsumos, setPaginaInsumos] = useState(1);

  const [modalInsumo, setModalInsumo] = useState(false);
  const [modalReporteExistencias, setModalReporteExistencias] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] =
    useState<InsumoInventario | null>(null);
  const [modalEntradas, setModalEntradas] = useState(false);
  const [insumoEntradaInicialId, setInsumoEntradaInicialId] = useState<
    number | null
  >(null);
  const [insumoAjuste, setInsumoAjuste] = useState<InsumoInventario | null>(
    null,
  );
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
      ...Array.from(new Set(insumos.map((insumo) => insumo.categoria))).sort(
        (a, b) => a.localeCompare(b, "es"),
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
      const coincideCategoria =
        categoria === "Todas" || insumo.categoria === categoria;
      const coincideEstado = estado === "Todos" || insumo.estado === estado;
      const coincideNivel =
        nivel === "Todos" || calcularNivelStockInsumo(insumo) === nivel;

      return (
        coincideTexto && coincideCategoria && coincideEstado && coincideNivel
      );
    });
  }, [insumos, busqueda, categoria, estado, nivel]);

  const totalPaginasInsumos = Math.max(
    1,
    Math.ceil(filtrados.length / INSUMOS_POR_PAGINA),
  );

  const paginaInsumosSegura = Math.min(paginaInsumos, totalPaginasInsumos);

  const insumosPagina = filtrados.slice(
    (paginaInsumosSegura - 1) * INSUMOS_POR_PAGINA,
    paginaInsumosSegura * INSUMOS_POR_PAGINA,
  );

  function abrirNuevo() {
    if (!puedeCrearInsumos) return;
    setInsumoSeleccionado(null);
    setModalInsumo(true);
  }

  function abrirEditar(insumo: InsumoInventario) {
    if (!puedeEditarInsumos) return;
    setInsumoSeleccionado(insumo);
    setModalInsumo(true);
  }

  function cerrarInsumo() {
    if (procesando) return;
    setModalInsumo(false);
    setInsumoSeleccionado(null);
  }

  function abrirEntradas(insumo?: InsumoInventario) {
    if (!puedeRegistrarEntradas) return;
    setInsumoEntradaInicialId(insumo?.id ?? null);
    setModalEntradas(true);
  }

  function cerrarEntradas() {
    if (procesando) return;
    setModalEntradas(false);
    setInsumoEntradaInicialId(null);
  }

  async function guardarInsumo(datos: DatosFormularioInsumo) {
    if (!usuario) return;

    if (insumoSeleccionado ? !puedeEditarInsumos : !puedeCrearInsumos) {
      return;
    }

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
            datosAnteriores: insumoSeleccionado,
            datosPosteriores: actualizado,
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

  async function guardarEntradas(datosLista: RegistrarEntradaInventarioDto[]) {
    if (!usuario || !puedeRegistrarEntradas || datosLista.length === 0) return;

    try {
      setProcesando(true);

      const movimientos = [];

      for (const datos of datosLista) {
        const movimiento = await registrarEntradaInventario(datos, usuario);
        movimientos.push(movimiento);

        await auditarAccion(
          {
            modulo: "Inventario",
            accion: "Registrar entrada",
            entidad: "Movimiento de inventario",
            entidadId: movimiento.id,
            descripcion: `${usuario.nombreCompleto} registró una entrada de ${formatearCantidadInventario(movimiento.cantidad, movimiento.unidadBase)} para ${movimiento.insumoNombre}.`,
            datosPosteriores: movimiento,
          },
          usuario,
        );
      }

      setModalEntradas(false);
      setInsumoEntradaInicialId(null);

      if (movimientos.length === 1) {
        const movimiento = movimientos[0];
        setNotificacion({
          tipo: "exito",
          titulo: "Entrada registrada",
          mensaje: `${movimiento.insumoNombre} quedó con ${formatearCantidadOperativa(
            movimiento.stockPosterior,
            movimiento.unidadBase,
          )}.`,
        });
      } else {
        setNotificacion({
          tipo: "exito",
          titulo: "Entradas registradas",
          mensaje: `Se registraron correctamente ${movimientos.length} entradas de inventario.`,
        });
      }

      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudieron registrar las entradas",
        mensaje: mensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function guardarAjuste(datos: RegistrarAjusteManualInventarioDto) {
    if (!usuario) return;

    const tienePermisoAjuste =
      datos.cantidadAjuste > 0 ? puedeAumentarStock : puedeDisminuirStock;

    if (!tienePermisoAjuste) return;

    try {
      setProcesando(true);
      const movimiento = await registrarAjusteManualInventario(datos, usuario);

      await auditarAccion(
        {
          modulo: "Inventario",
          accion: "Registrar ajuste",
          entidad: "Movimiento de inventario",
          entidadId: movimiento.id,
          descripcion: `${usuario.nombreCompleto} ajustó ${movimiento.insumoNombre} en ${formatearCantidadInventario(movimiento.cantidad, movimiento.unidadBase)}.`,
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
    if (!usuario || !accionEstado || !puedeCambiarEstadoInsumos) return;

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
          descripcion: `${actualizado.nombre} fue ${actualizado.estado === "Activo" ? "activado" : "desactivado"}.`,
          datosAnteriores: accionEstado.insumo,
          datosPosteriores: actualizado,
          nivel:
            actualizado.estado === "Inactivo" ? "Advertencia" : "Información",
        },
        usuario,
      );

      setAccionEstado(null);
      setNotificacion({
        tipo: "exito",
        titulo:
          actualizado.estado === "Activo"
            ? "Insumo activado"
            : "Insumo desactivado",
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
          <div className="h-136 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-136 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (errorCarga || !resumen) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/60 dark:bg-slate-900">
        <AlertTriangle size={38} className="mx-auto text-red-600" />
        <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          No se pudo cargar el inventario
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {errorCarga ?? "No existe información disponible."}
        </p>
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
    return (
      prioridad[calcularNivelStockInsumo(a)] -
      prioridad[calcularNivelStockInsumo(b)]
    );
  });

  const pestanas = [
    {
      id: "resumen" as const,
      etiqueta: "Resumen",
      icono: Activity,
      contador: resumen.alertas.length,
    },
    {
      id: "insumos" as const,
      etiqueta: "Insumos",
      icono: Package,
      contador: insumos.length,
    },
    ...(puedeVerRecetas
      ? [
          {
            id: "recetas" as const,
            etiqueta: "Recetas",
            icono: ClipboardList,
          },
        ]
      : []),
    ...(puedeVerMovimientos
      ? [
          {
            id: "movimientos" as const,
            etiqueta: "Movimientos",
            icono: ArrowDownUp,
          },
        ]
      : []),
    ...(puedeVerConteos
      ? [
          {
            id: "conteos" as const,
            etiqueta: "Conteos físicos",
            icono: ClipboardCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() => setNotificacion(null)}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <nav
          className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-950/50"
          aria-label="Secciones del inventario"
        >
          {pestanas.map((item) => {
            const Icono = item.icono;
            const activa = pestanaActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => cambiarPestana(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150 ${
                  activa
                    ? "bg-red-700 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <Icono size={17} />
                {item.etiqueta}
                {item.contador !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${activa ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}
                  >
                    {item.contador}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {pestanaActiva === "resumen" && (
          <div
            className={`grid min-h-144 gap-4 p-4 ${puedeVerMovimientos ? "xl:grid-cols-2" : "grid-cols-1"}`}
          >
            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/25">
              <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                    <BellRing size={19} className="text-amber-600" /> Alertas de
                    existencias
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Prioriza los insumos bajo el límite o con saldo negativo.
                  </p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  {alertasOrdenadas.length}
                </span>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {alertasOrdenadas.length === 0 ? (
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <PackageCheck size={34} className="text-emerald-500" />
                    <p className="mt-3 font-black text-slate-900 dark:text-white">
                      Existencias dentro de los límites
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      No existen alertas que requieran atención.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alertasOrdenadas.map((insumo) => {
                      const estadoStock = calcularNivelStockInsumo(insumo);
                      const negativo = estadoStock === "Negativo";
                      const bajo = estadoStock === "Bajo";
                      const proporcion =
                        insumo.controlarStockBajo && insumo.stockMinimo > 0
                          ? Math.max(
                              0,
                              Math.min(
                                100,
                                (insumo.stockActual / insumo.stockMinimo) * 100,
                              ),
                            )
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
                              <p className="truncate font-black text-slate-900 dark:text-white">
                                {insumo.nombre}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${negativo ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}
                              >
                                {textoNivel(estadoStock)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {insumo.codigo} · {insumo.categoria}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p
                                  className={`text-lg font-black ${negativo ? "text-red-700 dark:text-red-300" : bajo ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}
                                >
                                  {formatearCantidadOperativa(
                                    insumo.stockActual,
                                    insumo.unidadBase,
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Límite:{" "}
                                  {formatearCantidadOperativa(
                                    insumo.stockMinimo,
                                    insumo.unidadBase,
                                  )}
                                </p>
                              </div>
                              <span className="text-xs font-black text-slate-400">
                                {Math.round(proporcion)}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full ${negativo ? "bg-red-600" : "bg-amber-500"}`}
                                style={{ width: `${Math.max(4, proporcion)}%` }}
                              />
                            </div>
                          </div>

                          {(puedeRegistrarEntradas || puedeEditarInsumos) && (
                            <div className="flex items-center justify-end gap-2">
                              {puedeRegistrarEntradas && (
                                <button
                                  type="button"
                                  title="Registrar entrada"
                                  aria-label={`Registrar entrada de ${insumo.nombre}`}
                                  disabled={insumo.estado === "Inactivo"}
                                  onClick={() => abrirEntradas(insumo)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <PackagePlus size={17} />
                                </button>
                              )}

                              {puedeEditarInsumos && (
                                <button
                                  type="button"
                                  title="Configurar insumo"
                                  aria-label={`Configurar ${insumo.nombre}`}
                                  onClick={() => abrirEditar(insumo)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                                >
                                  <Edit3 size={17} />
                                </button>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {puedeVerMovimientos && (
              <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-950/25">
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div>
                    <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                      <ArrowDownUp size={19} className="text-blue-600" />{" "}
                      Movimientos recientes
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Últimos cambios de existencias registrados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cambiarPestana("movimientos")}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Ver todos
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {resumen.movimientosRecientes.length === 0 ? (
                    <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                      <ArrowDownUp size={34} className="text-slate-300" />
                      <p className="mt-3 font-black text-slate-900 dark:text-white">
                        Sin movimientos recientes
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                      {resumen.movimientosRecientes.map((movimiento) => (
                        <article
                          key={movimiento.id}
                          className="grid gap-2 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/70 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-black text-slate-900 dark:text-white">
                                {movimiento.insumoNombre}
                              </p>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {movimiento.tipo}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {fechaHora(movimiento.fechaHora)} ·{" "}
                              {movimiento.usuarioNombre}
                            </p>
                            <p
                              className="mt-1 truncate text-xs font-semibold text-slate-600 dark:text-slate-300"
                              title={
                                movimiento.tipo === "Consumo automático" &&
                                movimiento.numeroPedido
                                  ? `Pedido ${movimiento.numeroPedido}`
                                  : movimiento.motivo?.trim() ||
                                    "Sin detalle adicional"
                              }
                            >
                              {movimiento.tipo === "Consumo automático" &&
                              movimiento.numeroPedido
                                ? `Pedido ${movimiento.numeroPedido}`
                                : movimiento.motivo?.trim() ||
                                  "Sin detalle adicional"}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p
                              className={`font-black ${movimiento.cantidad < 0 ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}
                            >
                              {movimiento.cantidad > 0 ? "+" : ""}
                              {formatearCantidadInventario(
                                movimiento.cantidad,
                                movimiento.unidadBase,
                              )}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              Saldo:{" "}
                              {formatearCantidadInventario(
                                movimiento.stockPosterior,
                                movimiento.unidadBase,
                              )}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {pestanaActiva === "insumos" && (
          <div className="min-h-136">
            <header className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Insumos
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Existencias, límites y acciones frecuentes en una sola lista.
                </p>
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
                {puedeExportarReportes && (
                  <button
                    type="button"
                    onClick={() => setModalReporteExistencias(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                  >
                    <FileDown size={18} />
                    Reporte de existencias
                  </button>
                )}
                {puedeRegistrarEntradas && (
                  <button
                    type="button"
                    onClick={() => abrirEntradas()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    <PackagePlus size={18} /> Registrar entradas
                  </button>
                )}
                {puedeCrearInsumos && (
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
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={busqueda}
                  placeholder="Buscar nombre, código o categoría"
                  onChange={(evento) => {
                    setBusqueda(evento.target.value);
                    setPaginaInsumos(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-red-950/50"
                />
              </div>
              <select
                value={categoria}
                onChange={(evento) => {
                  setCategoria(evento.target.value);
                  setPaginaInsumos(1);
                }}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {categorias.map((item) => (
                  <option key={item} value={item}>
                    {item === "Todas" ? "Todas las categorías" : item}
                  </option>
                ))}
              </select>
              <select
                value={nivel}
                onChange={(evento) => {
                  setNivel(evento.target.value as FiltroNivel);
                  setPaginaInsumos(1);
                }}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="Todos">Todos los niveles</option>
                <option value="Normal">Stock normal</option>
                <option value="Bajo">Stock bajo</option>
                <option value="Negativo">Stock negativo</option>
              </select>
              <select
                value={estado}
                onChange={(evento) => {
                  setEstado(evento.target.value as FiltroEstado);
                  setPaginaInsumos(1);
                }}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
              <button
                type="button"
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
                onClick={limpiarFiltros}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FilterX size={17} />
              </button>
            </div>

            {filtrados.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                <Search size={35} className="text-slate-300" />
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                  No existen resultados
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Modifica los filtros o registra un nuevo insumo.
                </p>
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
                    const relacion =
                      insumo.controlarStockBajo && insumo.stockMinimo > 0
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              (insumo.stockActual / insumo.stockMinimo) * 100,
                            ),
                          )
                        : 100;
                    return (
                      <article
                        key={insumo.id}
                        className={`grid min-h-23 gap-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 lg:grid-cols-[minmax(210px,0.85fr)_minmax(390px,1.6fr)_96px_190px] lg:items-center ${insumo.estado === "Inactivo" ? "opacity-65" : ""}`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-900 dark:text-white">
                              {insumo.nombre}
                            </p>
                            {insumo.estado === "Inactivo" && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {insumo.codigo} · {insumo.categoria}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                              <p
                                className={`text-lg font-black ${negativo ? "text-red-700 dark:text-red-300" : bajo ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}
                              >
                                {formatearCantidadOperativa(
                                  insumo.stockActual,
                                  insumo.unidadBase,
                                )}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {insumo.controlarStockBajo
                                  ? `Límite ${formatearCantidadOperativa(insumo.stockMinimo, insumo.unidadBase)}`
                                  : "Sin límite configurado"}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${claseNivel(estadoStock)} dark:bg-opacity-20`}
                            >
                              {textoNivel(estadoStock)}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${negativo ? "bg-red-600" : bajo ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.max(4, relacion)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <span
                            title={
                              insumo.politicaFaltante === "Bloquear"
                                ? "Bloquea ventas con faltantes"
                                : "Permite ventas con advertencia"
                            }
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${insumo.politicaFaltante === "Bloquear" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"}`}
                          >
                            <ShieldAlert size={16} />
                          </span>
                          <span
                            title={
                              insumo.controlEconomico &&
                              insumo.costoPromedioUnidadBase !== null
                                ? `Valorado: Bs ${insumo.costoPromedioUnidadBase.toFixed(4)} / ${insumo.unidadBase}`
                                : "Sin valoración económica"
                            }
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${insumo.controlEconomico ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}
                          >
                            <DollarSign size={16} />
                          </span>
                        </div>

                        <div className="flex items-center justify-start gap-2 lg:justify-center">
                          {tieneAccionesInsumo ? (
                            <>
                              {puedeRegistrarEntradas && (
                                <button
                                  type="button"
                                  title="Registrar entrada"
                                  aria-label={`Registrar entrada de ${insumo.nombre}`}
                                  disabled={insumo.estado === "Inactivo"}
                                  onClick={() => abrirEntradas(insumo)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <PackagePlus size={17} />
                                </button>
                              )}
                              {puedeAjustarStock && (
                                <button
                                  type="button"
                                  title="Registrar ajuste"
                                  aria-label={`Registrar ajuste de ${insumo.nombre}`}
                                  onClick={() => setInsumoAjuste(insumo)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                                >
                                  <ArrowLeftRight size={17} />
                                </button>
                              )}
                              {puedeEditarInsumos && (
                                <button
                                  type="button"
                                  title="Configurar insumo"
                                  aria-label={`Configurar ${insumo.nombre}`}
                                  onClick={() => abrirEditar(insumo)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                                >
                                  <Edit3 size={17} />
                                </button>
                              )}
                              {puedeCambiarEstadoInsumos && (
                                <button
                                  type="button"
                                  title={
                                    insumo.estado === "Activo"
                                      ? "Desactivar insumo"
                                      : "Activar insumo"
                                  }
                                  aria-label={`${insumo.estado === "Activo" ? "Desactivar" : "Activar"} ${insumo.nombre}`}
                                  onClick={() =>
                                    setAccionEstado({
                                      insumo,
                                      nuevoEstado:
                                        insumo.estado === "Activo"
                                          ? "Inactivo"
                                          : "Activo",
                                    })
                                  }
                                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition ${insumo.estado === "Activo" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                                >
                                  {insumo.estado === "Activo" ? (
                                    <CircleOff size={17} />
                                  ) : (
                                    <PackageCheck size={17} />
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Solo consulta
                            </span>
                          )}
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
                  Mostrando{" "}
                  <strong className="text-slate-800 dark:text-white">
                    {insumosPagina.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-slate-800 dark:text-white">
                    {filtrados.length}
                  </strong>{" "}
                  resultado(s).
                </span>
                <span className="inline-flex items-center gap-2 text-xs">
                  <TrendingDown size={14} /> Los saldos negativos se conservan
                  hasta regularizarse.
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
                    onClick={() =>
                      setPaginaInsumos((pagina) => Math.max(1, pagina - 1))
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaInsumosSegura === totalPaginasInsumos}
                    onClick={() =>
                      setPaginaInsumos((pagina) =>
                        Math.min(totalPaginasInsumos, pagina + 1),
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </footer>
          </div>
        )}

        {pestanaActiva === "recetas" && puedeVerRecetas && (
          <PanelRecetas
            puedeGestionarRecetas={puedeGestionarRecetas}
            alNotificar={setNotificacion}
            alCambio={cargarDatos}
          />
        )}

        {pestanaActiva === "movimientos" && puedeVerMovimientos && (
          <PanelMovimientos alNotificar={setNotificacion} />
        )}

        {pestanaActiva === "conteos" && puedeVerConteos && (
          <PanelConteos
            puedeRegistrar={puedeRegistrarConteos}
            alNotificar={setNotificacion}
            alCambio={cargarDatos}
          />
        )}
      </section>

      <Modal
        abierto={modalReporteExistencias}
        titulo="Reporte de existencias"
        descripcion="Selecciona los insumos que deseas incluir y genera un PDF para revisar stock y necesidades de reposición."
        ancho="grande"
        alCerrar={() => setModalReporteExistencias(false)}
      >
        {modalReporteExistencias && (
          <FormularioReporteExistencias
            insumos={insumos}
            alCancelar={() => setModalReporteExistencias(false)}
          />
        )}
      </Modal>

      <Modal
        abierto={modalInsumo}
        titulo={
          insumoSeleccionado
            ? `Editar ${insumoSeleccionado.nombre}`
            : "Registrar insumo"
        }
        descripcion="Configura unidad, límite, política de faltantes y valoración."
        ancho="grande"
        alCerrar={cerrarInsumo}
      >
        <FormularioInsumo
          key={insumoSeleccionado?.id ?? "nuevo"}
          insumo={insumoSeleccionado}
          cargando={procesando}
          puedeRegistrarStockInicial={puedeRegistrarEntradas}
          alGuardar={guardarInsumo}
          alCancelar={cerrarInsumo}
        />
      </Modal>

      <Modal
        abierto={modalEntradas}
        titulo="Registrar entradas de inventario"
        descripcion="Selecciona uno o varios insumos recibidos y registra toda la recepción en una sola operación."
        ancho="grande"
        alCerrar={cerrarEntradas}
      >
        <FormularioEntradaInventario
          key={`${insumoEntradaInicialId ?? "lote"}-${modalEntradas ? "abierto" : "cerrado"}`}
          insumos={insumos}
          insumoInicialId={insumoEntradaInicialId}
          cargando={procesando}
          alGuardar={guardarEntradas}
          alCancelar={cerrarEntradas}
        />
      </Modal>

      <Modal
        abierto={Boolean(insumoAjuste)}
        titulo={
          insumoAjuste ? `Ajustar ${insumoAjuste.nombre}` : "Registrar ajuste"
        }
        descripcion="El ajuste genera un movimiento trazable; no reemplaza silenciosamente la existencia."
        ancho="mediano"
        alCerrar={() => {
          if (!procesando) setInsumoAjuste(null);
        }}
      >
        {insumoAjuste && (
          <FormularioAjusteInventario
            key={insumoAjuste.id}
            insumo={insumoAjuste}
            cargando={procesando}
            puedeAumentar={puedeAumentarStock}
            puedeDisminuir={puedeDisminuirStock}
            alGuardar={guardarAjuste}
            alCancelar={() => setInsumoAjuste(null)}
          />
        )}
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(accionEstado)}
        titulo={
          accionEstado?.nuevoEstado === "Inactivo"
            ? "Desactivar insumo"
            : "Activar insumo"
        }
        descripcion={
          accionEstado?.nuevoEstado === "Inactivo"
            ? `¿Confirmas la desactivación de ${accionEstado.insumo.nombre}? No podrá usarse en nuevas recetas ni entradas.`
            : `¿Confirmas la activación de ${accionEstado?.insumo.nombre ?? "este insumo"}?`
        }
        textoConfirmar={
          accionEstado?.nuevoEstado === "Inactivo"
            ? "Sí, desactivar"
            : "Sí, activar"
        }
        centrarIcono
        variante={
          accionEstado?.nuevoEstado === "Inactivo" ? "peligro" : "activar"
        }
        cargando={procesando}
        alConfirmar={() => void confirmarEstado()}
        alCancelar={() => {
          if (!procesando) setAccionEstado(null);
        }}
      />
    </div>
  );
}

export default Inventario;
