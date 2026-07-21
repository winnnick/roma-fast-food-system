import {
  Calculator,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  CerrarCajaDto,
  ResumenCaja,
} from "../../tipos/caja";

interface FormularioCierreCajaProps {
  resumen: ResumenCaja;
  cargando: boolean;

  alGuardar: (
    datos: CerrarCajaDto,
  ) => Promise<void>;

  alCancelar: () => void;
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

function FormularioCierreCaja({
  resumen,
  cargando,
  alGuardar,
  alCancelar,
}: FormularioCierreCajaProps) {
  const [
    montoContado,
    setMontoContado,
  ] = useState("");

  const [
    observacion,
    setObservacion,
  ] = useState("");

  const diferencia =
    useMemo(
      () =>
        redondearMoneda(
          (Number(montoContado) ||
            0) -
            resumen.efectivoEsperado,
        ),
      [
        montoContado,
        resumen.efectivoEsperado,
      ],
    );

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    await alGuardar({
      montoContado:
        Number(montoContado) ||
        0,

      observacion:
        observacion.trim() ||
        null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div className="p-5 sm:p-6">
        <div
          className="
            rounded-2xl
            bg-slate-950 p-5
            text-white
          "
        >
          <div
            className="
              flex items-center gap-3
            "
          >
            <Calculator
              size={24}
              className="text-red-400"
            />

            <h3
              className="
                text-lg font-black
              "
            >
              Resumen del efectivo
            </h3>
          </div>

          <div
            className="
              mt-5 space-y-3
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
                Monto inicial
              </span>

              <strong>
                {formatearMoneda(
                  resumen.montoInicial,
                )}
              </strong>
            </div>

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
                Ventas en efectivo
              </span>

              <strong>
                {formatearMoneda(
                  resumen
                    .totalVentasEfectivo,
                )}
              </strong>
            </div>

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
                Ingresos manuales
              </span>

              <strong>
                {formatearMoneda(
                  resumen
                    .totalIngresosManuales,
                )}
              </strong>
            </div>

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
                Egresos manuales
              </span>

              <strong
                className="
                  text-red-300
                "
              >
                −{" "}
                {formatearMoneda(
                  resumen
                    .totalEgresosManuales,
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
                  text-slate-400
                "
              >
                Efectivo esperado
              </p>

              <p
                className="
                  mt-1 text-3xl
                  font-black
                "
              >
                {formatearMoneda(
                  resumen.efectivoEsperado,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="monto-contado"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Efectivo contado
          </label>

          <input
            id="monto-contado"
            type="number"
            min="0"
            step="0.01"
            value={montoContado}
            disabled={cargando}
            placeholder="0.00"
            onChange={(evento) =>
              setMontoContado(
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

        <div
          className={`
            mt-4 rounded-2xl
            border p-4
            ${
              diferencia === 0
                ? `
                  border-emerald-200
                  bg-emerald-50
                `
                : diferencia > 0
                  ? `
                    border-blue-200
                    bg-blue-50
                  `
                  : `
                    border-red-200
                    bg-red-50
                  `
            }
          `}
        >
          <p
            className="
              text-xs font-bold
              uppercase
              text-slate-500
            "
          >
            Diferencia
          </p>

          <p
            className="
              mt-1 text-2xl
              font-black
              text-slate-900
            "
          >
            {formatearMoneda(
              diferencia,
            )}
          </p>

          <p
            className="
              mt-1 text-xs
              text-slate-500
            "
          >
            {diferencia === 0
              ? "La caja cuadra correctamente."
              : diferencia > 0
                ? "Existe un sobrante de efectivo."
                : "Existe un faltante de efectivo."}
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="observacion-cierre"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Observación de cierre
          </label>

          <textarea
            id="observacion-cierre"
            value={observacion}
            disabled={cargando}
            maxLength={300}
            rows={3}
            placeholder="Opcional"
            onChange={(evento) =>
              setObservacion(
                evento.target.value,
              )
            }
            className="
              mt-2 w-full resize-none
              rounded-xl border
              border-slate-300
              px-4 py-3 text-sm
              outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
            "
          />
        </div>
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
            rounded-xl border
            border-slate-300
            bg-white px-5 py-3
            text-sm font-bold
            text-slate-700
            hover:bg-slate-100
            disabled:opacity-50
          "
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={
            cargando ||
            montoContado === ""
          }
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl
            bg-red-700 px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-red-800
            disabled:opacity-50
          "
        >
          {cargando && (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          )}

          <LockKeyhole size={17} />
          Cerrar caja
        </button>
      </div>
    </form>
  );
}

export default FormularioCierreCaja;