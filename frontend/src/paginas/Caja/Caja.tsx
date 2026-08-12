import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  Eye,
  FileDown,
  History,
  LockKeyhole,
  LockOpen,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAuth,
} from "../../contextos/AuthContext";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  abrirCaja,
  calcularResumenSesionCaja,
  cerrarCaja,
  listarMovimientosCaja,
  listarSesionesCaja,
  obtenerCajaAbiertaPorUsuario,
  obtenerPagoPorVentaId,
  registrarMovimientoManual,
} from "../../servicios/cajaServicio";

import {
  listarUsuarios,
} from "../../servicios/usuarioServicio";

import {
  obtenerVentaPorId,
} from "../../servicios/ventaServicio";

import type {
  AbrirCajaDto,
  CerrarCajaDto,
  MovimientoCaja,
  PagoVenta,
  RegistrarMovimientoManualDto,
  ResumenCaja,
  SesionCaja,
} from "../../tipos/caja";

import type {
  Usuario,
} from "../../tipos/usuario";

import type {
  Venta,
} from "../../tipos/venta";

import Modal from "../../shared/ui/Modal";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import FormularioAperturaCaja from "./FormularioAperturaCaja";
import FormularioMovimiento from "./FormularioMovimiento";
import FormularioCierreCaja from "./FormularioCierreCaja";

type FiltroUsuario = "todos" | string;

interface DatosCajaCargados {
  caja: SesionCaja | null;
  sesiones: SesionCaja[];
  movimientos: MovimientoCaja[];
  resumen: ResumenCaja | null;
  usuarios: Usuario[];
}

