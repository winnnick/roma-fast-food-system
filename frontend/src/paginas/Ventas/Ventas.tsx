import {
  CalendarDays,
  CheckCircle2,
  Copy,
  CircleDollarSign,
  ClipboardList,
  FileDown,
  History,
  MapPin,
  MessageCircle,
  Printer,
  ReceiptText,
  RotateCcw,
  Share2,
  ShoppingCart,
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
  listarCategorias,
} from "../../servicios/categoriaServicio";

import {
  listarProductos,
} from "../../servicios/productoServicio";

import {
  clienteTieneDatosEntrega,
  construirTextoEntregaPedido,
  generarUrlWhatsappEntregaPedido,
  listarClientes,
} from "../../servicios/clienteServicio";

import {
  actualizarModoInicioPreparacion,
  cambiarEstadoPreparacion,
  listarVentas,
  obtenerModoInicioPreparacion,
  obtenerVentaPorId,
} from "../../servicios/ventaServicio";

import {
  anularVentaConInventario,
  evaluarVentaConInventario,
  obtenerEstadoInventarioAnulacion,
  registrarVentaConInventario,
} from "../../servicios/ventaInventarioServicio";

import {
  listarPagosPorVentaId,
  obtenerCajaAbiertaPorUsuario,
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
  ModoInicioPreparacion,
  Venta,
} from "../../tipos/venta";

import type {
  EvaluacionInventarioVenta,
  TratamientoAnulacionInventario,
} from "../../tipos/inventario";

