import {
  Ban,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  History,
  LoaderCircle,
  Plus,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../contextos/AuthContext";

import {
  listarCategorias,
} from "../../servicios/categoriaServicio";

import {
  listarProductos,
} from "../../servicios/productoServicio";

import {
  listarClientes,
} from "../../servicios/clienteServicio";

import {
  anularVenta,
  cambiarEstadoPreparacion,
  crearVenta,
  listarVentas,
} from "../../servicios/ventaServicio";

import type {
  CategoriaProducto,
  ProductoMenu,
} from "../../tipos/producto";

import type {
  Cliente,
} from "../../tipos/cliente";

import type {
  CrearVentaDto,
  EstadoPreparacion,
  Venta,
} from "../../tipos/venta";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import FormularioVenta from "./FormularioVenta";
import HistorialVentas from "./HistorialVentas";
import PanelPreparacion from "./PanelPreparacion";

type PestanaVentas =
  | "nueva"
  | "preparacion"
  | "historial";

interface AccionEstado {
  venta: Venta;
  nuevoEstado: EstadoPreparacion;
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

function Ventas() {
  const { usuario } = useAuth();

  const puedeGestionar =
    usuario?.permisos.includes(
      "VENTAS_CREAR",
    ) ?? false;

  const [
    pestanaActiva,
    setPestanaActiva,
  ] = useState<PestanaVentas>(
    puedeGestionar
      ? "nueva"
      : "preparacion",
  );

  const [productos, setProductos] =
    useState<ProductoMenu[]>([]);

  const [
    categorias,
    setCategorias,
  ] =
    useState<CategoriaProducto[]>(
      [],
    );

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [ventas, setVentas] =
    useState<Venta[]>([]);

  const [
    cargandoInicial,
    setCargandoInicial,
  ] = useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [
    procesandoOperacion,
    setProcesandoOperacion,
  ] = useState(false);

  const [
    claveFormulario,
    setClaveFormulario,
  ] = useState(0);

  const [
    notificacion,
    setNotificacion,
  ] =
    useState<DatosNotificacion | null>(
      null,
    );

  const [
    accionEstado,
    setAccionEstado,
  ] = useState<AccionEstado | null>(
    null,
  );

  const [
    ventaParaAnular,
    setVentaParaAnular,
  ] = useState<Venta | null>(null);

  const [
    motivoAnulacion,
    setMotivoAnulacion,
  ] = useState("");

  const cerrarNotificacion =
    useCallback(() => {
      setNotificacion(null);
    }, []);

  const cargarDatos =
    useCallback(async () => {
      try {
        setCargandoInicial(true);
        setErrorCarga(null);

        const [
          productosRespuesta,
          categoriasRespuesta,
          clientesRespuesta,
          ventasRespuesta,
        ] = await Promise.all([
          listarProductos(),
          listarCategorias(),
          listarClientes(),
          listarVentas(),
        ]);

        setProductos(
          productosRespuesta,
        );

        setCategorias(
          categoriasRespuesta,
        );

        setClientes(
          clientesRespuesta,
        );

        setVentas(
          ventasRespuesta,
        );
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      } finally {
        setCargandoInicial(false);
      }
    }, []);

  const recargarVentas =
    useCallback(async () => {
      const respuesta =
        await listarVentas();

      setVentas(respuesta);
    }, []);

  useEffect(() => {
    let componenteActivo = true;

    Promise.all([
      listarProductos(),
      listarCategorias(),
      listarClientes(),
      listarVentas(),
    ])
      .then(
        ([
          productosRespuesta,
          categoriasRespuesta,
          clientesRespuesta,
          ventasRespuesta,
        ]) => {
          if (!componenteActivo) {
            return;
          }

          setProductos(
            productosRespuesta,
          );

          setCategorias(
            categoriasRespuesta,
          );

          setClientes(
            clientesRespuesta,
          );

          setVentas(
            ventasRespuesta,
          );

          setErrorCarga(null);
        },
      )
      .catch((error: unknown) => {
        if (!componenteActivo) {
          return;
        }

        setErrorCarga(
          obtenerMensajeError(error),
        );
      })
      .finally(() => {
        if (componenteActivo) {
          setCargandoInicial(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, []);

  const pedidosEnPreparacion =
    ventas.filter(
      (venta) =>
        venta.estadoPreparacion ===
        "En preparación",
    ).length;

  const pedidosListos =
    ventas.filter(
      (venta) =>
        venta.estadoPreparacion ===
        "Listo",
    ).length;

  const ventasPendientes =
    ventas.filter(
      (venta) =>
        venta.estadoCobro ===
        "Pendiente de cobro",
    );

  const totalPendiente =
    ventasPendientes.reduce(
      (acumulado, venta) =>
        acumulado + venta.total,
      0,
    );

  async function guardarVenta(
    datos: CrearVentaDto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      const venta =
        await crearVenta(datos);

      setNotificacion({
        tipo: "exito",

        titulo:
          "Pedido registrado",

        mensaje:
          `${venta.numeroPedido} fue enviado a preparación.`,
      });

      setClaveFormulario(
        (clave) => clave + 1,
      );

      await recargarVentas();

      setPestanaActiva(
        "preparacion",
      );
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",

        titulo:
          "No se pudo registrar el pedido",

        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesandoOperacion(false);
    }
  }

  function solicitarCambioEstado(
    venta: Venta,
    nuevoEstado:
      EstadoPreparacion,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setAccionEstado({
      venta,
      nuevoEstado,
    });
  }

  async function confirmarCambioEstado() {
    if (
      !accionEstado ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      const venta =
        await cambiarEstadoPreparacion(
          accionEstado.venta.id,
          accionEstado.nuevoEstado,
        );

      setNotificacion({
        tipo: "exito",

        titulo:
          "Estado actualizado",

        mensaje:
          `${venta.numeroPedido} ahora está “${venta.estadoPreparacion}”.`,
      });

      setAccionEstado(null);

      await recargarVentas();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",

        titulo:
          "No se pudo actualizar el pedido",

        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesandoOperacion(false);
    }
  }

  function abrirAnulacion(
    venta: Venta,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setVentaParaAnular(venta);
    setMotivoAnulacion("");
  }

  function cerrarAnulacion() {
    if (procesandoOperacion) {
      return;
    }

    setVentaParaAnular(null);
    setMotivoAnulacion("");
  }

  async function confirmarAnulacion() {
    if (
      !ventaParaAnular ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      const venta =
        await anularVenta(
          ventaParaAnular.id,
          motivoAnulacion,
        );

      setNotificacion({
        tipo: "exito",

        titulo:
          "Pedido anulado",

        mensaje:
          `${venta.numeroPedido} fue anulado correctamente.`,
      });

      setVentaParaAnular(null);
      setMotivoAnulacion("");

      await recargarVentas();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",

        titulo:
          "No se pudo anular el pedido",

        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesandoOperacion(false);
    }
  }

  function abrirPantallaPedidos() {
    window.open(
      "/pantalla-pedidos",
      "_blank",
      "noopener,noreferrer",
    );
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
            h-130
            rounded-3xl bg-white
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
          No se pudo cargar el módulo
          de ventas
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
            void cargarDatos()
          }
          className="
            mt-5 inline-flex
            items-center gap-2
            rounded-xl
            bg-red-700
            px-5 py-3
            text-sm font-bold
            text-white
            hover:bg-red-800
          "
        >
          <RotateCcw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

  const tituloConfirmacion =
    accionEstado?.nuevoEstado ===
    "Listo"
      ? "Marcar pedido como listo"
      : "Marcar pedido como entregado";

  const descripcionConfirmacion =
    accionEstado?.nuevoEstado ===
    "Listo"
      ? `¿Confirmas que ${accionEstado.venta.numeroPedido} ya está listo para recoger?`
      : `¿Confirmas que ${accionEstado?.venta.numeroPedido ?? "el pedido"} ya fue entregado al cliente?`;

  return (
    <div className="space-y-6">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={cerrarNotificacion}
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
            absolute -right-20
            -top-20 h-56 w-56
            rounded-full
            bg-red-600/20
            blur-3xl
          "
        />

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
              <ShoppingCart size={15} />
              Operación comercial
            </div>

            <h1
              className="
                mt-4 text-3xl
                font-black tracking-tight
                sm:text-4xl
              "
            >
              Ventas y preparación
            </h1>

            <p
              className="
                mt-3 max-w-3xl
                text-sm leading-relaxed
                text-slate-300
                sm:text-base
              "
            >
              Registra la venta, genera
              el número de pedido y
              controla su preparación
              desde una sola operación.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirPantallaPedidos
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
              backdrop-blur
              hover:bg-white/15
            "
          >
            <ExternalLink size={18} />
            Abrir pantalla de pedidos
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
          titulo="En preparación"
          valor={String(
            pedidosEnPreparacion,
          )}
          descripcion="Pedidos activos en cocina"
          icono={ClipboardList}
          tono="ambar"
        />

        <TarjetaMetrica
          titulo="Listos"
          valor={String(
            pedidosListos,
          )}
          descripcion="Esperando ser entregados"
          icono={CheckCircle2}
          tono="verde"
        />

        <TarjetaMetrica
          titulo="Pendientes de cobro"
          valor={String(
            ventasPendientes.length,
          )}
          descripcion="Se cobrarán desde Caja"
          icono={CircleDollarSign}
          tono="azul"
        />

        <TarjetaMetrica
          titulo="Monto pendiente"
          valor={formatearMoneda(
            totalPendiente,
          )}
          descripcion="Total todavía no cobrado"
          icono={ShoppingCart}
          tono="roma"
        />
      </section>

      {!puedeGestionar && (
        <section
          className="
            rounded-2xl border
            border-blue-200
            bg-blue-50 p-4
          "
        >
          <p
            className="
              text-sm font-bold
              text-blue-900
            "
          >
            Modo de consulta
          </p>

          <p
            className="
              mt-1 text-sm
              text-blue-700
            "
          >
            Tu rol permite consultar
            pedidos y ventas, pero no
            registrar ni modificar
            operaciones.
          </p>
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
            flex flex-wrap gap-2
            border-b border-slate-100
            bg-slate-50 p-3
          "
        >
          {puedeGestionar && (
            <button
              type="button"
              onClick={() =>
                setPestanaActiva(
                  "nueva",
                )
              }
              className={`
                inline-flex items-center
                gap-2 rounded-xl
                px-4 py-2.5
                text-sm font-bold
                ${
                  pestanaActiva ===
                  "nueva"
                    ? `
                      bg-red-700
                      text-white
                    `
                    : `
                      bg-white
                      text-slate-600
                      hover:bg-slate-100
                    `
                }
              `}
            >
              <Plus size={17} />
              Nueva venta
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setPestanaActiva(
                "preparacion",
              )
            }
            className={`
              inline-flex items-center
              gap-2 rounded-xl
              px-4 py-2.5
              text-sm font-bold
              ${
                pestanaActiva ===
                "preparacion"
                  ? `
                    bg-red-700
                    text-white
                  `
                  : `
                    bg-white
                    text-slate-600
                    hover:bg-slate-100
                  `
              }
            `}
          >
            <ClipboardList size={17} />
            Preparación
          </button>

          <button
            type="button"
            onClick={() =>
              setPestanaActiva(
                "historial",
              )
            }
            className={`
              inline-flex items-center
              gap-2 rounded-xl
              px-4 py-2.5
              text-sm font-bold
              ${
                pestanaActiva ===
                "historial"
                  ? `
                    bg-red-700
                    text-white
                  `
                  : `
                    bg-white
                    text-slate-600
                    hover:bg-slate-100
                  `
              }
            `}
          >
            <History size={17} />
            Historial
          </button>
        </div>

        {pestanaActiva ===
          "nueva" &&
          puedeGestionar && (
            <FormularioVenta
              key={claveFormulario}
              productos={productos}
              categorias={categorias}
              clientes={clientes}
              cargando={
                procesandoOperacion
              }
              alGuardar={guardarVenta}
              alLimpiar={() => {
                setClaveFormulario(
                  (clave) => clave + 1,
                );
              }}
            />
          )}

        {pestanaActiva ===
          "preparacion" && (
          <PanelPreparacion
            ventas={ventas}
            puedeGestionar={
              puedeGestionar
            }
            alCambiarEstado={
              solicitarCambioEstado
            }
            alAnular={
              abrirAnulacion
            }
          />
        )}

        {pestanaActiva ===
          "historial" && (
          <HistorialVentas
            ventas={ventas}
            puedeGestionar={
              puedeGestionar
            }
            alAnular={
              abrirAnulacion
            }
          />
        )}
      </section>

      <ModalConfirmacion
        abierto={Boolean(
          accionEstado,
        )}
        titulo={tituloConfirmacion}
        descripcion={
          descripcionConfirmacion
        }
        textoConfirmar={
          accionEstado?.nuevoEstado ===
          "Listo"
            ? "Sí, está listo"
            : "Sí, fue entregado"
        }
        variante="activar"
        cargando={
          procesandoOperacion
        }
        alConfirmar={() =>
          void confirmarCambioEstado()
        }
        alCancelar={() => {
          if (!procesandoOperacion) {
            setAccionEstado(null);
          }
        }}
      />

      <Modal
        abierto={Boolean(
          ventaParaAnular,
        )}
        titulo="Anular pedido"
        descripcion={
          ventaParaAnular
            ? `Indica por qué se anulará ${ventaParaAnular.numeroPedido}.`
            : ""
        }
        ancho="mediano"
        alCerrar={cerrarAnulacion}
      >
        <div className="p-5 sm:p-6">
          <label
            htmlFor="motivo-anulacion"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Motivo de anulación
          </label>

          <textarea
            id="motivo-anulacion"
            value={motivoAnulacion}
            disabled={
              procesandoOperacion
            }
            maxLength={200}
            rows={4}
            placeholder="Ej.: El cliente canceló el pedido."
            onChange={(evento) =>
              setMotivoAnulacion(
                evento.target.value,
              )
            }
            className="
              mt-2 w-full resize-none
              rounded-xl border
              border-slate-300
              px-4 py-3
              text-sm outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
              disabled:bg-slate-100
            "
          />

          <div
            className="
              mt-1 flex
              justify-between gap-3
            "
          >
            <p
              className="
                text-xs text-slate-500
              "
            >
              Mínimo 5 caracteres.
            </p>

            <span
              className="
                text-xs text-slate-400
              "
            >
              {motivoAnulacion.length}
              /200
            </span>
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
            disabled={
              procesandoOperacion
            }
            onClick={cerrarAnulacion}
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
            type="button"
            disabled={
              procesandoOperacion ||
              motivoAnulacion
                .trim().length < 5
            }
            onClick={() =>
              void confirmarAnulacion()
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
            {procesandoOperacion && (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            )}

            <Ban size={17} />
            Confirmar anulación
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Ventas;