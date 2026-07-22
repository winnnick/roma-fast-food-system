import {
  Ban,
  LoaderCircle,
  PackageX,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  TratamientoAnulacionInventario,
} from "../../tipos/inventario";

import type {
  Venta,
} from "../../tipos/venta";

interface FormularioAnulacionInventarioProps {
  venta: Venta;
  tieneConsumoInventario: boolean;
  preparandoInventario: boolean;
  cargando: boolean;

  alConfirmar: (
    motivo: string,
    tratamiento:
      TratamientoAnulacionInventario | null,
  ) => Promise<void>;

  alCancelar: () => void;
}

function FormularioAnulacionInventario({
  venta,
  tieneConsumoInventario,
  preparandoInventario,
  cargando,
  alConfirmar,
  alCancelar,
}: FormularioAnulacionInventarioProps) {
  const [motivo, setMotivo] =
    useState("");

  const [tratamiento, setTratamiento] =
    useState<TratamientoAnulacionInventario>(
      venta.estadoPreparacion ===
        "En preparación"
        ? "Reintegrar insumos"
        : "Registrar como merma",
    );

  const [error, setError] =
    useState<string | null>(null);

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    const motivoLimpio =
      motivo.trim();

    if (motivoLimpio.length < 5) {
      setError(
        "El motivo debe contener al menos 5 caracteres.",
      );

      return;
    }

    if (motivoLimpio.length > 200) {
      setError(
        "El motivo no puede superar los 200 caracteres.",
      );

      return;
    }

    setError(null);

    await alConfirmar(
      motivoLimpio,
      tieneConsumoInventario
        ? tratamiento
        : null,
    );
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div className="space-y-5 p-5 sm:p-6">
        <section
          className="
            rounded-2xl border
            border-red-200
            bg-red-50 p-4
          "
        >
          <div className="flex items-start gap-3">
            <Ban
              size={22}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div>
              <p className="font-black text-red-950">
                {venta.numeroPedido}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-red-700">
                La anulación conservará el historial del pedido y deberá definir el tratamiento de los insumos cuando exista consumo automático.
              </p>
            </div>
          </div>
        </section>

        {preparandoInventario ? (
          <div
            className="
              flex min-h-32 items-center
              justify-center rounded-2xl
              border border-slate-200
              bg-slate-50
            "
          >
            <LoaderCircle
              size={24}
              className="animate-spin text-red-700"
            />

            <span className="ml-3 text-sm font-bold text-slate-600">
              Verificando movimientos de inventario...
            </span>
          </div>
        ) : tieneConsumoInventario ? (
          <section>
            <p className="text-sm font-bold text-slate-700">
              Tratamiento del inventario
            </p>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label
                className={`
                  cursor-pointer rounded-2xl
                  border p-4 transition
                  ${
                    tratamiento ===
                    "Reintegrar insumos"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="tratamiento-inventario"
                    checked={
                      tratamiento ===
                      "Reintegrar insumos"
                    }
                    disabled={cargando}
                    onChange={() =>
                      setTratamiento(
                        "Reintegrar insumos",
                      )
                    }
                    className="mt-1 accent-emerald-600"
                  />

                  <RotateCcw
                    size={21}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-900">
                      Reintegrar insumos
                    </span>

                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                      Utilízalo cuando el pedido todavía no fue preparado y los insumos continúan disponibles.
                    </span>
                  </span>
                </div>
              </label>

              <label
                className={`
                  cursor-pointer rounded-2xl
                  border p-4 transition
                  ${
                    tratamiento ===
                    "Registrar como merma"
                      ? "border-orange-600 bg-orange-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="tratamiento-inventario"
                    checked={
                      tratamiento ===
                      "Registrar como merma"
                    }
                    disabled={cargando}
                    onChange={() =>
                      setTratamiento(
                        "Registrar como merma",
                      )
                    }
                    className="mt-1 accent-orange-600"
                  />

                  <PackageX
                    size={21}
                    className="mt-0.5 shrink-0 text-orange-700"
                  />

                  <span>
                    <span className="block text-sm font-black text-slate-900">
                      Registrar como merma
                    </span>

                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                      Utilízalo cuando el pedido ya fue preparado y los insumos no pueden recuperarse.
                    </span>
                  </span>
                </div>
              </label>
            </div>
          </section>
        ) : (
          <section
            className="
              rounded-2xl border
              border-blue-200
              bg-blue-50 p-4
            "
          >
            <p className="text-sm font-black text-blue-950">
              Venta sin consumo automático registrado
            </p>

            <p className="mt-1 text-xs leading-relaxed text-blue-700">
              El pedido puede ser anterior a la integración de inventario o contener productos sin receta. La anulación no generará una reversión ni una merma automática.
            </p>
          </section>
        )}

        <div>
          <label
            htmlFor="motivo-anulacion-inventario"
            className="text-sm font-bold text-slate-700"
          >
            Motivo de anulación
          </label>

          <textarea
            id="motivo-anulacion-inventario"
            value={motivo}
            disabled={
              cargando ||
              preparandoInventario
            }
            maxLength={200}
            rows={4}
            placeholder="Ej.: El cliente canceló el pedido antes de la preparación."
            onChange={(evento) => {
              setMotivo(
                evento.target.value,
              );

              setError(null);
            }}
            className="
              mt-2 w-full resize-none
              rounded-xl border
              border-slate-300 px-4
              py-3 text-sm outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
              disabled:bg-slate-100
            "
          />

          <div className="mt-1 flex justify-between gap-3">
            <p className="text-xs text-slate-500">
              Mínimo 5 caracteres.
            </p>

            <span className="text-xs text-slate-400">
              {motivo.length}/200
            </span>
          </div>
        </div>

        {error && (
          <div
            className="
              rounded-xl border
              border-red-200
              bg-red-50 p-3
              text-sm font-semibold
              text-red-700
            "
          >
            {error}
          </div>
        )}
      </div>

      <footer
        className="
          flex flex-col-reverse gap-3
          border-t border-slate-100
          bg-slate-50 px-5 py-4
          sm:flex-row sm:justify-end
          sm:px-6
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
            border-slate-300 bg-white
            px-5 py-3 text-sm
            font-bold text-slate-700
            hover:bg-slate-100
            disabled:opacity-50
          "
        >
          <X size={18} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={
            cargando ||
            preparandoInventario
          }
          className="
            inline-flex items-center
            justify-center gap-2
            rounded-xl bg-red-700
            px-5 py-3 text-sm
            font-bold text-white
            hover:bg-red-800
            disabled:opacity-50
          "
        >
          {cargando ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          Confirmar anulación
        </button>
      </footer>
    </form>
  );
}

export default FormularioAnulacionInventario;
