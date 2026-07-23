import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  Boxes,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  CreditCard,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  UserRoundCheck,
  UsersRound,
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
  useAuth,
} from "../../contextos/AuthContext";

import {
  crearPeriodoRapidoAnalitica,
  obtenerPanelAdministrativo,
} from "../../servicios/analiticaServicio";

import DashboardSkeleton from "../../shared/feedback/DashboardSkeleton";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import type {
  FiltroPeriodoAnalitica,
  PanelAdministrativo,
  PeriodoRapidoAnalitica,
  ProductoVendidoAnalitica,
} from "../../tipos/analitica";

import ActividadReciente from "./ActividadReciente";
import FiltrosDashboard from "./FiltrosDashboard";
import GraficosDashboard from "./GraficosDashboard";
import PanelAlertas from "./PanelAlertas";

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

function formatearFecha(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(`${fecha}T12:00:00`),
  );
}

function formatearFechaHora(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fecha));
}

function obtenerSaludo(): string {
  const hora = new Date().getHours();

  if (hora < 12) {
    return "Buenos días";
  }

  if (hora < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible cargar la información administrativa.";
}

function porcentajeCobertura(
  valor: number,
): string {
  return `${new Intl.NumberFormat(
    "es-BO",
    {
      maximumFractionDigits: 1,
    },
  ).format(valor)}%`;
}

function ProductosMasVendidos({
  productos,
}: {
  productos:
    ProductoVendidoAnalitica[];
}) {
  const maximo =
    Math.max(
      ...productos.map(
        (producto) =>
          producto.cantidadVendida,
      ),
      1,
    );

  return (
    <section
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
            <ShoppingBag
              size={20}
              className="text-roma-700"
            />

            <h2
              className="
                text-lg font-black
                text-slate-900
              "
            >
              Productos más vendidos
            </h2>
          </div>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Unidades e importe estimado
            del periodo.
          </p>
        </div>

        <Link
          to="/reportes"
          className="
            inline-flex items-center
            gap-1 text-xs
            font-bold text-roma-700
            hover:text-roma-800
          "
        >
          Ver reportes
          <ArrowRight size={14} />
        </Link>
      </div>

      {productos.length === 0 ? (
        <div
          className="
            mt-5 rounded-2xl
            border border-dashed
            border-slate-300
            p-8 text-center
          "
        >
          <p
            className="
              text-sm text-slate-500
            "
          >
            No existen productos vendidos
            en el periodo seleccionado.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {productos
            .slice(0, 8)
            .map(
              (producto, indice) => {
                const ancho =
                  Math.max(
                    8,
                    (producto
                      .cantidadVendida /
                      maximo) *
                      100,
                  );

                return (
                  <article
                    key={
                      producto.productoId
                    }
                  >
                    <div
                      className="
                        flex items-start
                        justify-between gap-4
                      "
                    >
                      <div
                        className="
                          flex min-w-0
                          items-center gap-3
                        "
                      >
                        <span
                          className="
                            flex h-8 w-8
                            shrink-0 items-center
                            justify-center
                            rounded-lg
                            bg-slate-100
                            text-xs font-black
                            text-slate-600
                          "
                        >
                          {indice + 1}
                        </span>

                        <div className="min-w-0">
                          <p
                            className="
                              truncate text-sm
                              font-black
                              text-slate-900
                            "
                          >
                            {
                              producto.nombreProducto
                            }
                          </p>

                          <p
                            className="
                              mt-0.5 text-xs
                              text-slate-400
                            "
                          >
                            {
                              producto.codigoProducto
                            }{" "}
                            ·{" "}
                            {
                              producto.cantidadPedidos
                            }{" "}
                            pedidos
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          shrink-0 text-right
                        "
                      >
                        <p
                          className="
                            text-sm font-black
                            text-slate-900
                          "
                        >
                          {formatearNumero(
                            producto.cantidadVendida,
                          )}{" "}
                          uds.
                        </p>

                        <p
                          className="
                            mt-0.5 text-xs
                            font-bold
                            text-emerald-700
                          "
                        >
                          {formatearMoneda(
                            producto.importeNetoEstimado,
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        mt-2 h-2
                        overflow-hidden
                        rounded-full
                        bg-slate-100
                      "
                    >
                      <div
                        className="
                          h-full rounded-full
                          bg-linear-to-r
                          from-roma-700
                          to-roma-400
                        "
                        style={{
                          width: `${ancho}%`,
                        }}
                      />
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

function ActividadUsuarios({
  datos,
}: {
  datos:
    PanelAdministrativo["actividadPorUsuario"];
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-3xl border
        border-slate-200
        bg-white shadow-panel
      "
    >
      <div
        className="
          flex items-start
          justify-between gap-4
          p-5 sm:p-6
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
              Resumen por usuario
            </h2>
          </div>

          <p
            className="
              mt-1 text-sm
              text-slate-500
            "
          >
            Operaciones atribuidas a cada
            usuario dentro del periodo.
          </p>
        </div>
      </div>

      {datos.length === 0 ? (
        <div
          className="
            border-t border-slate-100
            p-8 text-center
            text-sm text-slate-500
          "
        >
          No existe actividad atribuida a
          usuarios.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="
              w-full min-w-[900px]
            "
          >
            <thead>
              <tr className="bg-slate-50">
                {[
                  "Usuario",
                  "Ventas",
                  "Cobros",
                  "Inventario",
                  "Caja",
                  "Total acciones",
                ].map(
                  (encabezado) => (
                    <th
                      key={encabezado}
                      className="
                        px-5 py-3.5
                        text-left
                        text-xs font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      {encabezado}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody
              className="
                divide-y
                divide-slate-100
              "
            >
              {datos
                .slice(0, 10)
                .map((usuario) => (
                  <tr
                    key={`${usuario.usuarioId ?? "sin-id"}-${usuario.usuarioNombre}`}
                    className="
                      hover:bg-slate-50
                    "
                  >
                    <td className="px-5 py-4">
                      <div
                        className="
                          flex items-center
                          gap-3
                        "
                      >
                        <div
                          className="
                            flex h-9 w-9
                            items-center
                            justify-center
                            rounded-xl
                            bg-violet-100
                            text-violet-700
                          "
                        >
                          <UserRoundCheck
                            size={18}
                          />
                        </div>

                        <div>
                          <p
                            className="
                              text-sm font-black
                              text-slate-900
                            "
                          >
                            {
                              usuario.usuarioNombre
                            }
                          </p>

                          <p
                            className="
                              mt-0.5 text-xs
                              text-slate-400
                            "
                          >
                            ID{" "}
                            {usuario.usuarioId ??
                              "no disponible"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className="
                          text-sm font-black
                          text-slate-900
                        "
                      >
                        {
                          usuario.ventasRegistradas
                        }
                      </p>

                      <p
                        className="
                          mt-0.5 text-xs
                          text-slate-500
                        "
                      >
                        {formatearMoneda(
                          usuario.montoVentasRegistradas,
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className="
                          text-sm font-black
                          text-slate-900
                        "
                      >
                        {
                          usuario.cobrosRealizados
                        }
                      </p>

                      <p
                        className="
                          mt-0.5 text-xs
                          text-slate-500
                        "
                      >
                        {formatearMoneda(
                          usuario.montoCobrado,
                        )}
                      </p>
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-black
                        text-slate-700
                      "
                    >
                      {
                        usuario.movimientosInventario
                      }
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-black
                        text-slate-700
                      "
                    >
                      {usuario.movimientosCajaManuales +
                        usuario.aperturasCaja +
                        usuario.cierresCaja}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className="
                          inline-flex
                          rounded-full
                          bg-slate-900
                          px-3 py-1
                          text-xs font-black
                          text-white
                        "
                      >
                        {
                          usuario.totalAcciones
                        }
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Dashboard() {
  const { usuario } = useAuth();

  const periodoInicial =
    useMemo(
      () =>
        crearPeriodoRapidoAnalitica(
          "Últimos 7 días",
        ),
      [],
    );

  const [
    periodoRapido,
    setPeriodoRapido,
  ] =
    useState<PeriodoRapidoAnalitica>(
      "Últimos 7 días",
    );

  const [
    filtroBorrador,
    setFiltroBorrador,
  ] =
    useState<FiltroPeriodoAnalitica>(
      periodoInicial,
    );

  const [
    filtroAplicado,
    setFiltroAplicado,
  ] =
    useState<FiltroPeriodoAnalitica>(
      periodoInicial,
    );

  const [panel, setPanel] =
    useState<PanelAdministrativo | null>(
      null,
    );

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const cargarPanel =
    useCallback(
      async (
        filtro:
          FiltroPeriodoAnalitica,
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
      [],
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
  }, [periodoInicial]);

  function seleccionarPeriodo(
    periodo: PeriodoRapidoAnalitica,
  ) {
    const nuevoFiltro =
      crearPeriodoRapidoAnalitica(
        periodo,
      );

    setPeriodoRapido(periodo);
    setFiltroBorrador(nuevoFiltro);

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
    void cargarPanel(
      filtroBorrador,
    );
  }

  function actualizarPanel() {
    void cargarPanel(
      filtroAplicado,
    );
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
      <section
        className="
          flex min-h-96
          flex-col items-center
          justify-center
          rounded-3xl
          border border-red-200
          bg-white p-8
          text-center
          shadow-panel
        "
      >
        <div
          className="
            flex h-14 w-14
            items-center
            justify-center
            rounded-2xl
            bg-red-100
            text-red-700
          "
        >
          <AlertTriangle size={28} />
        </div>

        <h2
          className="
            mt-5 text-xl
            font-black
            text-slate-900
          "
        >
          No se pudo cargar el panel
        </h2>

        <p
          className="
            mt-2 max-w-md
            text-sm text-slate-500
          "
        >
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void cargarPanel(
              filtroAplicado,
            )
          }
          className="
            mt-6 inline-flex
            items-center gap-2
            rounded-xl
            bg-roma-700
            px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-roma-800
          "
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
    <div className="space-y-6">
      <section
        className="
          relative overflow-hidden
          rounded-3xl
          bg-linear-to-br
          from-slate-950
          via-slate-900
          to-roma-950
          p-6 text-white
          shadow-panel
          sm:p-8
        "
      >
        <div
          className="
            absolute -right-20
            -top-24 h-72 w-72
            rounded-full
            bg-roma-500/20
            blur-3xl
          "
        />

        <div
          className="
            absolute -bottom-28
            left-1/3 h-64 w-64
            rounded-full
            bg-blue-500/10
            blur-3xl
          "
        />

        <div
          className="
            relative z-10
            flex flex-col gap-7
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center gap-2
                rounded-full
                border border-white/15
                bg-white/10
                px-3 py-1.5
                text-xs font-bold
                text-roma-200
              "
            >
              <BarChart3 size={15} />
              Panel administrativo
            </div>

            <h1
              className="
                mt-4 text-3xl
                font-black
                tracking-tight
                sm:text-4xl
              "
            >
              {obtenerSaludo()},{" "}
              {usuario?.nombreCompleto ??
                usuario?.username ??
                "administrador"}
            </h1>

            <p
              className="
                mt-3 max-w-3xl
                text-sm leading-relaxed
                text-slate-300
                sm:text-base
              "
            >
              Ventas, caja, inventario y
              actividad operativa reunidos
              en una sola vista para tomar
              decisiones con información
              real.
            </p>

            <div
              className="
                mt-5 flex flex-wrap
                items-center gap-3
                text-xs font-semibold
                text-slate-300
              "
            >
              <span
                className="
                  inline-flex items-center
                  gap-2 rounded-full
                  bg-white/10
                  px-3 py-2
                "
              >
                <CalendarRange
                  size={15}
                />

                {formatearFecha(
                  panel.periodo.fechaDesde,
                )}{" "}
                —{" "}
                {formatearFecha(
                  panel.periodo.fechaHasta,
                )}
              </span>

              <span
                className="
                  inline-flex items-center
                  gap-2 rounded-full
                  bg-white/10
                  px-3 py-2
                "
              >
                <Clock3 size={15} />
                Actualizado{" "}
                {formatearFechaHora(
                  panel.generadoEn,
                )}
              </span>
            </div>
          </div>

          <div
            className="
              grid gap-3 sm:grid-cols-2
              lg:w-[430px]
            "
          >
            <Link
              to="/ventas"
              className="
                inline-flex items-center
                justify-center gap-2
                rounded-xl bg-roma-600
                px-5 py-3
                text-sm font-bold
                text-white shadow-lg
                shadow-roma-950/30
                transition-all
                hover:-translate-y-0.5
                hover:bg-roma-500
              "
            >
              <ReceiptText size={18} />
              Nueva venta
            </Link>

            <Link
              to="/reportes"
              className="
                inline-flex items-center
                justify-center gap-2
                rounded-xl
                border border-white/15
                bg-white/10
                px-5 py-3
                text-sm font-bold
                text-white
                transition-colors
                hover:bg-white/15
              "
            >
              <BarChart3 size={18} />
              Ver reportes
            </Link>

            <Link
              to="/caja"
              className="
                inline-flex items-center
                justify-center gap-2
                rounded-xl
                border border-white/15
                bg-white/10
                px-5 py-3
                text-sm font-bold
                text-white
                transition-colors
                hover:bg-white/15
              "
            >
              <WalletCards size={18} />
              Revisar caja
            </Link>

            <Link
              to="/inventario"
              className="
                inline-flex items-center
                justify-center gap-2
                rounded-xl
                border border-white/15
                bg-white/10
                px-5 py-3
                text-sm font-bold
                text-white
                transition-colors
                hover:bg-white/15
              "
            >
              <PackageSearch
                size={18}
              />
              Inventario
            </Link>
          </div>
        </div>
      </section>

      <FiltrosDashboard
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
        <div
          className="
            flex items-start gap-3
            rounded-2xl border
            border-amber-200
            bg-amber-50 p-4
          "
        >
          <AlertTriangle
            size={20}
            className="
              mt-0.5 shrink-0
              text-amber-700
            "
          />

          <div>
            <p
              className="
                text-sm font-black
                text-amber-900
              "
            >
              No se pudo actualizar el
              periodo
            </p>

            <p
              className="
                mt-1 text-sm
                text-amber-700
              "
            >
              {error}. Se mantienen los
              últimos datos cargados.
            </p>
          </div>
        </div>
      )}

      <section
        className="
          grid gap-5
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <TarjetaMetrica
          titulo="Ventas netas"
          valor={formatearMoneda(
            panel.comerciales
              .ventasNetas,
          )}
          descripcion="Importe efectivamente cobrado"
          icono={CircleDollarSign}
          tono="roma"
          variacion={
            panel.comerciales
              .variacionVentas
              .porcentaje
          }
        />

        <TarjetaMetrica
          titulo="Pedidos registrados"
          valor={String(
            panel.comerciales
              .pedidosRegistrados,
          )}
          descripcion={`${panel.comerciales.pedidosCobrados} cobrados en el periodo`}
          icono={ReceiptText}
          tono="azul"
          variacion={
            panel.comerciales
              .variacionPedidos
              .porcentaje
          }
        />

        <TarjetaMetrica
          titulo="Ticket promedio"
          valor={formatearMoneda(
            panel.comerciales
              .ticketPromedio,
          )}
          descripcion="Promedio por pago cobrado"
          icono={ShoppingBag}
          tono="verde"
          variacion={
            panel.comerciales
              .variacionTicket
              .porcentaje
          }
        />

        <TarjetaMetrica
          titulo="Pendiente de cobro"
          valor={formatearMoneda(
            panel.comerciales
              .ventasPendientes,
          )}
          descripcion={`${panel.comerciales.pedidosPendientes} pedidos pendientes`}
          icono={Clock3}
          tono="ambar"
        />
      </section>

      <section
        className="
          grid gap-5
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-700
              "
            >
              <Banknote size={22} />
            </div>

            <span
              className={`
                rounded-full
                px-3 py-1
                text-xs font-black
                ${
                  panel.caja
                    .cajaAbierta
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }
              `}
            >
              {panel.caja
                .cajaAbierta
                ? "Abierta"
                : "Cerrada"}
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Estado de caja
          </p>

          <p
            className="
              mt-1 text-xl font-black
              text-slate-900
            "
          >
            {panel.caja.cajaAbierta
              ? formatearMoneda(
                  panel.caja
                    .efectivoEsperado,
                )
              : `${panel.caja.sesionesCerradasPeriodo} cierres`}
          </p>

          <p
            className="
              mt-2 text-xs
              leading-relaxed
              text-slate-500
            "
          >
            {panel.caja.cajaAbierta
              ? `Abierta por ${panel.caja.usuarioAperturaNombre ?? "usuario no identificado"}`
              : `${panel.caja.sesionesConDiferencia} cierres con diferencia`}
          </p>
        </article>

        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-emerald-100
                text-emerald-700
              "
            >
              <CreditCard size={22} />
            </div>

            <span
              className="
                rounded-full
                bg-slate-100
                px-3 py-1
                text-xs font-black
                text-slate-600
              "
            >
              Cobros
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Efectivo / QR
          </p>

          <p
            className="
              mt-1 text-xl font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              efectivo,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            QR:{" "}
            <strong
              className="
                text-slate-700
              "
            >
              {formatearMoneda(qr)}
            </strong>
          </p>
        </article>

        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-amber-100
                text-amber-700
              "
            >
              <Boxes size={22} />
            </div>

            <span
              className={`
                rounded-full
                px-3 py-1
                text-xs font-black
                ${
                  totalAlertasStock > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }
              `}
            >
              {totalAlertasStock} alertas
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Salud del inventario
          </p>

          <p
            className="
              mt-1 text-xl font-black
              text-slate-900
            "
          >
            {
              panel.inventario
                .insumosStockNegativo
            }{" "}
            negativos
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            {
              panel.inventario
                .insumosStockBajo
            }{" "}
            con stock bajo
          </p>
        </article>

        <article
          className="
            rounded-2xl border
            border-slate-200
            bg-white p-5
            shadow-panel
          "
        >
          <div
            className="
              flex items-start
              justify-between gap-3
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-100
                text-violet-700
              "
            >
              <BarChart3 size={22} />
            </div>

            <span
              className="
                rounded-full
                bg-violet-50
                px-3 py-1
                text-xs font-black
                text-violet-700
              "
            >
              Cobertura
            </span>
          </div>

          <p
            className="
              mt-4 text-sm font-bold
              text-slate-500
            "
          >
            Inventario valorado
          </p>

          <p
            className="
              mt-1 text-xl font-black
              text-slate-900
            "
          >
            {porcentajeCobertura(
              panel.inventario
                .coberturaValoracionPorcentaje,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-500
            "
          >
            Consumo valorado:{" "}
            {formatearMoneda(
              panel.inventario
                .costoConsumoValorado,
            )}
          </p>
        </article>
      </section>

      <div
        className="
          grid gap-6
          xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]
        "
      >
        <PanelAlertas
          alertas={panel.alertas}
        />

        <ActividadReciente
          actividades={
            panel.actividadReciente
          }
        />
      </div>

      <GraficosDashboard
        ventasPorDia={
          panel.ventasPorDia
        }
        ventasPorHora={
          panel.ventasPorHora
        }
        metodosPago={
          panel.metodosPago
        }
        actividadPorUsuario={
          panel.actividadPorUsuario
        }
      />

      <div
        className="
          grid gap-6
          xl:grid-cols-[minmax(360px,0.75fr)_minmax(0,1.25fr)]
        "
      >
        <ProductosMasVendidos
          productos={
            panel.productosMasVendidos
          }
        />

        <ActividadUsuarios
          datos={
            panel.actividadPorUsuario
          }
        />
      </div>

      <section
        className="
          grid gap-5
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <article
          className="
            rounded-2xl
            bg-slate-900 p-5
            text-white
            shadow-panel
          "
        >
          <TrendingDown
            size={22}
            className="text-roma-300"
          />

          <p
            className="
              mt-4 text-xs
              font-bold uppercase
              tracking-wide
              text-slate-400
            "
          >
            Diferencia acumulada
          </p>

          <p
            className={`
              mt-1 text-2xl
              font-black
              ${
                panel.caja
                  .diferenciaAcumulada <
                0
                  ? "text-red-300"
                  : "text-emerald-300"
              }
            `}
          >
            {formatearMoneda(
              panel.caja
                .diferenciaAcumulada,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-400
            "
          >
            Suma de diferencias de los
            cierres del periodo.
          </p>
        </article>

        <article
          className="
            rounded-2xl
            bg-slate-900 p-5
            text-white
            shadow-panel
          "
        >
          <ReceiptText
            size={22}
            className="text-amber-300"
          />

          <p
            className="
              mt-4 text-xs
              font-bold uppercase
              tracking-wide
              text-slate-400
            "
          >
            Descuentos
          </p>

          <p
            className="
              mt-1 text-2xl
              font-black
              text-amber-300
            "
          >
            {formatearMoneda(
              panel.comerciales
                .descuentosOtorgados,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-400
            "
          >
            Total otorgado sobre ventas
            cobradas.
          </p>
        </article>

        <article
          className="
            rounded-2xl
            bg-slate-900 p-5
            text-white
            shadow-panel
          "
        >
          <AlertTriangle
            size={22}
            className="text-red-300"
          />

          <p
            className="
              mt-4 text-xs
              font-bold uppercase
              tracking-wide
              text-slate-400
            "
          >
            Anulaciones
          </p>

          <p
            className="
              mt-1 text-2xl
              font-black text-red-300
            "
          >
            {
              panel.comerciales
                .pedidosAnulados
            }{" "}
            pedidos
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-400
            "
          >
            {
              panel.comerciales
                .porcentajeAnulacion
            }
            % del movimiento registrado.
          </p>
        </article>

        <article
          className="
            rounded-2xl
            bg-slate-900 p-5
            text-white
            shadow-panel
          "
        >
          <CircleDollarSign
            size={22}
            className="text-blue-300"
          />

          <p
            className="
              mt-4 text-xs
              font-bold uppercase
              tracking-wide
              text-slate-400
            "
          >
            Mermas valoradas
          </p>

          <p
            className="
              mt-1 text-2xl
              font-black text-blue-300
            "
          >
            {formatearMoneda(
              panel.inventario
                .costoMermasValoradas,
            )}
          </p>

          <p
            className="
              mt-2 text-xs
              text-slate-400
            "
          >
            Solo considera insumos con
            valoración económica activa.
          </p>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
