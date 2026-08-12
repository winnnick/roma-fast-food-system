import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock3,
  ExternalLink,
  HandPlatter,
  ListChecks,
  PackageCheck,
  ReceiptText,
  Settings2,
  Share2,
} from "lucide-react";

import type { ReactNode } from "react";

import type {
  EstadoPreparacion,
  ModoInicioPreparacion,
  Venta,
} from "../../tipos/venta";

interface PanelPreparacionProps {
  ventas: Venta[];
  puedePreparar: boolean;
  puedeCobrar: boolean;
  puedeAnular: boolean;
  puedeCompartirEntrega: boolean;
  puedeConfigurarFlujo: boolean;
  modoInicioPreparacion: ModoInicioPreparacion;
  cambiandoFlujo: boolean;
  cantidadEnCola: number;

  alCambiarModoInicioPreparacion: (
    modo: ModoInicioPreparacion,
  ) => void;

  alCambiarEstado: (
    venta: Venta,
    estado: EstadoPreparacion,
  ) => void;

  alAnular: (venta: Venta) => void;
  alCobrar: (venta: Venta) => void;
  alVerTicket: (venta: Venta) => void;

  clientesConEntregaIds: number[];

  alCompartirEntrega: (venta: Venta) => void;
  alAbrirPantallaPedidos: () => void;
}

interface AccionTarjetaPedido {
  clave: string;
  etiqueta: string;
  etiquetaCorta: string;
  titulo: string;
  color: string;
  icono: ReactNode;
  accion: () => void;
}

interface TarjetaPedidoProps {
  venta: Venta;
  puedePreparar: boolean;
  puedeCobrar: boolean;
  puedeAnular: boolean;
  puedeCompartirEntrega: boolean;

  alCambiarEstado: (
    venta: Venta,
    estado: EstadoPreparacion,
  ) => void;

  alAnular: (venta: Venta) => void;
  alCobrar: (venta: Venta) => void;
  alVerTicket: (venta: Venta) => void;

  clientesConEntregaIds: number[];
  alCompartirEntrega: (venta: Venta) => void;
}

function formatearHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

