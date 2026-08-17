import {
  CheckCircle2,
  ChefHat,
  Clock3,
  ListChecks,
  Maximize2,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listarPedidosPantallaPublica,
} from "../../servicios/ventaServicio";

import type {
  ModoInicioPreparacion,
  PedidoPantallaPublica,
} from "../../tipos/venta";

const TIEMPO_VISIBLE_LISTO_MS =
  10 * 60 * 1000;

function formatearHora(fecha: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(fecha);
}

function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function formatearHoraPedido(fecha: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

interface ColumnaPedidosProps {
  titulo: string;
  descripcion: string;
  ventas: PedidoPantallaPublica[];
  tono: "cola" | "preparacion" | "listo";
  fechaReferencia: (venta: PedidoPantallaPublica) => string;
}

function ColumnaPedidos({
  titulo,
  descripcion,
  ventas,
  tono,
  fechaReferencia,
}: ColumnaPedidosProps) {
  const configuracion = {
    cola: {
      borde: "border-sky-400/25",
      fondo: "bg-sky-400/[0.06]",
      icono: "bg-sky-400 text-slate-950",
      contador: "bg-sky-400/10 text-sky-300",
      tarjeta: "border-sky-400/20",
      etiqueta: "text-sky-300",
      Icono: ListChecks,
      vacio: "No hay pedidos esperando turno.",
    },
    preparacion: {
      borde: "border-amber-400/25",
      fondo: "bg-amber-400/[0.06]",
      icono: "bg-amber-400 text-slate-950",
      contador: "bg-amber-400/10 text-amber-300",
      tarjeta: "border-amber-400/20",
      etiqueta: "text-amber-300",
      Icono: ChefHat,
      vacio: "No hay pedidos en preparación.",
    },
    listo: {
      borde: "border-emerald-400/25",
      fondo: "bg-emerald-400/[0.06]",
      icono: "bg-emerald-400 text-slate-950",
      contador: "bg-emerald-400/10 text-emerald-300",
      tarjeta: "border-emerald-400/25",
      etiqueta: "text-emerald-300",
      Icono: CheckCircle2,
      vacio: "No hay pedidos listos para recoger.",
    },
  }[tono];

  const Icono = configuracion.Icono;

  return (
    <section
      className={`flex min-h-136 flex-col rounded-4xl border ${configuracion.borde} ${configuracion.fondo} p-5 sm:p-6`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${configuracion.icono}`}
          >
            <Icono size={25} />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              {titulo}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
              {descripcion}
            </p>
          </div>
        </div>

        <span
          className={`min-w-11 rounded-full px-3 py-1.5 text-center text-base font-black ${configuracion.contador}`}
        >
          {ventas.length}
        </span>
      </div>

      {ventas.length === 0 ? (
        <div className="mt-6 flex min-h-56 flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 text-center text-sm font-semibold text-slate-500">
          {configuracion.vacio}
        </div>
      ) : (
        <div className="mt-6 grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {ventas.map((venta) => (
            <article
              key={venta.id}
              className={`rounded-2xl border ${configuracion.tarjeta} bg-slate-900/90 px-4 py-5 shadow-lg shadow-black/10`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.18em] ${configuracion.etiqueta}`}
                >
                  Pedido
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Clock3 size={11} />
                  {formatearHoraPedido(
                    fechaReferencia(venta),
                  )}
                </span>
              </div>

              <strong className="mt-2 block text-3xl font-black tracking-tight text-white sm:text-4xl">
                {venta.numeroPedido}
              </strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PantallaPedidos() {
  const [ventas, setVentas] = useState<PedidoPantallaPublica[]>([]);
  const [ahora, setAhora] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [modoInicioPreparacion, setModoInicioPreparacion] =
    useState<ModoInicioPreparacion>("En preparación");

  useEffect(() => {
    let componenteActivo = true;

    function cargarEstado() {
      Promise.resolve(listarPedidosPantallaPublica())
        .then((respuesta) => {
          if (!componenteActivo) return;

          setVentas(respuesta.ventas);
          setModoInicioPreparacion(respuesta.modoInicioPreparacion);
          setError(null);
        })
        .catch(() => {
          if (!componenteActivo) return;
          setError(
            "No se pudo actualizar la pantalla de pedidos.",
          );
        });
    }

    cargarEstado();

    const intervaloDatos = window.setInterval(
      cargarEstado,
      4000,
    );

    const intervaloReloj = window.setInterval(() => {
      setAhora(new Date());
    }, 1000);

    return () => {
      componenteActivo = false;
      window.clearInterval(intervaloDatos);
      window.clearInterval(intervaloReloj);
    };
  }, []);

  const pedidosEnCola = useMemo(
    () =>
      ventas
        .filter(
          (venta) => venta.estadoPreparacion === "En cola",
        )
        .sort(
          (ventaA, ventaB) =>
            new Date(ventaA.fechaHoraRegistro).getTime() -
            new Date(ventaB.fechaHoraRegistro).getTime(),
        ),
    [ventas],
  );

  const pedidosEnPreparacion = useMemo(
    () =>
      ventas
        .filter(
          (venta) =>
            venta.estadoPreparacion === "En preparación",
        )
        .sort(
          (ventaA, ventaB) =>
            new Date(
              ventaA.fechaHoraInicioPreparacion ??
                ventaA.fechaHoraRegistro,
            ).getTime() -
            new Date(
              ventaB.fechaHoraInicioPreparacion ??
                ventaB.fechaHoraRegistro,
            ).getTime(),
        ),
    [ventas],
  );

  const pedidosListos = useMemo(() => {
    const momentoActual = ahora.getTime();

    return ventas
      .filter((venta) => {
        if (
          venta.estadoPreparacion !== "Listo" ||
          !venta.fechaHoraListo
        ) {
          return false;
        }

        const tiempoTranscurrido =
          momentoActual -
          new Date(venta.fechaHoraListo).getTime();

        return (
          tiempoTranscurrido >= 0 &&
          tiempoTranscurrido <= TIEMPO_VISIBLE_LISTO_MS
        );
      })
      .sort(
        (ventaA, ventaB) =>
          new Date(
            ventaB.fechaHoraListo ?? ventaB.fechaHoraRegistro,
          ).getTime() -
          new Date(
            ventaA.fechaHoraListo ?? ventaA.fechaHoraRegistro,
          ).getTime(),
      );
  }, [ventas, ahora]);

  async function activarPantallaCompleta() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setError(
        "El navegador no permitió activar la pantalla completa.",
      );
    }
  }

  const usaCola =
    modoInicioPreparacion === "En cola" ||
    pedidosEnCola.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6 lg:px-8 lg:py-7">
      <header className="mx-auto flex max-w-[1800px] flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,.75)]" />
            <p className="text-xs font-black uppercase tracking-[0.26em] text-red-400 sm:text-sm">
              Roma Fast Food
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Estado de pedidos
          </h1>

          <p className="mt-1.5 text-sm text-slate-400 sm:text-base">
            Busca tu número y sigue el avance de tu pedido.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 text-right">
            <p className="capitalize text-xs font-semibold text-slate-400">
              {formatearFecha(ahora)}
            </p>
            <p className="mt-1 flex items-center justify-end gap-2 text-xl font-black sm:text-2xl">
              <Clock3 size={19} />
              {formatearHora(ahora)}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-300 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Actualización automática
          </div>

          <button
            type="button"
            onClick={() => void activarPantallaCompleta()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white transition hover:bg-white/10"
            title="Pantalla completa"
          >
            <Maximize2 size={21} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-5 flex max-w-[1800px] items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          <RefreshCw size={18} />
          {error}
        </div>
      )}

      <div
        className={`mx-auto mt-6 grid max-w-[1800px] gap-5 ${
          usaCola
            ? "xl:grid-cols-3"
            : "xl:grid-cols-2"
        }`}
      >
        {usaCola && (
          <ColumnaPedidos
            titulo="Recibidos"
            descripcion="Tu pedido está registrado y espera turno."
            ventas={pedidosEnCola}
            tono="cola"
            fechaReferencia={(venta) => venta.fechaHoraRegistro}
          />
        )}

        <ColumnaPedidos
          titulo="En preparación"
          descripcion="Cocina ya está preparando tu pedido."
          ventas={pedidosEnPreparacion}
          tono="preparacion"
          fechaReferencia={(venta) =>
            venta.fechaHoraInicioPreparacion ??
            venta.fechaHoraRegistro
          }
        />

        <ColumnaPedidos
          titulo="Listos para recoger"
          descripcion="Acércate al mostrador cuando aparezca tu número."
          ventas={pedidosListos}
          tono="listo"
          fechaReferencia={(venta) =>
            venta.fechaHoraListo ?? venta.fechaHoraRegistro
          }
        />
      </div>

      <footer className="mx-auto mt-6 flex max-w-[1800px] flex-col gap-2 border-t border-white/10 pt-4 text-center text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span>
          Los pedidos listos permanecen visibles unos minutos para facilitar su identificación.
        </span>
        <span>
          No necesitas acercarte al mostrador hasta que tu pedido aparezca como listo.
        </span>
      </footer>
    </main>
  );
}

export default PantallaPedidos;
