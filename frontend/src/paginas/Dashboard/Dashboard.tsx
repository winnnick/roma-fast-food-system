import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Filter,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Tag,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "../../contextos/AuthContext";

import {
  crearPeriodoRapidoAnalitica,
  obtenerPanelAdministrativo,
} from "../../servicios/analiticaServicio";

import DashboardSkeleton from "../../shared/feedback/DashboardSkeleton";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import type {
  ActividadOperativa,
  AlertaAdministrativa,
  FiltroPeriodoAnalitica,
  ModuloActividadOperativa,
  PanelAdministrativo,
  PeriodoRapidoAnalitica,
  ProductoVendidoAnalitica,
  ResumenMetodoPagoAnalitica,
} from "../../tipos/analitica";

const PERIODOS_RAPIDOS: PeriodoRapidoAnalitica[] = [
  "Hoy",
  "Últimos 7 días",
  "Este mes",
  "Mes anterior",
];

const CLAVE_ALERTAS_REVISADAS =
  "roma-alertas-revisadas";

const CLAVE_ALERTAS_OCULTAS =
  "roma-alertas-ocultas";

const CLAVE_PERIODO_DASHBOARD =
  "roma-dashboard-periodo";

const CLAVE_FILTRO_DASHBOARD =
  "roma-dashboard-filtro";

const PERIODO_PREDETERMINADO:
  PeriodoRapidoAnalitica =
    "Últimos 7 días";

interface PreferenciaPeriodoDashboard {
  periodo: PeriodoRapidoAnalitica;
  filtro: FiltroPeriodoAnalitica;
}

function esPeriodoDashboardValido(
  valor: string,
): valor is PeriodoRapidoAnalitica {
  return [
    "Hoy",
    "Últimos 7 días",
    "Este mes",
    "Mes anterior",
    "Personalizado",
  ].includes(valor);
}

function esFiltroPeriodoValido(
  valor: unknown,
): valor is FiltroPeriodoAnalitica {
  if (
    typeof valor !== "object" ||
    valor === null
  ) {
    return false;
  }

  const filtro =
    valor as Record<string, unknown>;

  return (
    typeof filtro.fechaDesde ===
      "string" &&
    typeof filtro.fechaHasta ===
      "string" &&
    filtro.fechaDesde.length > 0 &&
    filtro.fechaHasta.length > 0
  );
}

function recuperarPreferenciaPeriodo():
  PreferenciaPeriodoDashboard {
  try {
    const periodoGuardado =
      localStorage.getItem(
        CLAVE_PERIODO_DASHBOARD,
      );

    if (
      !periodoGuardado ||
      !esPeriodoDashboardValido(
        periodoGuardado,
      )
    ) {
      return {
        periodo:
          PERIODO_PREDETERMINADO,
        filtro:
          crearPeriodoRapidoAnalitica(
            PERIODO_PREDETERMINADO,
          ),
      };
    }

    if (
      periodoGuardado !==
      "Personalizado"
    ) {
      return {
        periodo: periodoGuardado,
        filtro:
          crearPeriodoRapidoAnalitica(
            periodoGuardado,
          ),
      };
    }

    const filtroGuardado =
      localStorage.getItem(
        CLAVE_FILTRO_DASHBOARD,
      );

    if (!filtroGuardado) {
      throw new Error(
        "No existe un filtro personalizado guardado.",
      );
    }

    const filtro = JSON.parse(
      filtroGuardado,
    ) as unknown;

    if (
      !esFiltroPeriodoValido(
        filtro,
      )
    ) {
      throw new Error(
        "El filtro guardado no es válido.",
      );
    }

    return {
      periodo: "Personalizado",
      filtro,
    };
  } catch {
    localStorage.removeItem(
      CLAVE_PERIODO_DASHBOARD,
    );

    localStorage.removeItem(
      CLAVE_FILTRO_DASHBOARD,
    );

    return {
      periodo:
        PERIODO_PREDETERMINADO,
      filtro:
        crearPeriodoRapidoAnalitica(
          PERIODO_PREDETERMINADO,
        ),
    };
  }
}