function IconoCajaRegistradora({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 3h6v6H5V3Zm9 1h5v4h-5V4ZM4 9h15a2 2 0 0 1 2 2v8H3v-8a2 2 0 0 1 1-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6 12h3M6 15h3M12 12h1M16 12h1M12 15h1M16 15h1M2.5 19h19v2h-19v-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatearMoneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function obtenerConfiguracionEstado(venta: Venta) {
  if (venta.estadoPreparacion === "En cola") {
    return {
      borde: "border-sky-400 dark:border-sky-500",
      texto: "text-sky-700 dark:text-sky-300",
      icono:
        "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
      etiqueta:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-300",
      Icono: ListChecks,
    };
  }

  if (venta.estadoPreparacion === "Entrega directa") {
    return {
      borde: "border-indigo-400 dark:border-indigo-500",
      texto: "text-indigo-700 dark:text-indigo-300",
      icono:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
      etiqueta:
        "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/50 dark:text-indigo-300",
      Icono: PackageCheck,
    };
  }

  if (venta.estadoPreparacion === "Listo") {
    return {
      borde: "border-emerald-400 dark:border-emerald-500",
      texto: "text-emerald-700 dark:text-emerald-300",
      icono:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      etiqueta:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300",
      Icono: CheckCircle2,
    };
  }

  if (
    venta.estadoPreparacion === "Entregado" &&
    venta.estadoCobro === "Pendiente de cobro"
  ) {
    return {
      borde: "border-blue-400 dark:border-blue-500",
      texto: "text-blue-700 dark:text-blue-300",
      icono:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
      etiqueta:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300",
      Icono: PackageCheck,
    };
  }

  return {
    borde: "border-amber-400 dark:border-amber-500",
    texto: "text-amber-700 dark:text-amber-300",
    icono:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    etiqueta:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300",
    Icono: ChefHat,
  };
}

function TarjetaPedido({
  venta,
  puedePreparar,
  puedeCobrar,
  puedeAnular,
  puedeCompartirEntrega,
  alCambiarEstado,
  alAnular,
  alCobrar,
  alVerTicket,
  clientesConEntregaIds,
  alCompartirEntrega,
}: TarjetaPedidoProps) {
  const configuracion = obtenerConfiguracionEstado(venta);
  const IconoEstado = configuracion.Icono;

  const pendienteCobro =
    venta.canalVenta === "Local" &&
    venta.estadoCobro === "Pendiente de cobro";

  const puedeIniciarPreparacion =
    puedePreparar &&
    venta.estadoPreparacion === "En cola";

  const puedeMarcarListo =
    puedePreparar &&
    venta.estadoPreparacion === "En preparación";

  const entregaDirecta =
    venta.estadoPreparacion === "Entrega directa";

  const puedeEntregar =
    puedePreparar &&
    (entregaDirecta ||
      venta.estadoPreparacion === "En preparación" ||
      venta.estadoPreparacion === "Listo");

  const puedeAnularPedido =
    puedeAnular &&
    venta.estadoPreparacion !== "Anulado" &&
    venta.estadoPreparacion !== "Entregado";

  const puedeRegistrarCobro =
    puedeCobrar && pendienteCobro;

  const puedeCompartirEntregaPedido =
    puedeCompartirEntrega &&
    !entregaDirecta &&
    venta.clienteId !== null &&
    clientesConEntregaIds.includes(venta.clienteId);

  const fechaReferencia =
    venta.estadoPreparacion === "En cola" ||
    entregaDirecta
      ? venta.fechaHoraRegistro
      : venta.estadoPreparacion === "Listo" &&
          venta.fechaHoraListo
        ? venta.fechaHoraListo
        : venta.estadoPreparacion === "Entregado" &&
            venta.fechaHoraEntregado
          ? venta.fechaHoraEntregado
          : venta.fechaHoraInicioPreparacion ??
            venta.fechaHoraRegistro;


  const accionesPosibles: Array<AccionTarjetaPedido | null> = [
    puedeIniciarPreparacion
      ? {
          clave: "iniciar",
          etiqueta: "Iniciar preparación",
          etiquetaCorta: "Preparar",
          titulo: `Iniciar preparación de ${venta.numeroPedido}`,
          color: "border-amber-600 bg-amber-600 text-white hover:border-amber-700 hover:bg-amber-700 focus-visible:ring-amber-400",
          icono: <ChefHat size={16} />,
          accion: () => alCambiarEstado(venta, "En preparación"),
        }
      : null,
    puedeMarcarListo
      ? {
          clave: "listo",
          etiqueta: "Marcar listo",
          etiquetaCorta: "Listo",
          titulo: `Marcar listo ${venta.numeroPedido}`,
          color: "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700 focus-visible:ring-emerald-400",
          icono: <CheckCircle2 size={16} />,
          accion: () => alCambiarEstado(venta, "Listo"),
        }
      : null,
    puedeEntregar
      ? {
          clave: "entregar",
          etiqueta: "Entregar",
          etiquetaCorta: "Entregar",
          titulo: `Entregar ${venta.numeroPedido}`,
          color: "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700 focus-visible:ring-blue-400",
          icono: <HandPlatter size={16} />,
          accion: () => alCambiarEstado(venta, "Entregado"),
        }
      : null,
    puedeRegistrarCobro
      ? {
          clave: "cobrar",
          etiqueta: "Cobrar",
          etiquetaCorta: "Cobrar",
          titulo: `Cobrar ${venta.numeroPedido}`,
          color: "border-violet-600 bg-violet-600 text-white hover:border-violet-700 hover:bg-violet-700 focus-visible:ring-violet-400",
          icono: <IconoCajaRegistradora size={16} />,
          accion: () => alCobrar(venta),
        }
      : null,
    puedeCompartirEntregaPedido
      ? {
          clave: "compartir",
          etiqueta: "Compartir entrega",
          etiquetaCorta: "Compartir",
          titulo: `Compartir datos de entrega de ${venta.numeroPedido}`,
          color: "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 focus-visible:ring-teal-400 dark:border-teal-900/70 dark:bg-teal-950/35 dark:text-teal-300 dark:hover:bg-teal-950/60",
          icono: <Share2 size={16} />,
          accion: () => alCompartirEntrega(venta),
        }
      : null,
    puedeAnularPedido
      ? {
          clave: "anular",
          etiqueta: "Anular pedido",
          etiquetaCorta: "Anular",
          titulo: `Anular ${venta.numeroPedido}`,
          color: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-300 dark:hover:bg-red-950/60",
          icono: <Ban size={16} />,
          accion: () => alAnular(venta),
        }
      : null,
  ];

  const accionesDisponibles = accionesPosibles.filter(
    (accion): accion is AccionTarjetaPedido => accion !== null,
  );

  return (
    <article
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 ${configuracion.borde}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${configuracion.icono}`}
        >
          <IconoEstado size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                {venta.clienteNombre}
              </p>

              <p
                className={`mt-0.5 text-lg font-black ${configuracion.texto}`}
              >
                {venta.numeroPedido}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {formatearMoneda(venta.total)}
                </p>

                <button
                  type="button"
                  onClick={() => alVerTicket(venta)}
                  title={`Ver ticket de ${venta.numeroPedido}`}
                  aria-label={`Ver ticket de ${venta.numeroPedido}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:border-roma-300 hover:bg-roma-50 hover:text-roma-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roma-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-roma-700 dark:hover:bg-roma-950/30 dark:hover:text-roma-300"
                >
                  <ReceiptText size={15} />
                </button>
              </div>

              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Clock3 size={12} />
                {formatearHora(fechaReferencia)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${configuracion.etiqueta}`}
            >
              {venta.estadoPreparacion}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                venta.canalVenta === "PedidosYa"
                  ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/50 dark:text-fuchsia-300"
                  : pendienteCobro
                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/50 dark:text-rose-300"
                    : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300"
              }`}
            >
              {venta.estadoCobro}
            </span>

            {venta.canalVenta === "PedidosYa" && (
              <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-[10px] font-black text-fuchsia-700 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                PedidosYa
              </span>
            )}

            {venta.requierePreparacion &&
              venta.detalles.some(
                (detalle) => !detalle.requierePreparacion,
              ) && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-300">
                  Incluye entrega directa
                </span>
              )}
          </div>

          {venta.observaciones && (
            <p className="mt-3 line-clamp-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
              {venta.observaciones}
            </p>
          )}
        </div>
      </div>

      {accionesDisponibles.length > 0 && (
        <div
          className="mt-4 grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${accionesDisponibles.length}, minmax(0, 1fr))`,
          }}
        >
          {accionesDisponibles.map((accion) => (
            <button
              key={accion.clave}
              type="button"
              onClick={accion.accion}
              title={accion.titulo}
              aria-label={accion.etiqueta}
              className={`inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 shadow-sm transition-all duration-100 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 active:translate-y-0 active:shadow-sm ${accion.color}`}
            >
              {accion.icono}
              <span className="max-w-full truncate text-[9px] font-black leading-none sm:text-[10px]">
                {accion.etiquetaCorta}
              </span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function PanelPreparacion({
  ventas,
  puedePreparar,
  puedeCobrar,
  puedeAnular,
  puedeCompartirEntrega,
  puedeConfigurarFlujo,
  modoInicioPreparacion,
  cambiandoFlujo,
  cantidadEnCola,
  alCambiarModoInicioPreparacion,
  alCambiarEstado,
  alAnular,
  alCobrar,
  alVerTicket,
  clientesConEntregaIds,
  alCompartirEntrega,
  alAbrirPantallaPedidos,
}: PanelPreparacionProps) {
  const pedidosEnCurso = ventas
    .filter((venta) => {
      const pedidoAnulado =
        venta.estadoPreparacion === "Anulado" ||
        venta.estadoCobro === "Anulada";

      if (pedidoAnulado) {
        return false;
      }

      const sigueEnPreparacion =
        venta.estadoPreparacion === "En cola" ||
        venta.estadoPreparacion === "En preparación" ||
        venta.estadoPreparacion === "Entrega directa" ||
        venta.estadoPreparacion === "Listo";

      const siguePendienteCobro =
        venta.estadoCobro === "Pendiente de cobro";

      return sigueEnPreparacion || siguePendienteCobro;
    })
    .sort((ventaA, ventaB) => {
      const obtenerCorrelativo = (venta: Venta) => {
        const coincidencia = venta.numeroPedido.match(/\d+/);
        return coincidencia ? Number(coincidencia[0]) : venta.id;
      };

      const diferenciaCorrelativo =
        obtenerCorrelativo(ventaB) - obtenerCorrelativo(ventaA);

      if (diferenciaCorrelativo !== 0) {
        return diferenciaCorrelativo;
      }

      return (
        new Date(ventaB.fechaHoraRegistro).getTime() -
        new Date(ventaA.fechaHoraRegistro).getTime()
      );
    });

  const bloquearDesactivacionCola =
    modoInicioPreparacion === "En cola" && cantidadEnCola > 0;

  return (
    <aside className="flex h-full min-h-192 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText
                size={18}
                className="text-roma-600 dark:text-roma-400"
              />

              <h2 className="font-black text-slate-900 dark:text-white">
                Pedidos en curso
              </h2>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Preparación, entrega y cobros pendientes en una sola vista.
            </p>
          </div>

          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {pedidosEnCurso.length}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Settings2 size={14} />
            Ingreso de nuevos pedidos
          </div>

          {puedeConfigurarFlujo ? (
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
              <button
                type="button"
                disabled={cambiandoFlujo}
                onClick={() =>
                  alCambiarModoInicioPreparacion("En cola")
                }
                className={`min-h-10 rounded-lg px-3 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  modoInicioPreparacion === "En cola"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                En cola
              </button>

              <button
                type="button"
                disabled={
                  cambiandoFlujo || bloquearDesactivacionCola
                }
                onClick={() =>
                  alCambiarModoInicioPreparacion("En preparación")
                }
                title={
                  bloquearDesactivacionCola
                    ? "Primero debes sacar todos los pedidos de la cola."
                    : "Los pedidos nuevos ingresarán directamente a preparación."
                }
                className={`min-h-10 rounded-lg px-3 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                  modoInicioPreparacion === "En preparación"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Directo a preparación
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-950">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Flujo actual
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                {modoInicioPreparacion === "En cola"
                  ? "En cola"
                  : "Directo a preparación"}
              </span>
            </div>
          )}

          {bloquearDesactivacionCola && (
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-sky-700 dark:text-sky-300">
              Hay {cantidadEnCola} pedido{cantidadEnCola === 1 ? "" : "s"} en cola. Deben pasar a preparación o salir del flujo antes de desactivar la cola.
            </p>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {pedidosEnCurso.length === 0 ? (
          <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <ChefHat size={24} />
            </div>

            <p className="mt-4 font-black text-slate-800 dark:text-slate-100">
              No hay pedidos en curso
            </p>

            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Los pedidos nuevos aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosEnCurso.map((venta) => (
              <TarjetaPedido
                key={venta.id}
                venta={venta}
                puedePreparar={puedePreparar}
                puedeCobrar={puedeCobrar}
                puedeAnular={puedeAnular}
                puedeCompartirEntrega={puedeCompartirEntrega}
                alCambiarEstado={alCambiarEstado}
                alAnular={alAnular}
                alCobrar={alCobrar}
                alVerTicket={alVerTicket}
                clientesConEntregaIds={clientesConEntregaIds}
                alCompartirEntrega={alCompartirEntrega}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        <button
          type="button"
          onClick={alAbrirPantallaPedidos}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ExternalLink size={17} />
          Abrir pantalla de pedidos
        </button>
      </div>
    </aside>
  );
}

export default PanelPreparacion;