import type {
  PagoVenta,
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
import FormularioVenta, {
  type DatosCobroIntegrado,
} from "./FormularioVenta";
import FormularioCobro from "./FormularioCobro";
import HistorialVentas from "./HistorialVentas";
import PanelPreparacion from "./PanelPreparacion";


interface AccionEstado {
  venta: Venta;
  nuevoEstado: EstadoPreparacion;
}

interface VentaPendienteInventario {
  datos: CrearVentaDto;
  cobro: DatosCobroIntegrado | null;
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

async function copiarTexto(
  texto: string,
): Promise<void> {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      texto,
    );

    return;
  }

  const area =
    document.createElement("textarea");

  area.value = texto;
  area.style.position = "fixed";
  area.style.opacity = "0";

  document.body.appendChild(area);
  area.focus();
  area.select();

  const copiado =
    document.execCommand("copy");

  document.body.removeChild(area);

  if (!copiado) {
    throw new Error(
      "No se pudo copiar el texto.",
    );
  }
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

function formatearFechaHoraTicket(
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
  montoPagadoAcumulado = 0,
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

  const detallePago = venta.canalVenta === "PedidosYa"
    ? `
      <p><strong>Canal:</strong> PedidosYa</p>
      ${venta.referenciaPedidosYa ? `<p><strong>Referencia:</strong> ${escaparHtml(venta.referenciaPedidosYa)}</p>` : ""}
      <p><strong>Liquidación:</strong> ${escaparHtml(venta.estadoCobro)}</p>
    `
    : pago
      ? `
        <p><strong>${venta.estadoCobro === "Cobrada" ? "Método" : "Último abono"}:</strong> ${escaparHtml(pago.metodoPago)}</p>
        <p><strong>Pagado acumulado:</strong> ${formatearMoneda(montoPagadoAcumulado)}</p>
        ${venta.estadoCobro === "Pendiente de cobro" ? `<p><strong>Saldo pendiente:</strong> ${formatearMoneda(Math.max(0, venta.total - montoPagadoAcumulado))}</p>` : ""}
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
          @page { size: 80mm auto; margin: 4mm; }
          * { box-sizing: border-box; color: #000 !important; background: #fff !important; }
          html, body { margin: 0; padding: 0; background: #fff; }
          body { font-family: Arial, Helvetica, sans-serif; color: #000; }
          .ticket { width: 72mm; max-width: 100%; margin: 0 auto; }
          h1, h2, p { margin: 0; }
          h1 { text-align: center; font-size: 24px; line-height: 1; letter-spacing: -1px; }
          h2 { text-align: center; font-size: 10px; letter-spacing: 4px; margin-top: 4px; }
          .pedido { text-align: center; margin: 16px 0; padding: 8px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; font-size: 18px; font-weight: 800; }
          .datos { font-size: 11px; line-height: 1.55; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
          td { padding: 6px 0; border-bottom: 1px dashed #000; vertical-align: top; }
          td:last-child { padding-left: 8px; }
          .obs { font-size: 10px; font-style: italic; padding-top: 2px; }
          .totales { margin-top: 14px; font-size: 11px; line-height: 1.6; }
          .linea { display: flex; justify-content: space-between; gap: 10px; }
          .total { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; padding: 8px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; font-size: 17px; font-weight: 900; }
          .generales { margin-top: 12px; padding: 8px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; font-size: 10px; line-height: 1.45; }
          .pie { margin-top: 18px; padding-top: 10px; border-top: 1px dashed #000; text-align: center; font-size: 10px; }
          @media screen { body { padding: 20px; } }
          @media print {
            html, body { width: 80mm; }
            body { padding: 0; }
            .ticket { width: 72mm; }
          }
        </style>
      </head>
      <body>
        <main class="ticket">
          <h1>ROMA</h1>
          <h2>FAST FOOD</h2>
          <p class="pedido">${escaparHtml(venta.numeroPedido)}</p>

          <div class="datos">
            <p><strong>Cliente:</strong> ${escaparHtml(venta.clienteNombre)}</p>
            <p><strong>Atendido por:</strong> ${escaparHtml(venta.usuarioRegistroNombre)}</p>
            <p><strong>Canal:</strong> ${escaparHtml(venta.canalVenta)}</p>
            <p><strong>Fecha:</strong> ${escaparHtml(formatearFechaHoraTicket(venta.fechaHoraRegistro))}</p>
          </div>

          <table>
            <tbody>${filas}</tbody>
          </table>

          ${venta.observaciones ? `<div class="generales"><strong>OBSERVACIONES GENERALES PARA COCINA:</strong><br />${escaparHtml(venta.observaciones)}</div>` : ""}

          <div class="totales">
            <p class="linea"><span>Subtotal</span><strong>${formatearMoneda(venta.subtotal)}</strong></p>
            ${venta.montoDescuento > 0 ? `<p class="linea"><span>Descuento</span><strong>- ${formatearMoneda(venta.montoDescuento)}</strong></p>` : ""}
            <div class="total"><span>TOTAL</span><span>${formatearMoneda(venta.total)}</span></div>
            <div style="margin-top:10px">${detallePago}</div>
          </div>

          <p class="pie">Gracias por su compra.<br />Conserve este ticket.</p>
        </main>
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();

  window.setTimeout(() => {
    ventana.print();
  }, 250);
}

function Ventas() {
  const { usuario } = useAuth();

  const puedeRegistrar =
    usuario?.permisos.includes(
      "VENTAS_CREAR",
    ) ?? false;

  const puedePreparar =
    usuario?.permisos.includes(
      "VENTAS_PREPARAR",
    ) ?? false;

  const puedeConfigurarFlujo =
    usuario?.permisos.includes(
      "VENTAS_CONFIGURAR_FLUJO",
    ) ?? false;

  const puedeCobrar =
    usuario?.permisos.includes(
      "VENTAS_COBRAR",
    ) ?? false;

  const puedeAnular =
    usuario?.permisos.includes(
      "VENTAS_ANULAR",
    ) ?? false;

  const puedeVerHistorial =
    usuario?.permisos.includes(
      "VENTAS_HISTORIAL",
    ) ?? false;

  const puedeCompartirEntrega =
    usuario?.permisos.includes(
      "VENTAS_COMPARTIR_ENTREGA",
    ) ?? false;

  const [
    historialAbierto,
    setHistorialAbierto,
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
    montoPagadoParaTicket,
    setMontoPagadoParaTicket,
  ] = useState(0);

  const [ahora, setAhora] =
    useState(() => new Date());

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
    modoInicioPreparacion,
    setModoInicioPreparacion,
  ] = useState<ModoInicioPreparacion>(
    obtenerModoInicioPreparacion,
  );

  const [
    cambiandoFlujo,
    setCambiandoFlujo,
  ] = useState(false);

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
    pagosVentaParaCobrar,
    setPagosVentaParaCobrar,
  ] = useState<PagoVenta[]>([]);

  const [
    ventaParaCompartirEntrega,
    setVentaParaCompartirEntrega,
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


  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        setAhora(new Date());
      }, 1000);

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, []);

  useEffect(() => {
    const sincronizarFlujo = () => {
      setModoInicioPreparacion(
        obtenerModoInicioPreparacion(),
      );
    };

    const manejarStorage = (evento: StorageEvent) => {
      if (evento.key === "roma-ventas-flujo-preparacion-v1") {
        sincronizarFlujo();
      }
    };

    window.addEventListener(
      "roma-flujo-preparacion-actualizado",
      sincronizarFlujo,
    );
    window.addEventListener("storage", manejarStorage);

    return () => {
      window.removeEventListener(
        "roma-flujo-preparacion-actualizado",
        sincronizarFlujo,
      );
      window.removeEventListener("storage", manejarStorage);
    };
  }, []);

  useEffect(() => {
    let activo = true;

    const temporizador =
      window.setTimeout(() => {
        if (
          (!puedeRegistrar &&
            !puedeCobrar) ||
          !usuario
        ) {
          if (activo) {
            setCajaAbierta(null);
          }

          return;
        }

        obtenerCajaAbiertaPorUsuario(
          usuario.id,
        )
          .then((caja) => {
            if (activo) {
              setCajaAbierta(caja);
            }
          })
          .catch(() => {
            if (activo) {
              setCajaAbierta(null);
            }
          });
      }, 0);

    return () => {
      activo = false;
      window.clearTimeout(
        temporizador,
      );
    };
  }, [
    puedeCobrar,
    puedeRegistrar,
    usuario,
  ]);

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

  const clientesConEntregaIds =
    useMemo(
      () =>
        clientes
          .filter(
            clienteTieneDatosEntrega,
          )
          .map(
            (cliente) => cliente.id,
          ),
      [clientes],
    );

  const clienteParaCompartirEntrega =
    useMemo(() => {
      if (
        !ventaParaCompartirEntrega?.clienteId
      ) {
        return null;
      }

      return (
        clientes.find(
          (cliente) =>
            cliente.id ===
            ventaParaCompartirEntrega.clienteId,
        ) ?? null
      );
    }, [
      clientes,
      ventaParaCompartirEntrega,
    ]);

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

  const pedidosEnCola =
    ventas.filter(
      (venta) =>
        venta.estadoPreparacion === "En cola",
    ).length;

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
        venta.canalVenta === "Local" &&
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
    cobro: DatosCobroIntegrado | null,
    autorizaSaldoNegativo: boolean,
  ) {
    if (
      !usuario ||
      !puedeRegistrar
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
          `${usuario.nombreCompleto} registró ${venta.numeroPedido} por ${formatearMoneda(venta.total)} mediante el canal ${venta.canalVenta}.`,
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

    let ventaFinal = venta;
    let pagoRegistrado:
      PagoVenta | null = null;
    let mensajeCobro =
      venta.canalVenta === "PedidosYa"
        ? " El importe quedó pendiente de liquidación por PedidosYa."
        : "El pedido quedó pendiente de cobro.";

    if (
      cobro &&
      puedeCobrar
    ) {
      try {
        pagoRegistrado =
          await registrarPagoVenta(
            {
              ventaId: venta.id,
              ...cobro,
            },
            usuario,
          );

        await auditarAccion(
          {
            modulo: "Caja",
            accion: "Registrar cobro",
            entidad: "Pago",
            entidadId:
              pagoRegistrado.id,
            descripcion:
              `${usuario.nombreCompleto} cobró ${pagoRegistrado.numeroPedido} por ${formatearMoneda(pagoRegistrado.totalCobrado)} mediante ${pagoRegistrado.metodoPago}.`,
            datosPosteriores:
              pagoRegistrado,
            nivel:
              pagoRegistrado.montoDescuento > 0
                ? "Advertencia"
                : "Información",
          },
          usuario,
        );

        ventaFinal =
          await obtenerVentaPorId(
            venta.id,
          );

        const saldoPendiente =
          Math.max(
            0,
            ventaFinal.total -
              pagoRegistrado.totalCobrado,
          );

        mensajeCobro =
          ventaFinal.estadoCobro === "Cobrada"
            ? pagoRegistrado.cambio > 0
              ? ` Cobro registrado mediante ${pagoRegistrado.metodoPago}. Cambio: ${formatearMoneda(pagoRegistrado.cambio)}.`
              : ` Cobro registrado mediante ${pagoRegistrado.metodoPago}.`
            : ` Abono registrado por ${formatearMoneda(pagoRegistrado.totalCobrado)} mediante ${pagoRegistrado.metodoPago}. Saldo pendiente: ${formatearMoneda(saldoPendiente)}.`;
      } catch (errorCobro: unknown) {
        mensajeCobro =
          ` El pedido fue registrado, pero el cobro no pudo completarse y quedó pendiente: ${obtenerMensajeError(errorCobro)}`;
      }
    }

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

    const complementoInventario =
      avisos.length > 0
        ? ` Inventario: ${avisos.join("; ")}.`
        : " El inventario fue actualizado automáticamente.";

    setClaveFormulario(
      (clave) => clave + 1,
    );

    setVentaPendienteInventario(null);
    setEvaluacionBloqueada(null);

    await recargarVentas();

    setPagoParaTicket(
      pagoRegistrado,
    );
    setMontoPagadoParaTicket(
      pagoRegistrado?.totalCobrado ?? 0,
    );
    setVentaParaTicket(
      ventaFinal,
    );

    setNotificacion({
      tipo:
        pagoRegistrado
          ? "exito"
          : "info",
      titulo:
        pagoRegistrado &&
        ventaFinal.estadoCobro === "Cobrada"
          ? "Pedido y cobro registrados"
          : pagoRegistrado
            ? "Pedido y abono registrados"
          : "Pedido registrado",
      mensaje:
        `${ventaFinal.numeroPedido} ${
          ventaFinal.requierePreparacion
            ? "fue enviado al flujo de preparación"
            : "quedó disponible para entrega directa"
        }.${mensajeCobro}${complementoInventario}`,
    });
  }

  async function guardarVenta(
    datos: CrearVentaDto,
    cobro: DatosCobroIntegrado | null,
  ) {
    if (
      !usuario ||
      !puedeRegistrar
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
          cobro,
          evaluacion,
        });
        return;
      }

      await completarRegistroVenta(
        datos,
        cobro,
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
      !puedeRegistrar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      await completarRegistroVenta(
        ventaPendienteInventario.datos,
        ventaPendienteInventario.cobro,
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

  async function cambiarModoPreparacion(
    nuevoModo: ModoInicioPreparacion,
  ) {
    if (
      !usuario ||
      !puedeConfigurarFlujo ||
      nuevoModo === modoInicioPreparacion
    ) {
      return;
    }

    const modoAnterior = modoInicioPreparacion;

    try {
      setCambiandoFlujo(true);

      const modoActualizado =
        await actualizarModoInicioPreparacion(
          nuevoModo,
        );

      setModoInicioPreparacion(modoActualizado);

      await auditarAccion(
        {
          modulo: "Preparación",
          accion: "Configurar flujo de preparación",
          entidad: "Configuración",
          descripcion:
            modoActualizado === "En cola"
              ? "Los nuevos pedidos ingresarán primero a la cola de preparación."
              : "Los nuevos pedidos ingresarán directamente a preparación.",
          datosAnteriores: {
            modoInicioPreparacion: modoAnterior,
          },
          datosPosteriores: {
            modoInicioPreparacion: modoActualizado,
          },
        },
        usuario,
      );

      setNotificacion({
        tipo: "exito",
        titulo: "Flujo actualizado",
        mensaje:
          modoActualizado === "En cola"
            ? "Los próximos pedidos ingresarán a la cola antes de prepararse."
            : "Los próximos pedidos ingresarán directamente a preparación.",
      });
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo cambiar el flujo",
        mensaje: obtenerMensajeError(error),
      });
    } finally {
      setCambiandoFlujo(false);
    }
  }

  function solicitarCambioEstado(
    venta: Venta,
    nuevoEstado:
      EstadoPreparacion,
  ) {
    if (!puedePreparar) {
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
      !puedePreparar
    ) {
      return;
    }

    try {
      setProcesandoOperacion(true);

      let contextoEntrega:
        | { usuarioId: number; usuarioNombre: string; sesionCajaId: number }
        | undefined;

      if (
        accionEstado.nuevoEstado === "Entregado" &&
        accionEstado.venta.canalVenta === "PedidosYa"
      ) {
        if (!usuario) {
          throw new Error("No se pudo identificar al usuario responsable de la entrega.");
        }

        const cajaEntrega =
          await obtenerCajaAbiertaPorUsuario(usuario.id);

        if (!cajaEntrega) {
          throw new Error(
            "Abre tu propia caja antes de entregar un pedido de PedidosYa. La caja se utiliza para registrar quién entregó el pedido al repartidor, sin generar un ingreso de efectivo o QR.",
          );
        }

        setCajaAbierta(cajaEntrega);
        contextoEntrega = {
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombreCompleto,
          sesionCajaId: cajaEntrega.id,
        };
      }

      let venta: Venta;

      if (
        accionEstado.venta
          .estadoPreparacion ===
          "En preparación" &&
        accionEstado.nuevoEstado ===
          "Entregado"
      ) {
        await cambiarEstadoPreparacion(
          accionEstado.venta.id,
          "Listo",
        );

        venta =
          await cambiarEstadoPreparacion(
            accionEstado.venta.id,
            "Entregado",
            contextoEntrega,
          );
      } else {
        venta =
          await cambiarEstadoPreparacion(
            accionEstado.venta.id,
            accionEstado.nuevoEstado,
            contextoEntrega,
          );
      }

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

    if (venta.canalVenta === "PedidosYa") {
      setNotificacion({
        tipo: "info",
        titulo: "Cobro administrado por PedidosYa",
        mensaje:
          "Este pedido no se cobra en la caja del local. Su importe permanecerá pendiente hasta registrar la liquidación administrativa de PedidosYa.",
      });
      return;
    }

    try {
      setProcesandoCobro(true);

      if (!usuario) {
        return;
      }

      const caja =
        await obtenerCajaAbiertaPorUsuario(
          usuario.id,
        );

      if (!caja) {
        setNotificacion({
          tipo: "error",

          titulo:
            "Caja cerrada",

          mensaje:
            "Abre tu propia caja antes de registrar el cobro.",
        });

        return;
      }

      setCajaAbierta(caja);

      const pagosPrevios =
        await listarPagosPorVentaId(
          venta.id,
        );

      const montoPagado =
        pagosPrevios.reduce(
          (acumulado, pago) =>
            acumulado + pago.totalCobrado,
          0,
        );

      if (
        montoPagado >= venta.total
      ) {
        await recargarVentas();

        setNotificacion({
          tipo: "info",
          titulo: "Pedido sin saldo pendiente",
          mensaje:
            `${venta.numeroPedido} ya tiene registrado el total de sus pagos. Se actualizó el estado de la vista.`,
        });

        return;
      }

      setPagosVentaParaCobrar(
        pagosPrevios,
      );
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

    setPagosVentaParaCobrar([]);
    setVentaParaCobrar(null);
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

      const ventaActualizada =
        await obtenerVentaPorId(
          ventaParaCobrar.id,
        );

      const montoPagadoAnterior =
        pagosVentaParaCobrar.reduce(
          (acumulado, pagoPrevio) =>
            acumulado +
            pagoPrevio.totalCobrado,
          0,
        );

      const montoPagadoAcumulado =
        montoPagadoAnterior +
        pago.totalCobrado;

      const saldoPendiente =
        Math.max(
          0,
          ventaActualizada.total -
            montoPagadoAcumulado,
        );

      await auditarAccion(
        {
          modulo: "Caja",
          accion: "Registrar cobro",
          entidad: "Pago",
          entidadId: pago.id,
          descripcion:
            `${usuario.nombreCompleto} registró ${ventaActualizada.estadoCobro === "Cobrada" ? "el cobro final" : "un abono"} de ${pago.numeroPedido} por ${formatearMoneda(pago.totalCobrado)} mediante ${pago.metodoPago}.`,
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
          ventaActualizada.estadoCobro ===
          "Cobrada"
            ? "Cobro completado"
            : "Abono registrado",

        mensaje:
          ventaActualizada.estadoCobro ===
          "Cobrada"
            ? pago.cambio > 0
              ? `${pago.numeroPedido} quedó completamente pagado. Cambio: ${formatearMoneda(pago.cambio)}.`
              : `${pago.numeroPedido} quedó completamente pagado.`
            : `${pago.numeroPedido} recibió un abono de ${formatearMoneda(pago.totalCobrado)}. Saldo pendiente: ${formatearMoneda(saldoPendiente)}.`,
      });

      setPagosVentaParaCobrar([]);
      setVentaParaCobrar(null);

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
    if (!puedeAnular) {
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
      !puedeAnular
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

  function abrirCompartirEntrega(
    venta: Venta,
  ) {
    if (!puedeCompartirEntrega) {
      return;
    }

    const cliente =
      venta.clienteId !== null
        ? clientes.find(
            (item) =>
              item.id === venta.clienteId,
          )
        : null;

    if (
      !cliente ||
      !clienteTieneDatosEntrega(cliente)
    ) {
      setNotificacion({
        tipo: "info",
        titulo: "Entrega no disponible",
        mensaje:
          "Este pedido no tiene un cliente registrado con dirección o ubicación guardada.",
      });

      return;
    }

    setVentaParaCompartirEntrega(venta);
  }

  async function copiarPedidoEntrega() {
    if (
      !puedeCompartirEntrega ||
      !ventaParaCompartirEntrega ||
      !clienteParaCompartirEntrega
    ) {
      return;
    }

    try {
      await copiarTexto(
        construirTextoEntregaPedido(
          ventaParaCompartirEntrega,
          clienteParaCompartirEntrega,
        ),
      );

      setNotificacion({
        tipo: "exito",
        titulo: "Pedido copiado",
        mensaje:
          "Los datos del pedido y la entrega están listos para enviarse al repartidor.",
      });
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo copiar",
        mensaje:
          obtenerMensajeError(error),
      });
    }
  }

  function abrirWhatsappPedidoEntrega() {
    if (
      !puedeCompartirEntrega ||
      !ventaParaCompartirEntrega ||
      !clienteParaCompartirEntrega
    ) {
      return;
    }

    window.open(
      generarUrlWhatsappEntregaPedido(
        ventaParaCompartirEntrega,
        clienteParaCompartirEntrega,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  }

  function abrirHistorial() {
    if (!puedeVerHistorial) {
      return;
    }

    setHistorialAbierto(true);
  }

  async function abrirTicket(
    venta: Venta,
  ) {
    try {
      const pagos =
        await listarPagosPorVentaId(
          venta.id,
        );

      setPagoParaTicket(
        pagos[pagos.length - 1] ?? null,
      );
      setMontoPagadoParaTicket(
        pagos.reduce(
          (acumulado, pago) =>
            acumulado + pago.totalCobrado,
          0,
        ),
      );
    } catch {
      setPagoParaTicket(null);
      setMontoPagadoParaTicket(0);
    }

    setVentaParaTicket(venta);
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
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-3xl bg-white" />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.8fr)]">
          <div className="h-176 rounded-3xl bg-white" />
          <div className="h-176 rounded-3xl bg-white" />
        </div>
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
    accionEstado?.nuevoEstado === "En preparación"
      ? "Iniciar preparación del pedido"
      : accionEstado?.nuevoEstado === "Listo"
        ? "Marcar pedido como listo"
        : "Marcar pedido como entregado";

  const descripcionConfirmacion =
    accionEstado?.nuevoEstado === "En preparación"
      ? `¿Confirmas que cocina comenzará a preparar ${accionEstado.venta.numeroPedido}?`
      : accionEstado?.nuevoEstado === "Listo"
        ? `¿Confirmas que ${accionEstado.venta.numeroPedido} ya está listo para recoger?`
        : `¿Confirmas que ${accionEstado?.venta.numeroPedido ?? "el pedido"} ya fue entregado al cliente?`;

  const fechaActual =
    new Intl.DateTimeFormat(
      "es-BO",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    ).format(ahora);

  const horaActual =
    new Intl.DateTimeFormat(
      "es-BO",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    ).format(ahora);

  return (
    <div className="space-y-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={cerrarNotificacion}
        modoRapido
        duracionMs={
          notificacion?.tipo === "error"
            ? 2200
            : 1600
        }
      />

      {!puedeRegistrar && (
        <section className="rounded-2xl border border-blue-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-blue-700">
            Modo de consulta
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Tu rol puede consultar la operación, pero no registrar pedidos. Las demás acciones dependen de los permisos asignados.
          </p>
        </section>
      )}

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.8fr)]">
        <div className="min-h-192 overflow-visible rounded-3xl border border-slate-200 bg-white shadow-panel">
          {puedeRegistrar ? (
            <FormularioVenta
              key={claveFormulario}
              productos={productos}
              categorias={categorias}
              clientes={clientes}
              cargando={
                procesandoOperacion
              }
              puedeCobrar={puedeCobrar}
              puedeVerHistorial={
                puedeVerHistorial
              }
              cajaAbierta={cajaAbierta}
              alGuardar={guardarVenta}
              alLimpiar={() => {
                setClaveFormulario(
                  (clave) => clave + 1,
                );
              }}
              alAbrirHistorial={
                abrirHistorial
              }
            />
          ) : (
            <div className="flex min-h-176 items-center justify-center p-8 text-center">
              <div>
                <ClipboardList
                  size={36}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-4 font-black text-slate-800">
                  Registro no disponible
                </p>
                {puedeVerHistorial && (
                  <button
                    type="button"
                    onClick={abrirHistorial}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <History size={17} />
                    Ver historial
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <PanelPreparacion
          ventas={ventas}
          puedePreparar={
            puedePreparar
          }
          puedeCobrar={puedeCobrar}
          puedeAnular={puedeAnular}
          puedeCompartirEntrega={
            puedeCompartirEntrega
          }
          puedeConfigurarFlujo={
            puedeConfigurarFlujo
          }
          modoInicioPreparacion={
            modoInicioPreparacion
          }
          cambiandoFlujo={cambiandoFlujo}
          cantidadEnCola={pedidosEnCola}
          alCambiarModoInicioPreparacion={(modo) =>
            void cambiarModoPreparacion(modo)
          }
          alCambiarEstado={
            solicitarCambioEstado
          }
          alAnular={abrirAnulacion}
          alCobrar={(venta) =>
            void solicitarCobro(
              venta,
            )
          }
          alVerTicket={(venta) =>
            void abrirTicket(venta)
          }
          clientesConEntregaIds={
            clientesConEntregaIds
          }
          alCompartirEntrega={
            abrirCompartirEntrega
          }
          alAbrirPantallaPedidos={
            abrirPantallaPedidos
          }
        />
      </section>

      <section
        className={`grid gap-3 sm:grid-cols-2 ${
          modoInicioPreparacion === "En cola"
            ? "xl:grid-cols-6"
            : "xl:grid-cols-5"
        }`}
      >
        {modoInicioPreparacion === "En cola" && (
          <TarjetaMetrica
            titulo="En cola"
            valor={String(pedidosEnCola)}
            descripcion="Esperando inicio de preparación."
            icono={ClipboardList}
            tono="azul"
            variante="compacta"
          />
        )}

        <TarjetaMetrica
          titulo="En preparación"
          valor={String(
            pedidosEnPreparacion,
          )}
          descripcion="Pedidos activos en cocina."
          icono={ClipboardList}
          tono="ambar"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Listos"
          valor={String(pedidosListos)}
          descripcion="Esperando entrega al cliente."
          icono={CheckCircle2}
          tono="verde"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Pendientes de cobro"
          valor={String(
            ventasPendientes.length,
          )}
          descripcion="Cobros todavía no registrados."
          icono={CircleDollarSign}
          tono="azul"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Monto pendiente"
          valor={formatearMoneda(
            totalPendiente,
          )}
          descripcion="Total todavía no cobrado."
          icono={ShoppingCart}
          tono="roma"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Fecha y hora"
          valor={horaActual}
          descripcion={fechaActual}
          icono={CalendarDays}
          tono="neutro"
          variante="compacta"
        />
      </section>

      <Modal
        abierto={
          historialAbierto &&
          puedeVerHistorial
        }
        titulo="Historial de ventas"
        descripcion="Consulta el número, cliente, total y fecha de los pedidos registrados."
        ancho="grande"
        alCerrar={() =>
          setHistorialAbierto(false)
        }
      >
        <HistorialVentas
          ventas={ventas}
          alVisualizarTicket={(venta) => {
            setHistorialAbierto(false);
            void abrirTicket(venta);
          }}
        />
      </Modal>

      <Modal
        abierto={
          ventaParaCompartirEntrega !== null &&
          clienteParaCompartirEntrega !== null
        }
        titulo="Compartir pedido para delivery"
        descripcion="Incluye el pedido, los datos del cliente y las indicaciones necesarias para la entrega."
        ancho="grande"
        alCerrar={() =>
          setVentaParaCompartirEntrega(null)
        }
      >
        {ventaParaCompartirEntrega &&
          clienteParaCompartirEntrega && (
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div>
                <section className="rounded-2xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900/60 dark:bg-teal-950/35">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
                      <MapPin size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white">
                        {ventaParaCompartirEntrega.numeroPedido}
                        {" · "}
                        {clienteParaCompartirEntrega.nombreCompleto}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {clienteParaCompartirEntrega.telefono ??
                          "Sin teléfono registrado"}
                      </p>
                    </div>
                  </div>
                </section>

                <pre className="mt-4 max-h-120 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  {construirTextoEntregaPedido(
                    ventaParaCompartirEntrega,
                    clienteParaCompartirEntrega,
                  )}
                </pre>
              </div>

              <aside className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    <Share2 size={23} />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">
                    Enviar al repartidor
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Copia el mensaje o abre WhatsApp para seleccionar el chat correspondiente.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      void copiarPedidoEntrega()
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <Copy size={17} />
                    Copiar pedido
                  </button>

                  <button
                    type="button"
                    onClick={
                      abrirWhatsappPedidoEntrega
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-700"
                  >
                    <MessageCircle size={17} />
                    Abrir WhatsApp
                  </button>
                </div>
              </aside>
            </div>
          )}
      </Modal>

      <Modal
        abierto={
          ventaParaTicket !== null
        }
        titulo={
          ventaParaTicket
            ? `Ticket ${ventaParaTicket.numeroPedido}`
            : "Visualizar ticket"
        }
        descripcion="Vista resumida del comprobante asociado al pedido."
        ancho="grande"
        alCerrar={() => {
          setVentaParaTicket(null);
          setPagoParaTicket(null);
          setMontoPagadoParaTicket(0);
        }}
      >
        {ventaParaTicket && (
          <div
            className="
              grid gap-6 p-5
              lg:grid-cols-[minmax(320px,420px)_minmax(220px,1fr)]
              lg:p-6
            "
          >
            <section
              className="
                mx-auto w-full max-w-sm
                rounded-2xl border
                border-black p-6
                text-black
                shadow-none
              "
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                colorScheme: "light",
              }}
            >
              <div className="text-center">
                <p
                  className="
                    text-3xl font-black
                    tracking-[-0.06em]
                  "
                >
                  ROMA
                </p>

                <p
                  className="
                    mt-1 text-[10px]
                    font-black uppercase
                    tracking-[0.35em]
                    text-black
                  "
                >
                  FAST FOOD
                </p>

                <p
                  className="
                    mt-5 text-lg font-black
                  "
                >
                  {ventaParaTicket.numeroPedido}
                </p>
              </div>

              <div
                className="
                  mt-5 space-y-1
                  border-y border-dashed
                  border-black py-4
                  text-xs
                "
              >
                <p>
                  <strong>Cliente:</strong>{" "}
                  {ventaParaTicket.clienteNombre}
                </p>

                <p>
                  <strong>Atendido por:</strong>{" "}
                  {ventaParaTicket.usuarioRegistroNombre}
                </p>

                <p>
                  <strong>Canal:</strong>{" "}
                  {ventaParaTicket.canalVenta}
                </p>

                {ventaParaTicket.canalVenta === "PedidosYa" && ventaParaTicket.referenciaPedidosYa && (
                  <p>
                    <strong>Referencia:</strong>{" "}
                    {ventaParaTicket.referenciaPedidosYa}
                  </p>
                )}

                <p>
                  <strong>Fecha:</strong>{" "}
                  {formatearFechaHoraTicket(
                    ventaParaTicket.fechaHoraRegistro,
                  )}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {ventaParaTicket.detalles.map(
                  (detalle) => (
                    <div
                      key={detalle.productoId}
                      className="
                        border-b border-dashed
                        border-black pb-3
                      "
                    >
                      <div
                        className="
                          flex items-start
                          justify-between gap-3
                          text-xs
                        "
                      >
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
                        <p
                          className="
                            mt-1 text-[11px]
                            italic text-black
                          "
                        >
                          {detalle.observacion}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>

              {ventaParaTicket.observaciones && (
                <div
                  className="
                    mt-4 rounded-xl border-2
                    border-dashed border-black
                    p-3
                  "
                >
                  <p
                    className="
                      text-[10px] font-black
                      uppercase tracking-wide
                      text-black
                    "
                  >
                    Observaciones generales para cocina
                  </p>

                  <p
                    className="
                      mt-1 whitespace-pre-wrap
                      text-xs font-bold
                      leading-relaxed
                      text-black
                    "
                  >
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
                      -{" "}
                      {formatearMoneda(
                        ventaParaTicket.montoDescuento,
                      )}
                    </strong>
                  </div>
                )}

                <div
                  className="
                    mt-3 flex justify-between
                    gap-3 border-t
                    border-black pt-3
                    text-lg font-black
                  "
                >
                  <span>Total</span>
                  <span>
                    {formatearMoneda(
                      ventaParaTicket.total,
                    )}
                  </span>
                </div>

                <div className="mt-3 space-y-1 border-t border-dashed border-black pt-3 text-black">
                  <p>
                    <strong>{ventaParaTicket.canalVenta === "PedidosYa" ? "Liquidación" : ventaParaTicket.estadoCobro === "Cobrada" ? "Pago" : "Último abono"}:</strong>{" "}
                    {ventaParaTicket.canalVenta === "PedidosYa"
                      ? ventaParaTicket.estadoCobro
                      : pagoParaTicket?.metodoPago ?? ventaParaTicket.estadoCobro}
                  </p>

                  {ventaParaTicket.canalVenta === "Local" && pagoParaTicket && (
                    <>
                      <p>
                        Pagado acumulado: {formatearMoneda(
                          montoPagadoParaTicket,
                        )}
                      </p>

                      {ventaParaTicket.estadoCobro === "Pendiente de cobro" && (
                        <p className="font-black text-black">
                          Saldo pendiente: {formatearMoneda(
                            Math.max(
                              0,
                              ventaParaTicket.total - montoPagadoParaTicket,
                            ),
                          )}
                        </p>
                      )}

                      {pagoParaTicket.montoQr > 0 && (
                        <p>
                          QR: {formatearMoneda(
                            pagoParaTicket.montoQr,
                          )}
                        </p>
                      )}

                      {pagoParaTicket.montoEfectivo > 0 && (
                        <p>
                          Efectivo aplicado:{" "}
                          {formatearMoneda(
                            pagoParaTicket.montoEfectivo,
                          )}
                        </p>
                      )}

                      {pagoParaTicket.montoRecibido > 0 && (
                        <p>
                          Recibido: {formatearMoneda(
                            pagoParaTicket.montoRecibido,
                          )}
                        </p>
                      )}

                      {pagoParaTicket.cambio > 0 && (
                        <p className="font-black text-black">
                          Cambio: {formatearMoneda(
                            pagoParaTicket.cambio,
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p
                className="
                  mt-6 text-center
                  text-[11px]
                  text-black
                "
              >
                Gracias por su compra.
              </p>
            </section>

            <aside
              className="
                flex flex-col
                justify-between gap-4
                rounded-2xl border
                border-slate-200
                bg-slate-50 p-5
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <div>
                <div
                  className="
                    flex h-12 w-12
                    items-center justify-center
                    rounded-2xl bg-roma-50
                    text-roma-700
                    dark:bg-roma-950/40
                    dark:text-roma-300
                  "
                >
                  <ReceiptText size={24} />
                </div>

                <h3
                  className="
                    mt-4 text-lg font-black
                    text-slate-900
                    dark:text-white
                  "
                >
                  Copia del comprobante
                </h3>

                <p
                  className="
                    mt-2 text-sm
                    leading-relaxed
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Imprime el comprobante o utiliza la opción Guardar como PDF del navegador.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    imprimirTicket(
                      ventaParaTicket,
                      pagoParaTicket,
                      montoPagadoParaTicket,
                    )
                  }
                  className="
                    inline-flex h-11 w-full
                    items-center justify-center
                    gap-2 rounded-xl
                    bg-roma-700 px-4
                    text-sm font-bold
                    text-white
                    transition-colors
                    hover:bg-roma-800
                  "
                >
                  <Printer size={17} />
                  Imprimir ticket
                </button>

                <button
                  type="button"
                  onClick={() =>
                    imprimirTicket(
                      ventaParaTicket,
                      pagoParaTicket,
                      montoPagadoParaTicket,
                    )
                  }
                  className="
                    inline-flex h-11 w-full
                    items-center justify-center
                    gap-2 rounded-xl
                    border border-slate-300
                    bg-white px-4
                    text-sm font-bold
                    text-slate-700
                    transition-colors
                    hover:bg-slate-100
                    dark:border-slate-600
                    dark:bg-slate-800
                    dark:text-slate-200
                    dark:hover:bg-slate-700
                  "
                  title="En el cuadro de impresión selecciona Guardar como PDF"
                >
                  <FileDown size={17} />
                  Guardar como PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVentaParaTicket(null);
                    setPagoParaTicket(null);
                    setMontoPagadoParaTicket(0);
                  }}
                  className="
                    h-11 w-full rounded-xl
                    border border-slate-300
                    bg-white px-4
                    text-sm font-bold
                    text-slate-700
                    transition-colors
                    hover:bg-slate-100
                    dark:border-slate-600
                    dark:bg-slate-800
                    dark:text-slate-200
                    dark:hover:bg-slate-700
                  "
                >
                  Cerrar
                </button>
              </div>
            </aside>
          </div>
        )}
      </Modal>

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
        descripcion="Ingresa primero el efectivo recibido y, si corresponde, el monto QR. El método de pago se detectará automáticamente."
        ancho="grande"
        alCerrar={cerrarCobro}
      >
        {ventaParaCobrar &&
          cajaAbierta && (
            <FormularioCobro
              venta={ventaParaCobrar}
              sesionCaja={cajaAbierta}
              pagosPrevios={
                pagosVentaParaCobrar
              }
              cargando={
                procesandoCobro
              }
              alCobrar={confirmarCobro}
              alCancelar={cerrarCobro}
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
          accionEstado?.nuevoEstado === "En preparación"
            ? "Sí, iniciar preparación"
            : accionEstado?.nuevoEstado === "Listo"
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