function guardarPreferenciaPeriodo(
  periodo: PeriodoRapidoAnalitica,
  filtro: FiltroPeriodoAnalitica,
): void {
  localStorage.setItem(
    CLAVE_PERIODO_DASHBOARD,
    periodo,
  );

  if (
    periodo === "Personalizado"
  ) {
    localStorage.setItem(
      CLAVE_FILTRO_DASHBOARD,
      JSON.stringify(filtro),
    );

    return;
  }

  localStorage.removeItem(
    CLAVE_FILTRO_DASHBOARD,
  );
}

function formatearMoneda(
  valor: number,
): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function formatearNumero(
  valor: number,
): string {
  return new Intl.NumberFormat(
    "es-BO",
    {
      maximumFractionDigits: 2,
    },
  ).format(valor);
}

function formatearFechaHora(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(fecha));
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible cargar la información administrativa.";
}

function obtenerColorPago(
  metodo: string,
): string {
  const colores: Record<
    string,
    string
  > = {
    Efectivo: "#10b981",
    QR: "#3b82f6",
    Mixto: "#f43f5e",
  };

  return colores[metodo] ?? "#6366f1";
}

function leerIdsPersistidos(
  clave: string,
): string[] {
  try {
    const valor =
      localStorage.getItem(clave);

    if (!valor) {
      return [];
    }

    const datos = JSON.parse(
      valor,
    ) as unknown;

    if (!Array.isArray(datos)) {
      return [];
    }

    return datos.filter(
      (item) =>
        typeof item === "string",
    );
  } catch {
    return [];
  }
}

function guardarIdsPersistidos(
  clave: string,
  ids: string[],
): void {
  localStorage.setItem(
    clave,
    JSON.stringify(ids),
  );
}

function obtenerEstiloAlerta(
  prioridad: string,
): {
  borde: string;
  etiqueta: string;
  icono: string;
  realce: string;
} {
  const configuracion = {
    Baja: {
      borde: "border-l-sky-500",
      etiqueta:
        "bg-sky-100 text-sky-800",
      icono:
        "bg-sky-100 text-sky-700",
      realce:
        "ring-sky-400/50",
    },
    Media: {
      borde: "border-l-amber-500",
      etiqueta:
        "bg-amber-100 text-amber-800",
      icono:
        "bg-amber-100 text-amber-700",
      realce:
        "ring-amber-400/50",
    },
    Alta: {
      borde: "border-l-orange-500",
      etiqueta:
        "bg-orange-100 text-orange-800",
      icono:
        "bg-orange-100 text-orange-700",
      realce:
        "ring-orange-400/50",
    },
    Crítica: {
      borde: "border-l-red-500",
      etiqueta:
        "bg-red-100 text-red-800",
      icono:
        "bg-red-100 text-red-700",
      realce:
        "ring-red-400/50",
    },
  } as const;

  return (
    configuracion[
      prioridad as keyof typeof configuracion
    ] ?? configuracion.Media
  );
}

function obtenerIconoActividad(
  modulo: ModuloActividadOperativa,
) {
  const iconos = {
    Ventas: ReceiptText,
    Caja: WalletCards,
    Inventario: Boxes,
    Recetas: ShoppingBag,
    Auditoría: Activity,
  };

  return iconos[modulo];
}

function KpiPrincipal({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
}) {
  return (
    <TarjetaMetrica
      titulo={titulo}
      valor={valor}
      descripcion={descripcion}
      icono={CircleDollarSign}
      tono="roma"
      variante="principal"
      insignia="Indicador clave"
      className="h-full"
    />
  );
}

function KpiCompacta({
  titulo,
  valor,
  descripcion,
  icono,
  tono,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: typeof ReceiptText;
  tono:
    | "azul"
    | "verde"
    | "violeta"
    | "ambar"
    | "rosa"
    | "roma"
    | "neutro";
}) {
  return (
    <TarjetaMetrica
      titulo={titulo}
      valor={valor}
      descripcion={descripcion}
      icono={icono}
      tono={tono}
      variante="compacta"
      className="h-full"
    />
  );
}

