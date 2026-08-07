import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock3,
  ExternalLink,
  PackageCheck,
  ReceiptText,
  Share2,
  WalletCards,
} from "lucide-react";

import type {
  EstadoPreparacion,
  Venta,
} from "../../tipos/venta";

interface PanelPreparacionProps {
  ventas: Venta[];
  puedeGestionar: boolean;
  puedeCobrar: boolean;

  alCambiarEstado: (
    venta: Venta,
    estado: EstadoPreparacion,
  ) => void;

  alAnular: (
    venta: Venta,
  ) => void;

  alCobrar: (
    venta: Venta,
  ) => void;

  clientesConEntregaIds: number[];

  alCompartirEntrega: (
    venta: Venta,
  ) => void;

  alAbrirPantallaPedidos: () => void;
}

interface TarjetaPedidoProps {
  venta: Venta;
  puedeGestionar: boolean;
  puedeCobrar: boolean;

  alCambiarEstado: (
    venta: Venta,
    estado: EstadoPreparacion,
  ) => void;

  alAnular: (
    venta: Venta,
  ) => void;

  alCobrar: (
    venta: Venta,
  ) => void;

  clientesConEntregaIds: number[];

  alCompartirEntrega: (
    venta: Venta,
  ) => void;
}

function formatearHora(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(fecha));
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

function obtenerResumenProductos(
  venta: Venta,
): string {
  const productos = venta.detalles
    .slice(0, 3)
    .map(
      (detalle) =>
        `${detalle.cantidad}× ${detalle.nombreProducto}`,
    )
    .join(" · ");

  if (venta.detalles.length <= 3) {
    return productos;
  }

  return `${productos} · +${venta.detalles.length - 3}`;
}

function obtenerConfiguracionEstado(
  venta: Venta,
) {
  if (
    venta.estadoPreparacion ===
    "Listo"
  ) {
    return {
      borde: "border-emerald-400",
      texto: "text-emerald-600",
      icono:
        "bg-slate-100 text-emerald-600",
      etiqueta:
        "border-emerald-300 text-emerald-700",
      Icono: CheckCircle2,
    };
  }

  if (
    venta.estadoPreparacion ===
      "Entregado" &&
    venta.estadoCobro ===
      "Pendiente de cobro"
  ) {
    return {
      borde: "border-blue-400",
      texto: "text-blue-600",
      icono:
        "bg-slate-100 text-blue-600",
      etiqueta:
        "border-blue-300 text-blue-700",
      Icono: PackageCheck,
    };
  }

  return {
    borde: "border-amber-400",
    texto: "text-amber-600",
    icono:
      "bg-slate-100 text-amber-600",
    etiqueta:
      "border-amber-300 text-amber-700",
    Icono: ChefHat,
  };
}

