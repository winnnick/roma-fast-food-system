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

  const diferencia = useMemo(
    () =>
      redondearMoneda(
        (Number(montoContado) || 0) -
          resumen.efectivoEsperado,
      ),
    [
      montoContado,
      resumen.efectivoEsperado,
    ],
  );

  const configuracionDiferencia =
    diferencia === 0
      ? {
          panel:
            "border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/40",
          valor:
            "text-emerald-800 dark:text-emerald-200",
          texto:
            "text-emerald-700 dark:text-emerald-300",
          mensaje:
            "La caja cuadra correctamente.",
        }
      : diferencia > 0
        ? {
            panel:
              "border-blue-200 bg-blue-50 dark:border-blue-900/70 dark:bg-blue-950/40",
            valor:
              "text-blue-800 dark:text-blue-200",
            texto:
              "text-blue-700 dark:text-blue-300",
            mensaje:
              "Existe un sobrante de efectivo.",
          }
        : {
            panel:
              "border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/40",
            valor:
              "text-red-800 dark:text-red-200",
            texto:
              "text-red-700 dark:text-red-300",
            mensaje:
              "Existe un faltante de efectivo.",
          };

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    await alGuardar({
      montoContado:
        Number(montoContado) || 0,
      observacion:
        observacion.trim() || null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Calculator
              size={19}
              className="text-red-400"
            />
            <h3 className="font-black">
              Resumen del efectivo
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              {
                etiqueta:
                  "Monto inicial",
                valor:
                  resumen.montoInicial,
                clase:
                  "text-white",
              },
              {
                etiqueta:
                  "Ventas efectivo",
                valor:
                  resumen.totalVentasEfectivo,
                clase:
                  "text-emerald-300",
              },
              {
                etiqueta:
                  "Ingresos",
                valor:
                  resumen.totalIngresosManuales,
                clase:
                  "text-blue-300",
              },
              {
                etiqueta:
                  "Egresos",
                valor:
                  resumen.totalEgresosManuales,
                clase:
                  "text-red-300",
              },
            ].map((item) => (
              <div
                key={item.etiqueta}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {item.etiqueta}
                </p>
                <p
                  className={`mt-1 text-sm font-black ${item.clase}`}
                >
                  {item.etiqueta ===
                  "Egresos"
                    ? "− "
                    : ""}
                  {formatearMoneda(
                    item.valor,
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/70 dark:bg-amber-950/35">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Efectivo esperado
            </p>
            <p className="mt-1 text-xl font-black text-amber-950 dark:text-amber-100">
              {formatearMoneda(
                resumen.efectivoEsperado,
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="monto-contado"
              className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300"
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
              autoFocus
              onChange={(evento) =>
                setMontoContado(
                  evento.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-black text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/60"
            />
          </div>

          <div
            className={`rounded-2xl border p-3.5 ${configuracionDiferencia.panel}`}
          >
            <p
              className={`text-[10px] font-black uppercase tracking-wide ${configuracionDiferencia.texto}`}
            >
              Diferencia
            </p>
            <p
              className={`mt-1 text-xl font-black ${configuracionDiferencia.valor}`}
            >
              {formatearMoneda(
                diferencia,
              )}
            </p>
            <p
              className={`mt-1 text-[11px] font-semibold leading-snug ${configuracionDiferencia.texto}`}
            >
              {
                configuracionDiferencia.mensaje
              }
            </p>
          </div>
        </section>

        <div>
          <label
            htmlFor="observacion-cierre"
            className="text-sm font-bold text-slate-700 dark:text-slate-200"
          >
            Observación de cierre
            <span className="ml-1 font-normal text-slate-400">
              opcional
            </span>
          </label>

          <textarea
            id="observacion-cierre"
            value={observacion}
            disabled={cargando}
            maxLength={300}
            rows={2}
            placeholder="Ej.: diferencia verificada durante el arqueo"
            onChange={(evento) =>
              setObservacion(
                evento.target.value,
              )
            }
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-red-500 dark:focus:ring-red-950/60"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-5 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={
            cargando ||
            montoContado === ""
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-800 disabled:opacity-50"
        >
          {cargando && (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          )}
          <LockKeyhole size={17} />
          Confirmar cierre
        </button>
      </div>
    </form>
  );
}

export default FormularioCierreCaja;