function FiltroPeriodo({
  periodoRapido,
  filtro,
  cargando,
  alSeleccionarPeriodo,
  alCambiarFiltro,
  alAplicar,
  alActualizar,
}: {
  periodoRapido: PeriodoRapidoAnalitica;
  filtro: FiltroPeriodoAnalitica;
  cargando: boolean;
  alSeleccionarPeriodo: (
    periodo: PeriodoRapidoAnalitica,
  ) => void;
  alCambiarFiltro: (
    filtro: FiltroPeriodoAnalitica,
  ) => void;
  alAplicar: () => void;
  alActualizar: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Filter
              size={16}
              className="text-roma-700"
            />
            Periodo de análisis
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PERIODOS_RAPIDOS.map(
              (periodo) => (
                <button
                  key={periodo}
                  type="button"
                  disabled={cargando}
                  onClick={() =>
                    alSeleccionarPeriodo(
                      periodo,
                    )
                  }
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                    periodoRapido ===
                    periodo
                      ? "border-roma-700 bg-roma-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-roma-200 hover:bg-roma-50 hover:text-roma-700"
                  } disabled:opacity-50`}
                >
                  {periodo}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_auto_auto]">
          <label>
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Fecha inicial
            </span>

            <div className="relative mt-1.5">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={filtro.fechaDesde}
                disabled={cargando}
                onChange={(evento) =>
                  alCambiarFiltro({
                    ...filtro,
                    fechaDesde:
                      evento.target.value,
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100"
              />
            </div>
          </label>

          <label>
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Fecha final
            </span>

            <div className="relative mt-1.5">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={filtro.fechaHasta}
                disabled={cargando}
                onChange={(evento) =>
                  alCambiarFiltro({
                    ...filtro,
                    fechaHasta:
                      evento.target.value,
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100"
              />
            </div>
          </label>

          <button
            type="button"
            disabled={cargando}
            onClick={alAplicar}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {cargando ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <Filter size={16} />
            )}
            Aplicar
          </button>

          <button
            type="button"
            disabled={cargando}
            onClick={alActualizar}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                cargando
                  ? "animate-spin"
                  : ""
              }
            />
            Actualizar
          </button>
        </div>
      </div>
    </section>
  );
}

function CentroAlertas({
  alertas,
  alertasNuevas,
  puedeGestionar,
  alGestionar,
}: {
  alertas: AlertaAdministrativa[];
  alertasNuevas: string[];
  puedeGestionar: boolean;
  alGestionar: (
    alerta: AlertaAdministrativa,
  ) => void;
}) {
  return (
    <section className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={18}
              className="text-amber-600"
            />

            <h2 className="text-lg font-black text-slate-900">
              Centro de alertas
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Resumen operativo que requiere revisión.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {alertas.length}
        </span>
      </div>

      {alertas.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-6 text-center">
          <p className="font-black text-emerald-900">
            Sin alertas administrativas
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            No existen observaciones críticas para el periodo.
          </p>
        </div>
      ) : (
        <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {alertas.map((alerta) => {
            const estilo =
              obtenerEstiloAlerta(
                alerta.prioridad,
              );

            const esNueva =
              alertasNuevas.includes(
                alerta.id,
              );

            return (
              <article
                key={alerta.id}
                className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${estilo.borde} ${esNueva ? `ring-2 ${estilo.realce}` : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}>
                    <AlertTriangle size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-slate-900">
                          {alerta.titulo}
                        </p>

                        {esNueva && (
                          <span className="rounded-full bg-roma-100 px-2.5 py-1 text-[11px] font-black text-roma-800">
                            Nueva
                          </span>
                        )}
                      </div>

                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${estilo.etiqueta}`}>
                        {alerta.prioridad}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {alerta.descripcion}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      <span>
                        Tipo: {alerta.tipo}
                      </span>

                      {alerta.cantidad !==
                        null && (
                        <span>
                          Cantidad:{" "}
                          {formatearNumero(
                            alerta.cantidad,
                          )}
                        </span>
                      )}

                      {alerta.monto !== null && (
                        <span>
                          Monto:{" "}
                          {formatearMoneda(
                            alerta.monto,
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid w-full grid-cols-2 gap-2 sm:w-fit">
                      <Link
                        to={alerta.ruta}
                        className="inline-flex min-w-28 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        Revisar
                      </Link>

                      {puedeGestionar && (
                        <button
                          type="button"
                          onClick={() =>
                            alGestionar(
                              alerta,
                            )
                          }
                          className="inline-flex min-w-28 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 hover:text-amber-900"
                        >
                          Gestionar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActividadRecientePanel({
  actividades,
}: {
  actividades: ActividadOperativa[];
}) {
  const [
    filtroUsuario,
    setFiltroUsuario,
  ] = useState("Todos");

  const usuarios = useMemo(
    () => [
      "Todos",
      ...new Set(
        actividades.map(
          (actividad) =>
            actividad.usuarioNombre,
        ),
      ),
    ],
    [actividades],
  );

  const actividadesFiltradas =
    useMemo(
      () =>
        actividades.filter(
          (actividad) =>
            filtroUsuario ===
              "Todos" ||
            actividad.usuarioNombre ===
              filtroUsuario,
        ),
      [
        actividades,
        filtroUsuario,
      ],
    );

  return (
    <section className="flex h-[32rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity
              size={18}
              className="text-blue-700"
            />

            <h2 className="text-lg font-black text-slate-900">
              Actividad reciente
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Registro operativo reciente del sistema.
          </p>
        </div>

        <select
          value={filtroUsuario}
          onChange={(evento) =>
            setFiltroUsuario(
              evento.target.value,
            )
          }
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-500"
        >
          {usuarios.map((usuario) => (
            <option
              key={usuario}
              value={usuario}
            >
              {usuario === "Todos"
                ? "Todos los usuarios"
                : usuario}
            </option>
          ))}
        </select>
      </div>

      {actividadesFiltradas.length === 0 ? (
        <div className="mt-4 flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No existen movimientos para los filtros seleccionados.
        </div>
      ) : (
        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {actividadesFiltradas.map(
            (actividad) => {
              const Icono =
                obtenerIconoActividad(
                  actividad.modulo,
                );

              return (
                <article
                  key={actividad.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700">
                      <Icono size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-slate-900">
                          {actividad.accion}
                        </p>

                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {actividad.modulo}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {actividad.descripcion}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>
                          {
                            actividad.usuarioNombre
                          }
                        </span>

                        <span>
                          {formatearFechaHora(
                            actividad.fechaHora,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function GraficoVentasDia({
  data,
}: {
  data: PanelAdministrativo["ventasPorDia"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
      <div>
        <div className="flex items-center gap-2">
          <ReceiptText
            size={18}
            className="text-roma-700"
          />

          <h2 className="text-lg font-black text-slate-900">
            Ventas por día
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Evolución real de pedidos y ventas cobradas.
        </p>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -16,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="colorVentas"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#e11d48"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="#e11d48"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
            />

            <Tooltip
              formatter={(valor) =>
                [
                  formatearMoneda(
                    Number(valor ?? 0),
                  ),
                  "Ventas cobradas",
                ] as [string, string]
              }
              labelFormatter={(label) =>
                `Fecha: ${label}`
              }
              contentStyle={{
                borderRadius: "14px",
                border:
                  "1px solid #e2e8f0",
              }}
            />

            <Area
              type="monotone"
              dataKey="ventasCobradas"
              stroke="#e11d48"
              strokeWidth={3}
              fill="url(#colorVentas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ProductosMasVendidos({
  productos,
}: {
  productos: ProductoVendidoAnalitica[];
}) {
  const datosGrafico = productos
    .slice(0, 6)
    .map((producto) => ({
      nombre: producto.nombreProducto,
      nombreCorto:
        producto.nombreProducto.length > 16
          ? `${producto.nombreProducto.slice(0, 14)}…`
          : producto.nombreProducto,
      cantidadVendida:
        producto.cantidadVendida,
    }));

  const totalUnidades = datosGrafico.reduce(
    (total, producto) =>
      total + producto.cantidadVendida,
    0,
  );

  return (
    <section className="flex h-full min-h-[17rem] flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag
              size={18}
              className="text-roma-700"
            />

            <h2 className="text-lg font-black text-slate-900">
              Productos más vendidos
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Comparación de unidades vendidas por producto.
          </p>
        </div>

        <Link
          to="/reportes"
          className="shrink-0 text-xs font-bold text-roma-700 hover:text-roma-800"
        >
          Ver reportes
        </Link>
      </div>

      {datosGrafico.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No existen ventas en el periodo.
        </div>
      ) : (
        <div className="mt-4 grid flex-1 gap-4 md:grid-cols-[minmax(150px,0.42fr)_minmax(0,1fr)] md:items-stretch">
          <div className="flex min-h-44 flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Productos
            </p>

            <ol className="mt-2 space-y-2">
              {datosGrafico.map(
                (producto, indice) => (
                  <li
                    key={producto.nombre}
                    className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700"
                    title={producto.nombre}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-black text-roma-700 shadow-sm">
                      {indice + 1}
                    </span>

                    <span className="truncate">
                      {producto.nombre}
                    </span>
                  </li>
                ),
              )}
            </ol>
          </div>

          <div className="h-48 min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={datosGrafico}
                margin={{
                  top: 18,
                  right: 12,
                  left: -18,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={true}
                  horizontal={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="nombreCorto"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  formatter={(valor) =>
                    [
                      `${formatearNumero(
                        Number(valor ?? 0),
                      )} uds.`,
                      "Cantidad vendida",
                    ] as [string, string]
                  }
                  labelFormatter={(
                    _label,
                    payload,
                  ) =>
                    payload?.[0]?.payload
                      ?.nombre ?? "Producto"
                  }
                  contentStyle={{
                    borderRadius: "14px",
                    border:
                      "1px solid #e2e8f0",
                  }}
                />

                <Bar
                  dataKey="cantidadVendida"
                  fill="#e11d48"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={46}
                  label={{
                    position: "top",
                    fill: "#64748b",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {datosGrafico.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>
            {datosGrafico.length} productos comparados
          </span>

          <span className="font-bold text-slate-700">
            {formatearNumero(totalUnidades)} unidades en total
          </span>
        </div>
      )}
    </section>
  );
}
function MetodosPagoCompacto({
  metodos,
}: {
  metodos: ResumenMetodoPagoAnalitica[];
}) {
  const datos =
    metodos.map((metodo) => ({
      name: metodo.metodo,
      value: metodo.totalCobrado,
      color: obtenerColorPago(
        metodo.metodo,
      ),
      pagos: metodo.cantidadPagos,
    })) ?? [];

  const total =
    datos.reduce(
      (acumulado, dato) =>
        acumulado + dato.value,
      0,
    ) || 1;

  return (
    <section className="flex h-full min-h-[17rem] flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-panel">
      <div>
        <div className="flex items-center gap-2">
          <CreditCard
            size={18}
            className="text-emerald-700"
          />

          <h2 className="text-lg font-black text-slate-900">
            Métodos de pago
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Distribución cobrada en el periodo.
        </p>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-[92px_minmax(0,1fr)] items-center gap-3">
        <div className="h-28">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={datos}
                dataKey="value"
                innerRadius={29}
                outerRadius={44}
                paddingAngle={2}
              >
                {datos.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(valor) =>
                  [
                    formatearMoneda(
                      Number(valor ?? 0),
                    ),
                    "Cobrado",
                  ] as [string, string]
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 divide-y divide-slate-200">
          {datos.map((dato) => (
            <article
              key={dato.name}
              className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      dato.color,
                  }}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {dato.name}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {dato.pagos} pagos
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-black text-slate-900">
                  {formatearMoneda(
                    dato.value,
                  )}
                </p>

                <p className="text-[11px] text-slate-500">
                  {((dato.value / total) * 100).toFixed(
                    0,
                  )}
                  %
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemandaPorHoraCompacta({
  data,
}: {
  data: PanelAdministrativo["ventasPorHora"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
      <div>
        <div className="flex items-center gap-2">
          <Clock3
            size={18}
            className="text-blue-700"
          />

          <h2 className="text-lg font-black text-slate-900">
            Demanda por hora
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Identifica los tramos de mayor concentración.
        </p>
      </div>

      <div className="mt-4 h-48">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={data}
            margin={{
              top: 8,
              right: 0,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
            />

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 11,
              }}
            />

            <Tooltip />

            <Bar
              dataKey="pedidosRegistrados"
              radius={[8, 8, 0, 0]}
              fill="#3b82f6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Dashboard() {
  const { usuario } =
    useAuth();

  const [preferenciaInicial] =
    useState<PreferenciaPeriodoDashboard>(
    () =>
      recuperarPreferenciaPeriodo(),
  );

  const periodoInicial =
    preferenciaInicial.filtro;

  const [
    periodoRapido,
    setPeriodoRapido,
  ] =
    useState<PeriodoRapidoAnalitica>(
      preferenciaInicial.periodo,
    );

  const [
    filtroBorrador,
    setFiltroBorrador,
  ] =
    useState<FiltroPeriodoAnalitica>(
      preferenciaInicial.filtro,
    );

  const [
    filtroAplicado,
    setFiltroAplicado,
  ] =
    useState<FiltroPeriodoAnalitica>(
      preferenciaInicial.filtro,
    );

  const [panel, setPanel] =
    useState<PanelAdministrativo | null>(
      null,
    );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    alertasVisibles,
    setAlertasVisibles,
  ] = useState<
    AlertaAdministrativa[]
  >([]);

  const [
    alertasNuevas,
    setAlertasNuevas,
  ] = useState<string[]>([]);

  const [
    alertaSeleccionada,
    setAlertaSeleccionada,
  ] = useState<AlertaAdministrativa | null>(
    null,
  );

  const [
    gestionandoAlerta,
    setGestionandoAlerta,
  ] = useState(false);

  const puedeGestionarAlertas =
    usuario?.roles?.includes(
      "Administrador",
    ) === true ||
    usuario?.permisos.includes(
      "REPORTES_VER",
    ) === true;

  const sincronizarAlertasDesdePanel =
    useCallback(
      (
        alertasBase: AlertaAdministrativa[],
      ) => {
        const revisadas =
          new Set(
            leerIdsPersistidos(
              CLAVE_ALERTAS_REVISADAS,
            ),
          );

        const ocultas = new Set(
          leerIdsPersistidos(
            CLAVE_ALERTAS_OCULTAS,
          ),
        );

        const visibles =
          alertasBase.filter(
            (alerta) =>
              !ocultas.has(alerta.id),
          );

        const nuevas = visibles
          .filter(
            (alerta) =>
              !revisadas.has(alerta.id),
          )
          .map((alerta) => alerta.id);

        setAlertasVisibles(visibles);
        setAlertasNuevas(nuevas);
      },
      [],
    );

  const cargarPanel =
    useCallback(
      async (
        filtro: FiltroPeriodoAnalitica,
      ) => {
        try {
          setCargando(true);
          setError(null);

          const respuesta =
            await obtenerPanelAdministrativo(
              filtro,
            );

          setPanel(respuesta);
          setFiltroAplicado(
            respuesta.periodo,
          );
          sincronizarAlertasDesdePanel(
            respuesta.alertas,
          );
        } catch (
          errorCarga: unknown
        ) {
          setError(
            obtenerMensajeError(
              errorCarga,
            ),
          );
        } finally {
          setCargando(false);
        }
      },
      [
        sincronizarAlertasDesdePanel,
      ],
    );

  useEffect(() => {
    let activo = true;

    const temporizador =
      window.setTimeout(() => {
        obtenerPanelAdministrativo(
          periodoInicial,
        )
          .then((respuesta) => {
            if (!activo) {
              return;
            }

            setPanel(respuesta);
            setFiltroAplicado(
              respuesta.periodo,
            );
            sincronizarAlertasDesdePanel(
              respuesta.alertas,
            );
            setError(null);
          })
          .catch(
            (errorCarga: unknown) => {
              if (!activo) {
                return;
              }

              setError(
                obtenerMensajeError(
                  errorCarga,
                ),
              );
            },
          )
          .finally(() => {
            if (activo) {
              setCargando(false);
            }
          });
      }, 0);

    return () => {
      activo = false;
      window.clearTimeout(
        temporizador,
      );
    };
  }, [
    periodoInicial,
    sincronizarAlertasDesdePanel,
  ]);

  function seleccionarPeriodo(
    periodo: PeriodoRapidoAnalitica,
  ) {
    const nuevoFiltro =
      crearPeriodoRapidoAnalitica(
        periodo,
      );

    setPeriodoRapido(periodo);
    setFiltroBorrador(nuevoFiltro);

    guardarPreferenciaPeriodo(
      periodo,
      nuevoFiltro,
    );

    void cargarPanel(
      nuevoFiltro,
    );
  }

  function cambiarFiltro(
    filtro: FiltroPeriodoAnalitica,
  ) {
    setPeriodoRapido(
      "Personalizado",
    );

    setFiltroBorrador(filtro);
  }

  function aplicarFiltro() {
    guardarPreferenciaPeriodo(
      periodoRapido,
      filtroBorrador,
    );

    void cargarPanel(
      filtroBorrador,
    );
  }

  function actualizarPanel() {
    void cargarPanel(
      filtroAplicado,
    );
  }

  function gestionarAlerta(
    alerta: AlertaAdministrativa,
  ) {
    setAlertaSeleccionada(alerta);
  }

  function marcarAlertaComoRevisada(
    alertaId: string,
  ) {
    const revisadas =
      leerIdsPersistidos(
        CLAVE_ALERTAS_REVISADAS,
      );

    if (!revisadas.includes(alertaId)) {
      guardarIdsPersistidos(
        CLAVE_ALERTAS_REVISADAS,
        [...revisadas, alertaId],
      );
    }

    setAlertasNuevas((previo) =>
      previo.filter(
        (id) => id !== alertaId,
      ),
    );
  }

  function mantenerAlerta() {
    if (!alertaSeleccionada) {
      return;
    }

    marcarAlertaComoRevisada(
      alertaSeleccionada.id,
    );

    setAlertaSeleccionada(null);
  }

  async function borrarAlerta() {
    if (!alertaSeleccionada) {
      return;
    }

    setGestionandoAlerta(true);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 280);
    });

    const ocultas =
      leerIdsPersistidos(
        CLAVE_ALERTAS_OCULTAS,
      );

    if (
      !ocultas.includes(
        alertaSeleccionada.id,
      )
    ) {
      guardarIdsPersistidos(
        CLAVE_ALERTAS_OCULTAS,
        [
          ...ocultas,
          alertaSeleccionada.id,
        ],
      );
    }

    setAlertasVisibles((previo) =>
      previo.filter(
        (alerta) =>
          alerta.id !==
          alertaSeleccionada.id,
      ),
    );

    setAlertasNuevas((previo) =>
      previo.filter(
        (id) =>
          id !==
          alertaSeleccionada.id,
      ),
    );

    setGestionandoAlerta(false);
    setAlertaSeleccionada(null);
  }

  if (
    cargando &&
    panel === null
  ) {
    return <DashboardSkeleton />;
  }

  if (
    error &&
    panel === null
  ) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle size={28} />
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-900">
          No se pudo cargar el panel
        </h2>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void cargarPanel(
              filtroAplicado,
            )
          }
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-roma-700 px-5 py-3 text-sm font-bold text-white hover:bg-roma-800"
        >
          <RefreshCw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

  if (!panel) {
    return null;
  }

  const efectivo =
    panel.metodosPago.reduce(
      (total, metodo) =>
        total +
        metodo.montoEfectivo,
      0,
    );

  const qr =
    panel.metodosPago.reduce(
      (total, metodo) =>
        total + metodo.montoQr,
      0,
    );

  const totalAlertasStock =
    panel.inventario
      .insumosStockBajo +
    panel.inventario
      .insumosStockNegativo;

  return (
    <>
      <div className="space-y-5">
        <FiltroPeriodo
          periodoRapido={
            periodoRapido
          }
          filtro={filtroBorrador}
          cargando={cargando}
          alSeleccionarPeriodo={
            seleccionarPeriodo
          }
          alCambiarFiltro={
            cambiarFiltro
          }
          alAplicar={aplicarFiltro}
          alActualizar={
            actualizarPanel
          }
        />

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="text-sm font-black text-amber-900">
                No se pudo actualizar el periodo
              </p>

              <p className="mt-1 text-sm text-amber-700">
                {error}. Se muestran los últimos datos disponibles.
              </p>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-12">
            <div className="xl:col-span-3">
              <KpiPrincipal
                titulo="Ventas netas"
                valor={formatearMoneda(
                  panel.comerciales
                    .ventasNetas,
                )}
                descripcion="Importe efectivamente cobrado dentro del periodo filtrado."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-9 xl:grid-cols-5">
              <KpiCompacta
                titulo="Pedidos registrados"
                valor={String(
                  panel.comerciales
                    .pedidosRegistrados,
                )}
                descripcion={`${panel.comerciales.pedidosCobrados} cobrados en el periodo`}
                icono={ReceiptText}
                tono="azul"
              />

              <KpiCompacta
                titulo="Estado de caja"
                valor={
                  panel.caja.cajaAbierta
                    ? "Abierta"
                    : `${panel.caja.sesionesCerradasPeriodo} cierres`
                }
                descripcion={
                  panel.caja.cajaAbierta
                    ? `Esperado: ${formatearMoneda(panel.caja.efectivoEsperado)}`
                    : `${panel.caja.sesionesConDiferencia} con diferencia`
                }
                icono={WalletCards}
                tono="violeta"
              />

              <KpiCompacta
                titulo="Efectivo / QR"
                valor={formatearMoneda(
                  efectivo,
                )}
                descripcion={`QR: ${formatearMoneda(
                  qr,
                )}`}
                icono={CreditCard}
                tono="verde"
              />

              <KpiCompacta
                titulo="Descuentos"
                valor={`${panel.comerciales.descuentosAplicados} registros`}
                descripcion={`Valorado: ${formatearMoneda(panel.comerciales.descuentosOtorgados)}`}
                icono={Tag}
                tono="rosa"
              />

              <KpiCompacta
                titulo="Salud del inventario"
                valor={`${panel.inventario.insumosStockNegativo} negativos`}
                descripcion={`${totalAlertasStock} alertas de stock`}
                icono={Boxes}
                tono="ambar"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <KpiCompacta
              titulo="Diferencia acumulada"
              valor={formatearMoneda(
                panel.caja
                  .diferenciaAcumulada,
              )}
              descripcion="Suma de diferencias registradas en cierres."
              icono={TrendingDown}
              tono={
                panel.caja
                  .diferenciaAcumulada < 0
                  ? "rosa"
                  : "verde"
              }
            />

            <KpiCompacta
              titulo="Anulaciones"
              valor={`${panel.comerciales.pedidosAnulados} pedidos`}
              descripcion={`${panel.comerciales.porcentajeAnulacion}% del movimiento registrado.`}
              icono={AlertTriangle}
              tono="rosa"
            />

            <KpiCompacta
              titulo="Mermas valoradas"
              valor={formatearMoneda(
                panel.inventario
                  .costoMermasValoradas,
              )}
              descripcion="Solo considera insumos con valoración económica activa."
              icono={CircleDollarSign}
              tono="azul"
            />
          </div>
        </section>

<section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
  <div className="grid h-full min-w-0 grid-rows-[minmax(20rem,1fr)_auto] gap-5">
    <CentroAlertas
      alertas={
        alertasVisibles
      }
      alertasNuevas={
        alertasNuevas
      }
      puedeGestionar={
        puedeGestionarAlertas
      }
      alGestionar={
        gestionarAlerta
      }
    />

    <GraficoVentasDia
      data={panel.ventasPorDia}
    />
  </div>

  <div className="min-w-0 space-y-5">
    <ActividadRecientePanel
      actividades={
        panel.actividadReciente
      }
    />

    <DemandaPorHoraCompacta
      data={panel.ventasPorHora}
    />
  </div>
</section>

<section className="grid items-stretch gap-5 xl:grid-cols-[minmax(260px,0.42fr)_minmax(0,1.58fr)]">
  <MetodosPagoCompacto
    metodos={
      panel.metodosPago
    }
  />

  <ProductosMasVendidos
    productos={
      panel.productosMasVendidos
    }
  />
</section>


      </div>

      <ModalConfirmacion
        abierto={
          alertaSeleccionada !== null
        }
        titulo="Gestionar alerta"
        descripcion="Si eliges borrar, la alerta dejará de mostrarse en el dashboard. Si eliges cancelar, la alerta se mantendrá visible pero perderá el resaltado de novedad."
        textoConfirmar="Borrar alerta"
        textoCancelar="Mantener alerta"
        centrarIcono
        variante="peligro"
        cargando={
          gestionandoAlerta
        }
        alConfirmar={() => {
          void borrarAlerta();
        }}
        alCancelar={
          mantenerAlerta
        }
      />
    </>
  );
}

export default Dashboard;
