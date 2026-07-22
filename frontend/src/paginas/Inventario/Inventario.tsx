import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  BadgeDollarSign,
  BellRing,
  Boxes,
  CircleOff,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  Package,
  PackageCheck,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
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
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

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

interface AccionEstado {
  insumo: InsumoInventario;
  nuevoEstado: "Activo" | "Inactivo";
}

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function fechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
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
      setInsumoEntrada(null);
      setNotificacion({
        tipo: "exito",
        titulo: "Entrada registrada",
        mensaje: `${movimiento.insumoNombre} quedó con ${formatearCantidadInventario(
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
      setInsumoAjuste(null);
      setNotificacion({
        tipo: "exito",
        titulo: "Ajuste registrado",
        mensaje: `${movimiento.insumoNombre} quedó con ${formatearCantidadInventario(
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
  }

  if (cargandoInicial) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-3xl bg-slate-300" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div key={indice} className="h-36 rounded-2xl bg-white" />
          ))}
        </div>
        <div className="h-130 rounded-3xl bg-white" />
      </div>
    );
  }

  if (errorCarga || !resumen) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel">
        <AlertTriangle size={38} className="mx-auto text-red-600" />
        <h2 className="mt-4 text-xl font-black text-slate-900">No se pudo cargar el inventario</h2>
        <p className="mt-2 text-sm text-slate-500">{errorCarga ?? "No existe información disponible."}</p>
        <button
          type="button"
          onClick={() => void cargarDatos()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
        >
          <RefreshCw size={18} /> Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() => setNotificacion(null)}
      />

      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white shadow-panel sm:p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-red-100">
              <Boxes size={15} /> Control operativo
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Inventario</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Controla insumos, conversiones, límites individuales, entradas y ajustes con trazabilidad.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={procesando}
              onClick={() => void cargarDatos()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw size={18} /> Actualizar
            </button>
            {puedeGestionar && (
              <button
                type="button"
                onClick={abrirNuevo}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-600"
              >
                <Plus size={18} /> Nuevo insumo
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          titulo="Insumos activos"
          valor={String(resumen.totalInsumosActivos)}
          descripcion={`${resumen.insumosNormales} con stock normal`}
          icono={PackageCheck}
          tono="azul"
        />
        <TarjetaMetrica
          titulo="Stock bajo"
          valor={String(resumen.insumosBajos)}
          descripcion="Según el límite de cada insumo"
          icono={BellRing}
          tono="ambar"
        />
        <TarjetaMetrica
          titulo="Stock negativo"
          valor={String(resumen.insumosNegativos)}
          descripcion="Pendiente de regularización"
          icono={TrendingDown}
          tono="roma"
        />
        <TarjetaMetrica
          titulo="Inventario valorado"
          valor={moneda(resumen.valorInventarioPositivo)}
          descripcion="Solo insumos con valoración activa"
          icono={BadgeDollarSign}
          tono="verde"
        />
      </section>

      {!puedeGestionar && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">Modo de consulta</p>
          <p className="mt-1 text-sm text-blue-700">
            Tu rol puede revisar existencias, pero no registrar ni modificar movimientos.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 p-3">
          <button
            type="button"
            onClick={() => setPestana("resumen")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              pestana === "resumen" ? "bg-red-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Activity size={17} /> Resumen
          </button>
          <button
            type="button"
            onClick={() => setPestana("insumos")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              pestana === "insumos" ? "bg-red-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Package size={17} /> Insumos
          </button>
          <button
            type="button"
            onClick={() => setPestana("recetas")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              pestana === "recetas" ? "bg-red-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardList size={17} /> Recetas
          </button>
          <button
            type="button"
            onClick={() => setPestana("movimientos")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              pestana === "movimientos" ? "bg-red-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowDownUp size={17} /> Movimientos
          </button>
          <button
            type="button"
            onClick={() => setPestana("conteos")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              pestana === "conteos" ? "bg-red-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardCheck size={17} /> Conteos físicos
          </button>
        </div>

        {pestana === "resumen" && (
          <div className="grid gap-7 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Alertas de existencias</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Se calculan usando el límite configurado en cada insumo.
                  </p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700">
                  {resumen.alertas.length}
                </span>
              </div>

              {resumen.alertas.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/40 p-10 text-center">
                  <PackageCheck size={36} className="mx-auto text-emerald-500" />
                  <p className="mt-4 font-black text-emerald-900">Inventario sin alertas</p>
                  <p className="mt-1 text-sm text-emerald-700">Ningún insumo activo llegó a su límite.</p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {resumen.alertas.map((insumo) => {
                    const estadoStock = calcularNivelStockInsumo(insumo);
                    return (
                      <article
                        key={insumo.id}
                        className={`rounded-2xl border p-4 ${
                          estadoStock === "Negativo" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">{insumo.nombre}</p>
                            <p className="mt-1 text-xs text-slate-500">{insumo.codigo} · {insumo.categoria}</p>
                          </div>
                          {estadoStock === "Negativo" ? (
                            <ShieldAlert size={22} className="shrink-0 text-red-700" />
                          ) : (
                            <BellRing size={22} className="shrink-0 text-amber-700" />
                          )}
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-slate-500">Stock teórico</p>
                            <p className={`mt-1 text-xl font-black ${estadoStock === "Negativo" ? "text-red-800" : "text-amber-800"}`}>
                              {formatearCantidadInventario(insumo.stockActual, insumo.unidadBase)}
                            </p>
                          </div>
                          {insumo.controlarStockBajo && (
                            <p className="text-right text-xs font-semibold text-slate-500">
                              Límite:<br />
                              {formatearCantidadInventario(insumo.stockMinimo, insumo.unidadBase)}
                            </p>
                          )}
                        </div>
                        {puedeGestionar && (
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setInsumoEntrada(insumo)}
                              className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50"
                            >
                              Registrar entrada
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirEditar(insumo)}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                            >
                              Configurar
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900">Movimientos recientes</h2>
              <p className="mt-1 text-sm text-slate-500">Últimos cambios de existencias.</p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                {resumen.movimientosRecientes.length === 0 ? (
                  <div className="p-8 text-center text-sm font-semibold text-slate-500">Sin movimientos</div>
                ) : (
                  resumen.movimientosRecientes.map((movimiento, indice) => (
                    <div
                      key={movimiento.id}
                      className={`flex items-start justify-between gap-4 p-4 ${indice > 0 ? "border-t border-slate-100" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{movimiento.insumoNombre}</p>
                        <p className="mt-1 text-xs text-slate-500">{movimiento.tipo} · {fechaHora(movimiento.fechaHora)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-black ${movimiento.cantidad < 0 ? "text-red-700" : "text-emerald-700"}`}>
                          {movimiento.cantidad > 0 ? "+" : ""}
                          {formatearCantidadInventario(movimiento.cantidad, movimiento.unidadBase)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{movimiento.usuarioNombre}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {resumen.valorDeficitInventario > 0 && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase text-red-600">Déficit valorado</p>
                  <p className="mt-1 text-2xl font-black text-red-900">{moneda(resumen.valorDeficitInventario)}</p>
                  <p className="mt-1 text-xs text-red-700">
                    Solo incluye insumos negativos con valoración económica activa.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {pestana === "insumos" && (
          <div>
            <div className="grid gap-3 border-b border-slate-100 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_190px_170px_170px_auto]">
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={busqueda}
                  placeholder="Buscar por nombre, código o categoría..."
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
                />
              </div>

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
              >
                {categorias.map((item) => (
                  <option key={item} value={item}>{item === "Todas" ? "Todas las categorías" : item}</option>
                ))}
              </select>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as FiltroEstado)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>

              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value as FiltroNivel)}
                className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100"
              >
                <option value="Todos">Todos los niveles</option>
                <option value="Normal">Stock normal</option>
                <option value="Bajo">Stock bajo</option>
                <option value="Negativo">Stock negativo</option>
              </select>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                <Settings2 size={17} /> Limpiar
              </button>
            </div>

            {filtrados.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <Search size={35} className="text-slate-300" />
                <h3 className="mt-4 text-lg font-black text-slate-900">No existen resultados</h3>
                <p className="mt-1 text-sm text-slate-500">Modifica los filtros o registra un nuevo insumo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-337.5">
                  <thead>
                    <tr className="bg-slate-50">
                      {["Insumo", "Categoría", "Stock teórico", "Alerta", "Política", "Valoración", "Estado", "Acciones"].map(
                        (encabezado) => (
                          <th key={encabezado} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                            {encabezado}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((insumo) => {
                      const estadoStock = calcularNivelStockInsumo(insumo);
                      return (
                        <tr key={insumo.id} className={`hover:bg-slate-50/70 ${insumo.estado === "Inactivo" ? "opacity-65" : ""}`}>
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-900">{insumo.nombre}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">{insumo.codigo}</p>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-600">{insumo.categoria}</td>
                          <td className="px-5 py-4">
                            <p className={`font-black ${estadoStock === "Negativo" ? "text-red-700" : estadoStock === "Bajo" ? "text-amber-700" : "text-slate-900"}`}>
                              {formatearCantidadInventario(insumo.stockActual, insumo.unidadBase)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              1 {insumo.presentacionCompra} = {formatearCantidadInventario(insumo.factorConversionCompra, insumo.unidadBase)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${claseNivel(estadoStock)}`}>
                              {textoNivel(estadoStock)}
                            </span>
                            <p className="mt-2 text-xs text-slate-500">
                              {insumo.controlarStockBajo
                                ? `Límite: ${formatearCantidadInventario(insumo.stockMinimo, insumo.unidadBase)}`
                                : "Sin control de stock bajo"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                              insumo.politicaFaltante === "Bloquear" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                            }`}>
                              {insumo.politicaFaltante}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {insumo.controlEconomico && insumo.costoPromedioUnidadBase !== null ? (
                              <div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Con valoración</span>
                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                  Bs {new Intl.NumberFormat("es-BO", {
                                    minimumFractionDigits: 4,
                                    maximumFractionDigits: 6,
                                  }).format(insumo.costoPromedioUnidadBase)} / {insumo.unidadBase}
                                </p>
                              </div>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Solo cantidades</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                              insumo.estado === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              <span className={`h-2 w-2 rounded-full ${insumo.estado === "Activo" ? "bg-emerald-500" : "bg-slate-400"}`} />
                              {insumo.estado}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {puedeGestionar ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={insumo.estado === "Inactivo"}
                                  onClick={() => setInsumoEntrada(insumo)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <PackagePlus size={15} /> Entrada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInsumoAjuste(insumo)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                >
                                  <SlidersHorizontal size={15} /> Ajuste
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirEditar(insumo)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
                                >
                                  <Edit3 size={15} /> Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAccionEstado({
                                    insumo,
                                    nuevoEstado: insumo.estado === "Activo" ? "Inactivo" : "Activo",
                                  })}
                                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                    insumo.estado === "Activo"
                                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                >
                                  {insumo.estado === "Activo" ? <CircleOff size={15} /> : <PackageCheck size={15} />}
                                  {insumo.estado === "Activo" ? "Desactivar" : "Activar"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">Solo consulta</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">
                Mostrando <strong className="text-slate-800">{filtrados.length}</strong> de <strong className="text-slate-800">{insumos.length}</strong> insumos.
              </p>
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ShieldAlert size={15} /> Los saldos negativos se conservan hasta su regularización.
              </p>
            </div>
          </div>
        )}

        {pestana === "recetas" && (
          <PanelRecetas
            puedeGestionar={puedeGestionar}
            alNotificar={setNotificacion}
            alCambio={cargarDatos}
          />
        )}

        {pestana === "movimientos" && (
          <PanelMovimientos
            alNotificar={setNotificacion}
          />
        )}

        {pestana === "conteos" && (
          <PanelConteos
            puedeGestionar={puedeGestionar}
            alNotificar={setNotificacion}
            alCambio={cargarDatos}
          />
        )}
      </section>

      <Modal
        abierto={modalInsumo}
        titulo={insumoSeleccionado ? `Editar ${insumoSeleccionado.nombre}` : "Registrar insumo"}
        descripcion="Configura unidad, conversión, alerta individual, política de faltantes y valoración."
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
        alCerrar={() => {
          if (!procesando) setInsumoEntrada(null);
        }}
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
        alCerrar={() => {
          if (!procesando) setInsumoAjuste(null);
        }}
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
        descripcion={
          accionEstado?.nuevoEstado === "Inactivo"
            ? `¿Confirmas la desactivación de ${accionEstado.insumo.nombre}? No podrá usarse en nuevas recetas ni entradas.`
            : `¿Confirmas la activación de ${accionEstado?.insumo.nombre ?? "este insumo"}?`
        }
        textoConfirmar={accionEstado?.nuevoEstado === "Inactivo" ? "Sí, desactivar" : "Sí, activar"}
        variante={accionEstado?.nuevoEstado === "Inactivo" ? "peligro" : "activar"}
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
