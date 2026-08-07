import {
  BarChart3,
  Clock3,
  CreditCard,
  UsersRound,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  ActividadUsuarioAnalitica,
  PuntoVentasDiarias,
  PuntoVentasHora,
  ResumenMetodoPagoAnalitica,
} from "../../tipos/analitica";

interface GraficosDashboardProps {
  ventasPorDia:
    PuntoVentasDiarias[];

  ventasPorHora:
    PuntoVentasHora[];

  metodosPago:
    ResumenMetodoPagoAnalitica[];

  actividadPorUsuario:
    ActividadUsuarioAnalitica[];
}

const COLORES_PAGO = [
  "#059669",
  "#2563eb",
  "#be123c",
];

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

function abreviarMoneda(
  valor: number,
): string {
  return new Intl.NumberFormat(
    "es-BO",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(valor);
}

function GraficosDashboard({
  ventasPorDia,
  ventasPorHora,
  metodosPago,
  actividadPorUsuario,
}: GraficosDashboardProps) {
  const horasConActividad =
    ventasPorHora.filter(
      (punto) =>
        punto.ventasCobradas > 0 ||
        punto.pedidosRegistrados > 0,
    );

  const horasGrafico =
    horasConActividad.length > 0
      ? horasConActividad
      : ventasPorHora.filter(
          (punto) =>
            punto.hora >= 8 &&
            punto.hora <= 23,
        );

  const pagosConMonto =
    metodosPago.filter(
      (metodo) =>
        metodo.totalCobrado > 0,
    );

  const usuariosGrafico =
    actividadPorUsuario
      .slice(0, 8)
      .map((usuario) => ({
        usuario:
          usuario.usuarioNombre,
        ventas:
          usuario.ventasRegistradas,
        inventario:
          usuario.movimientosInventario,
        caja:
          usuario.movimientosCajaManuales +
          usuario.aperturasCaja +
          usuario.cierresCaja,
      }));

  return (
    <section
      className="
        grid gap-6
        xl:grid-cols-2
      "
    >
      <article
        className="
          rounded-3xl border
          border-slate-200
          bg-white p-5
          shadow-panel
          sm:p-6
        "
      >
        <div
          className="
            flex items-start
            justify-between gap-4
          "
        >
          <div>
            <div
              className="
                flex items-center gap-2
              "
            >
              <BarChart3
                size={20}
                className="text-roma-700"
              />

              <h2
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Ventas por día
              </h2>
            </div>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Importe cobrado y cantidad
              de pedidos registrados.
            </p>
          </div>
        </div>

        <div className="mt-5 h-80">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={ventasPorDia}
              margin={{
                top: 10,
                right: 10,
                left: -16,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e2e8f0"
                vertical={false}
              />

              <XAxis
                dataKey="etiqueta"
                tick={{
                  fill: "#64748b",
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="monto"
                tickFormatter={
                  abreviarMoneda
                }
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                yAxisId="pedidos"
                orientation="right"
                allowDecimals={false}
                tick={{
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(
                  valor,
                  nombre,
                ) => {
                  if (
                    nombre ===
                    "Ventas cobradas"
                  ) {
                    return [
                      formatearMoneda(
                        Number(valor ?? 0),
                      ),
                      nombre,
                    ];
                  }

                  return [
                    Number(valor ?? 0),
                    nombre,
                  ];
                }}
                contentStyle={{
                  borderRadius: "14px",
                  border:
                    "1px solid #e2e8f0",
                  boxShadow:
                    "0 12px 30px -18px rgb(15 23 42 / 0.45)",
                }}
              />

              <Legend />

              <Line
                yAxisId="monto"
                type="monotone"
                dataKey="ventasCobradas"
                name="Ventas cobradas"
                stroke="#be123c"
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: "#be123c",
                }}
                activeDot={{ r: 6 }}
              />

              <Line
                yAxisId="pedidos"
                type="monotone"
                dataKey="pedidosRegistrados"
                name="Pedidos"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article
        className="
          rounded-3xl border
          border-slate-200
          bg-white p-5
          shadow-panel
          sm:p-6
        "
      >
        <div
          className="
            flex items-start
            justify-between gap-4
          "
        >
          <div>
            <div
              className="
                flex items-center gap-2
              "
            >
              <Clock3
                size={20}
                className="text-blue-700"
              />

              <h2
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Demanda por hora
              </h2>
            </div>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Permite detectar las horas
              de mayor movimiento.
            </p>
          </div>
        </div>

        <div className="mt-5 h-80">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={horasGrafico}
              margin={{
                top: 10,
                right: 10,
                left: -18,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e2e8f0"
                vertical={false}
              />

              <XAxis
                dataKey="etiqueta"
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "14px",
                  border:
                    "1px solid #e2e8f0",
                }}
              />

              <Bar
                dataKey="pedidosRegistrados"
                name="Pedidos"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article
        className="
          rounded-3xl border
          border-slate-200
          bg-white p-5
          shadow-panel
          sm:p-6
        "
      >
        <div
          className="
            flex items-start
            justify-between gap-4
          "
        >
          <div>
            <div
              className="
                flex items-center gap-2
              "
            >
              <CreditCard
                size={20}
                className="text-emerald-700"
              />

              <h2
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Métodos de pago
              </h2>
            </div>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Distribución del importe
              cobrado en el periodo.
            </p>
          </div>
        </div>

        {pagosConMonto.length === 0 ? (
          <div
            className="
              flex h-80 items-center
              justify-center
              text-center
            "
          >
            <p
              className="
                max-w-xs text-sm
                text-slate-500
              "
            >
              Todavía no existen pagos
              cobrados en el periodo
              seleccionado.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-5 grid items-center
              gap-5 sm:grid-cols-2
            "
          >
            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={pagosConMonto}
                    dataKey="totalCobrado"
                    nameKey="metodo"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                  >
                    {pagosConMonto.map(
                      (metodo, indice) => (
                        <Cell
                          key={metodo.metodo}
                          fill={
                            COLORES_PAGO[
                              indice %
                                COLORES_PAGO.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(valor) =>
                      formatearMoneda(
                        Number(valor ?? 0),
                      )
                    }
                    contentStyle={{
                      borderRadius: "14px",
                      border:
                        "1px solid #e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {metodosPago.map(
                (metodo, indice) => (
                  <div
                    key={metodo.metodo}
                    className="
                      rounded-2xl
                      bg-slate-50 p-4
                    "
                  >
                    <div
                      className="
                        flex items-center
                        justify-between gap-3
                      "
                    >
                      <div
                        className="
                          flex items-center gap-2
                        "
                      >
                        <span
                          className="
                            h-3 w-3
                            rounded-full
                          "
                          style={{
                            backgroundColor:
                              COLORES_PAGO[
                                indice %
                                  COLORES_PAGO.length
                              ],
                          }}
                        />

                        <span
                          className="
                            text-sm font-bold
                            text-slate-700
                          "
                        >
                          {metodo.metodo}
                        </span>
                      </div>

                      <span
                        className="
                          text-xs font-black
                          text-slate-500
                        "
                      >
                        {
                          metodo.porcentajeMonto
                        }
                        %
                      </span>
                    </div>

                    <p
                      className="
                        mt-2 text-lg
                        font-black
                        text-slate-900
                      "
                    >
                      {formatearMoneda(
                        metodo.totalCobrado,
                      )}
                    </p>

                    <p
                      className="
                        mt-1 text-xs
                        text-slate-500
                      "
                    >
                      {metodo.cantidadPagos}{" "}
                      pagos registrados
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </article>

      <article
        className="
          rounded-3xl border
          border-slate-200
          bg-white p-5
          shadow-panel
          sm:p-6
        "
      >
        <div
          className="
            flex items-start
            justify-between gap-4
          "
        >
          <div>
            <div
              className="
                flex items-center gap-2
              "
            >
              <UsersRound
                size={20}
                className="text-violet-700"
              />

              <h2
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Actividad por usuario
              </h2>
            </div>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Cantidad de operaciones por
              módulo; no representa una
              evaluación de desempeño.
            </p>
          </div>
        </div>

        {usuariosGrafico.length === 0 ? (
          <div
            className="
              flex h-80 items-center
              justify-center text-center
            "
          >
            <p
              className="
                max-w-xs text-sm
                text-slate-500
              "
            >
              No existe actividad atribuida
              a usuarios en el periodo.
            </p>
          </div>
        ) : (
          <div className="mt-5 h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={usuariosGrafico}
                layout="vertical"
                margin={{
                  top: 6,
                  right: 12,
                  left: 20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e2e8f0"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="usuario"
                  width={105}
                  tick={{
                    fill: "#475569",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "14px",
                    border:
                      "1px solid #e2e8f0",
                  }}
                />

                <Legend />

                <Bar
                  dataKey="ventas"
                  name="Ventas"
                  stackId="actividad"
                  fill="#be123c"
                  radius={[0, 0, 0, 0]}
                />

                <Bar
                  dataKey="inventario"
                  name="Inventario"
                  stackId="actividad"
                  fill="#d97706"
                />

                <Bar
                  dataKey="caja"
                  name="Caja"
                  stackId="actividad"
                  fill="#2563eb"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
}

export default GraficosDashboard;
