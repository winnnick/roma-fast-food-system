
import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  History,
  Plus,
  RotateCcw,
  ShoppingCart,
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
  listarCategorias,
} from "../../servicios/categoriaServicio";

import {
  listarProductos,
} from "../../servicios/productoServicio";

import {
  listarClientes,
} from "../../servicios/clienteServicio";

import {
  cambiarEstadoPreparacion,
  listarVentas,
} from "../../servicios/ventaServicio";

import {
  anularVentaConInventario,
  evaluarVentaConInventario,
  obtenerEstadoInventarioAnulacion,
  registrarVentaConInventario,
} from "../../servicios/ventaInventarioServicio";

import {
  obtenerCajaAbierta,
  registrarPagoVenta,
} from "../../servicios/cajaServicio";

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

import type {
  EvaluacionInventarioVenta,
  TratamientoAnulacionInventario,
} from "../../tipos/inventario";

import type {
  RegistrarPagoVentaDto,
  SesionCaja,
} from "../../tipos/caja";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import AlertaInventarioVenta from "./AlertaInventarioVenta";
import FormularioAnulacionInventario from "./FormularioAnulacionInventario";
import FormularioVenta from "./FormularioVenta";
import FormularioCobro from "./FormularioCobro";
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

interface VentaPendienteInventario {
  datos: CrearVentaDto;
  evaluacion:
    EvaluacionInventarioVenta;
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

  const puedeCobrar =
    usuario?.permisos.includes(
      "CAJA_GESTIONAR",
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
  ] = useState<
    CategoriaProducto[]
  >([]);

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [ventas, setVentas] =
    useState<Venta[]>([]);

  const [
    cargandoInicial,
    setCargandoInicial,
  ] = useState(true);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState<string | null>(
    null,
  );

  const [
    procesandoOperacion,
    setProcesandoOperacion,
  ] = useState(false);

  const [
    procesandoCobro,
    setProcesandoCobro,
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
    tieneConsumoAnulacion,
    setTieneConsumoAnulacion,
  ] = useState(false);

  const [
    preparandoAnulacion,
    setPreparandoAnulacion,
  ] = useState(false);

  const [
    ventaPendienteInventario,
    setVentaPendienteInventario,
  ] =
    useState<VentaPendienteInventario | null>(
      null,
    );

  const [
    evaluacionBloqueada,
    setEvaluacionBloqueada,
  ] =
    useState<EvaluacionInventarioVenta | null>(
      null,
    );

  const [
    ventaParaCobrar,
    setVentaParaCobrar,
  ] = useState<Venta | null>(null);

  const [
    cajaAbierta,
    setCajaAbierta,
  ] =
    useState<SesionCaja | null>(
      null,
    );

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

