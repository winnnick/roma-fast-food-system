import {
  Boxes,
  Check,
  CircleAlert,
  ReceiptText,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  PanelAdministrativo,
} from "../../tipos/analitica";

import type {
  ResumenConciliacionCaja,
} from "../../servicios/conciliacionServicio";

interface PanelResumenReportesProps {
  panel: PanelAdministrativo;
  conciliacion: ResumenConciliacionCaja;
}

interface FilaLectura {
  etiqueta: string;
  valor: string;
  detalle?: string;
  alerta?: boolean;
}

function moneda(valor: number): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
}

function numero(valor: number): string {
  return new Intl.NumberFormat(
    "es-BO",
  ).format(valor);
}

function SeccionGerencial({
  titulo,
  descripcion,
  icono: Icono,
  filas,
}: {
  titulo: string;
  descripcion: string;
  icono: typeof ReceiptText;
  filas: FilaLectura[];
}) {
  return (
    <article
      className="
        overflow-hidden rounded-2xl
        border border-slate-200
        bg-white shadow-panel
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      <header
        className="
          flex items-start gap-3
          border-b border-slate-100
          px-5 py-4
          dark:border-slate-800
        "
      >
        <span
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-lg bg-roma-50
            text-roma-700
            dark:bg-roma-950/40
            dark:text-roma-300
          "
        >
          <Icono size={18} />
        </span>

        <div className="min-w-0">
          <h2
            className="
              text-sm font-black
              text-slate-900
              dark:text-white
            "
          >
            {titulo}
          </h2>

          <p
            className="
              mt-0.5 text-xs
              leading-relaxed
              text-slate-500
              dark:text-slate-400
            "
          >
            {descripcion}
          </p>
        </div>
      </header>

      <dl className="divide-y divide-slate-100 dark:divide-slate-800">
        {filas.map((fila) => (
          <div
            key={fila.etiqueta}
            className="
              grid gap-1 px-5 py-3
              sm:grid-cols-[minmax(0,1fr)_auto]
              sm:items-center sm:gap-5
            "
          >
            <div className="min-w-0">
              <dt
                className="
                  text-xs font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                {fila.etiqueta}
              </dt>

              {fila.detalle && (
                <p
                  className="
                    mt-0.5 text-[11px]
                    leading-relaxed
                    text-slate-400
                    dark:text-slate-500
                  "
                >
                  {fila.detalle}
                </p>
              )}
            </div>

            <dd
              className={`
                text-sm font-black
                sm:text-right
                ${
                  fila.alerta
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-slate-900 dark:text-white"
                }
              `}
            >
              {fila.valor}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function PanelResumenReportes({
  panel,
  conciliacion,
}: PanelResumenReportesProps) {
  const [hallazgosRevisados, setHallazgosRevisados] =
    useState<string[]>(() => {
      try {
        const guardados = localStorage.getItem(
          "roma-reportes-hallazgos-revisados",
        );

        if (!guardados) {
          return [];
        }

        const datos = JSON.parse(guardados);

        return Array.isArray(datos)
          ? datos.filter(
              (item): item is string =>
                typeof item === "string",
            )
          : [];
      } catch {
        return [];
      }
    });

  const efectivo =
    panel.metodosPago.reduce(
      (total, metodo) =>
        total + metodo.montoEfectivo,
      0,
    );

  const qr = panel.metodosPago.reduce(
    (total, metodo) =>
      total + metodo.montoQr,
    0,
  );

  const actividadOrdenada = [
    ...panel.actividadPorUsuario,
  ].sort(
    (a, b) =>
      b.totalAcciones - a.totalAcciones,
  );

  const usuarioMasActivo =
    actividadOrdenada[0] ?? null;

  const totalAcciones =
    panel.actividadPorUsuario.reduce(
      (total, usuario) =>
        total + usuario.totalAcciones,
      0,
    );

  const hallazgos: Array<{
    titulo: string;
    detalle: string;
    nivel: "normal" | "atencion";
  }> = [];

  if (
    panel.comerciales.pedidosPendientes > 0
  ) {
    hallazgos.push({
      titulo: "Cobros pendientes",
      detalle:
        `${panel.comerciales.pedidosPendientes} pedido(s) por ${moneda(panel.comerciales.ventasPendientes)} aún no fueron cobrados.`,
      nivel: "atencion",
    });
  }

  if (
    conciliacion.sesionesConDiferencias > 0
  ) {
    hallazgos.push({
      titulo: "Diferencias de caja",
      detalle:
        `${conciliacion.sesionesConDiferencias} cierre(s) presentan diferencia. Acumulado: ${moneda(conciliacion.diferenciaAcumulada)}.`,
      nivel: "atencion",
    });
  }

  if (
    panel.inventario.insumosStockNegativo > 0
  ) {
    hallazgos.push({
      titulo: "Existencias negativas",
      detalle:
        `${panel.inventario.insumosStockNegativo} insumo(s) requieren regularización inmediata.`,
      nivel: "atencion",
    });
  }

  if (
    panel.inventario.insumosStockBajo > 0
  ) {
    hallazgos.push({
      titulo: "Stock por debajo del mínimo",
      detalle:
        `${panel.inventario.insumosStockBajo} insumo(s) se encuentran en nivel bajo.`,
      nivel: "atencion",
    });
  }

  if (
    panel.inventario.productosActivosSinReceta >
    0
  ) {
    hallazgos.push({
      titulo: "Productos sin receta",
      detalle:
        `${panel.inventario.productosActivosSinReceta} producto(s) activo(s) no tienen receta configurada para controlar consumo automático.`,
      nivel: "atencion",
    });
  }

  const claveHallazgo = (
    titulo: string,
    detalle: string,
  ) => `${titulo}::${detalle}`;

  const hallazgosVisibles =
    hallazgos.filter((hallazgo) => {
      if (hallazgo.nivel === "normal") {
        return true;
      }

      return !hallazgosRevisados.includes(
        claveHallazgo(
          hallazgo.titulo,
          hallazgo.detalle,
        ),
      );
    });

  function marcarHallazgoRevisado(
    titulo: string,
    detalle: string,
  ) {
    const clave = claveHallazgo(
      titulo,
      detalle,
    );

    setHallazgosRevisados((actuales) => {
      const siguientes = Array.from(
        new Set([...actuales, clave]),
      );

      localStorage.setItem(
        "roma-reportes-hallazgos-revisados",
        JSON.stringify(siguientes),
      );

      return siguientes;
    });
  }

  const hayHallazgosPendientes =
    hallazgosVisibles.some(
      (hallazgo) =>
        hallazgo.nivel === "atencion",
    );

  return (
    <div className="space-y-4">
      <section
        className="
          grid gap-4
          xl:grid-cols-2
        "
      >
        <SeccionGerencial
          titulo="Ventas y cobranza"
          descripcion="Qué se vendió, cuánto se cobró y qué quedó pendiente."
          icono={ReceiptText}
          filas={[
            {
              etiqueta: "Ventas cobradas",
              valor: moneda(
                panel.comerciales.ventasNetas,
              ),
              detalle:
                `${numero(panel.comerciales.pedidosCobrados)} pedidos cobrados de ${numero(panel.comerciales.pedidosRegistrados)} registrados.`,
            },
            {
              etiqueta: "Pendiente de cobro",
              valor: moneda(
                panel.comerciales.ventasPendientes,
              ),
              detalle:
                `${numero(panel.comerciales.pedidosPendientes)} pedidos pendientes.`,
              alerta:
                panel.comerciales
                  .pedidosPendientes > 0,
            },
            {
              etiqueta: "Descuentos otorgados",
              valor: moneda(
                panel.comerciales
                  .descuentosOtorgados,
              ),
              detalle:
                `${numero(panel.comerciales.descuentosAplicados)} ventas con descuento.`,
            },
            {
              etiqueta: "Pedidos anulados",
              valor: numero(
                panel.comerciales
                  .pedidosAnulados,
              ),
              alerta:
                panel.comerciales
                  .pedidosAnulados > 0,
            },
          ]}
        />

        <SeccionGerencial
          titulo="Caja y conciliación"
          descripcion="Cómo ingresó el dinero y si los cierres cuadraron."
          icono={WalletCards}
          filas={[
            {
              etiqueta: "Cobros en efectivo",
              valor: moneda(efectivo),
            },
            {
              etiqueta: "Cobros mediante QR",
              valor: moneda(qr),
            },
            {
              etiqueta: "Cajas cerradas revisadas",
              valor: numero(
                conciliacion.sesionesCerradas,
              ),
              detalle:
                `${numero(conciliacion.sesionesConDiferencias)} con diferencia registrada.`,
              alerta:
                conciliacion
                  .sesionesConDiferencias > 0,
            },
            {
              etiqueta: "Diferencia acumulada",
              valor: moneda(
                conciliacion
                  .diferenciaAcumulada,
              ),
              detalle:
                "Suma de sobrantes y faltantes registrados al cierre.",
              alerta:
                Math.abs(
                  conciliacion
                    .diferenciaAcumulada,
                ) > 0.009,
            },
          ]}
        />

        <SeccionGerencial
          titulo="Inventario y abastecimiento"
          descripcion="Existencias que requieren atención y costo registrado del movimiento."
          icono={Boxes}
          filas={[
            {
              etiqueta: "Insumos con stock bajo",
              valor: numero(
                panel.inventario
                  .insumosStockBajo,
              ),
              alerta:
                panel.inventario
                  .insumosStockBajo > 0,
            },
            {
              etiqueta: "Insumos con stock negativo",
              valor: numero(
                panel.inventario
                  .insumosStockNegativo,
              ),
              alerta:
                panel.inventario
                  .insumosStockNegativo > 0,
            },
            {
              etiqueta: "Costo de insumos consumidos",
              valor: moneda(
                panel.inventario
                  .costoConsumoValorado,
              ),
              detalle:
                "Costo registrado de los consumos que cuentan con valoración.",
            },
            {
              etiqueta: "Valor estimado del stock disponible",
              valor: moneda(
                panel.inventario
                  .valorInventarioPositivo,
              ),
              detalle:
                "Valor de existencias positivas según el costo registrado.",
            },
          ]}
        />

        <SeccionGerencial
          titulo="Control operativo"
          descripcion="Quién operó el sistema y qué tan trazable fue la actividad del periodo."
          icono={UsersRound}
          filas={[
            {
              etiqueta: "Usuarios con actividad",
              valor: numero(
                panel.actividadPorUsuario.length,
              ),
            },
            {
              etiqueta: "Acciones registradas",
              valor: numero(totalAcciones),
              detalle:
                "Ventas, cobros, caja, inventario y eventos registrados por usuario.",
            },
            {
              etiqueta: "Usuario con mayor actividad",
              valor:
                usuarioMasActivo?.usuarioNombre ??
                "Sin actividad",
              detalle: usuarioMasActivo
                ? `${numero(usuarioMasActivo.totalAcciones)} acciones registradas.`
                : undefined,
            },
          ]}
        />
      </section>

      <section
        className="
          overflow-hidden rounded-2xl
          border border-slate-200
          bg-white shadow-panel
          dark:border-slate-700
          dark:bg-slate-900
        "
      >
        <header
          className="
            flex items-center gap-3
            border-b border-slate-100
            px-5 py-4
            dark:border-slate-800
          "
        >
          <span
            className="
              flex h-9 w-9 items-center
              justify-center rounded-lg
              bg-amber-50 text-amber-700
              dark:bg-amber-950/30
              dark:text-amber-300
            "
          >
            <CircleAlert size={18} />
          </span>

          <div>
            <h2
              className="
                text-sm font-black
                text-slate-900
                dark:text-white
              "
            >
              Situaciones que requieren revisión
            </h2>
            <p
              className="
                mt-0.5 text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              Prioriza lo que necesita una decisión administrativa.
            </p>
          </div>
        </header>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {hayHallazgosPendientes ? (
            hallazgosVisibles
              .filter(
                (hallazgo) =>
                  hallazgo.nivel ===
                  "atencion",
              )
              .map((hallazgo) => (
                <div
                  key={claveHallazgo(
                    hallazgo.titulo,
                    hallazgo.detalle,
                  )}
                  className="
                    flex items-start
                    justify-between gap-4
                    px-5 py-3
                    transition-colors
                    hover:bg-slate-50/80
                    dark:hover:bg-slate-800/40
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        text-xs font-black
                        text-slate-800
                        dark:text-slate-100
                      "
                    >
                      {hallazgo.titulo}
                    </p>
                    <p
                      className="
                        mt-0.5 text-xs
                        leading-relaxed
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {hallazgo.detalle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      marcarHallazgoRevisado(
                        hallazgo.titulo,
                        hallazgo.detalle,
                      )
                    }
                    className="
                      inline-flex h-8 w-8
                      shrink-0 items-center
                      justify-center rounded-lg
                      border border-emerald-200
                      bg-emerald-50
                      text-emerald-700
                      transition
                      hover:-translate-y-0.5
                      hover:bg-emerald-100
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-emerald-500
                      dark:border-emerald-900
                      dark:bg-emerald-950/30
                      dark:text-emerald-300
                      dark:hover:bg-emerald-950/60
                    "
                    title="Marcar como revisada"
                    aria-label={`Marcar ${hallazgo.titulo} como revisada`}
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))
          ) : (
            <div className="px-5 py-4">
              <p
                className="
                  text-xs font-bold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                No hay situaciones pendientes de revisión.
              </p>
              <p
                className="
                  mt-0.5 text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Las situaciones revisadas se ocultan de esta lista; si cambia el estado que las originó, volverán a aparecer con la información actualizada.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PanelResumenReportes;
