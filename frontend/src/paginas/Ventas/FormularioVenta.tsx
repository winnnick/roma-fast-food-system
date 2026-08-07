import {
  Check,
  CircleDollarSign,
  CircleUserRound,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  History,
  LoaderCircle,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import Modal from "../../shared/ui/Modal";

import type {
  CategoriaProducto,
  ProductoMenu,
} from "../../tipos/producto";

import type {
  Cliente,
} from "../../tipos/cliente";

import type {
  CrearVentaDto,
  TipoClienteVenta,
} from "../../tipos/venta";

import type {
  RegistrarPagoVentaDto,
  SesionCaja,
  TipoDescuento,
} from "../../tipos/caja";

export type DatosCobroIntegrado = Omit<
  RegistrarPagoVentaDto,
  "ventaId"
>;

interface FormularioVentaProps {
  productos: ProductoMenu[];
  categorias: CategoriaProducto[];
  clientes: Cliente[];
  cargando: boolean;
  puedeCobrar: boolean;
  cajaAbierta: SesionCaja | null;

  alGuardar: (
    datos: CrearVentaDto,
    cobro: DatosCobroIntegrado | null,
  ) => Promise<void>;

  alLimpiar: () => void;
  alAbrirHistorial: () => void;
}

interface ItemCarrito {
  productoId: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  observacion: string;
}

interface ResumenConfirmacion {
  datos: CrearVentaDto;
  cobro: DatosCobroIntegrado | null;
  nombreCliente: string;
  subtotal: number;
  montoDescuento: number;
  totalFinal: number;
  montoQr: number;
  efectivoAplicado: number;
  montoRecibido: number;
  cambio: number;
  faltante: number;
}

const MAXIMO_RESULTADOS_PRODUCTOS = 8;
const MAXIMO_RESULTADOS_CLIENTES = 6;

function redondearMoneda(
  valor: number,
): number {
  return Math.round(
    (valor + Number.EPSILON) * 100,
  ) / 100;
}

function convertirNumero(
  valor: string,
): number {
  const numero = Number(
    valor.replace(",", "."),
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
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

function normalizarBusqueda(
  valor: string,
): string {
  return valor
    .trim()
    .toLocaleLowerCase("es");
}

function FormularioVenta({
  productos,
  categorias,
  clientes,
  cargando,
  puedeCobrar,
  cajaAbierta,
  alGuardar,
  alLimpiar,
  alAbrirHistorial,
}: FormularioVentaProps) {
  const buscadorProductoRef =
    useRef<HTMLInputElement>(null);

  const buscadorClienteRef =
    useRef<HTMLInputElement>(null);

  const [
    busquedaProducto,
    setBusquedaProducto,
  ] = useState("");

  const [
    resultadosProductoAbiertos,
    setResultadosProductoAbiertos,
  ] = useState(false);

  const [
    indiceProductoActivo,
    setIndiceProductoActivo,
  ] = useState(0);

  const [
    busquedaCliente,
    setBusquedaCliente,
  ] = useState("");

  const [
    clienteSeleccionadoId,
    setClienteSeleccionadoId,
  ] = useState<number | null>(null);

  const [
    resultadosClienteAbiertos,
    setResultadosClienteAbiertos,
  ] = useState(false);

  const [
    indiceClienteActivo,
    setIndiceClienteActivo,
  ] = useState(0);

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [carrito, setCarrito] =
    useState<ItemCarrito[]>([]);

  const [
    tipoDescuento,
    setTipoDescuento,
  ] = useState<TipoDescuento>(
    "Ninguno",
  );

  const [
    valorDescuento,
    setValorDescuento,
  ] = useState("");

  const [
    motivoDescuento,
    setMotivoDescuento,
  ] = useState("");

  const [
    mostrarDescuento,
    setMostrarDescuento,
  ] = useState(false);

  const [montoQr, setMontoQr] =
    useState("");

  const [
    montoRecibido,
    setMontoRecibido,
  ] = useState("");

  const [
    referenciaQr,
    setReferenciaQr,
  ] = useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [
    resumenConfirmacion,
    setResumenConfirmacion,
  ] = useState<ResumenConfirmacion | null>(
    null,
  );

  const mapaCategorias = useMemo(
    () =>
      new Map(
        categorias.map((categoria) => [
          categoria.id,
          categoria.nombre,
        ]),
      ),
    [categorias],
  );

  const productosDisponibles = useMemo(
    () =>
      productos.filter(
        (producto) =>
          producto.estado === "Activo" &&
          producto.disponible,
      ),
    [productos],
  );

  const resultadosProductos = useMemo(
    () => {
      const texto = normalizarBusqueda(
        busquedaProducto,
      );

      return productosDisponibles
        .filter((producto) => {
          if (!texto) {
            return true;
          }

          return (
            normalizarBusqueda(
              producto.nombre,
            ).includes(texto) ||
            normalizarBusqueda(
              producto.codigo,
            ).includes(texto)
          );
        })
        .slice(
          0,
          MAXIMO_RESULTADOS_PRODUCTOS,
        );
    }, [
      busquedaProducto,
      productosDisponibles,
    ],
  );

  const clientesDisponibles = useMemo(
    () =>
      clientes.filter(
        (cliente) =>
          !cliente.archivado,
      ),
    [clientes],
  );

  const resultadosClientes = useMemo(
    () => {
      const texto = normalizarBusqueda(
        busquedaCliente,
      );

      return clientesDisponibles
        .filter((cliente) => {
          if (!texto) {
            return true;
          }

          return [
            cliente.nombreCompleto,
            cliente.numeroDocumento ?? "",
            cliente.telefono ?? "",
          ].some((valor) =>
            normalizarBusqueda(
              valor,
            ).includes(texto),
          );
        })
        .slice(
          0,
          MAXIMO_RESULTADOS_CLIENTES,
        );
    }, [
      busquedaCliente,
      clientesDisponibles,
    ],
  );

  const clienteSeleccionado = useMemo(
    () =>
      clienteSeleccionadoId === null
        ? null
        : clientesDisponibles.find(
            (cliente) =>
              cliente.id ===
              clienteSeleccionadoId,
          ) ?? null,
    [
      clienteSeleccionadoId,
      clientesDisponibles,
    ],
  );

  const tipoClienteActual:
    TipoClienteVenta = clienteSeleccionado
      ? "Registrado"
      : busquedaCliente.trim()
        ? "Ocasional"
        : "Consumidor final";

  const subtotal = useMemo(
    () =>
      redondearMoneda(
        carrito.reduce(
          (acumulado, item) =>
            acumulado +
            item.precio * item.cantidad,
          0,
        ),
      ),
    [carrito],
  );

  const cantidadUnidades = useMemo(
    () =>
      carrito.reduce(
        (acumulado, item) =>
          acumulado + item.cantidad,
        0,
      ),
    [carrito],
  );

  const valorDescuentoNumerico =
    convertirNumero(valorDescuento);

  const montoDescuento = useMemo(() => {
    if (
      tipoDescuento === "Ninguno"
    ) {
      return 0;
    }

    if (
      tipoDescuento === "Porcentaje"
    ) {
      if (
        valorDescuentoNumerico <= 0 ||
        valorDescuentoNumerico >= 100
      ) {
        return 0;
      }

      return redondearMoneda(
        subtotal *
          (valorDescuentoNumerico / 100),
      );
    }

    if (
      valorDescuentoNumerico <= 0 ||
      valorDescuentoNumerico >= subtotal
    ) {
      return 0;
    }

    return redondearMoneda(
      valorDescuentoNumerico,
    );
  }, [
    subtotal,
    tipoDescuento,
    valorDescuentoNumerico,
  ]);

  const totalFinal = redondearMoneda(
    Math.max(
      0,
      subtotal - montoDescuento,
    ),
  );

  const montoQrNumerico =
    redondearMoneda(
      Math.max(
        0,
        convertirNumero(montoQr),
      ),
    );

  const montoRecibidoNumerico =
    redondearMoneda(
      Math.max(
        0,
        convertirNumero(
          montoRecibido,
        ),
      ),
    );

  const efectivoNecesario =
    redondearMoneda(
      Math.max(
        0,
        totalFinal - montoQrNumerico,
      ),
    );

  const cambio = redondearMoneda(
    Math.max(
      0,
      montoRecibidoNumerico -
        efectivoNecesario,
    ),
  );

  const faltante = redondearMoneda(
    Math.max(
      0,
      efectivoNecesario -
        montoRecibidoNumerico,
    ),
  );

  const metodoDetectado = useMemo(() => {
    if (
      !puedeCobrar ||
      !cajaAbierta ||
      totalFinal <= 0 ||
      montoQrNumerico > totalFinal
    ) {
      return null;
    }

    if (
      montoQrNumerico === totalFinal
    ) {
      return "QR" as const;
    }

    if (
      montoQrNumerico === 0 &&
      montoRecibidoNumerico >=
        totalFinal
    ) {
      return "Efectivo" as const;
    }

    if (
      montoQrNumerico > 0 &&
      montoQrNumerico < totalFinal &&
      montoRecibidoNumerico >=
        efectivoNecesario
    ) {
      return "Mixto" as const;
    }

    return null;
  }, [
    cajaAbierta,
    efectivoNecesario,
    montoQrNumerico,
    montoRecibidoNumerico,
    puedeCobrar,
    totalFinal,
  ]);

  const pagoHabilitado =
    puedeCobrar &&
    cajaAbierta !== null;

  useEffect(() => {
    function manejarAtajos(
      evento: globalThis.KeyboardEvent,
    ) {
      if (
        evento.altKey &&
        !evento.ctrlKey &&
        !evento.metaKey &&
        evento.code === "KeyB"
      ) {
        evento.preventDefault();
        buscadorProductoRef.current?.focus();
        setResultadosProductoAbiertos(
          true,
        );
        return;
      }

      if (
        evento.altKey &&
        !evento.ctrlKey &&
        !evento.metaKey &&
        evento.code === "KeyC"
      ) {
        evento.preventDefault();
        buscadorClienteRef.current?.focus();
        setResultadosClienteAbiertos(
          true,
        );
        return;
      }

      if (
        evento.ctrlKey &&
        !evento.altKey &&
        !evento.metaKey &&
        evento.code === "Enter"
      ) {
        evento.preventDefault();
        buscadorProductoRef.current
          ?.form?.requestSubmit();
      }
    }

    window.addEventListener(
      "keydown",
      manejarAtajos,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        manejarAtajos,
      );
    };
  }, []);

  function agregarProducto(
    producto: ProductoMenu,
  ) {
    setError(null);

    setCarrito((carritoActual) => {
      const existente =
        carritoActual.find(
          (item) =>
            item.productoId ===
            producto.id,
        );

      if (existente) {
        return carritoActual.map(
          (item) =>
            item.productoId ===
            producto.id
              ? {
                  ...item,
                  cantidad: Math.min(
                    50,
                    item.cantidad + 1,
                  ),
                }
              : item,
        );
      }

      return [
        ...carritoActual,
        {
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          observacion: "",
        },
      ];
    });

    buscadorProductoRef.current?.focus();
  }

  function cambiarCantidad(
    productoId: number,
    cantidad: number,
  ) {
    const cantidadSegura = Math.min(
      50,
      Math.max(
        1,
        Number.isFinite(cantidad)
          ? Math.trunc(cantidad)
          : 1,
      ),
    );

    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad: cantidadSegura,
            }
          : item,
      ),
    );
  }

  function cambiarObservacion(
    productoId: number,
    observacion: string,
  ) {
    setCarrito((carritoActual) =>
      carritoActual.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              observacion,
            }
          : item,
      ),
    );
  }

  function quitarProducto(
    productoId: number,
  ) {
    setCarrito((carritoActual) =>
      carritoActual.filter(
        (item) =>
          item.productoId !==
          productoId,
      ),
    );
  }

  function seleccionarCliente(
    cliente: Cliente,
  ) {
    setBusquedaCliente(
      cliente.nombreCompleto,
    );
    setClienteSeleccionadoId(
      cliente.id,
    );
    setResultadosClienteAbiertos(
      false,
    );
    setError(null);
  }

  function manejarTeclaProducto(
    evento: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      resultadosProductos.length === 0
    ) {
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceProductoActivo(
        (indiceActual) =>
          Math.min(
            resultadosProductos.length - 1,
            indiceActual + 1,
          ),
      );
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceProductoActivo(
        (indiceActual) =>
          Math.max(
            0,
            indiceActual - 1,
          ),
      );
      return;
    }

    if (evento.key === "Enter") {
      evento.preventDefault();
      agregarProducto(
        resultadosProductos[
          indiceProductoActivo
        ],
      );
      return;
    }

    if (evento.key === "Escape") {
      setResultadosProductoAbiertos(
        false,
      );
    }
  }

  function manejarTeclaCliente(
    evento: KeyboardEvent<HTMLInputElement>,
  ) {
    if (evento.key === "Escape") {
      setResultadosClienteAbiertos(
        false,
      );
      return;
    }

    if (
      resultadosClientes.length === 0
    ) {
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceClienteActivo(
        (indiceActual) =>
          Math.min(
            resultadosClientes.length - 1,
            indiceActual + 1,
          ),
      );
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceClienteActivo(
        (indiceActual) =>
          Math.max(
            0,
            indiceActual - 1,
          ),
      );
      return;
    }

    if (evento.key === "Enter") {
      evento.preventDefault();
      seleccionarCliente(
        resultadosClientes[
          indiceClienteActivo
        ],
      );
    }
  }

  function cambiarTipoDescuento(
    nuevoTipo: TipoDescuento,
  ) {
    setTipoDescuento(nuevoTipo);
    setValorDescuento("");
    setMotivoDescuento("");
    setError(null);
  }

  function quitarDescuento() {
    setMostrarDescuento(false);
    cambiarTipoDescuento("Ninguno");
  }

  function limpiarFormulario() {
    setBusquedaProducto("");
    setResultadosProductoAbiertos(
      false,
    );
    setBusquedaCliente("");
    setClienteSeleccionadoId(null);
    setResultadosClienteAbiertos(
      false,
    );
    setObservaciones("");
    setCarrito([]);
    setTipoDescuento("Ninguno");
    setValorDescuento("");
    setMotivoDescuento("");
    setMostrarDescuento(false);
    setMontoQr("");
    setMontoRecibido("");
    setReferenciaQr("");
    setError(null);
    setResumenConfirmacion(null);
    alLimpiar();

    window.setTimeout(() => {
      buscadorProductoRef.current?.focus();
    }, 0);
  }

  function prepararResumen():
    ResumenConfirmacion | null {
    if (!puedeCobrar) {
      setError(
        "Tu usuario no tiene permiso para operar una caja y no puede registrar ventas.",
      );
      return null;
    }

    if (!cajaAbierta) {
      setError(
        "Debes abrir tu propia caja antes de registrar una venta.",
      );
      return null;
    }

    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto al pedido.",
      );
      return null;
    }

    if (
      observaciones.trim().length > 300
    ) {
      setError(
        "Las observaciones generales no pueden superar los 300 caracteres.",
      );
      return null;
    }

    const itemConObservacionExtensa =
      carrito.find(
        (item) =>
          item.observacion.trim().length >
          120,
      );

    if (itemConObservacionExtensa) {
      setError(
        `La observación de “${itemConObservacionExtensa.nombre}” no puede superar los 120 caracteres.`,
      );
      return null;
    }

    const nombreCliente =
      busquedaCliente.trim();

    if (
      tipoClienteActual ===
        "Ocasional" &&
      nombreCliente.length < 2
    ) {
      setError(
        "El nombre del cliente ocasional debe contener al menos 2 caracteres.",
      );
      return null;
    }

    if (nombreCliente.length > 100) {
      setError(
        "El nombre del cliente no puede superar los 100 caracteres.",
      );
      return null;
    }

    if (
      montoQrNumerico > totalFinal
    ) {
      setError(
        "El monto en QR no puede superar el total por cobrar.",
      );
      return null;
    }

    if (
      tipoDescuento !== "Ninguno"
    ) {
      if (
        valorDescuentoNumerico <= 0
      ) {
        setError(
          "Ingresa un valor de descuento válido.",
        );
        return null;
      }

      if (
        tipoDescuento ===
          "Porcentaje" &&
        valorDescuentoNumerico >= 100
      ) {
        setError(
          "El porcentaje de descuento debe ser menor al 100 %.",
        );
        return null;
      }

      if (
        tipoDescuento ===
          "Monto fijo" &&
        valorDescuentoNumerico >= subtotal
      ) {
        setError(
          "El descuento fijo debe ser menor al subtotal.",
        );
        return null;
      }

      if (
        motivoDescuento.trim().length < 5
      ) {
        setError(
          "Indica un motivo de descuento de al menos 5 caracteres.",
        );
        return null;
      }

      if (!metodoDetectado) {
        setError(
          "Para aplicar un descuento debes completar el cobro. Los pedidos pendientes conservan su total original.",
        );
        return null;
      }
    }

    const datos: CrearVentaDto = {
      tipoCliente:
        tipoClienteActual,
      clienteId:
        tipoClienteActual ===
        "Registrado"
          ? clienteSeleccionado?.id ??
            null
          : null,
      clienteNombre:
        tipoClienteActual ===
        "Ocasional"
          ? nombreCliente
          : null,
      detalles: carrito.map(
        (item) => ({
          productoId:
            item.productoId,
          cantidad: item.cantidad,
          observacion:
            item.observacion.trim() ||
            null,
        }),
      ),
      observaciones:
        observaciones.trim() || null,
    };

    const cobro: DatosCobroIntegrado | null =
      metodoDetectado
        ? {
            tipoDescuento,
            valorDescuento:
              tipoDescuento ===
              "Ninguno"
                ? 0
                : valorDescuentoNumerico,
            motivoDescuento:
              tipoDescuento ===
              "Ninguno"
                ? null
                : motivoDescuento.trim(),
            metodoPago:
              metodoDetectado,
            montoEfectivo:
              metodoDetectado === "QR"
                ? 0
                : efectivoNecesario,
            montoRecibido:
              metodoDetectado === "QR"
                ? 0
                : montoRecibidoNumerico,
            referenciaQr:
              metodoDetectado ===
                "Efectivo" ||
              !referenciaQr.trim()
                ? null
                : referenciaQr.trim(),
          }
        : null;

    setError(null);

    return {
      datos,
      cobro,
      nombreCliente:
        tipoClienteActual ===
        "Consumidor final"
          ? "Consumidor final"
          : tipoClienteActual ===
              "Registrado"
            ? clienteSeleccionado
                ?.nombreCompleto ??
              nombreCliente
            : nombreCliente,
      subtotal,
      montoDescuento:
        cobro ? montoDescuento : 0,
      totalFinal:
        cobro ? totalFinal : subtotal,
      montoQr:
        cobro &&
        cobro.metodoPago !==
          "Efectivo"
          ? montoQrNumerico
          : 0,
      efectivoAplicado:
        cobro
          ? cobro.montoEfectivo
          : 0,
      montoRecibido:
        cobro
          ? cobro.montoRecibido
          : 0,
      cambio:
        cobro ? cambio : 0,
      faltante:
        cobro ? 0 : faltante,
    };
  }

  function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    const resumen =
      prepararResumen();

    if (resumen) {
      setResumenConfirmacion(
        resumen,
      );
    }
  }

  async function confirmarPedido() {
    if (!resumenConfirmacion) {
      return;
    }

    await alGuardar(
      resumenConfirmacion.datos,
      resumenConfirmacion.cobro,
    );

    setResumenConfirmacion(null);
  }

  return (
    <>
      <form
        onSubmit={manejarEnvio}
        noValidate
        className="flex min-h-[48rem] flex-col gap-4 p-4 sm:p-5"
      >
        <section className="grid gap-3 lg:grid-cols-2">
          <div className="relative">
            <label
              htmlFor="buscador-productos-venta"
              className="text-xs font-black uppercase tracking-wide text-slate-500"
            >
              Buscar producto
            </label>

            <div className="relative mt-1.5">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={buscadorProductoRef}
                id="buscador-productos-venta"
                type="search"
                value={busquedaProducto}
                disabled={cargando}
                autoComplete="off"
                placeholder="Nombre o código del producto"
                onFocus={() =>
                  setResultadosProductoAbiertos(
                    true,
                  )
                }
                onBlur={() => {
                  window.setTimeout(() => {
                    setResultadosProductoAbiertos(
                      false,
                    );
                  }, 60);
                }}
                onChange={(evento) => {
                  setBusquedaProducto(
                    evento.target.value,
                  );
                  setIndiceProductoActivo(0);
                  setResultadosProductoAbiertos(
                    true,
                  );
                }}
                onKeyDown={
                  manejarTeclaProducto
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100 [.tema-oscuro_&]:placeholder:text-slate-500 [.tema-oscuro_&]:focus:ring-roma-950/60"
              />

              {busquedaProducto && (
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => {
                    setBusquedaProducto("");
                    setIndiceProductoActivo(0);
                    buscadorProductoRef.current?.focus();
                  }}
                  aria-label="Limpiar búsqueda de productos"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 [.tema-oscuro_&]:hover:bg-slate-800 [.tema-oscuro_&]:hover:text-slate-100"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {resultadosProductoAbiertos && (
              <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-flotante [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
                {resultadosProductos.length ===
                0 ? (
                  <div className="p-5 text-center text-sm text-slate-500">
                    No se encontraron productos disponibles.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {resultadosProductos.map(
                      (producto, indice) => (
                        <button
                          key={producto.id}
                          type="button"
                          disabled={cargando}
                          onMouseDown={(evento) =>
                            evento.preventDefault()
                          }
                          onDoubleClick={() =>
                            agregarProducto(
                              producto,
                            )
                          }
                          onMouseEnter={() =>
                            setIndiceProductoActivo(
                              indice,
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left transition-colors ${
                            indiceProductoActivo ===
                            indice
                              ? "border-roma-500 bg-slate-100 pl-2 [.tema-oscuro_&]:bg-slate-800"
                              : "border-transparent hover:bg-slate-50 [.tema-oscuro_&]:hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-200">
                            {producto.nombre
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                                {producto.nombre}
                              </p>

                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-300">
                                {producto.codigo}
                              </span>
                            </div>

                            <p className="mt-0.5 truncate text-xs text-slate-500 [.tema-oscuro_&]:text-slate-400">
                              {mapaCategorias.get(
                                producto.categoriaId,
                              ) ?? "Sin categoría"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                              {formatearMoneda(
                                producto.precio,
                              )}
                            </p>

                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-roma-700 [.tema-oscuro_&]:text-roma-300">
                              <Plus size={12} />
                              Agregar
                            </span>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <label
              htmlFor="buscador-cliente-venta"
              className="text-xs font-black uppercase tracking-wide text-slate-500"
            >
              Nombre del cliente
            </label>

            <div className="relative mt-1.5">
              <UserRound
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={buscadorClienteRef}
                id="buscador-cliente-venta"
                type="text"
                value={busquedaCliente}
                disabled={cargando}
                autoComplete="off"
                placeholder="Consumidor final o escriba un nombre"
                onFocus={() =>
                  setResultadosClienteAbiertos(
                    true,
                  )
                }
                onBlur={() => {
                  window.setTimeout(() => {
                    setResultadosClienteAbiertos(
                      false,
                    );
                  }, 60);
                }}
                onChange={(evento) => {
                  setBusquedaCliente(
                    evento.target.value,
                  );
                  setClienteSeleccionadoId(null);
                  setIndiceClienteActivo(0);
                  setResultadosClienteAbiertos(
                    true,
                  );
                }}
                onKeyDown={manejarTeclaCliente}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100 [.tema-oscuro_&]:placeholder:text-slate-500 [.tema-oscuro_&]:focus:ring-roma-950/60"
              />

              {busquedaCliente && (
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => {
                    setBusquedaCliente("");
                    setClienteSeleccionadoId(null);
                    setIndiceClienteActivo(0);
                    buscadorClienteRef.current?.focus();
                  }}
                  aria-label="Usar consumidor final"
                  title="Usar consumidor final"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 [.tema-oscuro_&]:hover:bg-slate-800 [.tema-oscuro_&]:hover:text-slate-100"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={`rounded-full border px-2.5 py-1 font-black ${
                  tipoClienteActual ===
                  "Registrado"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 [.tema-oscuro_&]:border-emerald-500/50 [.tema-oscuro_&]:bg-emerald-500/10 [.tema-oscuro_&]:text-emerald-200"
                    : tipoClienteActual ===
                        "Ocasional"
                      ? "border-blue-300 bg-blue-50 text-blue-700 [.tema-oscuro_&]:border-blue-500/50 [.tema-oscuro_&]:bg-blue-500/10 [.tema-oscuro_&]:text-blue-200"
                      : "border-slate-300 bg-slate-100 text-slate-600 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-200"
                }`}
              >
                {tipoClienteActual}
              </span>

              <span className="text-slate-500 [.tema-oscuro_&]:text-slate-400">
                {tipoClienteActual ===
                "Ocasional"
                  ? "Se guardará solo en este pedido."
                  : tipoClienteActual ===
                      "Registrado"
                    ? "Vinculado al módulo Clientes."
                    : "No se asociará un cliente."}
              </span>
            </div>

            {resultadosClienteAbiertos && (
              <div className="absolute inset-x-0 top-[4.6rem] z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-flotante [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
                <button
                  type="button"
                  onMouseDown={(evento) =>
                    evento.preventDefault()
                  }
                  onClick={() => {
                    setBusquedaCliente("");
                    setClienteSeleccionadoId(null);
                    setResultadosClienteAbiertos(
                      false,
                    );
                  }}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 [.tema-oscuro_&]:border-slate-800 [.tema-oscuro_&]:hover:bg-slate-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-300">
                    <CircleUserRound size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                      Consumidor final
                    </p>
                    <p className="text-xs text-slate-500 [.tema-oscuro_&]:text-slate-400">
                      Continuar sin asociar un cliente.
                    </p>
                  </div>
                </button>

                {resultadosClientes.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto p-2">
                    {resultadosClientes.map(
                      (cliente, indice) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onMouseDown={(evento) =>
                            evento.preventDefault()
                          }
                          onClick={() =>
                            seleccionarCliente(
                              cliente,
                            )
                          }
                          onMouseEnter={() =>
                            setIndiceClienteActivo(
                              indice,
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left transition-colors ${
                            indiceClienteActivo ===
                            indice
                              ? "border-emerald-500 bg-slate-100 pl-2 [.tema-oscuro_&]:bg-slate-800"
                              : "border-transparent hover:bg-slate-50 [.tema-oscuro_&]:hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 [.tema-oscuro_&]:bg-emerald-500/10 [.tema-oscuro_&]:text-emerald-300">
                            <UserRound size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                              {cliente.nombreCompleto}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500 [.tema-oscuro_&]:text-slate-400">
                              {[cliente.numeroDocumento, cliente.telefono]
                                .filter(Boolean)
                                .join(" · ") || "Cliente registrado"}
                            </p>
                          </div>

                          {clienteSeleccionadoId ===
                            cliente.id && (
                            <Check
                              size={17}
                              className="text-emerald-600"
                            />
                          )}
                        </button>
                      ),
                    )}
                  </div>
                ) : (
                  busquedaCliente.trim() && (
                    <div className="border-t border-slate-100 px-4 py-3 [.tema-oscuro_&]:border-slate-800">
                      <p className="text-xs font-bold text-blue-700 [.tema-oscuro_&]:text-blue-300">
                        Se usará “{busquedaCliente.trim()}” como cliente ocasional.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between [.tema-oscuro_&]:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-roma-50 text-roma-700 [.tema-oscuro_&]:bg-roma-500/10 [.tema-oscuro_&]:text-roma-300">
                <ShoppingCart size={20} />
              </div>

              <div>
                <h2 className="font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                  Detalle del pedido
                </h2>
                <p className="text-xs text-slate-500 [.tema-oscuro_&]:text-slate-400">
                  {carrito.length} producto(s) · {cantidadUnidades} unidad(es)
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 px-4 py-2 text-right text-white">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Subtotal
              </p>
              <p className="text-lg font-black">
                {formatearMoneda(subtotal)}
              </p>
            </div>
          </div>

          {carrito.length === 0 ? (
            <div className="flex min-h-64 flex-1 flex-col items-center justify-center p-6 text-center">
              <ClipboardList
                size={34}
                className="text-slate-300"
              />
              <p className="mt-3 font-black text-slate-800 [.tema-oscuro_&]:text-slate-200">
                El pedido está vacío
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Busca un producto y agrégalo al pedido.
              </p>
            </div>
          ) : (
            <div className="min-h-64 max-h-[24rem] flex-1 overflow-y-auto">
              <div className="hidden grid-cols-[minmax(170px,1.1fr)_118px_minmax(190px,1fr)_105px_42px] gap-3 border-b border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-400 lg:grid [.tema-oscuro_&]:border-slate-800">
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Observación</span>
                <span className="text-right">Valor</span>
                <span />
              </div>

              <div className="divide-y divide-slate-100 [.tema-oscuro_&]:divide-slate-800">
                {carrito.map((item) => (
                  <article
                    key={item.productoId}
                    className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(170px,1.1fr)_118px_minmax(190px,1fr)_105px_42px] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                          {item.nombre}
                        </p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-300">
                          {item.codigo}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatearMoneda(item.precio)} por unidad
                      </p>
                    </div>

                    <div className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-slate-50 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-800">
                      <button
                        type="button"
                        disabled={cargando || item.cantidad <= 1}
                        onClick={() =>
                          cambiarCantidad(
                            item.productoId,
                            item.cantidad - 1,
                          )
                        }
                        className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 [.tema-oscuro_&]:text-slate-300 [.tema-oscuro_&]:hover:bg-slate-700"
                      >
                        <Minus size={15} />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={item.cantidad}
                        disabled={cargando}
                        onChange={(evento) =>
                          cambiarCantidad(
                            item.productoId,
                            Number(evento.target.value),
                          )
                        }
                        className="h-9 w-11 border-x border-slate-200 bg-white text-center text-sm font-black text-slate-900 outline-none [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100"
                      />

                      <button
                        type="button"
                        disabled={cargando || item.cantidad >= 50}
                        onClick={() =>
                          cambiarCantidad(
                            item.productoId,
                            item.cantidad + 1,
                          )
                        }
                        className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 [.tema-oscuro_&]:text-slate-300 [.tema-oscuro_&]:hover:bg-slate-700"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item.observacion}
                      disabled={cargando}
                      maxLength={120}
                      placeholder="Ej. sin cebolla"
                      onChange={(evento) =>
                        cambiarObservacion(
                          item.productoId,
                          evento.target.value,
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100 [.tema-oscuro_&]:placeholder:text-slate-500"
                    />

                    <p className="text-left text-sm font-black text-slate-900 lg:text-right [.tema-oscuro_&]:text-slate-100">
                      {formatearMoneda(
                        item.precio * item.cantidad,
                      )}
                    </p>

                    <button
                      type="button"
                      disabled={cargando}
                      onClick={() =>
                        quitarProducto(item.productoId)
                      }
                      aria-label={`Quitar ${item.nombre}`}
                      title="Quitar producto"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 [.tema-oscuro_&]:border-red-500/30 [.tema-oscuro_&]:bg-red-500/10 [.tema-oscuro_&]:text-red-300 [.tema-oscuro_&]:hover:bg-red-500/20"
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <div className="space-y-3">
            <label>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Observaciones generales
              </span>
              <textarea
                value={observaciones}
                disabled={cargando}
                maxLength={300}
                rows={3}
                placeholder="Indicaciones generales para todo el pedido"
                onChange={(evento) =>
                  setObservaciones(evento.target.value)
                }
                className="mt-1.5 min-h-24 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-roma-500 focus:ring-4 focus:ring-roma-100 disabled:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100 [.tema-oscuro_&]:placeholder:text-slate-500"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={cargando}
                onClick={alAbrirHistorial}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-200 [.tema-oscuro_&]:hover:bg-slate-800"
              >
                <History size={17} />
                Historial
              </button>

              <button
                type="button"
                disabled={
                  cargando ||
                  (carrito.length === 0 &&
                    !busquedaCliente &&
                    !observaciones)
                }
                onClick={limpiarFormulario}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-200 [.tema-oscuro_&]:hover:bg-slate-800"
              >
                <X size={17} />
                Limpiar pedido
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards
                  size={18}
                  className="text-emerald-600"
                />
                <h3 className="font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                  Cobro integrado
                </h3>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                  metodoDetectado
                    ? "bg-emerald-100 text-emerald-700 [.tema-oscuro_&]:bg-emerald-500/15 [.tema-oscuro_&]:text-emerald-200"
                    : "bg-amber-100 text-amber-700 [.tema-oscuro_&]:bg-amber-500/15 [.tema-oscuro_&]:text-amber-200"
                }`}
              >
                {metodoDetectado ?? "Pendiente"}
              </span>
            </div>

            {!pagoHabilitado && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 [.tema-oscuro_&]:border-amber-500/30 [.tema-oscuro_&]:bg-amber-500/10 [.tema-oscuro_&]:text-amber-200">
                {puedeCobrar
                  ? "Debes abrir tu propia caja antes de registrar pedidos y cobros."
                  : "Tu usuario no tiene permiso para operar una caja ni registrar ventas."}
              </div>
            )}

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950">
              {!mostrarDescuento ? (
                <button
                  type="button"
                  disabled={cargando || !pagoHabilitado}
                  onClick={() =>
                    setMostrarDescuento(true)
                  }
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 [.tema-oscuro_&]:hover:bg-slate-900"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700 [.tema-oscuro_&]:text-slate-200">
                    <Tag
                      size={16}
                      className="text-roma-600 [.tema-oscuro_&]:text-roma-300"
                    />
                    Aplicar descuento
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-400">
                    Opcional
                  </span>
                </button>
              ) : (
                <div className="space-y-3 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                        Configurar descuento
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-500 [.tema-oscuro_&]:text-slate-400">
                        Selecciona el tipo e indica el motivo.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={cargando}
                      onClick={quitarDescuento}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-300 [.tema-oscuro_&]:hover:bg-slate-800 [.tema-oscuro_&]:hover:text-white"
                    >
                      <X size={14} />
                      Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(["Porcentaje", "Monto fijo"] as TipoDescuento[]).map(
                      (tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          disabled={cargando || !pagoHabilitado}
                          onClick={() =>
                            cambiarTipoDescuento(tipo)
                          }
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-40 ${
                            tipoDescuento === tipo
                              ? "border-roma-500 bg-roma-50 text-roma-700 [.tema-oscuro_&]:bg-roma-500/10 [.tema-oscuro_&]:text-roma-200"
                              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-300 [.tema-oscuro_&]:hover:bg-slate-800"
                          }`}
                        >
                          {tipo === "Monto fijo"
                            ? "Monto fijo"
                            : "Porcentaje"}
                        </button>
                      ),
                    )}
                  </div>

                  {tipoDescuento === "Ninguno" ? (
                    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-center text-xs text-slate-500 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:text-slate-400">
                      Elige porcentaje o monto fijo para continuar.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="relative">
                        <Tag
                          size={15}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={valorDescuento}
                          disabled={cargando || !pagoHabilitado}
                          placeholder={
                            tipoDescuento === "Porcentaje"
                              ? "%"
                              : "Bs"
                          }
                          onChange={(evento) =>
                            setValorDescuento(evento.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-500 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100"
                        />
                      </div>

                      <input
                        type="text"
                        value={motivoDescuento}
                        disabled={cargando || !pagoHabilitado}
                        maxLength={200}
                        placeholder="Motivo del descuento"
                        onChange={(evento) =>
                          setMotivoDescuento(evento.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-roma-500 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900 [.tema-oscuro_&]:text-slate-100"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Monto en QR
                </span>
                <div className="relative mt-1">
                  <QrCode
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoQr}
                    disabled={cargando || !pagoHabilitado}
                    placeholder="0,00"
                    onChange={(evento) =>
                      setMontoQr(evento.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-500 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-slate-100"
                  />
                </div>
              </label>

              <label>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Efectivo recibido
                </span>
                <div className="relative mt-1">
                  <CircleDollarSign
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoRecibido}
                    disabled={
                      cargando ||
                      !pagoHabilitado ||
                      montoQrNumerico === totalFinal
                    }
                    placeholder="0,00"
                    onChange={(evento) =>
                      setMontoRecibido(evento.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-roma-500 disabled:bg-slate-100 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-slate-100 [.tema-oscuro_&]:disabled:bg-slate-800"
                  />
                </div>
              </label>
            </div>

            {montoQrNumerico > 0 && (
              <input
                type="text"
                value={referenciaQr}
                disabled={cargando || !pagoHabilitado}
                maxLength={100}
                placeholder="Referencia QR opcional"
                onChange={(evento) =>
                  setReferenciaQr(evento.target.value)
                }
                className="mt-2 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-roma-500 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-950 [.tema-oscuro_&]:text-slate-100"
              />
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3 [.tema-oscuro_&]:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Total final
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                  {formatearMoneda(totalFinal)}
                </p>
                {montoDescuento > 0 && (
                  <p className="mt-1 text-[10px] font-bold text-roma-600">
                    Descuento: - {formatearMoneda(montoDescuento)}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 [.tema-oscuro_&]:bg-emerald-500/10">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 [.tema-oscuro_&]:text-emerald-300">
                  Cambio
                </p>
                <p className="mt-1 text-lg font-black text-emerald-700 [.tema-oscuro_&]:text-emerald-300">
                  {formatearMoneda(cambio)}
                </p>
                {!metodoDetectado &&
                  pagoHabilitado &&
                  totalFinal > 0 && (
                    <p className="mt-1 text-[10px] font-bold text-amber-700 [.tema-oscuro_&]:text-amber-300">
                      Faltan {formatearMoneda(faltante)}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {error ? (
            <div
              role="alert"
              className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 [.tema-oscuro_&]:border-red-500/30 [.tema-oscuro_&]:bg-red-500/10 [.tema-oscuro_&]:text-red-200"
            >
              {error}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {metodoDetectado
                ? `El pedido se registrará cobrado mediante ${metodoDetectado}.`
                : pagoHabilitado
                  ? "Si el pago no cubre el total, el pedido quedará pendiente dentro de tu caja."
                  : "Abre tu caja para habilitar el registro del pedido."}
            </p>
          )}

          <button
            type="submit"
            disabled={
              cargando ||
              carrito.length === 0 ||
              !pagoHabilitado
            }
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-roma-700 px-6 text-sm font-bold text-white shadow-lg shadow-roma-900/15 transition-colors hover:bg-roma-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <ClipboardCheck size={18} />
            )}

            {metodoDetectado
              ? "Revisar y cobrar"
              : "Revisar pedido"}
          </button>
        </div>
      </form>

      <Modal
        abierto={
          resumenConfirmacion !== null
        }
        titulo="Confirmar pedido"
        descripcion="Revisa el resumen antes de registrar la operación y generar el ticket."
        ancho="grande"
        alCerrar={() => {
          if (!cargando) {
            setResumenConfirmacion(null);
          }
        }}
      >
        {resumenConfirmacion && (
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-roma-600">
                    Pre-resumen
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                    {resumenConfirmacion.nombreCliente}
                  </h3>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 [.tema-oscuro_&]:bg-slate-800 [.tema-oscuro_&]:text-slate-200">
                  {cantidadUnidades} unidad(es)
                </span>
              </div>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {carrito.map((item) => (
                  <div
                    key={item.productoId}
                    className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 [.tema-oscuro_&]:bg-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                        {item.cantidad}× {item.nombre}
                      </p>
                      {item.observacion.trim() && (
                        <p className="mt-1 text-xs italic text-slate-500 [.tema-oscuro_&]:text-slate-400">
                          {item.observacion.trim()}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-black text-slate-900 [.tema-oscuro_&]:text-slate-100">
                      {formatearMoneda(
                        item.precio * item.cantidad,
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {observaciones.trim() && (
                <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm text-slate-600 [.tema-oscuro_&]:border-slate-700 [.tema-oscuro_&]:text-slate-300">
                  <strong>Observaciones:</strong>{" "}
                  {observaciones.trim()}
                </div>
              )}
            </section>

            <aside className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-2">
                <ReceiptText
                  size={20}
                  className="text-roma-300"
                />
                <h3 className="font-black">
                  Resumen económico
                </h3>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3 text-slate-300">
                  <span>Subtotal</span>
                  <strong className="text-white">
                    {formatearMoneda(
                      resumenConfirmacion.subtotal,
                    )}
                  </strong>
                </div>

                {resumenConfirmacion.montoDescuento > 0 && (
                  <div className="flex justify-between gap-3 text-amber-300">
                    <span>Descuento</span>
                    <strong>
                      - {formatearMoneda(
                        resumenConfirmacion.montoDescuento,
                      )}
                    </strong>
                  </div>
                )}

                <div className="flex justify-between gap-3 border-t border-white/10 pt-3 text-lg font-black">
                  <span>Total</span>
                  <span>
                    {formatearMoneda(
                      resumenConfirmacion.totalFinal,
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-black">
                  {resumenConfirmacion.cobro ? (
                    <CreditCard
                      size={18}
                      className="text-emerald-300"
                    />
                  ) : (
                    <WalletCards
                      size={18}
                      className="text-amber-300"
                    />
                  )}
                  {resumenConfirmacion.cobro
                    ? resumenConfirmacion.cobro.metodoPago
                    : "Pendiente de cobro"}
                </div>

                {resumenConfirmacion.cobro ? (
                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    {resumenConfirmacion.montoQr > 0 && (
                      <p>
                        QR: {formatearMoneda(
                          resumenConfirmacion.montoQr,
                        )}
                      </p>
                    )}
                    {resumenConfirmacion.efectivoAplicado > 0 && (
                      <p>
                        Efectivo aplicado: {formatearMoneda(
                          resumenConfirmacion.efectivoAplicado,
                        )}
                      </p>
                    )}
                    {resumenConfirmacion.montoRecibido > 0 && (
                      <p>
                        Recibido: {formatearMoneda(
                          resumenConfirmacion.montoRecibido,
                        )}
                      </p>
                    )}
                    <p className="font-black text-emerald-300">
                      Cambio: {formatearMoneda(
                        resumenConfirmacion.cambio,
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    No se registrará un pago parcial. El pedido permanecerá en la cola hasta completar el cobro.
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-2">
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() =>
                    void confirmarPedido()
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-roma-700 px-4 text-sm font-bold text-white transition-colors hover:bg-roma-800 disabled:opacity-50"
                >
                  {cargando ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <ClipboardCheck size={17} />
                  )}
                  {resumenConfirmacion.cobro
                    ? "Confirmar y cobrar"
                    : "Confirmar pendiente"}
                </button>

                <button
                  type="button"
                  disabled={cargando}
                  onClick={() =>
                    setResumenConfirmacion(null)
                  }
                  className="h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  Volver a editar
                </button>
              </div>
            </aside>
          </div>
        )}
      </Modal>
    </>
  );
}

export default FormularioVenta;
