import {
  Eye,
  FileJson,
  SearchX,
  ShieldCheck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import Modal from "../../shared/ui/Modal";

import type {
  NivelAuditoria,
  RegistroAuditoria,
} from "../../tipos/auditoria";

interface PanelBitacoraProps {
  registros: RegistroAuditoria[];
  pagina: number;
  porPagina: number;
}


function fecha(valor: string): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  ).format(new Date(valor));
}

function estiloNivel(
  nivel: NivelAuditoria,
): string {
  if (nivel === "Crítico") {
    return "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300";
  }

  if (nivel === "Advertencia") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300";
  }

  return "bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300";
}

function formatearEtiquetaCampo(
  campo: string,
): string {
  const equivalencias: Record<string, string> = {
    id: "ID",
    usuarioId: "ID de usuario",
    ventaId: "ID de venta",
    productoId: "ID de producto",
    clienteId: "ID de cliente",
    insumoId: "ID de insumo",
    sesionCajaId: "ID de sesión de caja",
    numeroPedido: "Número de pedido",
    fechaHora: "Fecha y hora",
    fechaHoraRegistro: "Fecha de registro",
    fechaHoraCobro: "Fecha de cobro",
    estadoCobro: "Estado de cobro",
    estadoPreparacion: "Estado de preparación",
    metodoPago: "Método de pago",
    montoInicial: "Monto inicial",
    montoContado: "Monto contado",
    stockAnterior: "Existencia anterior",
    stockPosterior: "Existencia posterior",
    stockActual: "Existencia actual",
    stockMinimo: "Existencia mínima",
    nombreCompleto: "Nombre completo",
    activo: "Estado activo",
  };

  if (equivalencias[campo]) {
    return equivalencias[campo];
  }

  const separado = campo
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/([a-záéíóúñ])([A-Z])/g, "$1 $2")
    .trim();

  if (!separado) {
    return campo;
  }

  const normalizado = separado
    .replace(/\bid\b/gi, "ID")
    .toLocaleLowerCase("es");

  return `${normalizado.charAt(0).toLocaleUpperCase("es")}${normalizado.slice(1)}`
    .replaceAll(" id", " ID")
    .replace(/^Id\b/, "ID");
}

function formatearValorSimple(
  valor: unknown,
): string | null {
  if (valor === null || valor === undefined) {
    return "Sin información";
  }

  if (typeof valor === "boolean") {
    return valor ? "Sí" : "No";
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    return String(valor);
  }

  return null;
}

