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

  const valorDescuentoNumerico =
    convertirNumero(valorDescuento);

  const montoDescuento = useMemo(() => {
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
    tipoDescuento,
    valorDescuentoNumerico,
    venta.subtotal,
  ]);

  const totalPorCobrar = useMemo(
    () =>
      redondearMoneda(
        Math.max(
          0,
          venta.subtotal -
            montoDescuento,
        ),
      ),
    [venta.subtotal, montoDescuento],
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

  const efectivoNecesario =
    redondearMoneda(
      Math.max(
        0,
        totalPorCobrar -
          montoQrNumerico,
      ),
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
      efectivoNecesario -
        montoRecibidoNumerico,
    ),
  );

  const metodoDetectado = useMemo<
    MetodoPago | null
  >(() => {
    if (
      totalPorCobrar <= 0 ||
      montoQrNumerico > totalPorCobrar
    ) {
      return null;
    }

    if (
      montoQrNumerico ===
      totalPorCobrar
    ) {
      return "QR";
    }

    if (
      montoQrNumerico === 0 &&
      montoRecibidoNumerico >=
        totalPorCobrar
    ) {
      return "Efectivo";
    }

    if (
      montoQrNumerico > 0 &&
      montoQrNumerico <
        totalPorCobrar &&
      montoRecibidoNumerico >=
        efectivoNecesario
    ) {
      return "Mixto";
    }

    return null;
  }, [
    efectivoNecesario,
    montoQrNumerico,
    montoRecibidoNumerico,
    totalPorCobrar,
  ]);

  const pagoCompleto =
    metodoDetectado !== null;

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
        "Completa el pago mediante QR, efectivo o una combinación de ambos.",
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

      montoEfectivo:
        metodoDetectado === "Mixto"
          ? efectivoNecesario
          : metodoDetectado ===
              "Efectivo"
            ? totalPorCobrar
            : 0,

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
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 [.tema-oscuro_&]:text-slate-400">
                  Pedido pendiente
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-950 [.tema-oscuro_&]:text-white">
                  {venta.numeroPedido}
                </h3>

                <p className="mt-1 text-sm text-slate-600 [.tema-oscuro_&]:text-slate-300">
                  {venta.clienteNombre}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 [.tema-oscuro_&]:text-slate-400">
                  Total actual
                </p>

                <p className="mt-1 text-xl font-black text-slate-950 [.tema-oscuro_&]:text-white">
                  {formatearMoneda(
                    venta.total,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-600 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:text-slate-300">
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
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards
                  size={19}
                  className="text-emerald-600"
                />

                <div>
                  <h3 className="font-black text-slate-950 [.tema-oscuro_&]:text-white">
                    Cobro rápido
                  </h3>

                  <p className="text-xs text-slate-500 [.tema-oscuro_&]:text-slate-400">
                    El método se detecta automáticamente.
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-slate-300">
                Caja N.º {sesionCaja.id}
              </span>
            </div>

            <div className="mt-4">
              {!mostrarDescuento ? (
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
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-slate-300 [.tema-oscuro_&]:hover:border-red-900 [.tema-oscuro_&]:hover:bg-red-950/40 [.tema-oscuro_&]:hover:text-red-300"
                >
                  <Tag size={16} />
                  Aplicar descuento
                  <span className="ml-1 text-[10px] font-bold uppercase text-slate-400">
                    Opcional
                  </span>
                </button>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 [.tema-oscuro_&]:border-red-900/70 [.tema-oscuro_&]:bg-red-950/25">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-red-800 [.tema-oscuro_&]:text-red-300">
                      Configurar descuento
                    </p>

                    <button
                      type="button"
                      disabled={cargando}
                      onClick={quitarDescuento}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 [.tema-oscuro_&]:text-red-300 [.tema-oscuro_&]:hover:bg-red-950/60"
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
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-200 [.tema-oscuro_&]:hover:bg-slate-800"
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
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-white [.tema-oscuro_&]:focus:ring-red-950/50"
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
                    className="mt-3 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-white [.tema-oscuro_&]:focus:ring-red-950/50"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500 [.tema-oscuro_&]:text-slate-400">
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
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-black text-slate-950 outline-none transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-white [.tema-oscuro_&]:focus:ring-blue-950/60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500 [.tema-oscuro_&]:text-slate-400">
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
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-black text-slate-950 outline-none transition-colors focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-white [.tema-oscuro_&]:disabled:bg-slate-800 [.tema-oscuro_&]:disabled:text-slate-500 [.tema-oscuro_&]:focus:ring-emerald-950/60"
                />
              </label>
            </div>

            {montoQrNumerico > 0 && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500 [.tema-oscuro_&]:text-slate-400">
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
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-white [.tema-oscuro_&]:focus:ring-blue-950/60"
                />
              </label>
            )}

            {errorLocal && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 [.tema-oscuro_&]:border-red-900/70 [.tema-oscuro_&]:bg-red-950/35 [.tema-oscuro_&]:text-red-300">
                {errorLocal}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-inner [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950">
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

            <div className="border-t border-slate-800 pt-4">
              <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-400">
                Total por cobrar
              </p>

              <p className="mt-1 text-4xl font-black tracking-tight">
                {formatearMoneda(
                  totalPorCobrar,
                )}
              </p>
            </div>
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
                  {metodoDetectado ??
                    "Pago incompleto"}
                </span>
              </div>
            </div>

            <div
              className={`rounded-xl border p-3 ${
                pagoCompleto
                  ? "border-emerald-800 bg-emerald-950/55"
                  : "border-amber-800 bg-amber-950/40"
              }`}
            >
              <p className={`text-[10px] font-black uppercase tracking-wide ${
                pagoCompleto
                  ? "text-emerald-300"
                  : "text-amber-300"
              }`}
              >
                {pagoCompleto
                  ? "Cambio para el cliente"
                  : "Monto faltante"}
              </p>

              <p className={`mt-1 text-2xl font-black ${
                pagoCompleto
                  ? "text-emerald-300"
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
              <span>QR aplicado</span>
              <strong className="text-white">
                {formatearMoneda(
                  Math.min(
                    montoQrNumerico,
                    totalPorCobrar,
                  ),
                )}
              </strong>
            </div>

            <div className="flex justify-between gap-3">
              <span>Efectivo aplicado</span>
              <strong className="text-white">
                {formatearMoneda(
                  metodoDetectado ===
                    "Efectivo"
                    ? totalPorCobrar
                    : metodoDetectado ===
                        "Mixto"
                      ? efectivoNecesario
                      : 0,
                )}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-5 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-slate-200 [.tema-oscuro_&]:hover:bg-slate-800"
        >
          <X size={18} />
          Dejar pendiente
        </button>

        <button
          type="submit"
          disabled={
            cargando ||
            !pagoCompleto
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

          Confirmar cobro
        </button>
      </footer>
    </form>
  );
}

export default FormularioCobro;
