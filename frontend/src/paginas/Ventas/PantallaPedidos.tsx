import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Maximize2,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listarVentas,
} from "../../servicios/ventaServicio";

import type {
  Venta,
} from "../../tipos/venta";

const TIEMPO_VISIBLE_LISTO_MS =
  10 * 60 * 1000;

function formatearHora(
  fecha: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(fecha);
}

function formatearFecha(
  fecha: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(fecha);
}

function PantallaPedidos() {
  const [ventas, setVentas] =
    useState<Venta[]>([]);

  const [ahora, setAhora] =
    useState(new Date());

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let componenteActivo = true;

    function cargarVentas() {
      listarVentas()
        .then((respuesta) => {
          if (!componenteActivo) {
            return;
          }

          setVentas(respuesta);
          setError(null);
        })
        .catch(() => {
          if (!componenteActivo) {
            return;
          }

          setError(
            "No se pudo actualizar la pantalla de pedidos.",
          );
        });
    }

    cargarVentas();

    const intervaloDatos =
      window.setInterval(
        cargarVentas,
        5000,
      );

    const intervaloReloj =
      window.setInterval(() => {
        setAhora(new Date());
      }, 1000);

    function manejarCambioStorage(
      evento: StorageEvent,
    ) {
      if (
        evento.key ===
        "roma-ventas-unificadas-v1"
      ) {
        cargarVentas();
      }
    }

    window.addEventListener(
      "storage",
      manejarCambioStorage,
    );

    return () => {
      componenteActivo = false;

      window.clearInterval(
        intervaloDatos,
      );

      window.clearInterval(
        intervaloReloj,
      );

      window.removeEventListener(
        "storage",
        manejarCambioStorage,
      );
    };
  }, []);

  const pedidosEnPreparacion =
    useMemo(
      () =>
        ventas
          .filter(
            (venta) =>
              venta.estadoPreparacion ===
              "En preparación",
          )
          .sort(
            (ventaA, ventaB) =>
              new Date(
                ventaA.fechaHoraRegistro,
              ).getTime() -
              new Date(
                ventaB.fechaHoraRegistro,
              ).getTime(),
          ),
      [ventas],
    );

  const pedidosListos =
    useMemo(() => {
      const momentoActual =
        ahora.getTime();

      return ventas
        .filter((venta) => {
          if (
            venta.estadoPreparacion !==
              "Listo" ||
            !venta.fechaHoraListo
          ) {
            return false;
          }

          const tiempoTranscurrido =
            momentoActual -
            new Date(
              venta.fechaHoraListo,
            ).getTime();

          return (
            tiempoTranscurrido >= 0 &&
            tiempoTranscurrido <=
              TIEMPO_VISIBLE_LISTO_MS
          );
        })
        .sort(
          (ventaA, ventaB) =>
            new Date(
              ventaB.fechaHoraListo ??
                ventaB.fechaHoraRegistro,
            ).getTime() -
            new Date(
              ventaA.fechaHoraListo ??
                ventaA.fechaHoraRegistro,
            ).getTime(),
        );
    }, [ventas, ahora]);

  async function activarPantallaCompleta() {
    try {
      if (
        !document.fullscreenElement
      ) {
        await document.documentElement
          .requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setError(
        "El navegador no permitió activar la pantalla completa.",
      );
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-slate-950
        px-6 py-6
        text-white
        lg:px-10 lg:py-8
      "
    >
      <header
        className="
          flex flex-col gap-5
          border-b border-white/10
          pb-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-sm font-bold
              uppercase tracking-[0.25em]
              text-red-400
            "
          >
            Roma Fast Food
          </p>

          <h1
            className="
              mt-2 text-4xl
              font-black tracking-tight
              sm:text-5xl
            "
          >
            Estado de pedidos
          </h1>

          <p
            className="
              mt-2 text-base
              text-slate-400
            "
          >
            Revisa tu número de pedido.
          </p>
        </div>

        <div
          className="
            flex flex-wrap
            items-center gap-4
          "
        >
          <div
            className="
              rounded-2xl
              border border-white/10
              bg-white/5
              px-5 py-3
              text-right
            "
          >
            <p
              className="
                capitalize text-sm
                text-slate-400
              "
            >
              {formatearFecha(ahora)}
            </p>

            <p
              className="
                mt-1 flex items-center
                justify-end gap-2
                text-2xl font-black
              "
            >
              <Clock3 size={21} />
              {formatearHora(ahora)}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void activarPantallaCompleta()
            }
            className="
              inline-flex h-14 w-14
              items-center
              justify-center
              rounded-2xl
              border border-white/10
              bg-white/5
              text-white
              hover:bg-white/10
            "
            title="Pantalla completa"
          >
            <Maximize2 size={23} />
          </button>
        </div>
      </header>

      {error && (
        <div
          className="
            mt-6 flex items-center
            gap-3 rounded-2xl
            border border-red-500/30
            bg-red-500/10
            p-4 text-red-200
          "
        >
          <RefreshCw size={19} />
          {error}
        </div>
      )}

      <div
        className="
          mt-8 grid gap-8
          xl:grid-cols-2
        "
      >
        <section
          className="
            rounded-3xl
            border border-amber-400/20
            bg-amber-400/5
            p-6
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-4
            "
          >
            <div
              className="
                flex items-center gap-3
              "
            >
              <div
                className="
                  flex h-14 w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-amber-500
                  text-slate-950
                "
              >
                <ChefHat size={29} />
              </div>

              <div>
                <h2
                  className="
                    text-2xl font-black
                    sm:text-3xl
                  "
                >
                  En preparación
                </h2>

                <p
                  className="
                    mt-1 text-sm
                    text-slate-400
                  "
                >
                  Tu pedido está siendo
                  preparado.
                </p>
              </div>
            </div>

            <span
              className="
                rounded-full
                bg-amber-400/10
                px-4 py-2
                text-lg font-black
                text-amber-300
              "
            >
              {
                pedidosEnPreparacion.length
              }
            </span>
          </div>

          {pedidosEnPreparacion.length ===
          0 ? (
            <div
              className="
                mt-8 rounded-3xl
                border border-dashed
                border-white/10
                p-12 text-center
                text-slate-500
              "
            >
              No hay pedidos en
              preparación.
            </div>
          ) : (
            <div
              className="
                mt-8 grid gap-4
                sm:grid-cols-2
                2xl:grid-cols-3
              "
            >
              {pedidosEnPreparacion.map(
                (venta) => (
                  <div
                    key={venta.id}
                    className="
                      rounded-3xl
                      border border-amber-400/20
                      bg-slate-900
                      px-5 py-7
                      text-center
                    "
                  >
                    <p
                      className="
                        text-xs font-bold
                        uppercase
                        tracking-[0.18em]
                        text-amber-400
                      "
                    >
                      N.º de pedido
                    </p>

                    <strong
                      className="
                        mt-3 block
                        text-4xl font-black
                        tracking-tight
                        sm:text-5xl
                      "
                    >
                      {
                        venta.numeroPedido
                      }
                    </strong>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section
          className="
            rounded-3xl
            border
            border-emerald-400/20
            bg-emerald-400/5
            p-6
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-4
            "
          >
            <div
              className="
                flex items-center gap-3
              "
            >
              <div
                className="
                  flex h-14 w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-500
                  text-slate-950
                "
              >
                <CheckCircle2
                  size={29}
                />
              </div>

              <div>
                <h2
                  className="
                    text-2xl font-black
                    sm:text-3xl
                  "
                >
                  Listos para recoger
                </h2>

                <p
                  className="
                    mt-1 text-sm
                    text-slate-400
                  "
                >
                  Acércate al mostrador
                  cuando aparezca tu número.
                </p>
              </div>
            </div>

            <span
              className="
                rounded-full
                bg-emerald-400/10
                px-4 py-2
                text-lg font-black
                text-emerald-300
              "
            >
              {pedidosListos.length}
            </span>
          </div>

          {pedidosListos.length ===
          0 ? (
            <div
              className="
                mt-8 rounded-3xl
                border border-dashed
                border-white/10
                p-12 text-center
                text-slate-500
              "
            >
              No hay pedidos listos para
              recoger.
            </div>
          ) : (
            <div
              className="
                mt-8 grid gap-4
                sm:grid-cols-2
                2xl:grid-cols-3
              "
            >
              {pedidosListos.map(
                (venta) => (
                  <div
                    key={venta.id}
                    className="
                      rounded-3xl
                      bg-emerald-500
                      px-5 py-7
                      text-center
                      text-slate-950
                      shadow-lg
                      shadow-emerald-950/30
                    "
                  >
                    <p
                      className="
                        text-xs font-black
                        uppercase
                        tracking-[0.18em]
                      "
                    >
                      Pedido listo
                    </p>

                    <strong
                      className="
                        mt-3 block
                        text-4xl font-black
                        tracking-tight
                        sm:text-5xl
                      "
                    >
                      {
                        venta.numeroPedido
                      }
                    </strong>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      <footer
        className="
          mt-8 border-t
          border-white/10 pt-5
          text-center text-sm
          text-slate-500
        "
      >
        Los pedidos listos permanecen
        visibles durante algunos minutos
        para facilitar su identificación.
      </footer>
    </main>
  );
}

export default PantallaPedidos;