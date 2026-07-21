import {
  BadgePercent,
  Banknote,
  Calculator,
  CheckCircle2,
  LoaderCircle,
  QrCode,
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
  const numero = Number(valor);

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
  const [
    tipoDescuento,
    setTipoDescuento,
  ] =
    useState<TipoDescuento>(
      "Ninguno",
    );

  const [
    valorDescuento,
    setValorDescuento,
  ] = useState("");

  const [
    motivoDescuento,
    setMotivoDescuento,
  ] = useState("");

  const [
    metodoPago,
    setMetodoPago,
  ] =
    useState<MetodoPago>(
      "Efectivo",
    );

  const [
    montoEfectivo,
    setMontoEfectivo,
  ] = useState("");

  const [
    montoRecibido,
    setMontoRecibido,
  ] = useState("");

  const [
    referenciaQr,
    setReferenciaQr,
  ] = useState("");

  const [
    errorLocal,
    setErrorLocal,
  ] = useState<string | null>(
    null,
  );

  const valorDescuentoNumerico =
    convertirNumero(
      valorDescuento,
    );

  const montoDescuento =
    useMemo(() => {
      if (
        tipoDescuento ===
        "Ninguno"
      ) {
        return 0;
      }

      if (
        tipoDescuento ===
        "Porcentaje"
      ) {
        if (
          valorDescuentoNumerico <=
            0 ||
          valorDescuentoNumerico >=
            100
        ) {
          return 0;
        }

        return redondearMoneda(
          venta.subtotal *
            (valorDescuentoNumerico /
              100),
        );
      }

      if (
        valorDescuentoNumerico <=
          0 ||
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

  const totalPorCobrar =
    useMemo(
      () =>
        redondearMoneda(
          Math.max(
            0,
            venta.subtotal -
              montoDescuento,
          ),
        ),
      [
        venta.subtotal,
        montoDescuento,
      ],
    );

  const montoEfectivoNumerico =
    convertirNumero(
      montoEfectivo,
    );

  const montoRecibidoNumerico =
    convertirNumero(
      montoRecibido,
    );

  const parteEfectivo =
    metodoPago === "Efectivo"
      ? totalPorCobrar
      : metodoPago === "Mixto"
        ? Math.max(
            0,
            montoEfectivoNumerico,
          )
        : 0;

  const parteQr =
    metodoPago === "QR"
      ? totalPorCobrar
      : metodoPago === "Mixto"
        ? redondearMoneda(
            Math.max(
              0,
              totalPorCobrar -
                parteEfectivo,
            ),
          )
        : 0;

  const cambio =
    metodoPago === "Efectivo" ||
    metodoPago === "Mixto"
      ? redondearMoneda(
          Math.max(
            0,
            montoRecibidoNumerico -
              parteEfectivo,
          ),
        )
      : 0;

  function cambiarTipoDescuento(
    nuevoTipo: TipoDescuento,
  ) {
    setTipoDescuento(
      nuevoTipo,
    );

    setValorDescuento("");
    setMotivoDescuento("");
    setErrorLocal(null);
  }

  function cambiarMetodoPago(
    nuevoMetodo: MetodoPago,
  ) {
    setMetodoPago(
      nuevoMetodo,
    );

    setMontoEfectivo("");
    setMontoRecibido("");
    setReferenciaQr("");
    setErrorLocal(null);
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (
      tipoDescuento !==
      "Ninguno"
    ) {
      if (
        valorDescuentoNumerico <=
        0
      ) {
        setErrorLocal(
          "Ingresa un descuento válido.",
        );

        return;
      }

      if (
        tipoDescuento ===
          "Porcentaje" &&
        valorDescuentoNumerico >=
          100
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
      metodoPago ===
        "Efectivo" &&
      montoRecibidoNumerico <
        totalPorCobrar
    ) {
      setErrorLocal(
        "El monto recibido es menor al total por cobrar.",
      );

      return;
    }

    if (
      metodoPago === "Mixto"
    ) {
      if (
        parteEfectivo <= 0 ||
        parteEfectivo >=
          totalPorCobrar
      ) {
        setErrorLocal(
          "La parte en efectivo debe ser mayor a cero y menor al total.",
        );

        return;
      }

      if (
        montoRecibidoNumerico <
        parteEfectivo
      ) {
        setErrorLocal(
          "El monto recibido es menor a la parte en efectivo.",
        );

        return;
      }
    }

    setErrorLocal(null);

    await alCobrar({
      ventaId: venta.id,

      tipoDescuento,

      valorDescuento:
        tipoDescuento ===
        "Ninguno"
          ? 0
          : valorDescuentoNumerico,

      motivoDescuento:
        tipoDescuento ===
        "Ninguno"
          ? null
          : motivoDescuento.trim(),

      metodoPago,

      montoEfectivo:
        metodoPago === "Mixto"
          ? parteEfectivo
          : metodoPago ===
              "Efectivo"
            ? totalPorCobrar
            : 0,

      montoRecibido:
        metodoPago === "QR"
          ? 0
          : montoRecibidoNumerico,

      referenciaQr:
        metodoPago ===
          "Efectivo"
          ? null
          : referenciaQr.trim() ||
            null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div
        className="
          grid gap-6 p-5
          sm:p-6
          2xl:grid-cols-[minmax(0,1fr)_380px]
        "
      >
        <div className="space-y-6 min-w-0">
          <section
            className="
              rounded-2xl border
              border-slate-200
              bg-slate-50 p-5
            "
          >
            <div
              className="
                flex items-center
                justify-between gap-4
              "
            >
              <div>
                <p
                  className="
                    text-xs font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  N.º de pedido
                </p>

                <h3
                  className="
                    mt-1 text-2xl
                    font-black
                    text-slate-950
                  "
                >
                  {venta.numeroPedido}
                </h3>

                <p
                  className="
                    mt-1 text-sm
                    text-slate-500
                  "
                >
                  {venta.clienteNombre}
                </p>
              </div>

              <WalletCards
                size={30}
                className="text-red-700"
              />
            </div>

            <div
              className="
                mt-5 space-y-3
                border-t
                border-slate-200
                pt-4
              "
            >
              {venta.detalles.map(
                (detalle) => (
                  <div
                    key={
                      detalle.productoId
                    }
                    className="
                      flex items-start
                      justify-between
                      gap-4 text-sm
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          font-bold
                          text-slate-800
                        "
                      >
                        {detalle.cantidad}
                        ×{" "}
                        {
                          detalle.nombreProducto
                        }
                      </p>

                      {detalle.observacion && (
                        <p
                          className="
                            mt-1 text-xs
                            text-slate-500
                          "
                        >
                          {
                            detalle.observacion
                          }
                        </p>
                      )}
                    </div>

                    <span
                      className="
                        shrink-0
                        font-bold
                        text-slate-700
                      "
                    >
                      {formatearMoneda(
                        detalle.subtotal,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          </section>

          <section>
            <div
              className="
                flex items-center gap-2
              "
            >
              <BadgePercent
                size={20}
                className="text-red-700"
              />

              <h3
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Descuento
              </h3>
            </div>

            <div
              className="
                mt-4 flex flex-wrap
                gap-3
              "
            >
              {(
                [
                  "Ninguno",
                  "Porcentaje",
                  "Monto fijo",
                ] as TipoDescuento[]
              ).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  disabled={cargando}
                  onClick={() =>
                    cambiarTipoDescuento(
                      tipo,
                    )
                  }
                  className={`
                    min-w-35 flex-1
                    rounded-xl border
                    px-4 py-3
                    text-sm font-bold
                    transition-colors
                    ${
                      tipoDescuento ===
                      tipo
                        ? `
                          border-red-700
                          bg-red-50
                          text-red-700
                        `
                        : `
                          border-slate-300
                          bg-white
                          text-slate-600
                          hover:bg-slate-50
                        `
                    }
                  `}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {tipoDescuento !==
              "Ninguno" && (
              <div
                className="
                  mt-4 grid gap-4
                  lg:grid-cols-2
                "
              >
                <div>
                  <label
                    htmlFor="valor-descuento"
                    className="
                      text-sm font-bold
                      text-slate-700
                    "
                  >
                    {tipoDescuento ===
                    "Porcentaje"
                      ? "Porcentaje de descuento"
                      : "Monto de descuento"}
                  </label>

                  <div className="relative mt-2">
                    <input
                      id="valor-descuento"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        valorDescuento
                      }
                      disabled={cargando}
                      placeholder={
                        tipoDescuento ===
                        "Porcentaje"
                          ? "Ej.: 10"
                          : "Ej.: 5"
                      }
                      onChange={(
                        evento,
                      ) =>
                        setValorDescuento(
                          evento.target
                            .value,
                        )
                      }
                      className="
                        h-12 w-full
                        rounded-xl border
                        border-slate-300
                        bg-white px-4
                        pr-12 text-sm
                        outline-none
                        focus:border-red-600
                        focus:ring-4
                        focus:ring-red-100
                      "
                    />

                    <span
                      className="
                        absolute right-4
                        top-1/2
                        -translate-y-1/2
                        text-sm font-bold
                        text-slate-400
                      "
                    >
                      {tipoDescuento ===
                      "Porcentaje"
                        ? "%"
                        : "Bs"}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="motivo-descuento"
                    className="
                      text-sm font-bold
                      text-slate-700
                    "
                  >
                    Motivo del descuento
                  </label>

                  <input
                    id="motivo-descuento"
                    type="text"
                    value={
                      motivoDescuento
                    }
                    disabled={cargando}
                    maxLength={200}
                    placeholder="Ej.: Promoción especial"
                    onChange={(
                      evento,
                    ) =>
                      setMotivoDescuento(
                        evento.target
                          .value,
                      )
                    }
                    className="
                      mt-2 h-12
                      w-full rounded-xl
                      border
                      border-slate-300
                      bg-white px-4
                      text-sm outline-none
                      focus:border-red-600
                      focus:ring-4
                      focus:ring-red-100
                    "
                  />
                </div>
              </div>
            )}
          </section>

          <section>
            <div
              className="
                flex items-center gap-2
              "
            >
              <Banknote
                size={20}
                className="text-red-700"
              />

              <h3
                className="
                  text-lg font-black
                  text-slate-900
                "
              >
                Método de pago
              </h3>
            </div>

            <div
              className="
                mt-4 flex flex-wrap
                gap-3
              "
            >
              {(
                [
                  "Efectivo",
                  "QR",
                  "Mixto",
                ] as MetodoPago[]
              ).map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  disabled={cargando}
                  onClick={() =>
                    cambiarMetodoPago(
                      metodo,
                    )
                  }
                  className={`
                    min-w-35 flex-1
                    flex items-center
                    justify-center gap-2
                    rounded-xl border
                    px-4 py-3
                    text-sm font-bold
                    transition-colors
                    ${
                      metodoPago ===
                      metodo
                        ? `
                          border-red-700
                          bg-red-50
                          text-red-700
                        `
                        : `
                          border-slate-300
                          bg-white
                          text-slate-600
                          hover:bg-slate-50
                        `
                    }
                  `}
                >
                  {metodo ===
                  "Efectivo" ? (
                    <Banknote
                      size={17}
                    />
                  ) : metodo ===
                    "QR" ? (
                    <QrCode size={17} />
                  ) : (
                    <WalletCards
                      size={17}
                    />
                  )}

                  {metodo}
                </button>
              ))}
            </div>

            {metodoPago ===
              "Mixto" && (
              <div
                className="
                  mt-4 grid gap-4
                  lg:grid-cols-2
                "
              >
                <div>
                  <label
                    htmlFor="parte-efectivo"
                    className="
                      text-sm font-bold
                      text-slate-700
                    "
                  >
                    Parte en efectivo
                  </label>

                  <input
                    id="parte-efectivo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      montoEfectivo
                    }
                    disabled={cargando}
                    placeholder="0.00"
                    onChange={(
                      evento,
                    ) =>
                      setMontoEfectivo(
                        evento.target
                          .value,
                      )
                    }
                    className="
                      mt-2 h-12
                      w-full rounded-xl
                      border
                      border-slate-300
                      px-4 text-sm
                      outline-none
                      focus:border-red-600
                      focus:ring-4
                      focus:ring-red-100
                    "
                  />
                </div>

                <div
                  className="
                    rounded-xl
                    border border-blue-200
                    bg-blue-50 p-4
                  "
                >
                  <p
                    className="
                      text-xs font-bold
                      uppercase
                      text-blue-600
                    "
                  >
                    Parte por QR
                  </p>

                  <p
                    className="
                      mt-1 text-xl
                      font-black
                      text-blue-900
                    "
                  >
                    {formatearMoneda(
                      parteQr,
                    )}
                  </p>
                </div>
              </div>
            )}

            {(metodoPago ===
              "Efectivo" ||
              metodoPago ===
                "Mixto") && (
              <div
                className="
                  mt-4 grid gap-4
                  lg:grid-cols-2
                "
              >
                <div>
                  <label
                    htmlFor="monto-recibido"
                    className="
                      text-sm font-bold
                      text-slate-700
                    "
                  >
                    ¿Con cuánto paga el
                    cliente?
                  </label>

                  <input
                    id="monto-recibido"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      montoRecibido
                    }
                    disabled={cargando}
                    placeholder="Monto entregado"
                    onChange={(
                      evento,
                    ) =>
                      setMontoRecibido(
                        evento.target
                          .value,
                      )
                    }
                    className="
                      mt-2 h-12
                      w-full rounded-xl
                      border
                      border-slate-300
                      px-4 text-sm
                      outline-none
                      focus:border-red-600
                      focus:ring-4
                      focus:ring-red-100
                    "
                  />
                </div>

                <div
                  className="
                    rounded-xl
                    border
                    border-emerald-200
                    bg-emerald-50 p-4
                  "
                >
                  <p
                    className="
                      text-xs font-bold
                      uppercase
                      text-emerald-600
                    "
                  >
                    Cambio
                  </p>

                  <p
                    className="
                      mt-1 text-2xl
                      font-black
                      text-emerald-900
                    "
                  >
                    {formatearMoneda(
                      cambio,
                    )}
                  </p>
                </div>
              </div>
            )}

            {(metodoPago === "QR" ||
              metodoPago ===
                "Mixto") && (
              <div className="mt-4">
                <label
                  htmlFor="referencia-qr"
                  className="
                    text-sm font-bold
                    text-slate-700
                  "
                >
                  Referencia u operación
                  QR
                </label>

                <input
                  id="referencia-qr"
                  type="text"
                  value={referenciaQr}
                  disabled={cargando}
                  maxLength={100}
                  placeholder="Opcional"
                  onChange={(evento) =>
                    setReferenciaQr(
                      evento.target.value,
                    )
                  }
                  className="
                    mt-2 h-12 w-full
                    rounded-xl border
                    border-slate-300
                    px-4 text-sm
                    outline-none
                    focus:border-red-600
                    focus:ring-4
                    focus:ring-red-100
                  "
                />
              </div>
            )}
          </section>
        </div>

        <aside
          className="
            self-start rounded-3xl
            bg-slate-950 p-5
            text-white
            2xl:sticky 2xl:top-24
          "
        >
          <div
            className="
              flex items-center
              gap-3
            "
          >
            <Calculator
              size={24}
              className="text-red-400"
            />

            <div>
              <h3
                className="
                  text-xl font-black
                "
              >
                Resumen del cobro
              </h3>

              <p
                className="
                  mt-1 text-xs
                  text-slate-400
                "
              >
                Caja N.º{" "}
                {sesionCaja.id} abierta
                por{" "}
                {
                  sesionCaja.usuarioAperturaNombre
                }
              </p>
            </div>
          </div>

          <div
            className="
              mt-6 space-y-4
            "
          >
            <div
              className="
                flex items-center
                justify-between
                gap-4 text-sm
              "
            >
              <span
                className="
                  text-slate-400
                "
              >
                Subtotal
              </span>

              <strong>
                {formatearMoneda(
                  venta.subtotal,
                )}
              </strong>
            </div>

            <div
              className="
                flex items-center
                justify-between
                gap-4 text-sm
              "
            >
              <span
                className="
                  text-slate-400
                "
              >
                Descuento
              </span>

              <strong
                className="
                  text-amber-300
                "
              >
                −{" "}
                {formatearMoneda(
                  montoDescuento,
                )}
              </strong>
            </div>

            <div
              className="
                border-t
                border-white/10
                pt-4
              "
            >
              <p
                className="
                  text-xs font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                Total por cobrar
              </p>

              <p
                className="
                  mt-2 text-4xl
                  font-black
                "
              >
                {formatearMoneda(
                  totalPorCobrar,
                )}
              </p>
            </div>

            {metodoPago ===
              "Mixto" && (
              <div
                className="
                  rounded-2xl
                  bg-white/5 p-4
                  text-sm
                "
              >
                <div
                  className="
                    flex justify-between
                    gap-4
                  "
                >
                  <span
                    className="
                      text-slate-400
                    "
                  >
                    Efectivo
                  </span>

                  <strong>
                    {formatearMoneda(
                      parteEfectivo,
                    )}
                  </strong>
                </div>

                <div
                  className="
                    mt-3 flex
                    justify-between gap-4
                  "
                >
                  <span
                    className="
                      text-slate-400
                    "
                  >
                    QR
                  </span>

                  <strong>
                    {formatearMoneda(
                      parteQr,
                    )}
                  </strong>
                </div>
              </div>
            )}

            {(metodoPago ===
              "Efectivo" ||
              metodoPago ===
                "Mixto") && (
              <div
                className="
                  rounded-2xl
                  bg-emerald-500/10
                  p-4
                "
              >
                <p
                  className="
                    text-xs font-bold
                    uppercase
                    text-emerald-300
                  "
                >
                  Cambio para el cliente
                </p>

                <p
                  className="
                    mt-1 text-3xl
                    font-black
                    text-emerald-300
                  "
                >
                  {formatearMoneda(
                    cambio,
                  )}
                </p>
              </div>
            )}
          </div>

          {errorLocal && (
            <div
              className="
                mt-5 rounded-xl
                border border-red-500/30
                bg-red-500/10
                p-3 text-sm
                font-semibold
                text-red-200
              "
            >
              {errorLocal}
            </div>
          )}
        </aside>
      </div>

      <div
        className="
          flex flex-col-reverse
          gap-3 border-t
          border-slate-100
          bg-slate-50
          px-5 py-4
          sm:flex-row
          sm:justify-end sm:px-6
        "
      >
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl border
            border-slate-300
            bg-white px-5 py-3
            text-sm font-bold
            text-slate-700
            hover:bg-slate-100
            disabled:opacity-50
          "
        >
          <X size={18} />
          Dejar pendiente
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl
            bg-emerald-600
            px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-emerald-700
            disabled:opacity-50
          "
        >
          {cargando ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <CheckCircle2
              size={18}
            />
          )}

          Confirmar cobro
        </button>
      </div>
    </form>
  );
}

export default FormularioCobro;