interface OpcionUsuario {
  id: number;
  nombre: string;
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
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

function formatearFechaHora(
  fecha: string,
): string {
  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(fecha));
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

function claseDiferencia(
  diferencia: number | null,
): string {
  if (diferencia === null) {
    return "text-slate-500 dark:text-slate-400";
  }

  if (Math.abs(diferencia) < 0.01) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (diferencia > 0) {
    return "text-blue-700 dark:text-blue-300";
  }

  return "text-red-700 dark:text-red-300";
}

interface EsperadoSesionCaja {
  efectivo: number;
  qr: number;
}

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function calcularEsperadoSesion(
  sesion: SesionCaja,
  movimientos: MovimientoCaja[],
): EsperadoSesionCaja {
  const movimientosSesion =
    movimientos.filter(
      (movimiento) =>
        movimiento.sesionCajaId ===
        sesion.id,
    );

  const efectivoCalculado =
    redondearMoneda(
      sesion.montoInicial +
        movimientosSesion.reduce(
          (acumulado, movimiento) => {
            if (
              movimiento.tipo ===
              "Ingreso"
            ) {
              return (
                acumulado +
                movimiento.monto
              );
            }

            if (
              movimiento.tipo ===
              "Egreso"
            ) {
              return (
                acumulado -
                movimiento.monto
              );
            }

            return (
              acumulado +
              movimiento.montoEfectivo
            );
          },
          0,
        ),
    );

  const qr = redondearMoneda(
    movimientosSesion.reduce(
      (acumulado, movimiento) =>
        acumulado +
        movimiento.montoQr,
      0,
    ),
  );

  return {
    efectivo:
      sesion.efectivoEsperado ??
      efectivoCalculado,
    qr,
  };
}

function escaparHtml(
  valor: string,
): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imprimirTicket(
  venta: Venta,
  pago: PagoVenta | null,
) {
  const ventana = window.open(
    "",
    "_blank",
    "width=480,height=760",
  );

  if (!ventana) {
    return;
  }

  const filas = venta.detalles
    .map(
      (detalle) => `
        <tr>
          <td>${detalle.cantidad}× ${escaparHtml(detalle.nombreProducto)}</td>
          <td style="text-align:right">${formatearMoneda(detalle.subtotal)}</td>
        </tr>
        ${
          detalle.observacion
            ? `<tr><td colspan="2" class="obs">${escaparHtml(detalle.observacion)}</td></tr>`
            : ""
        }
      `,
    )
    .join("");

  const observacionesGenerales =
    venta.observaciones
      ? `
        <section class="observaciones-generales">
          <strong>OBSERVACIONES GENERALES PARA COCINA</strong>
          <p>${escaparHtml(venta.observaciones)}</p>
        </section>
      `
      : "";

  const detallePago = pago
    ? `
      <p><strong>Método:</strong> ${escaparHtml(pago.metodoPago)}</p>
      ${pago.montoQr > 0 ? `<p><strong>QR:</strong> ${formatearMoneda(pago.montoQr)}</p>` : ""}
      ${pago.montoEfectivo > 0 ? `<p><strong>Efectivo aplicado:</strong> ${formatearMoneda(pago.montoEfectivo)}</p>` : ""}
      ${pago.montoRecibido > 0 ? `<p><strong>Recibido:</strong> ${formatearMoneda(pago.montoRecibido)}</p>` : ""}
      ${pago.cambio > 0 ? `<p><strong>Cambio:</strong> ${formatearMoneda(pago.cambio)}</p>` : ""}
    `
    : `<p><strong>Pago:</strong> ${escaparHtml(venta.estadoCobro)}</p>`;

  ventana.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escaparHtml(venta.numeroPedido)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111827; }
          .ticket { width: 320px; margin: 0 auto; }
          h1, h2, p { margin: 0; }
          h1 { text-align: center; font-size: 24px; }
          h2 { text-align: center; font-size: 13px; letter-spacing: 3px; margin-top: 4px; }
          .pedido { text-align: center; margin: 18px 0; font-size: 18px; font-weight: 700; }
          .datos { font-size: 12px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
          td { padding: 6px 0; border-bottom: 1px dashed #cbd5e1; vertical-align: top; }
          .obs { color: #64748b; font-size: 11px; padding-top: 0; }
          .observaciones-generales { margin-top: 14px; border: 2px dashed #f59e0b; background: #fffbeb; padding: 10px; font-size: 11px; line-height: 1.5; }
          .observaciones-generales strong { color: #92400e; font-size: 10px; }
          .observaciones-generales p { margin-top: 5px; white-space: pre-wrap; font-weight: 700; }
          .totales { margin-top: 16px; font-size: 12px; line-height: 1.6; }
          .total { display: flex; justify-content: space-between; border-top: 1px solid #111827; margin-top: 8px; padding-top: 8px; font-size: 17px; font-weight: 700; }
          .pie { margin-top: 22px; text-align: center; font-size: 11px; color: #64748b; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <main class="ticket">
          <h1>ROMA</h1>
          <h2>FAST FOOD</h2>
          <p class="pedido">${escaparHtml(venta.numeroPedido)}</p>
          <section class="datos">
            <p><strong>Cliente:</strong> ${escaparHtml(venta.clienteNombre)}</p>
            <p><strong>Atendido por:</strong> ${escaparHtml(venta.usuarioRegistroNombre)}</p>
            <p><strong>Fecha:</strong> ${escaparHtml(formatearFechaHora(venta.fechaHoraRegistro))}</p>
          </section>
          <table><tbody>${filas}</tbody></table>
          ${observacionesGenerales}
          <section class="totales">
            <p><strong>Subtotal:</strong> ${formatearMoneda(venta.subtotal)}</p>
            ${venta.montoDescuento > 0 ? `<p><strong>Descuento:</strong> − ${formatearMoneda(venta.montoDescuento)}</p>` : ""}
            ${detallePago}
            <div class="total"><span>Total</span><span>${formatearMoneda(venta.total)}</span></div>
          </section>
          <p class="pie">Gracias por su compra.<br />Conserve este ticket.</p>
        </main>
        <script>window.addEventListener("load", () => window.print());</script>
      </body>
    </html>
  `);

  ventana.document.close();
}

async function cargarInformacionCaja(
  usuarioId: number,
): Promise<DatosCajaCargados> {
  const [
    caja,
    sesiones,
    movimientos,
    usuarios,
  ] = await Promise.all([
    obtenerCajaAbiertaPorUsuario(
      usuarioId,
    ),
    listarSesionesCaja(),
    listarMovimientosCaja(),
    listarUsuarios(),
  ]);

  const resumen = caja
    ? await calcularResumenSesionCaja(
        caja.id,
      )
    : null;

  return {
    caja,
    sesiones,
    movimientos,
    resumen,
    usuarios,
  };
}

function Caja() {
  const { usuario } = useAuth();

  const puedeAbrirCaja =
    usuario?.permisos.includes(
      "CAJA_ABRIR",
    ) ?? false;

  const puedeRegistrarIngresos =
    usuario?.permisos.includes(
      "CAJA_INGRESOS",
    ) ?? false;

  const puedeRegistrarEgresos =
    usuario?.permisos.includes(
      "CAJA_EGRESOS",
    ) ?? false;

  const puedeCerrarCaja =
    usuario?.permisos.includes(
      "CAJA_CERRAR",
    ) ?? false;

  const puedeVerHistorial =
    usuario?.permisos.includes(
      "CAJA_HISTORIAL",
    ) ?? false;

  const puedeRegistrarMovimiento =
    puedeRegistrarIngresos ||
    puedeRegistrarEgresos;

  const [
    cajaAbierta,
    setCajaAbierta,
  ] =
    useState<SesionCaja | null>(
      null,
    );

  const [sesiones, setSesiones] =
    useState<SesionCaja[]>([]);

  const [
    movimientos,
    setMovimientos,
  ] = useState<MovimientoCaja[]>(
    [],
  );

  const [resumen, setResumen] =
    useState<ResumenCaja | null>(
      null,
    );

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [
    filtroMovimientos,
    setFiltroMovimientos,
  ] = useState<FiltroUsuario>(
    "todos",
  );

  const [
    filtroHistorial,
    setFiltroHistorial,
  ] = useState<FiltroUsuario>(
    "todos",
  );

  const [
    cargandoInicial,
    setCargandoInicial,
  ] = useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState<string | null>(
    null,
  );

  const [
    notificacion,
    setNotificacion,
  ] =
    useState<DatosNotificacion | null>(
      null,
    );

  const [
    modalApertura,
    setModalApertura,
  ] = useState(false);

  const [
    modalMovimiento,
    setModalMovimiento,
  ] = useState(false);

  const [
    modalCierre,
    setModalCierre,
  ] = useState(false);

  const [
    ventaParaTicket,
    setVentaParaTicket,
  ] = useState<Venta | null>(null);

  const [
    pagoParaTicket,
    setPagoParaTicket,
  ] = useState<PagoVenta | null>(null);

  const [
    cargandoTicket,
    setCargandoTicket,
  ] = useState(false);

  const aplicarDatos = useCallback(
    (datos: DatosCajaCargados) => {
      setCajaAbierta(datos.caja);
      setSesiones(datos.sesiones);
      setMovimientos(
        datos.movimientos,
      );
      setResumen(datos.resumen);
      setUsuarios(datos.usuarios);
      setErrorCarga(null);
    },
    [],
  );

  const recargarDatos = useCallback(
    async () => {
      if (!usuario) {
        return;
      }

      try {
        const datos =
          await cargarInformacionCaja(
            usuario.id,
          );

        aplicarDatos(datos);
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      }
    },
    [usuario, aplicarDatos],
  );

  useEffect(() => {
    let componenteActivo = true;

    if (!usuario) {
      return () => {
        componenteActivo = false;
      };
    }

    cargarInformacionCaja(usuario.id)
      .then((datos) => {
        if (componenteActivo) {
          aplicarDatos(datos);
        }
      })
      .catch((error: unknown) => {
        if (componenteActivo) {
          setErrorCarga(
            obtenerMensajeError(error),
          );
        }
      })
      .finally(() => {
        if (componenteActivo) {
          setCargandoInicial(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, [usuario, aplicarDatos]);

  const opcionesUsuarios =
    useMemo<OpcionUsuario[]>(() => {
      const mapa = new Map<
        number,
        string
      >();

      usuarios.forEach(
        (usuarioActual) => {
          mapa.set(
            usuarioActual.id,
            usuarioActual.nombreCompleto,
          );
        },
      );

      sesiones.forEach((sesion) => {
        mapa.set(
          sesion.usuarioAperturaId,
          sesion.usuarioAperturaNombre,
        );
      });

      movimientos.forEach(
        (movimiento) => {
          mapa.set(
            movimiento.usuarioId,
            movimiento.usuarioNombre,
          );
        },
      );

      return Array.from(mapa.entries())
        .map(([id, nombre]) => ({
          id,
          nombre,
        }))
        .sort((a, b) =>
          a.nombre.localeCompare(
            b.nombre,
            "es",
          ),
        );
    }, [usuarios, sesiones, movimientos]);

  const movimientosFiltrados =
    useMemo(() => {
      if (
        filtroMovimientos === "todos"
      ) {
        return movimientos;
      }

      const usuarioId = Number(
        filtroMovimientos,
      );

      return movimientos.filter(
        (movimiento) =>
          movimiento.usuarioId ===
          usuarioId,
      );
    }, [movimientos, filtroMovimientos]);

  const sesionesFiltradas =
    useMemo(() => {
      if (
        filtroHistorial === "todos"
      ) {
        return sesiones;
      }

      const usuarioId = Number(
        filtroHistorial,
      );

      return sesiones.filter(
        (sesion) =>
          sesion.usuarioAperturaId ===
          usuarioId,
      );
    }, [sesiones, filtroHistorial]);

  const esperadoPorSesion =
    useMemo(() => {
      const mapa = new Map<
        number,
        EsperadoSesionCaja
      >();

      sesiones.forEach((sesion) => {
        mapa.set(
          sesion.id,
          calcularEsperadoSesion(
            sesion,
            movimientos,
          ),
        );
      });

      return mapa;
    }, [sesiones, movimientos]);

  const cajasAbiertas =
    useMemo(
      () =>
        sesiones.filter(
          (sesion) =>
            sesion.estado === "Abierta",
        ).length,
      [sesiones],
    );

  async function guardarApertura(
    datos: AbrirCajaDto,
  ) {
    if (
      !usuario ||
      !puedeAbrirCaja
    ) {
      return;
    }

    try {
      setProcesando(true);

      const caja = await abrirCaja(
        datos,
        usuario,
      );

      await auditarAccion(
        {
          modulo: "Caja",
          accion: "Abrir caja",
          entidad: "Sesión de caja",
          entidadId: caja.id,
          descripcion:
            `${usuario.nombreCompleto} abrió la caja N.º ${caja.id} con ${formatearMoneda(caja.montoInicial)}.`,
          datosPosteriores: caja,
        },
        usuario,
      );

      setModalApertura(false);

      setNotificacion({
        tipo: "exito",
        titulo: "Caja abierta",
        mensaje:
          `Tu caja N.º ${caja.id} fue abierta correctamente.`,
      });

      await recargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo abrir la caja",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function guardarMovimiento(
    datos:
      RegistrarMovimientoManualDto,
  ) {
    const puedeRegistrarTipo =
      datos.tipo === "Ingreso"
        ? puedeRegistrarIngresos
        : puedeRegistrarEgresos;

    if (
      !usuario ||
      !puedeRegistrarTipo
    ) {
      return;
    }

    try {
      setProcesando(true);

      const movimiento =
        await registrarMovimientoManual(
          datos,
          usuario,
        );

      await auditarAccion(
        {
          modulo: "Caja",
          accion:
            movimiento.tipo ===
            "Ingreso"
              ? "Registrar ingreso"
              : "Registrar egreso",
          entidad:
            "Movimiento de caja",
          entidadId: movimiento.id,
          descripcion:
            `${usuario.nombreCompleto} registró ${movimiento.tipo.toLocaleLowerCase("es")} por ${formatearMoneda(movimiento.monto)}: ${movimiento.concepto}.`,
          datosPosteriores:
            movimiento,
          nivel:
            movimiento.tipo ===
            "Egreso"
              ? "Advertencia"
              : "Información",
        },
        usuario,
      );

      setModalMovimiento(false);

      setNotificacion({
        tipo: "exito",
        titulo:
          "Movimiento registrado",
        mensaje:
          `${movimiento.tipo}: ${movimiento.concepto}.`,
      });

      await recargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo registrar el movimiento",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function guardarCierre(
    datos: CerrarCajaDto,
  ) {
    if (
      !usuario ||
      !puedeCerrarCaja
    ) {
      return;
    }

    try {
      setProcesando(true);

      const caja = await cerrarCaja(
        datos,
        usuario,
      );

      await auditarAccion(
        {
          modulo: "Caja",
          accion: "Cerrar caja",
          entidad: "Sesión de caja",
          entidadId: caja.id,
          descripcion:
            `${usuario.nombreCompleto} cerró la caja N.º ${caja.id} con una diferencia de ${formatearMoneda(caja.diferencia ?? 0)}.`,
          datosPosteriores: caja,
          nivel:
            Math.abs(
              caja.diferencia ?? 0,
            ) > 0.009
              ? "Advertencia"
              : "Información",
        },
        usuario,
      );

      setModalCierre(false);

      setNotificacion({
        tipo: "exito",
        titulo: "Caja cerrada",
        mensaje:
          caja.diferencia === 0
            ? "Tu caja fue cerrada y cuadró correctamente."
            : `Tu caja fue cerrada con una diferencia de ${formatearMoneda(caja.diferencia ?? 0)}.`,
      });

      await recargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo cerrar la caja",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesando(false);
    }
  }

  async function abrirTicketMovimiento(
    movimiento: MovimientoCaja,
  ) {
    if (!movimiento.ventaId) {
      return;
    }

    try {
      setCargandoTicket(true);

      const [venta, pago] =
        await Promise.all([
          obtenerVentaPorId(
            movimiento.ventaId,
          ),
          obtenerPagoPorVentaId(
            movimiento.ventaId,
          ).catch(() => null),
        ]);

      setVentaParaTicket(venta);
      setPagoParaTicket(pago);
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo abrir el ticket",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setCargandoTicket(false);
    }
  }

  if (cargandoInicial) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-28 rounded-3xl bg-white dark:bg-slate-900" />
        <div className="h-96 rounded-3xl bg-white dark:bg-slate-900" />
        <div className="h-96 rounded-3xl bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/70 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          No se pudo cargar la caja
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {errorCarga}
        </p>

        <button
          type="button"
          onClick={() =>
            void recargarDatos()
          }
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-800"
        >
          <RefreshCw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() =>
          setNotificacion(null)
        }
      />

      <section className="grid gap-3 xl:grid-cols-[minmax(360px,1.25fr)_repeat(3,minmax(0,1fr))]">
        <article
          className={`
            min-h-28 rounded-3xl border p-4 shadow-panel
            ${
              cajaAbierta
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/20"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`
                  flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                  ${
                    cajaAbierta
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }
                `}
              >
                {cajaAbierta ? (
                  <LockOpen size={19} />
                ) : (
                  <LockKeyhole size={19} />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-slate-950 dark:text-white">
                    {cajaAbierta
                      ? `Caja abierta · N.º ${cajaAbierta.id}`
                      : "Caja cerrada"}
                  </h2>

                  <span
                    className={`
                      rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide
                      ${
                        cajaAbierta
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    {cajaAbierta
                      ? "Operativa"
                      : "Sin apertura"}
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
                  {cajaAbierta
                    ? `${cajaAbierta.usuarioAperturaNombre} · ${formatearHora(cajaAbierta.fechaHoraApertura)}`
                    : "Abre tu caja para registrar operaciones."}
                </p>

                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <UsersRound size={13} />
                  {cajasAbiertas} {cajasAbiertas === 1 ? "caja activa" : "cajas activas"}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={procesando}
              onClick={() =>
                void recargarDatos()
              }
              aria-label="Actualizar información de caja"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {(!cajaAbierta && puedeAbrirCaja) ||
          (cajaAbierta &&
            (puedeRegistrarMovimiento ||
              puedeCerrarCaja)) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {!cajaAbierta ? (
                <button
                  type="button"
                  onClick={() =>
                    setModalApertura(true)
                  }
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  <LockOpen size={15} />
                  Abrir caja
                </button>
              ) : (
                <>
                  {puedeRegistrarMovimiento && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalMovimiento(true)
                      }
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      <Plus size={15} />
                      Movimiento
                    </button>
                  )}

                  {puedeCerrarCaja && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalCierre(true)
                      }
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-black text-white shadow-sm transition-colors hover:bg-red-800"
                    >
                      <LockKeyhole size={15} />
                      Cerrar caja
                    </button>
                  )}
                </>
              )}
            </div>
          ) : null}
        </article>

        <TarjetaMetrica
          titulo="Monto inicial"
          valor={formatearMoneda(
            resumen?.montoInicial ?? 0,
          )}
          descripcion={
            cajaAbierta
              ? `Caja N.º ${cajaAbierta.id}`
              : "Sin caja abierta"
          }
          icono={Banknote}
          tono="azul"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Efectivo esperado"
          valor={formatearMoneda(
            resumen?.efectivoEsperado ?? 0,
          )}
          descripcion="Conteo físico esperado."
          icono={CircleDollarSign}
          tono="ambar"
          variante="compacta"
          insignia="Clave"
        />

        <TarjetaMetrica
          titulo="Ventas por QR"
          valor={formatearMoneda(
            resumen?.totalVentasQr ?? 0,
          )}
          descripcion="Monto no físico registrado."
          icono={QrCode}
          tono="verde"
          variante="compacta"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <ReceiptText size={20} />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Movimientos de caja
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Ventas, ingresos y egresos registrados por cada responsable.
              </p>
            </div>
          </div>

          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 sm:min-w-64">
            Filtrar por usuario
            <select
              value={filtroMovimientos}
              onChange={(evento) =>
                setFiltroMovimientos(
                  evento.target.value,
                )
              }
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-red-500 dark:focus:ring-red-950/60"
            >
              <option value="todos">
                Todos los usuarios
              </option>

              {opcionesUsuarios.map(
                (opcion) => (
                  <option
                    key={opcion.id}
                    value={String(
                      opcion.id,
                    )}
                  >
                    {opcion.nombre}
                  </option>
                ),
              )}
            </select>
          </label>
        </header>

        {movimientosFiltrados.length ===
        0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
            <ReceiptText
              size={34}
              className="text-slate-300 dark:text-slate-700"
            />
            <p className="mt-4 font-bold text-slate-700 dark:text-slate-200">
              No hay movimientos
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              No existen resultados para el usuario seleccionado.
            </p>
          </div>
        ) : (
          <div className="max-h-136 overflow-y-auto p-3 sm:p-4">
            <div className="mb-2 hidden grid-cols-[92px_minmax(250px,1fr)_minmax(210px,0.78fr)_minmax(210px,0.72fr)_150px] gap-3 px-4 text-[10px] font-black uppercase tracking-wide text-slate-400 xl:grid">
              <span>Tipo</span>
              <span>Detalle</span>
              <span>Responsable</span>
              <span>Fecha y monto</span>
              <span className="text-center">
                Acción
              </span>
            </div>

            <div className="space-y-2">
              {movimientosFiltrados.map(
                (movimiento) => (
                  <article
                    key={movimiento.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/55 md:grid-cols-2 xl:grid-cols-[92px_minmax(250px,1fr)_minmax(210px,0.78fr)_minmax(210px,0.72fr)_150px] xl:items-center"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                        Tipo
                      </p>
                      <span
                        className={`
                          mt-1 inline-flex items-center gap-2 text-sm font-black xl:mt-0
                          ${
                            movimiento.tipo ===
                            "Egreso"
                              ? "text-red-700 dark:text-red-300"
                              : movimiento.tipo ===
                                  "Ingreso"
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-blue-700 dark:text-blue-300"
                          }
                        `}
                      >
                        {movimiento.tipo ===
                        "Egreso" ? (
                          <ArrowDownCircle
                            size={17}
                          />
                        ) : movimiento.tipo ===
                          "Ingreso" ? (
                          <ArrowUpCircle
                            size={17}
                          />
                        ) : (
                          <ReceiptText
                            size={17}
                          />
                        )}
                        {movimiento.tipo}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                        Detalle
                      </p>
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {movimiento.concepto}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {movimiento.metodoPago ??
                            "Movimiento manual"}
                        </span>

                        {movimiento.numeroPedido && (
                          <span className="font-black text-blue-700 dark:text-blue-300">
                            {movimiento.numeroPedido}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                        Responsable
                      </p>
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {movimiento.usuarioNombre}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Caja N.º {movimiento.sesionCajaId}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                        Fecha y monto
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatearFechaHora(
                          movimiento.fechaHoraRegistro,
                        )}
                      </p>
                      <p
                        className={`
                          mt-1 text-base font-black
                          ${
                            movimiento.tipo ===
                            "Egreso"
                              ? "text-red-700 dark:text-red-300"
                              : "text-slate-950 dark:text-white"
                          }
                        `}
                      >
                        {movimiento.tipo ===
                        "Egreso"
                          ? "− "
                          : ""}
                        {formatearMoneda(
                          movimiento.monto,
                        )}
                      </p>
                    </div>

                    <div className="md:col-span-2 xl:col-span-1">
                      {movimiento.tipo ===
                        "Venta" &&
                      movimiento.ventaId ? (
                        <button
                          type="button"
                          disabled={
                            cargandoTicket
                          }
                          onClick={() =>
                            void abrirTicketMovimiento(
                              movimiento,
                            )
                          }
                          className="inline-flex h-10 min-w-36 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-600 bg-blue-600 px-4 text-xs font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-700 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 dark:border-blue-500 dark:bg-blue-600 dark:hover:border-blue-400 dark:hover:bg-blue-500"
                        >
                          <Eye size={16} />
                          Ver ticket
                        </button>
                      ) : (
                        <span className="hidden text-center text-xs text-slate-400 xl:block">
                          —
                        </span>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        )}
      </section>


      {puedeVerHistorial && (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
              <History size={20} />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Historial de cajas
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Aperturas, cierres y diferencias por responsable.
              </p>
            </div>
          </div>

          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 sm:min-w-64">
            Filtrar por usuario
            <select
              value={filtroHistorial}
              onChange={(evento) =>
                setFiltroHistorial(
                  evento.target.value,
                )
              }
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-red-500 dark:focus:ring-red-950/60"
            >
              <option value="todos">
                Todos los usuarios
              </option>

              {opcionesUsuarios.map(
                (opcion) => (
                  <option
                    key={opcion.id}
                    value={String(
                      opcion.id,
                    )}
                  >
                    {opcion.nombre}
                  </option>
                ),
              )}
            </select>
          </label>
        </header>

        {sesionesFiltradas.length ===
        0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
            <History
              size={34}
              className="text-slate-300 dark:text-slate-700"
            />
            <p className="mt-4 font-bold text-slate-700 dark:text-slate-200">
              No existen sesiones
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              No hay cajas asociadas al usuario seleccionado.
            </p>
          </div>
        ) : (
          <div className="max-h-144 overflow-y-auto p-3 sm:p-4">
            <div className="mb-2 hidden grid-cols-[76px_minmax(170px,0.95fr)_minmax(150px,0.82fr)_minmax(150px,0.82fr)_minmax(175px,1fr)_120px_120px_52px] gap-3 px-4 text-[10px] font-black uppercase tracking-wide text-slate-400 xl:grid">
              <span>N.º caja</span>
              <span>Responsable</span>
              <span>Apertura</span>
              <span>Cierre</span>
              <span>Esperado</span>
              <span>Contado</span>
              <span>Diferencia</span>
              <span className="text-center">
                Estado
              </span>
            </div>

            <div className="space-y-2">
              {sesionesFiltradas.map(
                (sesion) => {
                  const esperado =
                    esperadoPorSesion.get(
                      sesion.id,
                    ) ?? {
                      efectivo:
                        sesion.efectivoEsperado ??
                        0,
                      qr: 0,
                    };

                  const estaAbierta =
                    sesion.estado ===
                    "Abierta";

                  return (
                    <article
                      key={sesion.id}
                      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/55 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[76px_minmax(170px,0.95fr)_minmax(150px,0.82fr)_minmax(150px,0.82fr)_minmax(175px,1fr)_120px_120px_52px] xl:items-center"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          N.º caja
                        </p>
                        <p className="mt-1 font-black text-slate-950 dark:text-white xl:mt-0">
                          N.º {sesion.id}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          Responsable
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100 xl:mt-0">
                          {sesion.usuarioAperturaNombre}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          Apertura
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200 xl:mt-0">
                          {formatearFechaHora(
                            sesion.fechaHoraApertura,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          Cierre
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 xl:mt-0">
                          {sesion.fechaHoraCierre
                            ? formatearFechaHora(
                                sesion.fechaHoraCierre,
                              )
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          Esperado
                        </p>
                        <div className="mt-1 space-y-1 text-xs xl:mt-0">
                          <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-2 py-1 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200">
                            <span className="font-bold">
                              Efectivo
                            </span>
                            <strong>
                              {formatearMoneda(
                                esperado.efectivo,
                              )}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200">
                            <span className="font-bold">
                              QR
                            </span>
                            <strong>
                              {formatearMoneda(
                                esperado.qr,
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          Contado
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100 xl:mt-0">
                          {sesion.montoContado ===
                          null
                            ? "—"
                            : formatearMoneda(
                                sesion.montoContado,
                              )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 xl:hidden">
                          Diferencia
                        </p>
                        <p
                          className={`mt-1 text-sm font-black xl:mt-0 ${claseDiferencia(sesion.diferencia)}`}
                        >
                          {sesion.diferencia ===
                          null
                            ? "—"
                            : formatearMoneda(
                                sesion.diferencia,
                              )}
                        </p>
                      </div>

                      <div className="flex items-center xl:justify-center">
                        <div
                          title={
                            estaAbierta
                              ? "Caja abierta"
                              : "Caja cerrada"
                          }
                          aria-label={
                            estaAbierta
                              ? "Caja abierta"
                              : "Caja cerrada"
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                            estaAbierta
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/65 dark:text-emerald-300"
                              : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {estaAbierta ? (
                            <LockOpen
                              size={18}
                            />
                          ) : (
                            <LockKeyhole
                              size={18}
                            />
                          )}
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </div>
        )}
      </section>
      )}



      <Modal
        abierto={modalApertura}
        titulo="Abrir mi caja"
        descripcion="Registra tu fondo inicial para comenzar a operar."
        ancho="mediano"
        alCerrar={() => {
          if (!procesando) {
            setModalApertura(false);
          }
        }}
      >
        <FormularioAperturaCaja
          cargando={procesando}
          alGuardar={guardarApertura}
          alCancelar={() =>
            setModalApertura(false)
          }
        />
      </Modal>

      <Modal
        abierto={modalMovimiento}
        titulo="Registrar movimiento"
        descripcion={
          puedeRegistrarIngresos &&
          puedeRegistrarEgresos
            ? "Añade un ingreso o egreso manual a tu caja."
            : puedeRegistrarIngresos
              ? "Añade un ingreso manual a tu caja."
              : "Registra un egreso manual de tu caja."
        }
        ancho="mediano"
        alCerrar={() => {
          if (!procesando) {
            setModalMovimiento(false);
          }
        }}
      >
        <FormularioMovimiento
          cargando={procesando}
          puedeRegistrarIngreso={
            puedeRegistrarIngresos
          }
          puedeRegistrarEgreso={
            puedeRegistrarEgresos
          }
          alGuardar={guardarMovimiento}
          alCancelar={() =>
            setModalMovimiento(false)
          }
        />
      </Modal>

      <Modal
        abierto={Boolean(
          modalCierre && resumen,
        )}
        titulo="Cerrar mi caja"
        descripcion="Compara el efectivo contado con el monto calculado."
        ancho="mediano"
        alCerrar={() => {
          if (!procesando) {
            setModalCierre(false);
          }
        }}
      >
        {resumen && (
          <FormularioCierreCaja
            resumen={resumen}
            cargando={procesando}
            alGuardar={guardarCierre}
            alCancelar={() =>
              setModalCierre(false)
            }
          />
        )}
      </Modal>
      <Modal
        abierto={ventaParaTicket !== null}
        titulo={
          ventaParaTicket
            ? `Ticket ${ventaParaTicket.numeroPedido}`
            : "Visualizar ticket"
        }
        descripcion="Comprobante asociado al movimiento de venta."
        ancho="grande"
        alCerrar={() => {
          setVentaParaTicket(null);
          setPagoParaTicket(null);
        }}
      >
        {ventaParaTicket && (
          <div className="grid gap-6 p-5 lg:grid-cols-[minmax(320px,420px)_minmax(220px,1fr)] lg:p-6">
            <section className="mx-auto w-full max-w-sm rounded-2xl border border-slate-300 bg-[#ffffff] p-6 text-[#0f172a] shadow-panel">
              <div className="text-center">
                <p className="text-3xl font-black tracking-[-0.06em]">
                  ROMA
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.35em] text-red-700">
                  FAST FOOD
                </p>
                <p className="mt-5 text-lg font-black">
                  {ventaParaTicket.numeroPedido}
                </p>
              </div>

              <div className="mt-5 space-y-1 border-y border-dashed border-slate-300 py-4 text-xs">
                <p>
                  <strong>Cliente:</strong>{" "}
                  {ventaParaTicket.clienteNombre}
                </p>
                <p>
                  <strong>Atendido por:</strong>{" "}
                  {ventaParaTicket.usuarioRegistroNombre}
                </p>
                {pagoParaTicket && (
                  <p>
                    <strong>Cobrado por:</strong>{" "}
                    {pagoParaTicket.usuarioNombre}
                  </p>
                )}
                <p>
                  <strong>Fecha:</strong>{" "}
                  {formatearFechaHora(
                    ventaParaTicket.fechaHoraRegistro,
                  )}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {ventaParaTicket.detalles.map(
                  (detalle) => (
                    <div
                      key={detalle.productoId}
                      className="border-b border-dashed border-slate-200 pb-3"
                    >
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <p className="font-bold">
                          {detalle.cantidad}×{" "}
                          {detalle.nombreProducto}
                        </p>
                        <p className="shrink-0 font-black">
                          {formatearMoneda(
                            detalle.subtotal,
                          )}
                        </p>
                      </div>

                      {detalle.observacion && (
                        <p className="mt-1 text-[11px] italic text-slate-500">
                          {detalle.observacion}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>

              {ventaParaTicket.observaciones && (
                <div className="mt-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-amber-800">
                    Observaciones generales para cocina
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs font-bold leading-relaxed text-slate-800">
                    {ventaParaTicket.observaciones}
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <span>Subtotal</span>
                  <strong>
                    {formatearMoneda(
                      ventaParaTicket.subtotal,
                    )}
                  </strong>
                </div>

                {ventaParaTicket.montoDescuento > 0 && (
                  <div className="flex justify-between gap-3">
                    <span>Descuento</span>
                    <strong>
                      −{" "}
                      {formatearMoneda(
                        ventaParaTicket.montoDescuento,
                      )}
                    </strong>
                  </div>
                )}

                <div className="mt-3 flex justify-between gap-3 border-t border-slate-300 pt-3 text-lg font-black">
                  <span>Total</span>
                  <span>
                    {formatearMoneda(
                      ventaParaTicket.total,
                    )}
                  </span>
                </div>

                <div className="mt-3 space-y-1 border-t border-dashed border-slate-300 pt-3 text-slate-600">
                  <p>
                    <strong>Pago:</strong>{" "}
                    {pagoParaTicket?.metodoPago ??
                      ventaParaTicket.estadoCobro}
                  </p>

                  {pagoParaTicket && (
                    <>
                      {pagoParaTicket.montoQr > 0 && (
                        <p>
                          <strong>QR:</strong>{" "}
                          {formatearMoneda(
                            pagoParaTicket.montoQr,
                          )}
                        </p>
                      )}
                      {pagoParaTicket.montoEfectivo > 0 && (
                        <p>
                          <strong>Efectivo:</strong>{" "}
                          {formatearMoneda(
                            pagoParaTicket.montoEfectivo,
                          )}
                        </p>
                      )}
                      {pagoParaTicket.cambio > 0 && (
                        <p>
                          <strong>Cambio:</strong>{" "}
                          {formatearMoneda(
                            pagoParaTicket.cambio,
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            <aside className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/45">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  <ReceiptText size={23} />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                  Copia del comprobante
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Puedes imprimir nuevamente el ticket o guardarlo como PDF desde el cuadro de impresión del navegador.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    imprimirTicket(
                      ventaParaTicket,
                      pagoParaTicket,
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-blue-700"
                >
                  <Printer size={18} />
                  Imprimir ticket
                </button>

                <button
                  type="button"
                  title="En el cuadro de impresión selecciona Guardar como PDF"
                  onClick={() =>
                    imprimirTicket(
                      ventaParaTicket,
                      pagoParaTicket,
                    )
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <FileDown size={18} />
                  Guardar como PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVentaParaTicket(null);
                    setPagoParaTicket(null);
                  }}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Cerrar
                </button>
              </div>
            </aside>
          </div>
        )}
      </Modal>

    </div>
  );
}

export default Caja;