  async function completarRegistroVenta(
    datos: CrearVentaDto,
    autorizaSaldoNegativo: boolean,
  ) {
    if (
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    const resultado =
      await registrarVentaConInventario(
        datos,
        usuario,
        autorizaSaldoNegativo,
      );

    const { venta, evaluacion } =
      resultado;

    const cantidadNegativos =
      evaluacion.proyecciones.filter(
        (item) =>
          item.nivel === "Negativo",
      ).length;

    await auditarAccion(
      {
        modulo: "Ventas",
        accion: "Registrar venta",
        entidad: "Venta",
        entidadId: venta.id,
        descripcion:
          `${usuario.nombreCompleto} registró ${venta.numeroPedido} por ${formatearMoneda(venta.total)}.`,
        datosPosteriores: venta,
        nivel:
          cantidadNegativos > 0
            ? "Advertencia"
            : "Información",
      },
      usuario,
    );

    await auditarAccion(
      {
        modulo: "Inventario",
        accion: "Consumir receta por venta",
        entidad: "Venta",
        entidadId: venta.id,
        descripcion:
          `El inventario fue procesado automáticamente para ${venta.numeroPedido}.`,
        datosPosteriores: {
          numeroPedido:
            venta.numeroPedido,
          proyecciones:
            evaluacion.proyecciones,
          productosSinReceta:
            evaluacion.productosSinReceta,
          autorizoSaldoNegativo:
            autorizaSaldoNegativo,
        },
        nivel:
          cantidadNegativos > 0
            ? "Advertencia"
            : "Información",
        origen:
          "Proceso automático",
      },
      usuario,
    );

    setClaveFormulario(
      (clave) => clave + 1,
    );

    setVentaPendienteInventario(null);
    setEvaluacionBloqueada(null);

    await recargarVentas();

    setPestanaActiva(
      "preparacion",
    );

    let caja:
      SesionCaja | null = null;

    if (puedeCobrar) {
      try {
        caja =
          await obtenerCajaAbierta();
      } catch {
        caja = null;
      }
    }

    setCajaAbierta(caja);

    const insumosBajos =
      evaluacion.proyecciones.filter(
        (item) =>
          item.nivel === "Bajo",
      ).length;

    const insumosNegativos =
      evaluacion.proyecciones.filter(
        (item) =>
          item.nivel === "Negativo",
      ).length;

    const sinReceta =
      evaluacion.productosSinReceta.length;

    const avisos: string[] = [];

    if (insumosNegativos > 0) {
      avisos.push(
        `${insumosNegativos} insumo(s) quedaron con saldo negativo`,
      );
    }

    if (insumosBajos > 0) {
      avisos.push(
        `${insumosBajos} insumo(s) quedaron en stock bajo`,
      );
    }

    if (sinReceta > 0) {
      avisos.push(
        `${sinReceta} producto(s) no descontaron inventario por falta de receta`,
      );
    }

    const complemento =
      avisos.length > 0
        ? ` Inventario: ${avisos.join("; ")}.`
        : " El inventario fue actualizado automáticamente.";

    if (
      puedeCobrar &&
      caja
    ) {
      setVentaParaCobrar(
        venta,
      );

      setNotificacion({
        tipo:
          insumosNegativos > 0 ||
          sinReceta > 0
            ? "info"
            : "exito",

        titulo:
          "Pedido registrado",

        mensaje:
          `${venta.numeroPedido} fue enviado a preparación.${complemento} Puedes registrar el cobro ahora.`,
      });
    } else {
      setNotificacion({
        tipo: "info",

        titulo:
          "Pedido registrado",

        mensaje:
          `${venta.numeroPedido} fue enviado a preparación y quedó pendiente de cobro.${complemento}`,
      });
    }
  }

  async function guardarVenta(
    datos: CrearVentaDto,
  ) {
    if (
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      const evaluacion =
        await evaluarVentaConInventario(
          datos,
        );

      if (evaluacion.bloqueada) {
        setEvaluacionBloqueada(
          evaluacion,
        );

        return;
      }

      if (
        evaluacion.requiereConfirmacion
      ) {
        setVentaPendienteInventario({
          datos,
          evaluacion,
        });

        return;
      }

      await completarRegistroVenta(
        datos,
        false,
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

  async function confirmarVentaConSaldoNegativo() {
    if (
      !ventaPendienteInventario ||
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      await completarRegistroVenta(
        ventaPendienteInventario.datos,
        true,
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

      await auditarAccion({
        modulo: "Preparación",
        accion: "Cambiar estado de preparación",
        entidad: "Venta",
        entidadId: venta.id,
        descripcion:
          `${venta.numeroPedido} cambió de “${accionEstado.venta.estadoPreparacion}” a “${venta.estadoPreparacion}”.`,
        datosAnteriores:
          accionEstado.venta,
        datosPosteriores: venta,
      });

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

  async function solicitarCobro(
    venta: Venta,
  ) {
    if (!puedeCobrar) {
      return;
    }

    try {
      setProcesandoCobro(true);

      const caja =
        await obtenerCajaAbierta();

      if (!caja) {
        setNotificacion({
          tipo: "error",

          titulo:
            "Caja cerrada",

          mensaje:
            "Abre una caja antes de registrar el cobro.",
        });

        return;
      }

      setCajaAbierta(caja);
      setVentaParaCobrar(venta);
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",

        titulo:
          "No se pudo iniciar el cobro",

        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesandoCobro(false);
    }
  }

  function cerrarCobro() {
    if (procesandoCobro) {
      return;
    }

    setVentaParaCobrar(null);
    setCajaAbierta(null);
  }

  async function confirmarCobro(
    datos: RegistrarPagoVentaDto,
  ) {
    if (
      !ventaParaCobrar ||
      !usuario ||
      !puedeCobrar
    ) {
      return;
    }

    try {
      setProcesandoCobro(true);

      const pago =
        await registrarPagoVenta(
          datos,
          usuario,
        );

      await auditarAccion(
        {
          modulo: "Caja",
          accion: "Registrar cobro",
          entidad: "Pago",
          entidadId: pago.id,
          descripcion:
            `${usuario.nombreCompleto} cobró ${pago.numeroPedido} por ${formatearMoneda(pago.totalCobrado)} mediante ${pago.metodoPago}.`,
          datosPosteriores: pago,
          nivel:
            pago.montoDescuento > 0
              ? "Advertencia"
              : "Información",
        },
        usuario,
      );

      setNotificacion({
        tipo: "exito",

        titulo:
          "Cobro registrado",

        mensaje:
          pago.cambio > 0
            ? `${pago.numeroPedido} fue cobrado. Cambio: ${formatearMoneda(pago.cambio)}.`
            : `${pago.numeroPedido} fue cobrado correctamente.`,
      });

      setVentaParaCobrar(null);
      setCajaAbierta(null);

      await recargarVentas();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",

        titulo:
          "No se pudo registrar el cobro",

        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setProcesandoCobro(false);
    }
  }

  function abrirAnulacion(
    venta: Venta,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setVentaParaAnular(venta);
    setTieneConsumoAnulacion(false);
    setPreparandoAnulacion(true);

    obtenerEstadoInventarioAnulacion(
      venta.id,
    )
      .then((estado) => {
        setTieneConsumoAnulacion(
          estado.tieneConsumoAplicado,
        );
      })
      .catch((error: unknown) => {
        setNotificacion({
          tipo: "error",
          titulo:
            "No se pudo revisar el inventario",
          mensaje:
            obtenerMensajeError(error),
        });

        setTieneConsumoAnulacion(false);
      })
      .finally(() => {
        setPreparandoAnulacion(false);
      });
  }

  function cerrarAnulacion() {
    if (procesandoOperacion) {
      return;
    }

    setVentaParaAnular(null);
    setTieneConsumoAnulacion(false);
    setPreparandoAnulacion(false);
  }

  async function confirmarAnulacion(
    motivo: string,
    tratamiento:
      TratamientoAnulacionInventario | null,
  ) {
    if (
      !ventaParaAnular ||
      !usuario ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      const venta =
        await anularVentaConInventario(
          ventaParaAnular,
          motivo,
          tratamiento,
          usuario,
        );

      await auditarAccion(
        {
          modulo: "Ventas",
          accion: "Anular venta",
          entidad: "Venta",
          entidadId: venta.id,
          descripcion:
            `${usuario.nombreCompleto} anuló ${venta.numeroPedido}. Motivo: ${motivo}.`,
          datosAnteriores:
            ventaParaAnular,
          datosPosteriores: venta,
          nivel: "Crítico",
        },
        usuario,
      );

      if (tratamiento) {
        await auditarAccion(
          {
            modulo: "Inventario",
            accion:
              tratamiento === "Reintegrar insumos"
                ? "Reintegrar insumos"
                : "Registrar merma",
            entidad: "Venta",
            entidadId: venta.id,
            descripcion:
              `${tratamiento} por la anulación de ${venta.numeroPedido}.`,
            datosPosteriores: {
              numeroPedido:
                venta.numeroPedido,
              tratamiento,
              motivo,
            },
            nivel:
              tratamiento === "Registrar como merma"
                ? "Advertencia"
                : "Información",
          },
          usuario,
        );
      }

      setNotificacion({
        tipo: "exito",

        titulo:
          "Pedido anulado",

        mensaje:
          tratamiento ===
          "Reintegrar insumos"
            ? `${venta.numeroPedido} fue anulado y los insumos retornaron al inventario.`
            : tratamiento ===
                "Registrar como merma"
              ? `${venta.numeroPedido} fue anulado y sus insumos quedaron registrados como merma.`
              : `${venta.numeroPedido} fue anulado correctamente.`,
      });

      setVentaParaAnular(null);
      setTieneConsumoAnulacion(false);
      setPreparandoAnulacion(false);

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
              el número de pedido,
              controla la preparación y
              realiza el cobro desde una
              sola operación.
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
          descripcion="Cobros todavía no registrados"
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
                    ? "bg-red-700 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
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
                  ? "bg-red-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
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
                  ? "bg-red-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
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
            puedeCobrar={
              puedeCobrar
            }
            alCambiarEstado={
              solicitarCambioEstado
            }
            alAnular={
              abrirAnulacion
            }
            alCobrar={(venta) =>
              void solicitarCobro(
                venta,
              )
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
            puedeCobrar={
              puedeCobrar
            }
            alAnular={
              abrirAnulacion
            }
            alCobrar={(venta) =>
              void solicitarCobro(
                venta,
              )
            }
          />
        )}
      </section>

      <Modal
        abierto={Boolean(
          ventaParaCobrar &&
            cajaAbierta,
        )}
        titulo={
          ventaParaCobrar
            ? `Cobrar ${ventaParaCobrar.numeroPedido}`
            : "Registrar cobro"
        }
        descripcion="Selecciona el descuento, método de pago y monto entregado por el cliente."
        ancho="grande"
        alCerrar={cerrarCobro}
      >
        {ventaParaCobrar &&
          cajaAbierta && (
            <FormularioCobro
              venta={ventaParaCobrar}
              sesionCaja={cajaAbierta}
              cargando={
                procesandoCobro
              }
              alCobrar={
                confirmarCobro
              }
              alCancelar={
                cerrarCobro
              }
            />
          )}
      </Modal>

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
          ventaPendienteInventario,
        )}
        titulo="Advertencia de inventario"
        descripcion="Revisa los insumos que quedarán con saldo negativo antes de continuar."
        ancho="grande"
        alCerrar={() => {
          if (!procesandoOperacion) {
            setVentaPendienteInventario(null);
          }
        }}
      >
        {ventaPendienteInventario && (
          <AlertaInventarioVenta
            evaluacion={
              ventaPendienteInventario.evaluacion
            }
            cargando={
              procesandoOperacion
            }
            alConfirmar={() =>
              void confirmarVentaConSaldoNegativo()
            }
            alCancelar={() =>
              setVentaPendienteInventario(null)
            }
          />
        )}
      </Modal>

      <Modal
        abierto={Boolean(
          evaluacionBloqueada,
        )}
        titulo="Inventario no disponible"
        descripcion="La configuración de uno o más insumos impide registrar este pedido."
        ancho="grande"
        alCerrar={() =>
          setEvaluacionBloqueada(null)
        }
      >
        {evaluacionBloqueada && (
          <AlertaInventarioVenta
            evaluacion={
              evaluacionBloqueada
            }
            cargando={false}
            alConfirmar={() => undefined}
            alCancelar={() =>
              setEvaluacionBloqueada(null)
            }
          />
        )}
      </Modal>

      <Modal
        abierto={Boolean(
          ventaParaAnular,
        )}
        titulo="Anular pedido"
        descripcion={
          ventaParaAnular
            ? `Define el motivo y el tratamiento de inventario para ${ventaParaAnular.numeroPedido}.`
            : ""
        }
        ancho="grande"
        alCerrar={cerrarAnulacion}
      >
        {ventaParaAnular && (
          <FormularioAnulacionInventario
            key={ventaParaAnular.id}
            venta={ventaParaAnular}
            tieneConsumoInventario={
              tieneConsumoAnulacion
            }
            preparandoInventario={
              preparandoAnulacion
            }
            cargando={
              procesandoOperacion
            }
            alConfirmar={
              confirmarAnulacion
            }
            alCancelar={
              cerrarAnulacion
            }
          />
        )}
      </Modal>
    </div>
  );
}

export default Ventas;
