import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  History,
  LockKeyhole,
  LockOpen,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  useCallback,
  useEffect,
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
  obtenerCajaAbierta,
  registrarMovimientoManual,
} from "../../servicios/cajaServicio";

import type {
  AbrirCajaDto,
  CerrarCajaDto,
  MovimientoCaja,
  RegistrarMovimientoManualDto,
  ResumenCaja,
  SesionCaja,
} from "../../tipos/caja";

import Modal from "../../shared/ui/Modal";

import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import FormularioAperturaCaja from "./FormularioAperturaCaja";
import FormularioMovimiento from "./FormularioMovimiento";
import FormularioCierreCaja from "./FormularioCierreCaja";

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

function Caja() {
  const { usuario } = useAuth();

  const puedeGestionar =
    usuario?.permisos.includes(
      "CAJA_GESTIONAR",
    ) ?? false;

  const [
    cajaAbierta,
    setCajaAbierta,
  ] =
    useState<SesionCaja | null>(
      null,
    );

  const [
    sesiones,
    setSesiones,
  ] = useState<SesionCaja[]>([]);

  const [
    movimientos,
    setMovimientos,
  ] = useState<
    MovimientoCaja[]
  >([]);

  const [
    resumen,
    setResumen,
  ] =
    useState<ResumenCaja | null>(
      null,
    );

  const [
    cargandoInicial,
    setCargandoInicial,
  ] = useState(true);

  const [
    procesando,
    setProcesando,
  ] = useState(false);

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

  const recargarDatos =
    useCallback(async () => {
      try {
        const [
          caja,
          sesionesRespuesta,
        ] = await Promise.all([
          obtenerCajaAbierta(),
          listarSesionesCaja(),
        ]);

        const movimientosRespuesta =
          caja
            ? await listarMovimientosCaja(
                caja.id,
              )
            : [];

        const resumenRespuesta =
          caja
            ? await calcularResumenSesionCaja(
                caja.id,
              )
            : null;

        setCajaAbierta(caja);

        setSesiones(
          sesionesRespuesta,
        );

        setMovimientos(
          movimientosRespuesta,
        );

        setResumen(
          resumenRespuesta,
        );

        setErrorCarga(null);
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      }
    }, []);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarDatosIniciales() {
      try {
        const [
          caja,
          sesionesRespuesta,
        ] = await Promise.all([
          obtenerCajaAbierta(),
          listarSesionesCaja(),
        ]);

        const movimientosRespuesta =
          caja
            ? await listarMovimientosCaja(
                caja.id,
              )
            : [];

        const resumenRespuesta =
          caja
            ? await calcularResumenSesionCaja(
                caja.id,
              )
            : null;

        if (!componenteActivo) {
          return;
        }

        setCajaAbierta(caja);

        setSesiones(
          sesionesRespuesta,
        );

        setMovimientos(
          movimientosRespuesta,
        );

        setResumen(
          resumenRespuesta,
        );

        setErrorCarga(null);
      } catch (error: unknown) {
        if (!componenteActivo) {
          return;
        }

        setErrorCarga(
          obtenerMensajeError(error),
        );
      } finally {
        if (componenteActivo) {
          setCargandoInicial(false);
        }
      }
    }

    void cargarDatosIniciales();

    return () => {
      componenteActivo = false;
    };
  }, []);

  async function guardarApertura(
    datos: AbrirCajaDto,
  ) {
    if (
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesando(true);

      const caja =
        await abrirCaja(
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
          `La caja N.º ${caja.id} fue abierta correctamente.`,
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
    if (
      !usuario ||
      !puedeGestionar
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
            movimiento.tipo === "Ingreso"
              ? "Registrar ingreso"
              : "Registrar egreso",
          entidad: "Movimiento de caja",
          entidadId:
            movimiento.id,
          descripcion:
            `${usuario.nombreCompleto} registró ${movimiento.tipo.toLocaleLowerCase("es")} por ${formatearMoneda(movimiento.monto)}: ${movimiento.concepto}.`,
          datosPosteriores:
            movimiento,
          nivel:
            movimiento.tipo === "Egreso"
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
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesando(true);

      const caja =
        await cerrarCaja(
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
            Math.abs(caja.diferencia ?? 0) > 0.009
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
            ? "La caja fue cerrada y cuadró correctamente."
            : `La caja fue cerrada con una diferencia de ${formatearMoneda(caja.diferencia ?? 0)}.`,
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

  if (cargandoInicial) {
    return (
      <div
        className="
          space-y-6 animate-pulse
        "
      >
        <div
          className="
            h-44 rounded-3xl
            bg-slate-300
          "
        />

        <div
          className="
            grid gap-5
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {Array.from({
            length: 4,
          }).map((_, indice) => (
            <div
              key={indice}
              className="
                h-36 rounded-2xl
                bg-white
              "
            />
          ))}
        </div>

        <div
          className="
            h-96 rounded-3xl
            bg-white
          "
        />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <section
        className="
          rounded-3xl border
          border-red-200
          bg-white p-8
          text-center shadow-panel
        "
      >
        <h2
          className="
            text-xl font-black
            text-slate-900
          "
        >
          No se pudo cargar la caja
        </h2>

        <p
          className="
            mt-2 text-sm
            text-slate-500
          "
        >
          {errorCarga}
        </p>

        <button
          type="button"
          onClick={() =>
            void recargarDatos()
          }
          className="
            mt-5 inline-flex
            items-center gap-2
            rounded-xl
            bg-red-700
            px-5 py-3
            text-sm font-bold
            text-white
          "
        >
          <RefreshCw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={() =>
          setNotificacion(null)
        }
      />

      <section
        className="
          relative overflow-hidden
          rounded-3xl
          bg-linear-to-br
          from-slate-950
          via-slate-900
          to-red-950
          p-6 text-white
          shadow-panel
          sm:p-8
        "
      >
        <div
          className="
            relative flex flex-col
            gap-6 lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center gap-2
                rounded-full
                border border-white/15
                bg-white/10
                px-3 py-1.5
                text-xs font-bold
                text-red-100
              "
            >
              <Wallet size={15} />
              Control financiero
            </div>

            <h1
              className="
                mt-4 text-3xl
                font-black
                sm:text-4xl
              "
            >
              Caja
            </h1>

            <p
              className="
                mt-3 max-w-3xl
                text-sm leading-relaxed
                text-slate-300
                sm:text-base
              "
            >
              Controla la apertura,
              movimientos, cobros y
              cierre de la jornada.
            </p>
          </div>

          <button
            type="button"
            disabled={procesando}
            onClick={() =>
              void recargarDatos()
            }
            className="
              inline-flex items-center
              justify-center gap-2
              rounded-xl
              border border-white/15
              bg-white/10
              px-5 py-3
              text-sm font-bold
              text-white
              hover:bg-white/15
              disabled:opacity-50
            "
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </section>

      <section
        className="
          grid gap-5
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <TarjetaMetrica
          titulo="Estado"
          valor={
            cajaAbierta
              ? "Abierta"
              : "Cerrada"
          }
          descripcion={
            cajaAbierta
              ? `Caja N.º ${cajaAbierta.id}`
              : "Sin sesión activa"
          }
          icono={
            cajaAbierta
              ? LockOpen
              : LockKeyhole
          }
          tono={
            cajaAbierta
              ? "verde"
              : "roma"
          }
        />

        <TarjetaMetrica
          titulo="Monto inicial"
          valor={formatearMoneda(
            resumen?.montoInicial ??
              0,
          )}
          descripcion="Efectivo de apertura"
          icono={Banknote}
          tono="azul"
        />

        <TarjetaMetrica
          titulo="Efectivo esperado"
          valor={formatearMoneda(
            resumen?.efectivoEsperado ??
              0,
          )}
          descripcion="Efectivo calculado"
          icono={CircleDollarSign}
          tono="ambar"
        />

        <TarjetaMetrica
          titulo="Ventas por QR"
          valor={formatearMoneda(
            resumen?.totalVentasQr ??
              0,
          )}
          descripcion="Monto no físico"
          icono={QrCode}
          tono="verde"
        />
      </section>

      {puedeGestionar && (
        <section
          className="
            flex flex-wrap gap-3
          "
        >
          {!cajaAbierta ? (
            <button
              type="button"
              onClick={() =>
                setModalApertura(
                  true,
                )
              }
              className="
                inline-flex items-center
                gap-2 rounded-xl
                bg-emerald-600
                px-5 py-3
                text-sm font-bold
                text-white
                hover:bg-emerald-700
              "
            >
              <LockOpen size={18} />
              Abrir caja
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  setModalMovimiento(
                    true,
                  )
                }
                className="
                  inline-flex items-center
                  gap-2 rounded-xl
                  bg-blue-600
                  px-5 py-3
                  text-sm font-bold
                  text-white
                  hover:bg-blue-700
                "
              >
                <Plus size={18} />
                Nuevo movimiento
              </button>

              <button
                type="button"
                onClick={() =>
                  setModalCierre(true)
                }
                className="
                  inline-flex items-center
                  gap-2 rounded-xl
                  bg-red-700
                  px-5 py-3
                  text-sm font-bold
                  text-white
                  hover:bg-red-800
                "
              >
                <LockKeyhole
                  size={18}
                />

                Cerrar caja
              </button>
            </>
          )}
        </section>
      )}

      <section
        className="
          overflow-hidden
          rounded-3xl border
          border-slate-200
          bg-white shadow-panel
        "
      >
        <div
          className="
            flex items-center
            justify-between gap-4
            border-b
            border-slate-100
            p-5 sm:p-6
          "
        >
          <div>
            <h2
              className="
                text-xl font-black
                text-slate-900
              "
            >
              Movimientos de la caja
              actual
            </h2>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Ventas, ingresos y
              egresos registrados.
            </p>
          </div>

          <ReceiptText
            size={24}
            className="text-red-700"
          />
        </div>

        {movimientos.length === 0 ? (
          <div
            className="
              flex min-h-64
              flex-col items-center
              justify-center
              p-8 text-center
            "
          >
            <ReceiptText
              size={35}
              className="text-slate-300"
            />

            <p
              className="
                mt-4 font-bold
                text-slate-700
              "
            >
              No hay movimientos
            </p>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Los cobros y movimientos
              manuales aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
                w-full min-w-237.5
              "
            >
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "Tipo",
                    "Concepto",
                    "Método",
                    "Usuario",
                    "Fecha",
                    "Monto",
                  ].map(
                    (encabezado) => (
                      <th
                        key={encabezado}
                        className="
                          px-5 py-4
                          text-left
                          text-xs font-bold
                          uppercase
                          tracking-wider
                          text-slate-500
                        "
                      >
                        {encabezado}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {movimientos.map(
                  (movimiento) => (
                    <tr
                      key={
                        movimiento.id
                      }
                      className="
                        hover:bg-slate-50
                      "
                    >
                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-2
                            text-sm
                            font-bold
                            ${
                              movimiento.tipo ===
                              "Egreso"
                                ? "text-red-700"
                                : movimiento.tipo ===
                                    "Ingreso"
                                  ? "text-emerald-700"
                                  : "text-blue-700"
                            }
                          `}
                        >
                          {movimiento.tipo ===
                          "Egreso" ? (
                            <ArrowDownCircle
                              size={18}
                            />
                          ) : movimiento.tipo ===
                            "Ingreso" ? (
                            <ArrowUpCircle
                              size={18}
                            />
                          ) : (
                            <ReceiptText
                              size={18}
                            />
                          )}

                          {movimiento.tipo}
                        </span>
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm font-semibold
                          text-slate-700
                        "
                      >
                        {
                          movimiento.concepto
                        }
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm
                          text-slate-600
                        "
                      >
                        {movimiento.metodoPago ??
                          "—"}
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm
                          text-slate-600
                        "
                      >
                        {
                          movimiento.usuarioNombre
                        }
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm
                          text-slate-600
                        "
                      >
                        {formatearFechaHora(
                          movimiento.fechaHoraRegistro,
                        )}
                      </td>

                      <td
                        className={`
                          px-5 py-4
                          font-black
                          ${
                            movimiento.tipo ===
                            "Egreso"
                              ? "text-red-700"
                              : "text-slate-900"
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
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className="
          overflow-hidden
          rounded-3xl border
          border-slate-200
          bg-white shadow-panel
        "
      >
        <div
          className="
            flex items-center gap-3
            border-b border-slate-100
            p-5 sm:p-6
          "
        >
          <History
            size={23}
            className="text-red-700"
          />

          <div>
            <h2
              className="
                text-xl font-black
                text-slate-900
              "
            >
              Historial de cajas
            </h2>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Sesiones abiertas y
              cerradas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="
              w-full min-w-250
            "
          >
            <thead>
              <tr className="bg-slate-50">
                {[
                  "Caja",
                  "Estado",
                  "Apertura",
                  "Responsable",
                  "Cierre",
                  "Esperado",
                  "Contado",
                  "Diferencia",
                ].map(
                  (encabezado) => (
                    <th
                      key={encabezado}
                      className="
                        px-5 py-4
                        text-left
                        text-xs font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      {encabezado}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody
              className="
                divide-y
                divide-slate-100
              "
            >
              {sesiones
                .slice(0, 10)
                .map((sesion) => (
                  <tr
                    key={sesion.id}
                    className="
                      hover:bg-slate-50
                    "
                  >
                    <td
                      className="
                        px-5 py-4
                        font-black
                        text-slate-900
                      "
                    >
                      N.º {sesion.id}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`
                          rounded-full
                          px-3 py-1
                          text-xs font-bold
                          ${
                            sesion.estado ===
                            "Abierta"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        `}
                      >
                        {sesion.estado}
                      </span>
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm
                        text-slate-600
                      "
                    >
                      {formatearFechaHora(
                        sesion.fechaHoraApertura,
                      )}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm font-semibold
                        text-slate-700
                      "
                    >
                      {
                        sesion.usuarioAperturaNombre
                      }
                    </td>

                    <td
                      className="
                        px-5 py-4
                        text-sm
                        text-slate-600
                      "
                    >
                      {sesion.fechaHoraCierre
                        ? formatearFechaHora(
                            sesion.fechaHoraCierre,
                          )
                        : "—"}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        font-bold
                        text-slate-700
                      "
                    >
                      {sesion.efectivoEsperado ===
                      null
                        ? "—"
                        : formatearMoneda(
                            sesion.efectivoEsperado,
                          )}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        font-bold
                        text-slate-700
                      "
                    >
                      {sesion.montoContado ===
                      null
                        ? "—"
                        : formatearMoneda(
                            sesion.montoContado,
                          )}
                    </td>

                    <td
                      className="
                        px-5 py-4
                        font-black
                        text-slate-900
                      "
                    >
                      {sesion.diferencia ===
                      null
                        ? "—"
                        : formatearMoneda(
                            sesion.diferencia,
                          )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        abierto={modalApertura}
        titulo="Abrir caja"
        descripcion="Registra el fondo inicial para comenzar la jornada."
        ancho="mediano"
        alCerrar={() => {
          if (!procesando) {
            setModalApertura(
              false,
            );
          }
        }}
      >
        <FormularioAperturaCaja
          cargando={procesando}
          alGuardar={
            guardarApertura
          }
          alCancelar={() =>
            setModalApertura(false)
          }
        />
      </Modal>

      <Modal
        abierto={modalMovimiento}
        titulo="Registrar movimiento"
        descripcion="Añade un ingreso o egreso manual de efectivo."
        ancho="mediano"
        alCerrar={() => {
          if (!procesando) {
            setModalMovimiento(
              false,
            );
          }
        }}
      >
        <FormularioMovimiento
          cargando={procesando}
          alGuardar={
            guardarMovimiento
          }
          alCancelar={() =>
            setModalMovimiento(
              false,
            )
          }
        />
      </Modal>

      <Modal
        abierto={Boolean(
          modalCierre &&
            resumen,
        )}
        titulo="Cerrar caja"
        descripcion="Cuenta el efectivo disponible y compara el resultado con el monto esperado."
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
            alGuardar={
              guardarCierre
            }
            alCancelar={() =>
              setModalCierre(false)
            }
          />
        )}
      </Modal>
    </div>
  );
}

export default Caja;