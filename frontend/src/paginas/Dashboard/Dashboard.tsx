import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  ReceiptText,
  RotateCw,
  ShoppingCart,
  UserPlus,
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
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardSkeleton from "../../shared/feedback/DashboardSkeleton";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import { useAuth } from "../../contextos/AuthContext";

import { obtenerResumenDashboard } from "../../servicios/dashboardServicio";

import type {
  EstadoPedido,
  ResumenDashboard,
} from "../../tipos/dashboard";

function formatearMoneda(valor: number): string {
  return `Bs. ${valor.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function obtenerSaludo(): string {
  const horaActual = new Date().getHours();

  if (horaActual < 12) {
    return "Buenos días";
  }

  if (horaActual < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

function obtenerEstiloEstado(
  estado: EstadoPedido,
): string {
  const estilos: Record<EstadoPedido, string> = {
    Pendiente:
      "bg-amber-50 text-amber-700 border-amber-200",

    Preparando:
      "bg-blue-50 text-blue-700 border-blue-200",

    Listo:
      "bg-violet-50 text-violet-700 border-violet-200",

    Entregado:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    Anulado:
      "bg-red-50 text-red-700 border-red-200",
  };

  return estilos[estado];
}

function Dashboard() {
  const { usuario } = useAuth();

  const [datos, setDatos] =
    useState<ResumenDashboard | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const coloresMetodosPago = useMemo(
    () => ["#be123c", "#2563eb"],
    [],
  );

  const cargarDashboard = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const respuesta =
        await obtenerResumenDashboard();

      setDatos(respuesta);
    } catch {
      setError(
        "No fue posible cargar la información del dashboard.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

useEffect(() => {
  let componenteActivo = true;

  obtenerResumenDashboard()
    .then((respuesta) => {
      if (!componenteActivo) {
        return;
      }

      setDatos(respuesta);
      setError(null);
    })
    .catch(() => {
      if (!componenteActivo) {
        return;
      }

      setError(
        "No fue posible cargar la información del dashboard.",
      );
    })
    .finally(() => {
      if (componenteActivo) {
        setCargando(false);
      }
    });

  return () => {
    componenteActivo = false;
  };
}, []);

  if (cargando) {
    return <DashboardSkeleton />;
  }

  if (error || !datos) {
    return (
      <section
        className="
          flex min-h-96 flex-col items-center
          justify-center rounded-3xl
          border border-red-200
          bg-white p-8 text-center
          shadow-panel
        "
      >
        <div
          className="
            flex h-14 w-14 items-center
            justify-center rounded-2xl
            bg-red-100 text-red-700
          "
        >
          <AlertTriangle size={28} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">
          No pudimos cargar el Dashboard
        </h2>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={() => void cargarDashboard()}
          className="
            mt-6 inline-flex items-center gap-2
            rounded-xl bg-roma-700
            px-5 py-3 font-semibold text-white
            transition-colors hover:bg-roma-800
          "
        >
          <RotateCw size={18} />

          Volver a intentar
        </button>
      </section>
    );
  }

  const accionesRapidas = [
    {
      titulo: "Registrar venta",
      descripcion: "Crear un nuevo pedido",
      ruta: "/ventas",
      icono: ShoppingCart,
      estilos:
        "bg-roma-50 text-roma-700 hover:border-roma-200",
    },
    {
      titulo: "Gestionar caja",
      descripcion: "Consultar la caja actual",
      ruta: "/caja",
      icono: WalletCards,
      estilos:
        "bg-blue-50 text-blue-700 hover:border-blue-200",
    },
    {
      titulo: "Revisar inventario",
      descripcion: "Consultar existencias",
      ruta: "/inventario",
      icono: PackageSearch,
      estilos:
        "bg-amber-50 text-amber-700 hover:border-amber-200",
    },
    {
      titulo: "Nuevo usuario",
      descripcion: "Registrar personal",
      ruta: "/usuarios",
      icono: UserPlus,
      estilos:
        "bg-emerald-50 text-emerald-700 hover:border-emerald-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado principal */}
      <section
        className="
          relative overflow-hidden rounded-3xl
          bg-linear-to-br
          from-slate-950 via-slate-900
          to-roma-950
          p-6 text-white shadow-panel
          sm:p-8
        "
      >
        <div
          className="
            absolute -right-20 -top-24
            h-72 w-72 rounded-full
            bg-roma-500/20 blur-3xl
          "
        />

        <div
          className="
            absolute -bottom-28 left-1/3
            h-64 w-64 rounded-full
            bg-blue-500/10 blur-3xl
          "
        />

        <div
          className="
            relative z-10 flex flex-col
            gap-7 lg:flex-row
            lg:items-center lg:justify-between
          "
        >
          <div>
            <p className="text-sm font-semibold text-roma-300">
              Panel operativo
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {obtenerSaludo()},{" "}
              {usuario?.username || "usuario"}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Consulta el estado general del restaurante
              y accede rápidamente a las operaciones
              principales de la jornada.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/ventas"
                className="
                  inline-flex items-center gap-2
                  rounded-xl bg-roma-600
                  px-5 py-3 text-sm
                  font-bold text-white
                  shadow-lg shadow-roma-950/30
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-roma-500
                "
              >
                <ShoppingCart size={18} />

                Nueva venta
              </Link>

              <Link
                to="/caja"
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-white/15
                  bg-white/10 px-5 py-3
                  text-sm font-semibold text-white
                  backdrop-blur-sm transition-colors
                  hover:bg-white/15
                "
              >
                <WalletCards size={18} />

                Ver caja
              </Link>
            </div>
          </div>

          <div
            className="
              min-w-72 rounded-2xl
              border border-white/10
              bg-white/8 p-5
              backdrop-blur-md
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Estado de caja
                </p>

                <p className="mt-2 text-xl font-black">
                  {datos.cajaAbierta
                    ? "Caja abierta"
                    : "Caja cerrada"}
                </p>
              </div>

              <span
                className={`
                  mt-1 h-3 w-3 rounded-full
                  ${
                    datos.cajaAbierta
                      ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                      : "bg-red-400 shadow-lg shadow-red-400/50"
                  }
                `}
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Apertura
                </span>

                <span className="font-semibold">
                  {datos.horaApertura}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Saldo registrado
                </span>

                <span className="font-semibold">
                  {formatearMoneda(datos.saldoCaja)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores principales */}
      <section
        aria-label="Indicadores principales"
        className="
          grid grid-cols-1 gap-5
          sm:grid-cols-2 xl:grid-cols-4
        "
      >
        <TarjetaMetrica
          titulo="Ventas del día"
          valor={formatearMoneda(datos.ventasDia)}
          descripcion="Comparación respecto a la jornada anterior"
          icono={CircleDollarSign}
          tono="roma"
          variacion={datos.comparacionVentas}
        />

        <TarjetaMetrica
          titulo="Pedidos registrados"
          valor={String(datos.pedidosDia)}
          descripcion="Pedidos procesados durante la jornada"
          icono={ReceiptText}
          tono="azul"
          variacion={datos.comparacionPedidos}
        />

        <TarjetaMetrica
          titulo="Ticket promedio"
          valor={formatearMoneda(
            datos.ticketPromedio,
          )}
          descripcion="Promedio económico por cada venta"
          icono={Banknote}
          tono="verde"
          variacion={datos.comparacionTicket}
        />

        <TarjetaMetrica
          titulo="Productos activos"
          valor={String(datos.productosActivos)}
          descripcion={`${datos.alertasStock} alertas de inventario pendientes`}
          icono={Boxes}
          tono="ambar"
        />
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article
          className="
            rounded-2xl border border-slate-200
            bg-white p-5 shadow-panel
            sm:p-6 xl:col-span-2
          "
        >
          <div
            className="
              flex flex-col gap-4
              sm:flex-row sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Comportamiento de ventas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ingresos registrados durante los últimos
                siete días
              </p>
            </div>

            <div
              className="
                inline-flex w-fit items-center
                gap-2 rounded-xl bg-slate-100
                px-3 py-2 text-xs
                font-semibold text-slate-600
              "
            >
              <Clock3 size={15} />

              Últimos 7 días
            </div>
          </div>

          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={datos.ventasSemana}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="rellenoVentas"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#be123c"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#be123c"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(valor) => [
                    formatearMoneda(Number(valor)),
                    "Ventas",
                  ]}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow:
                      "0 12px 30px -15px rgba(15, 23, 42, 0.35)",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#be123c"
                  strokeWidth={3}
                  fill="url(#rellenoVentas)"
                  activeDot={{
                    r: 6,
                    fill: "#be123c",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article
          className="
            rounded-2xl border border-slate-200
            bg-white p-5 shadow-panel
            sm:p-6
          "
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Métodos de pago
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Distribución de los cobros del día
            </p>
          </div>

          <div className="mt-5 h-56">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={datos.metodosPago}
                  dataKey="monto"
                  nameKey="nombre"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={5}
                  strokeWidth={0}
                >
                  {datos.metodosPago.map(
                    (metodo, indice) => (
                      <Cell
                        key={metodo.nombre}
                        fill={
                          coloresMetodosPago[indice]
                        }
                      />
                    ),
                  )}
                </Pie>

                <Tooltip
                  formatter={(valor) => [
                    formatearMoneda(Number(valor)),
                    "Monto",
                  ]}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {datos.metodosPago.map(
              (metodo, indice) => (
                <div
                  key={metodo.nombre}
                  className="
                    flex items-center
                    justify-between rounded-xl
                    bg-slate-50 px-4 py-3
                  "
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          coloresMetodosPago[indice],
                      }}
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {metodo.nombre}
                      </p>

                      <p className="text-xs text-slate-500">
                        {metodo.porcentaje.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-900">
                    {formatearMoneda(metodo.monto)}
                  </p>
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      {/* Accesos rápidos */}
      <section
        className="
          rounded-2xl border border-slate-200
          bg-white p-5 shadow-panel sm:p-6
        "
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Accesos rápidos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Operaciones utilizadas con mayor frecuencia
          </p>
        </div>

        <div
          className="
            mt-5 grid grid-cols-1 gap-4
            sm:grid-cols-2 xl:grid-cols-4
          "
        >
          {accionesRapidas.map((accion) => {
            const Icono = accion.icono;

            return (
              <Link
                key={accion.titulo}
                to={accion.ruta}
                className={`
                  group flex items-center gap-4
                  rounded-2xl border border-slate-200
                  p-4 transition-all duration-200
                  hover:-translate-y-0.5
                  hover:shadow-md
                  ${accion.estilos}
                `}
              >
                <div
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    rounded-xl bg-current/10
                  "
                >
                  <Icono size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {accion.titulo}
                  </p>

                  <p className="mt-1 truncate text-xs opacity-70">
                    {accion.descripcion}
                  </p>
                </div>

                <ArrowRight
                  size={18}
                  className="
                    shrink-0 opacity-50
                    transition-transform
                    group-hover:translate-x-1
                  "
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Pedidos recientes y stock */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article
          className="
            overflow-hidden rounded-2xl
            border border-slate-200
            bg-white shadow-panel
            xl:col-span-2
          "
        >
          <div
            className="
              flex items-center justify-between
              border-b border-slate-100
              px-5 py-5 sm:px-6
            "
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pedidos recientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Últimas operaciones registradas
              </p>
            </div>

            <Link
              to="/ventas"
              className="
                inline-flex items-center gap-1
                text-sm font-bold text-roma-700
                hover:text-roma-800
              "
            >
              Ver todos

              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-170px">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pedido
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hora
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cliente
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {datos.pedidosRecientes.map(
                  (pedido) => (
                    <tr
                      key={pedido.id}
                      className="
                        transition-colors
                        hover:bg-slate-50/70
                      "
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {pedido.numero}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {pedido.hora}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {pedido.cliente}
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {formatearMoneda(
                          pedido.total,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`
                            inline-flex rounded-full
                            border px-2.5 py-1
                            text-xs font-bold
                            ${obtenerEstiloEstado(
                              pedido.estado,
                            )}
                          `}
                        >
                          {pedido.estado}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article
          className="
            rounded-2xl border border-slate-200
            bg-white p-5 shadow-panel sm:p-6
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Alertas de inventario
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Insumos por debajo del mínimo
              </p>
            </div>

            <div
              className="
                flex h-10 w-10 items-center
                justify-center rounded-xl
                bg-amber-100 text-amber-700
              "
            >
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {datos.stockCritico.map((alerta) => {
              const porcentajeDisponible =
                Math.min(
                  100,
                  (alerta.stockActual /
                    alerta.stockMinimo) *
                    100,
                );

              return (
                <div
                  key={alerta.id}
                  className="
                    rounded-xl border
                    border-slate-200 p-4
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {alerta.insumo}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Mínimo: {alerta.stockMinimo}{" "}
                        {alerta.unidad}
                      </p>
                    </div>

                    <p className="text-sm font-black text-amber-700">
                      {alerta.stockActual}{" "}
                      {alerta.unidad}
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="
                        h-full rounded-full
                        bg-amber-500
                      "
                      style={{
                        width: `${porcentajeDisponible}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/inventario"
            className="
              mt-5 flex w-full items-center
              justify-center gap-2 rounded-xl
              border border-slate-200
              px-4 py-3 text-sm font-bold
              text-slate-700 transition-colors
              hover:border-amber-200
              hover:bg-amber-50
              hover:text-amber-800
            "
          >
            Revisar inventario

            <ArrowRight size={17} />
          </Link>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;