function DetalleEstructurado({
  valor,
}: {
  valor: unknown;
}) {
  const valorSimple =
    formatearValorSimple(valor);

  if (valorSimple !== null) {
    return (
      <span className="wrap-break-word text-xs font-semibold text-slate-700 dark:text-slate-200">
        {valorSimple}
      </span>
    );
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      return (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Sin elementos registrados
        </span>
      );
    }

    return (
      <div className="space-y-2">
        {valor.map((elemento, indice) => (
          <div
            key={indice}
            className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <DetalleEstructurado valor={elemento} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof valor === "object") {
    const entradas = Object.entries(
      valor as Record<string, unknown>,
    );

    if (entradas.length === 0) {
      return (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Sin datos registrados
        </span>
      );
    }

    return (
      <dl className="divide-y divide-slate-200 dark:divide-slate-800">
        {entradas.map(([clave, dato]) => (
          <div
            key={clave}
            className="grid gap-1 py-2.5 sm:grid-cols-[minmax(120px,0.8fr)_minmax(0,1.2fr)] sm:gap-4"
          >
            <dt className="text-[11px] font-black text-slate-500 dark:text-slate-400">
              {formatearEtiquetaCampo(clave)}
            </dt>
            <dd className="min-w-0 sm:text-right">
              <DetalleEstructurado valor={dato} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <span className="text-xs text-slate-500 dark:text-slate-400">
      Información no disponible
    </span>
  );
}

function DatoEvento({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-100">
        {valor}
      </dd>
    </div>
  );
}

function PanelBitacora({
  registros,
  pagina,
  porPagina,
}: PanelBitacoraProps) {
  const [seleccionado, setSeleccionado] =
    useState<RegistroAuditoria | null>(
      null,
    );

  const resumen = useMemo(
    () => ({
      advertencias: registros.filter(
        (registro) =>
          registro.nivel ===
          "Advertencia",
      ).length,
      criticos: registros.filter(
        (registro) =>
          registro.nivel === "Crítico",
      ).length,
      usuarios: new Set(
        registros
          .map(
            (registro) =>
              registro.usuarioId,
          )
          .filter(
            (id) => id !== null,
          ),
      ).size,
    }),
    [registros],
  );

  const registrosPagina = registros.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina,
  );

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-roma-50 text-roma-700 dark:bg-roma-950/40 dark:text-roma-300">
                <ShieldCheck size={18} />
              </span>

              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Bitácora del sistema
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Trazabilidad de las acciones realizadas dentro del sistema.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {registros.length}
                </strong>{" "}
                eventos
              </span>
              <span>
                <strong
                  className={
                    resumen.advertencias > 0
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-slate-900 dark:text-white"
                  }
                >
                  {resumen.advertencias}
                </strong>{" "}
                advertencias
              </span>
              <span>
                <strong
                  className={
                    resumen.criticos > 0
                      ? "text-red-700 dark:text-red-300"
                      : "text-slate-900 dark:text-white"
                  }
                >
                  {resumen.criticos}
                </strong>{" "}
                críticos
              </span>
              <span>
                <strong className="text-slate-900 dark:text-white">
                  {resumen.usuarios}
                </strong>{" "}
                responsables
              </span>
            </div>
          </div>

        </header>

        {registros.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <SearchX
              size={34}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="mt-3 text-sm font-black text-slate-800 dark:text-slate-100">
              No hay eventos para mostrar
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Cambia el periodo, la búsqueda, el módulo o el nivel seleccionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-245">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/55">
                  {[
                    "Fecha",
                    "Responsable",
                    "Módulo",
                    "Acción",
                    "Nivel",
                    "Detalle",
                  ].map((encabezado) => (
                    <th
                      key={encabezado}
                      className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {encabezado}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {registrosPagina.map((registro) => (
                  <tr
                    key={registro.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
                  >
                    <td className="px-5 py-4 align-middle text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {fecha(registro.fechaHora)}
                    </td>

                    <td className="px-5 py-4 align-middle text-sm font-black text-slate-900 dark:text-white">
                      {registro.usuarioNombre}
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {registro.modulo}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle text-xs font-black text-slate-800 dark:text-slate-100">
                      {registro.accion}
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${estiloNivel(
                          registro.nivel,
                        )}`}
                      >
                        {registro.nivel}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          setSeleccionado(
                            registro,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-roma-300 hover:bg-roma-50 hover:text-roma-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roma-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-roma-700 dark:hover:bg-roma-950/35 dark:hover:text-roma-200"
                      >
                        <Eye size={14} />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        abierto={seleccionado !== null}
        titulo={
          seleccionado
            ? `${seleccionado.modulo}: ${seleccionado.accion}`
            : "Detalle de auditoría"
        }
        descripcion="Información necesaria para reconstruir la acción seleccionada."
        ancho="grande"
        alCerrar={() =>
          setSeleccionado(null)
        }
      >
        {seleccionado && (
          <div className="p-5 sm:p-6">
            <dl className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-700 dark:bg-slate-950/45">
              <DatoEvento
                etiqueta="Fecha y hora"
                valor={fecha(
                  seleccionado.fechaHora,
                )}
              />
              <DatoEvento
                etiqueta="Responsable"
                valor={
                  seleccionado.usuarioNombre
                }
              />
              <DatoEvento
                etiqueta="Rol"
                valor={
                  seleccionado.usuarioRol ??
                  "Sistema"
                }
              />
              <DatoEvento
                etiqueta="Nivel"
                valor={seleccionado.nivel}
              />
              <DatoEvento
                etiqueta="Módulo"
                valor={seleccionado.modulo}
              />
              <DatoEvento
                etiqueta="Acción"
                valor={seleccionado.accion}
              />
              <DatoEvento
                etiqueta="Origen"
                valor={seleccionado.origen}
              />
              <DatoEvento
                etiqueta="Registro afectado"
                valor={`${seleccionado.entidad}${
                  seleccionado.entidadId === null
                    ? ""
                    : ` #${seleccionado.entidadId}`
                }`}
              />
            </dl>

            <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileJson
                  size={16}
                  className="text-roma-700 dark:text-roma-300"
                />
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Qué ocurrió
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {seleccionado.descripcion}
              </p>
            </div>

            {seleccionado.datosAnteriores ===
              null &&
            seleccionado.datosPosteriores ===
              null ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/45 dark:text-slate-400">
                Esta acción no modificó datos que necesiten una comparación antes y después.
              </div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Antes de la acción
                  </h3>
                  <div className="mt-3">
                    {seleccionado.datosAnteriores ===
                    null ? (
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        No había información previa registrada. Esto es normal, por ejemplo, cuando se crea un registro nuevo.
                      </p>
                    ) : (
                      <DetalleEstructurado
                        valor={
                          seleccionado.datosAnteriores
                        }
                      />
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Después de la acción
                  </h3>
                  <div className="mt-3">
                    {seleccionado.datosPosteriores ===
                    null ? (
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        No se registró información posterior. Esto puede ocurrir cuando un registro fue eliminado o la acción no generó un nuevo estado.
                      </p>
                    ) : (
                      <DetalleEstructurado
                        valor={
                          seleccionado.datosPosteriores
                        }
                      />
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default PanelBitacora;
