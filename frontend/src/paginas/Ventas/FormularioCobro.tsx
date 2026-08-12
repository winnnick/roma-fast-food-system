import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  QrCode,
  ReceiptText,
  Tag,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  MetodoPago,
  PagoVenta,
  RegistrarPagoVentaDto,
  SesionCaja,
  TipoDescuento,
} from "../../tipos/caja";

import type {
  Venta,
} from "../../tipos/venta";

interface FormularioCobroProps {
  venta: Venta;
  sesionCaja: SesionCaja;
  pagosPrevios: PagoVenta[];
  cargando: boolean;

  alCobrar: (
    datos: RegistrarPagoVentaDto,
  ) => Promise<void>;

  alCancelar: () => void;
}

function convertirNumero(
  valor: string,
): number {
  const numero = Number(
    valor.replace(",", "."),
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function formatearMoneda(
  valor: number,
): string {
  const monto =
    new Intl.NumberFormat(
      "es-BO",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(valor);

  return `Bs ${monto}`;
}

function FormularioCobro({
  venta,
  sesionCaja,
  pagosPrevios,
  cargando,
  alCobrar,
  alCancelar,
}: FormularioCobroProps) {
  const [mostrarDescuento, setMostrarDescuento] =
    useState(false);

  const [tipoDescuento, setTipoDescuento] =
    useState<TipoDescuento>("Ninguno");

  const [valorDescuento, setValorDescuento] =
    useState("");

  const [motivoDescuento, setMotivoDescuento] =
    useState("");

  const [montoQr, setMontoQr] =
    useState("");

  const [montoRecibido, setMontoRecibido] =
    useState("");

  const [referenciaQr, setReferenciaQr] =
    useState("");

  const [errorLocal, setErrorLocal] =
    useState<string | null>(null);

  const descuentoBloqueado =
    pagosPrevios.length > 0;

  const montoPagadoPrevio =
    useMemo(
      () =>
        redondearMoneda(
          pagosPrevios.reduce(
            (acumulado, pago) =>
              acumulado + pago.totalCobrado,
            0,
          ),
        ),
      [pagosPrevios],
    );

  const valorDescuentoNumerico =
    convertirNumero(valorDescuento);

  const montoDescuento = useMemo(() => {
    if (descuentoBloqueado) {
      return redondearMoneda(
        venta.montoDescuento,
      );
    }

    if (
      tipoDescuento === "Ninguno"
    ) {
      return 0;
    }

    if (
      tipoDescuento === "Porcentaje"
    ) {
      if (
        valorDescuentoNumerico <= 0 ||
        valorDescuentoNumerico >= 100
      ) {
        return 0;
      }

      return redondearMoneda(
        venta.subtotal *
          (valorDescuentoNumerico / 100),
      );
    }

    if (
      valorDescuentoNumerico <= 0 ||
      valorDescuentoNumerico >=
        venta.subtotal
    ) {
      return 0;
    }

    return redondearMoneda(
      valorDescuentoNumerico,
    );
  }, [
    descuentoBloqueado,
    tipoDescuento,
    valorDescuentoNumerico,
    venta.montoDescuento,
    venta.subtotal,
  ]);

  const totalVenta = useMemo(
    () =>
      descuentoBloqueado
        ? redondearMoneda(venta.total)
        : redondearMoneda(
            Math.max(
              0,
              venta.subtotal -
                montoDescuento,
            ),
          ),
    [
      descuentoBloqueado,
      montoDescuento,
      venta.subtotal,
      venta.total,
    ],
  );

  const totalPorCobrar =
    redondearMoneda(
      Math.max(
        0,
        totalVenta -
          montoPagadoPrevio,
      ),
    );

  const montoQrNumerico =
    redondearMoneda(
      Math.max(
        0,
        convertirNumero(montoQr),
      ),
    );

  const montoRecibidoNumerico =
    redondearMoneda(
      Math.max(
        0,
        convertirNumero(
          montoRecibido,
        ),
      ),
    );

  const montoQrAplicado =
    redondearMoneda(
      Math.min(
        montoQrNumerico,
        totalPorCobrar,
      ),
    );

  const efectivoNecesario =
    redondearMoneda(
      Math.min(
        montoRecibidoNumerico,
        Math.max(
          0,
          totalPorCobrar -
            montoQrAplicado,
        ),
      ),
    );

  const totalAbono =
    redondearMoneda(
      montoQrAplicado +
        efectivoNecesario,
    );

  const cambio = redondearMoneda(
    Math.max(
      0,
      montoRecibidoNumerico -
        efectivoNecesario,
    ),
  );

  const faltante = redondearMoneda(
    Math.max(
      0,
      totalPorCobrar - totalAbono,
    ),
  );

  const metodoDetectado = useMemo<
    MetodoPago | null
  >(() => {
    if (
      totalPorCobrar <= 0 ||
      montoQrNumerico > totalPorCobrar ||
      totalAbono <= 0
    ) {
      return null;
    }

    if (
      montoQrAplicado > 0 &&
      efectivoNecesario > 0
    ) {
      return "Mixto";
    }

    if (montoQrAplicado > 0) {
      return "QR";
    }

    return "Efectivo";
  }, [
    efectivoNecesario,
    montoQrAplicado,
    montoQrNumerico,
    totalAbono,
    totalPorCobrar,
  ]);

  const pagoCompleto =
    metodoDetectado !== null &&
    faltante <= 0;

  function cambiarTipoDescuento(
    nuevoTipo: TipoDescuento,
  ) {
    setTipoDescuento(nuevoTipo);
    setValorDescuento("");
    setMotivoDescuento("");
    setErrorLocal(null);
  }

  function quitarDescuento() {
    setMostrarDescuento(false);
    cambiarTipoDescuento("Ninguno");
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (
      !descuentoBloqueado &&
      tipoDescuento !== "Ninguno"
    ) {
      if (
        valorDescuentoNumerico <= 0
      ) {
        setErrorLocal(
          "Ingresa un descuento válido.",
        );
        return;
      }

      if (
        tipoDescuento ===
          "Porcentaje" &&
        valorDescuentoNumerico >= 100
      ) {
        setErrorLocal(
          "El descuento porcentual debe ser menor al 100 %.",
        );
        return;
      }

      if (
        tipoDescuento ===
          "Monto fijo" &&
        valorDescuentoNumerico >=
          venta.subtotal
      ) {
        setErrorLocal(
          "El descuento fijo debe ser menor al subtotal.",
        );
        return;
      }

      if (
        motivoDescuento
          .trim().length < 5
      ) {
        setErrorLocal(
          "Indica un motivo de descuento de al menos 5 caracteres.",
        );
        return;
      }
    }

    if (
      montoQrNumerico >
      totalPorCobrar
    ) {
      setErrorLocal(
        "El monto QR no puede superar el total por cobrar.",
      );
      return;
    }

    if (!metodoDetectado) {
      setErrorLocal(
        "Ingresa un monto de efectivo, QR o una combinación para registrar el abono.",
      );
      return;
    }

    setErrorLocal(null);

    await alCobrar({
      ventaId: venta.id,

      tipoDescuento,

      valorDescuento:
        tipoDescuento === "Ninguno"
          ? 0
          : valorDescuentoNumerico,

      motivoDescuento:
        tipoDescuento === "Ninguno"
          ? null
          : motivoDescuento.trim(),

      metodoPago:
        metodoDetectado,

      montoQr:
        montoQrAplicado,

      montoEfectivo:
        efectivoNecesario,

      montoRecibido:
        metodoDetectado === "QR"
          ? 0
          : montoRecibidoNumerico,

      referenciaQr:
        montoQrNumerico > 0
          ? referenciaQr.trim() ||
            null
          : null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="flex min-h-0 flex-col"
    >
      <div className="grid min-h-0 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 in-[.tema-oscuro]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 in-[.tema-oscuro_&]:text-slate-400">
                  Pedido pendiente
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-950 in-[.tema-oscuro_&]:text-white">
                  {venta.numeroPedido}
                </h3>

                <p className="mt-1 text-sm text-slate-600 in-[.tema-oscuro_&]:text-slate-300">
                  {venta.clienteNombre}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 in-[.tema-oscuro_&]:text-slate-400">
                  Total actual
                </p>

                <p className="mt-1 text-xl font-black text-slate-950 in-[.tema-oscuro_&]:text-white">
                  {formatearMoneda(
                    venta.total,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-600 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:text-slate-300">
              {venta.detalles
                .slice(0, 3)
                .map((detalle) => (
                  <span
                    key={detalle.productoId}
                  >
                    {detalle.cantidad}× {detalle.nombreProducto}
                  </span>
                ))}

              {venta.detalles.length > 3 && (
                <span className="font-bold">
                  +{venta.detalles.length - 3} más
                </span>
              )}
            </div>

            {pagosPrevios.length > 0 && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 in-[.tema-oscuro_&]:border-emerald-900/70 in-[.tema-oscuro_&]:bg-emerald-950/25">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-emerald-800 in-[.tema-oscuro_&]:text-emerald-300">
                    Abonos registrados
                  </p>
                  <strong className="text-xs text-emerald-800 in-[.tema-oscuro_&]:text-emerald-300">
                    {formatearMoneda(montoPagadoPrevio)}
                  </strong>
                </div>

                <div className="mt-2 space-y-1.5">
                  {pagosPrevios
                    .slice(-3)
                    .map((pago) => (
                      <div
                        key={pago.id}
                        className="flex items-center justify-between gap-3 text-[11px] text-emerald-900 in-[.tema-oscuro_&]:text-emerald-200"
                      >
                        <span className="min-w-0 truncate">
                          {pago.usuarioNombre} · Caja N.º {pago.sesionCajaId} · {pago.metodoPago}
                        </span>
                        <strong className="shrink-0">
                          {formatearMoneda(pago.totalCobrado)}
                        </strong>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards
                  size={19}
                  className="text-emerald-600"
                />

                <div>
                  <h3 className="font-black text-slate-950 in-[.tema-oscuro_&]:text-white">
                    Cobro rápido
                  </h3>

                  <p className="text-xs text-slate-500 in-[.tema-oscuro_&]:text-slate-400">
                    El método se detecta automáticamente.
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950 in-[.tema-oscuro_&]:text-slate-300">
                Caja N.º {sesionCaja.id}
              </span>
            </div>

            <div className="mt-4">
              {descuentoBloqueado ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 in-[.tema-oscuro_&]:border-amber-900/70 in-[.tema-oscuro_&]:bg-amber-950/25 in-[.tema-oscuro_&]:text-amber-200">
                  <div className="flex items-center gap-2 font-black">
                    <Tag size={16} />
                    Condiciones del pedido fijadas
                  </div>
                  <p className="mt-1.5 leading-relaxed">
                    Ya existe al menos un abono. El total y el descuento no pueden modificarse durante los pagos restantes.
                  </p>
                  {venta.montoDescuento > 0 && (
                    <p className="mt-2 font-black">
                      Descuento aplicado: - {formatearMoneda(venta.montoDescuento)}
                    </p>
                  )}
                </div>
              ) : !mostrarDescuento ? (
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => {
                    setMostrarDescuento(
                      true,
                    );
                    setTipoDescuento(
                      "Porcentaje",
                    );
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950 in-[.tema-oscuro_&]:text-slate-300 in-[.tema-oscuro_&]:hover:border-red-900 in-[.tema-oscuro_&]:hover:bg-red-950/40 in-[.tema-oscuro_&]:hover:text-red-300"
                >
                  <Tag size={16} />
                  Aplicar descuento
                  <span className="ml-1 text-[10px] font-bold uppercase text-slate-400">
                    Opcional
                  </span>
                </button>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 in-[.tema-oscuro_&]:border-red-900/70 in-[.tema-oscuro_&]:bg-red-950/25">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-red-800 in-[.tema-oscuro_&]:text-red-300">
                      Configurar descuento
                    </p>

                    <button
                      type="button"
                      disabled={cargando}
                      onClick={quitarDescuento}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 in-[.tema-oscuro_&]:text-red-300 in-[.tema-oscuro_&]:hover:bg-red-950/60"
                    >
                      <Trash2 size={14} />
                      Quitar
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        "Porcentaje",
                        "Monto fijo",
                      ] as const).map(
                        (tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            disabled={cargando}
                            onClick={() =>
                              cambiarTipoDescuento(
                                tipo,
                              )
                            }
                            className={`rounded-xl border px-3 py-2 text-xs font-black transition-colors disabled:opacity-50 ${
                              tipoDescuento ===
                              tipo
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-900 in-[.tema-oscuro_&]:text-slate-200 in-[.tema-oscuro_&]:hover:bg-slate-800"
                            }`}
                          >
                            {tipo}
                          </button>
                        ),
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorDescuento}
                        disabled={cargando}
                        placeholder={
                          tipoDescuento ===
                          "Porcentaje"
                            ? "Ej. 10"
                            : "Ej. 5,00"
                        }
                        onChange={(evento) => {
                          setValorDescuento(
                            evento.target.value,
                          );
                          setErrorLocal(null);
                        }}
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-900 in-[.tema-oscuro_&]:text-white in-[.tema-oscuro_&]:focus:ring-red-950/50"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={motivoDescuento}
                    disabled={cargando}
                    maxLength={160}
                    placeholder="Motivo del descuento"
                    onChange={(evento) => {
                      setMotivoDescuento(
                        evento.target.value,
                      );
                      setErrorLocal(null);
                    }}
                    className="mt-3 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-900 in-[.tema-oscuro_&]:text-white in-[.tema-oscuro_&]:focus:ring-red-950/50"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500 in-[.tema-oscuro_&]:text-slate-400">
                  <Banknote size={15} />
                  Efectivo recibido
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoRecibido}
                  disabled={
                    cargando ||
                    montoQrNumerico ===
                      totalPorCobrar
                  }
                  placeholder="0,00"
                  onChange={(evento) => {
                    setMontoRecibido(
                      evento.target.value,
                    );
                    setErrorLocal(null);
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-black text-slate-950 outline-none transition-colors focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950 in-[.tema-oscuro_&]:text-white in-[.tema-oscuro_&]:disabled:bg-slate-800 in-[.tema-oscuro_&]:disabled:text-slate-500 in-[.tema-oscuro_&]:focus:ring-emerald-950/60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500 in-[.tema-oscuro_&]:text-slate-400">
                  <QrCode size={15} />
                  Monto en QR
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoQr}
                  disabled={cargando}
                  placeholder="0,00"
                  onChange={(evento) => {
                    setMontoQr(
                      evento.target.value,
                    );
                    setErrorLocal(null);
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-black text-slate-950 outline-none transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-100 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950 in-[.tema-oscuro_&]:text-white in-[.tema-oscuro_&]:focus:ring-blue-950/60"
                />
              </label>
            </div>

            {montoQrNumerico > 0 && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500 in-[.tema-oscuro_&]:text-slate-400">
                  Referencia QR opcional
                </span>

                <input
                  type="text"
                  value={referenciaQr}
                  disabled={cargando}
                  maxLength={100}
                  placeholder="Código o referencia del comprobante"
                  onChange={(evento) =>
                    setReferenciaQr(
                      evento.target.value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950 in-[.tema-oscuro_&]:text-white in-[.tema-oscuro_&]:focus:ring-blue-950/60"
                />
              </label>
            )}

            {errorLocal && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 in-[.tema-oscuro_&]:border-red-900/70 in-[.tema-oscuro_&]:bg-red-950/35 in-[.tema-oscuro_&]:text-red-300">
                {errorLocal}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-inner in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/15 text-red-400">
              <ReceiptText size={22} />
            </div>

            <div>
              <h3 className="text-lg font-black">
                Resumen del cobro
              </h3>

              <p className="text-xs text-slate-400">
                Caja N.º {sesionCaja.id} · {sesionCaja.usuarioAperturaNombre}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Subtotal</span>
              <strong className="text-white">
                {formatearMoneda(
                  venta.subtotal,
                )}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Descuento</span>
              <strong className="text-amber-300">
                − {formatearMoneda(
                  montoDescuento,
                )}
              </strong>
            </div>

            <div className="rounded-xl border border-roma-500/35 bg-roma-500/10 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.13em] text-roma-300">
                Total final
              </p>

              <p className="mt-1 text-4xl font-black tracking-tight text-white">
                {formatearMoneda(
                  totalVenta,
                )}
              </p>
            </div>

            {montoPagadoPrevio > 0 && (
              <>
                <div className="flex items-center justify-between gap-4 text-emerald-300">
                  <span>Pagado anteriormente</span>
                  <strong>
                    {formatearMoneda(montoPagadoPrevio)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 text-amber-300">
                  <span>Saldo antes de este abono</span>
                  <strong>
                    {formatearMoneda(totalPorCobrar)}
                  </strong>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl bg-slate-900 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Método detectado
              </p>

              <div className="mt-2 flex items-center gap-2">
                {metodoDetectado ===
                  "QR" && (
                  <QrCode
                    size={18}
                    className="text-blue-400"
                  />
                )}

                {metodoDetectado ===
                  "Efectivo" && (
                  <Banknote
                    size={18}
                    className="text-emerald-400"
                  />
                )}

                {metodoDetectado ===
                  "Mixto" && (
                  <WalletCards
                    size={18}
                    className="text-violet-400"
                  />
                )}

                {!metodoDetectado && (
                  <CircleDollarSign
                    size={18}
                    className="text-amber-400"
                  />
                )}

                <span className="font-black">
                  {metodoDetectado
                    ? pagoCompleto
                      ? metodoDetectado
                      : `${metodoDetectado} · Abono`
                    : "Sin abono"}
                </span>
              </div>
            </div>

            <div
              className={`rounded-xl border p-3 ${
                pagoCompleto
                  ? "border-slate-700 bg-slate-900"
                  : "border-amber-800 bg-amber-950/40"
              }`}
            >
              <p className={`text-[10px] font-black uppercase tracking-wide ${
                pagoCompleto
                  ? "text-slate-400"
                  : "text-amber-300"
              }`}
              >
                {pagoCompleto
                  ? "Cambio para el cliente"
                  : metodoDetectado
                    ? "Saldo después del abono"
                    : "Saldo pendiente"}
              </p>

              <p className={`mt-1 text-2xl font-black ${
                pagoCompleto
                  ? "text-white"
                  : "text-amber-300"
              }`}
              >
                {formatearMoneda(
                  pagoCompleto
                    ? cambio
                    : faltante,
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
            <div className="flex justify-between gap-3">
              <span>Abono actual</span>
              <strong className="text-white">
                {formatearMoneda(totalAbono)}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>QR aplicado</span>
              <strong className="text-white">
                {formatearMoneda(montoQrAplicado)}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>Efectivo aplicado</span>
              <strong className="text-white">
                {formatearMoneda(efectivoNecesario)}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-5 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-900">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 in-[.tema-oscuro_&]:border-slate-700 in-[.tema-oscuro_&]:bg-slate-950 in-[.tema-oscuro_&]:text-slate-200 in-[.tema-oscuro_&]:hover:bg-slate-800"
        >
          <X size={18} />
          Dejar pendiente
        </button>

        <button
          type="submit"
          disabled={
            cargando ||
            !metodoDetectado
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {cargando ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <CheckCircle2 size={18} />
          )}

          {pagoCompleto
            ? "Completar cobro"
            : "Registrar abono"}
        </button>
      </footer>
    </form>
  );
}

export default FormularioCobro;