function TarjetaPedido({
  venta,
  puedeGestionar,
  puedeCobrar,
  alCambiarEstado,
  alAnular,
  alCobrar,
  clientesConEntregaIds,
  alCompartirEntrega,
}: TarjetaPedidoProps) {
  const configuracion =
    obtenerConfiguracionEstado(venta);

  const IconoEstado =
    configuracion.Icono;

  const pendienteCobro =
    venta.estadoCobro ===
    "Pendiente de cobro";

  const puedeMarcarListo =
    puedeGestionar &&
    venta.estadoPreparacion ===
      "En preparación";

  const puedeEntregar =
    puedeGestionar &&
    (venta.estadoPreparacion ===
      "En preparación" ||
      venta.estadoPreparacion ===
        "Listo");

  const puedeAnular =
    puedeGestionar &&
    venta.estadoPreparacion !==
      "Anulado";

  const puedeRegistrarCobro =
    puedeCobrar && pendienteCobro;

  const puedeCompartirEntrega =
    venta.clienteId !== null &&
    clientesConEntregaIds.includes(
      venta.clienteId,
    );

  const cantidadAcciones = [
    puedeMarcarListo,
    puedeEntregar,
    puedeRegistrarCobro,
    puedeCompartirEntrega,
    puedeAnular,
  ].filter(Boolean).length;

  const fechaReferencia =
    venta.estadoPreparacion ===
      "Listo" &&
    venta.fechaHoraListo
      ? venta.fechaHoraListo
      : venta.estadoPreparacion ===
          "Entregado" &&
          venta.fechaHoraEntregado
        ? venta.fechaHoraEntregado
        : venta.fechaHoraInicioPreparacion;

  return (
    <article
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${configuracion.borde}`}
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
              <p className="truncate text-sm font-black text-slate-900">
                {venta.clienteNombre}
              </p>

              <p
                className={`mt-0.5 text-lg font-black ${configuracion.texto}`}
              >
                {venta.numeroPedido}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-black text-slate-900">
                {formatearMoneda(
                  venta.total,
                )}
              </p>

              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Clock3 size={12} />
                {formatearHora(
                  fechaReferencia,
                )}
              </p>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {obtenerResumenProductos(
              venta,
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border bg-slate-100 px-2.5 py-1 text-[10px] font-black ${configuracion.etiqueta}`}
            >
              {venta.estadoPreparacion}
            </span>

            <span
              className={`rounded-full border bg-slate-100 px-2.5 py-1 text-[10px] font-black ${
                pendienteCobro
                  ? "border-rose-300 text-rose-700"
                  : "border-blue-300 text-blue-700"
              }`}
            >
              {venta.estadoCobro}
            </span>
          </div>

          {venta.observaciones && (
            <p className="mt-3 line-clamp-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic leading-relaxed text-slate-500">
              {venta.observaciones}
            </p>
          )}
        </div>
      </div>

      {cantidadAcciones > 0 ? (
        <div
          className={`mt-4 grid gap-2 ${
            cantidadAcciones === 1
              ? "grid-cols-1"
              : "grid-cols-2"
          }`}
        >
          {puedeMarcarListo && (
            <button
              type="button"
              onClick={() =>
                alCambiarEstado(
                  venta,
                  "Listo",
                )
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-all duration-100 hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:translate-y-0 active:shadow-sm"
            >
              <CheckCircle2 size={15} />
              Marcar listo
            </button>
          )}

          {puedeEntregar && (
            <button
              type="button"
              onClick={() =>
                alCambiarEstado(
                  venta,
                  "Entregado",
                )
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-all duration-100 hover:-translate-y-0.5 hover:border-blue-700 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:translate-y-0 active:shadow-sm"
            >
              <PackageCheck size={15} />
              Entregar
            </button>
          )}

          {puedeRegistrarCobro && (
            <button
              type="button"
              onClick={() =>
                alCobrar(venta)
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-600 bg-violet-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-all duration-100 hover:-translate-y-0.5 hover:border-violet-700 hover:bg-violet-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:translate-y-0 active:shadow-sm"
            >
              <WalletCards size={15} />
              Cobrar
            </button>
          )}


          {puedeCompartirEntrega && (
            <button
              type="button"
              onClick={() =>
                alCompartirEntrega(venta)
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-teal-600 bg-teal-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-all duration-100 hover:-translate-y-0.5 hover:border-teal-700 hover:bg-teal-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 active:translate-y-0 active:shadow-sm"
            >
              <Share2 size={15} />
              Entrega
            </button>
          )}

          {puedeAnular && (
            <button
              type="button"
              onClick={() =>
                alAnular(venta)
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-all duration-100 hover:-translate-y-0.5 hover:border-red-700 hover:bg-red-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:translate-y-0 active:shadow-sm"
            >
              <Ban size={15} />
              Anular
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
          Pedido disponible solo para consulta.
        </p>
      )}
    </article>
  );
}

function PanelPreparacion({
  ventas,
  puedeGestionar,
  puedeCobrar,
  alCambiarEstado,
  alAnular,
  alCobrar,
  clientesConEntregaIds,
  alCompartirEntrega,
  alAbrirPantallaPedidos,
}: PanelPreparacionProps) {
  const pedidosEnCurso = ventas
    .filter((venta) => {
      const pedidoAnulado =
        venta.estadoPreparacion ===
          "Anulado" ||
        venta.estadoCobro ===
          "Anulada";

      if (pedidoAnulado) {
        return false;
      }

      const sigueEnPreparacion =
        venta.estadoPreparacion ===
          "En preparación" ||
        venta.estadoPreparacion ===
          "Listo";

      const siguePendienteCobro =
        venta.estadoCobro ===
        "Pendiente de cobro";

      /*
       * Regla operativa:
       * ningún pedido sin cobrar debe salir de la cola,
       * incluso si ya fue marcado como entregado.
       */
      return (
        sigueEnPreparacion ||
        siguePendienteCobro
      );
    })
    .sort((ventaA, ventaB) => {
      const prioridad = (
        venta: Venta,
      ) => {
        if (
          venta.estadoPreparacion ===
          "Listo"
        ) {
          return 0;
        }

        if (
          venta.estadoPreparacion ===
          "En preparación"
        ) {
          return 1;
        }

        return 2;
      };

      const diferenciaPrioridad =
        prioridad(ventaA) -
        prioridad(ventaB);

      if (diferenciaPrioridad !== 0) {
        return diferenciaPrioridad;
      }

      return (
        new Date(
          ventaA.fechaHoraRegistro,
        ).getTime() -
        new Date(
          ventaB.fechaHoraRegistro,
        ).getTime()
      );
    });

  return (
    <aside className="flex h-full min-h-[48rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText
                size={18}
                className="text-roma-600"
              />

              <h2 className="font-black text-slate-900">
                Pedidos en curso
              </h2>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Preparación, entrega y cobros pendientes en una sola cola.
            </p>
          </div>

          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-700">
            {pedidosEnCurso.length}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {pedidosEnCurso.length === 0 ? (
          <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ChefHat size={24} />
            </div>

            <p className="mt-4 font-black text-slate-800">
              No hay pedidos en curso
            </p>

            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              Los pedidos nuevos aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidosEnCurso.map(
              (venta) => (
                <TarjetaPedido
                  key={venta.id}
                  venta={venta}
                  puedeGestionar={
                    puedeGestionar
                  }
                  puedeCobrar={
                    puedeCobrar
                  }
                  alCambiarEstado={
                    alCambiarEstado
                  }
                  alAnular={alAnular}
                  alCobrar={alCobrar}
                  clientesConEntregaIds={
                    clientesConEntregaIds
                  }
                  alCompartirEntrega={
                    alCompartirEntrega
                  }
                />
              ),
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-3">
        <button
          type="button"
          onClick={
            alAbrirPantallaPedidos
          }
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
        >
          <ExternalLink size={17} />
          Abrir pantalla de pedidos
        </button>
      </div>
    </aside>
  );
}

export default PanelPreparacion;
