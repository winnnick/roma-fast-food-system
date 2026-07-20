import {
  ClipboardList,
  LoaderCircle,
  Minus,
  Plus,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  CategoriaProducto,
  ProductoMenu,
} from "../../tipos/producto";

import type {
  Cliente,
} from "../../tipos/cliente";

import type {
  CrearVentaDto,
} from "../../tipos/venta";

interface FormularioVentaProps {
  productos: ProductoMenu[];
  categorias: CategoriaProducto[];
  clientes: Cliente[];
  cargando: boolean;

  alGuardar: (
    datos: CrearVentaDto,
  ) => Promise<void>;

  alLimpiar: () => void;
}

interface ItemCarrito {
  productoId: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  observacion: string;
  imagenUrl: string | null;
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

function FormularioVenta({
  productos,
  categorias,
  clientes,
  cargando,
  alGuardar,
  alLimpiar,
}: FormularioVentaProps) {
  const [busqueda, setBusqueda] =
    useState("");

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState("Todas");

  const [clienteId, setClienteId] =
    useState("");

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [carrito, setCarrito] =
    useState<ItemCarrito[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const mapaCategorias =
    useMemo(
      () =>
        new Map(
          categorias.map(
            (categoria) => [
              categoria.id,
              categoria.nombre,
            ],
          ),
        ),
      [categorias],
    );

  const categoriasActivas =
    useMemo(
      () =>
        categorias.filter(
          (categoria) =>
            categoria.estado ===
            "Activo",
        ),
      [categorias],
    );

  const clientesActivos =
    useMemo(
      () =>
        clientes.filter(
          (cliente) =>
            cliente.estado ===
            "Activo",
        ),
      [clientes],
    );

  const productosDisponibles =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLocaleLowerCase("es");

      return productos.filter(
        (producto) => {
          const estaDisponible =
            producto.estado ===
              "Activo" &&
            producto.disponible;

          const coincideBusqueda =
            !texto ||
            producto.nombre
              .toLocaleLowerCase("es")
              .includes(texto) ||
            producto.codigo
              .toLocaleLowerCase("es")
              .includes(texto);

          const coincideCategoria =
            categoriaSeleccionada ===
              "Todas" ||
            producto.categoriaId ===
              Number(
                categoriaSeleccionada,
              );

          return (
            estaDisponible &&
            coincideBusqueda &&
            coincideCategoria
          );
        },
      );
    }, [
      productos,
      busqueda,
      categoriaSeleccionada,
    ]);

  const total =
    useMemo(
      () =>
        carrito.reduce(
          (acumulado, item) =>
            acumulado +
            item.precio *
              item.cantidad,
          0,
        ),
      [carrito],
    );

  function agregarProducto(
    producto: ProductoMenu,
  ) {
    setError(null);

    setCarrito(
      (carritoActual) => {
        const existente =
          carritoActual.find(
            (item) =>
              item.productoId ===
              producto.id,
          );

        if (existente) {
          if (
            existente.cantidad >= 50
          ) {
            setError(
              "La cantidad máxima por producto es 50.",
            );

            return carritoActual;
          }

          return carritoActual.map(
            (item) =>
              item.productoId ===
              producto.id
                ? {
                    ...item,
                    cantidad:
                      item.cantidad + 1,
                  }
                : item,
          );
        }

        return [
          ...carritoActual,
          {
            productoId:
              producto.id,

            codigo:
              producto.codigo,

            nombre:
              producto.nombre,

            precio:
              producto.precio,

            cantidad: 1,

            observacion: "",

            imagenUrl:
              producto.imagenUrl,
          },
        ];
      },
    );
  }

  function cambiarCantidad(
    productoId: number,
    nuevaCantidad: number,
  ) {
    if (
      nuevaCantidad < 1 ||
      nuevaCantidad > 50
    ) {
      return;
    }

    setCarrito(
      (carritoActual) =>
        carritoActual.map(
          (item) =>
            item.productoId ===
            productoId
              ? {
                  ...item,
                  cantidad:
                    nuevaCantidad,
                }
              : item,
        ),
    );

    setError(null);
  }

  function cambiarObservacion(
    productoId: number,
    valor: string,
  ) {
    setCarrito(
      (carritoActual) =>
        carritoActual.map(
          (item) =>
            item.productoId ===
            productoId
              ? {
                  ...item,
                  observacion:
                    valor,
                }
              : item,
        ),
    );
  }

  function quitarProducto(
    productoId: number,
  ) {
    setCarrito(
      (carritoActual) =>
        carritoActual.filter(
          (item) =>
            item.productoId !==
            productoId,
        ),
    );

    setError(null);
  }

  function limpiarFormulario() {
    setBusqueda("");
    setCategoriaSeleccionada(
      "Todas",
    );
    setClienteId("");
    setObservaciones("");
    setCarrito([]);
    setError(null);

    alLimpiar();
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto al pedido.",
      );

      return;
    }

    if (
      observaciones.trim().length >
      300
    ) {
      setError(
        "Las observaciones generales no pueden superar los 300 caracteres.",
      );

      return;
    }

    const itemConObservacionExtensa =
      carrito.find(
        (item) =>
          item.observacion
            .trim().length > 120,
      );

    if (
      itemConObservacionExtensa
    ) {
      setError(
        `La observación de “${itemConObservacionExtensa.nombre}” no puede superar los 120 caracteres.`,
      );

      return;
    }

    setError(null);

    await alGuardar({
      clienteId:
        clienteId
          ? Number(clienteId)
          : null,

      detalles:
        carrito.map(
          (item) => ({
            productoId:
              item.productoId,

            cantidad:
              item.cantidad,

            observacion:
              item.observacion
                .trim() || null,
          }),
        ),

      observaciones:
        observaciones.trim() ||
        null,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="
        grid gap-6 p-5
        sm:p-6
        xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]
      "
    >
      <section className="min-w-0">
        <div
          className="
            flex flex-col gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl font-black
                text-slate-900
              "
            >
              Seleccionar productos
            </h2>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Agrega los productos
              solicitados por el cliente.
            </p>
          </div>

          <div
            className="
              flex h-11 w-11
              items-center
              justify-center
              rounded-2xl
              bg-red-50
              text-red-700
            "
          >
            <ShoppingCart size={21} />
          </div>
        </div>

        <div
          className="
            mt-5 grid gap-3
            md:grid-cols-[minmax(0,1fr)_240px]
          "
        >
          <div className="relative">
            <Search
              size={18}
              className="
                pointer-events-none
                absolute left-4 top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={busqueda}
              placeholder="Buscar por nombre o código..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value,
                )
              }
              className="
                h-12 w-full
                rounded-xl border
                border-slate-300
                bg-white pl-11 pr-4
                text-sm outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
              "
            />
          </div>

          <select
            value={
              categoriaSeleccionada
            }
            onChange={(evento) =>
              setCategoriaSeleccionada(
                evento.target.value,
              )
            }
            className="
              h-12 min-w-0
              rounded-xl border
              border-slate-300
              bg-white px-4
              text-sm font-semibold
              text-slate-700
              outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
            "
          >
            <option value="Todas">
              Todas las categorías
            </option>

            {categoriasActivas.map(
              (categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nombre}
                </option>
              ),
            )}
          </select>
        </div>

        {productosDisponibles.length ===
        0 ? (
          <div
            className="
              mt-5 rounded-2xl
              border border-dashed
              border-slate-300
              p-10 text-center
            "
          >
            <Search
              size={32}
              className="
                mx-auto text-slate-300
              "
            />

            <p
              className="
                mt-4 font-bold
                text-slate-700
              "
            >
              No se encontraron productos
            </p>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              Revisa la búsqueda,
              categoría o disponibilidad.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-5 grid gap-4
              md:grid-cols-2
              2xl:grid-cols-3
            "
          >
            {productosDisponibles.map(
              (producto) => (
                <article
                  key={producto.id}
                  className="
                    flex min-w-0
                    flex-col
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white p-4
                    transition-all
                    hover:-translate-y-0.5
                    hover:border-red-200
                    hover:shadow-md
                  "
                >
                  <div
                    className="
                      flex min-w-0
                      items-start gap-3
                    "
                  >
                    <div
                      className="
                        flex h-14 w-14
                        shrink-0
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-2xl
                        bg-slate-100
                        text-lg font-black
                        text-slate-500
                      "
                    >
                      {producto.imagenUrl ? (
                        <img
                          src={
                            producto.imagenUrl
                          }
                          alt={
                            producto.nombre
                          }
                          className="
                            h-full w-full
                            object-cover
                          "
                        />
                      ) : (
                        producto.nombre
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-xs font-bold
                          text-red-700
                        "
                      >
                        {producto.codigo}
                      </p>

                      <h3
                        className="
                          mt-1 wrap-break-word
                          font-black
                          leading-snug
                          text-slate-900
                        "
                      >
                        {producto.nombre}
                      </h3>

                      <p
                        className="
                          mt-1 text-xs
                          text-slate-500
                        "
                      >
                        {mapaCategorias.get(
                          producto.categoriaId,
                        ) ??
                          "Sin categoría"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <p
                      className="
                        text-lg font-black
                        text-slate-900
                      "
                    >
                      {formatearMoneda(
                        producto.precio,
                      )}
                    </p>

                    <button
                      type="button"
                      disabled={cargando}
                      onClick={() =>
                        agregarProducto(
                          producto,
                        )
                      }
                      className="
                        mt-3 inline-flex
                        w-full items-center
                        justify-center gap-2
                        rounded-xl
                        bg-red-700
                        px-3 py-2.5
                        text-xs font-bold
                        text-white
                        transition-colors
                        hover:bg-red-800
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <Plus size={16} />
                      Agregar producto
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <aside
        className="
          min-w-0 self-start
          rounded-3xl
          border border-slate-200
          bg-slate-50 p-5
          xl:sticky xl:top-24
        "
      >
        <div
          className="
            flex items-center
            justify-between gap-3
          "
        >
          <div>
            <h2
              className="
                text-xl font-black
                text-slate-900
              "
            >
              Detalle del pedido
            </h2>

            <p
              className="
                mt-1 text-sm
                text-slate-500
              "
            >
              {carrito.length} productos
              diferentes
            </p>
          </div>

          <ClipboardList
            size={23}
            className="text-red-700"
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="cliente-venta"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Cliente
          </label>

          <div className="relative mt-2">
            <UserRound
              size={18}
              className="
                pointer-events-none
                absolute left-4 top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <select
              id="cliente-venta"
              value={clienteId}
              disabled={cargando}
              onChange={(evento) =>
                setClienteId(
                  evento.target.value,
                )
              }
              className="
                h-12 w-full
                appearance-none
                rounded-xl border
                border-slate-300
                bg-white pl-11 pr-4
                text-sm font-semibold
                text-slate-700
                outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
                disabled:bg-slate-100
              "
            >
              <option value="">
                Consumidor final
              </option>

              {clientesActivos.map(
                (cliente) => (
                  <option
                    key={cliente.id}
                    value={cliente.id}
                  >
                    {
                      cliente.nombreCompleto
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {carrito.length === 0 ? (
            <div
              className="
                rounded-2xl border
                border-dashed
                border-slate-300
                bg-white p-8
                text-center
              "
            >
              <ShoppingCart
                size={31}
                className="
                  mx-auto text-slate-300
                "
              />

              <p
                className="
                  mt-3 font-bold
                  text-slate-700
                "
              >
                El pedido está vacío
              </p>

              <p
                className="
                  mt-1 text-xs
                  text-slate-500
                "
              >
                Agrega productos desde el
                catálogo.
              </p>
            </div>
          ) : (
            carrito.map((item) => (
              <article
                key={item.productoId}
                className="
                  min-w-0 rounded-2xl
                  border border-slate-200
                  bg-white p-4
                "
              >
                <div
                  className="
                    flex min-w-0
                    items-start
                    justify-between gap-3
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        truncate text-xs
                        font-bold
                        text-red-700
                      "
                    >
                      {item.codigo}
                    </p>

                    <h3
                      className="
                        mt-1 wrap-break-word
                        font-black
                        text-slate-900
                      "
                    >
                      {item.nombre}
                    </h3>

                    <p
                      className="
                        mt-1 text-xs
                        text-slate-500
                      "
                    >
                      {formatearMoneda(
                        item.precio,
                      )}{" "}
                      por unidad
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={cargando}
                    title="Quitar producto"
                    onClick={() =>
                      quitarProducto(
                        item.productoId,
                      )
                    }
                    className="
                      shrink-0 rounded-xl
                      bg-red-50 p-2
                      text-red-700
                      hover:bg-red-100
                      disabled:opacity-50
                    "
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div
                  className="
                    mt-4 flex
                    flex-wrap items-center
                    justify-between gap-3
                  "
                >
                  <div
                    className="
                      inline-flex
                      items-center
                      rounded-xl border
                      border-slate-200
                      bg-slate-50
                    "
                  >
                    <button
                      type="button"
                      disabled={
                        cargando ||
                        item.cantidad === 1
                      }
                      onClick={() =>
                        cambiarCantidad(
                          item.productoId,
                          item.cantidad - 1,
                        )
                      }
                      className="
                        p-2.5
                        text-slate-600
                        disabled:opacity-30
                      "
                    >
                      <Minus size={15} />
                    </button>

                    <span
                      className="
                        min-w-9 text-center
                        text-sm font-black
                        text-slate-900
                      "
                    >
                      {item.cantidad}
                    </span>

                    <button
                      type="button"
                      disabled={
                        cargando ||
                        item.cantidad === 50
                      }
                      onClick={() =>
                        cambiarCantidad(
                          item.productoId,
                          item.cantidad + 1,
                        )
                      }
                      className="
                        p-2.5
                        text-slate-600
                        disabled:opacity-30
                      "
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <p
                    className="
                      font-black
                      text-slate-900
                    "
                  >
                    {formatearMoneda(
                      item.precio *
                        item.cantidad,
                    )}
                  </p>
                </div>

                <input
                  type="text"
                  value={item.observacion}
                  disabled={cargando}
                  maxLength={120}
                  placeholder="Ej.: sin cebolla, poco picante..."
                  onChange={(evento) =>
                    cambiarObservacion(
                      item.productoId,
                      evento.target.value,
                    )
                  }
                  className="
                    mt-3 w-full
                    rounded-xl border
                    border-slate-200
                    bg-slate-50
                    px-3 py-2.5
                    text-xs outline-none
                    focus:border-red-600
                    focus:ring-4
                    focus:ring-red-100
                    disabled:bg-slate-100
                  "
                />
              </article>
            ))
          )}
        </div>

        <div className="mt-5">
          <label
            htmlFor="observaciones-venta"
            className="
              text-sm font-bold
              text-slate-700
            "
          >
            Observaciones generales
          </label>

          <textarea
            id="observaciones-venta"
            value={observaciones}
            disabled={cargando}
            maxLength={300}
            rows={3}
            placeholder="Indicaciones generales del pedido..."
            onChange={(evento) =>
              setObservaciones(
                evento.target.value,
              )
            }
            className="
              mt-2 w-full resize-none
              rounded-xl border
              border-slate-300
              bg-white px-4 py-3
              text-sm outline-none
              focus:border-red-600
              focus:ring-4
              focus:ring-red-100
              disabled:bg-slate-100
            "
          />
        </div>

        {error && (
          <div
            className="
              mt-4 rounded-xl
              border border-red-200
              bg-red-50 p-3
              text-sm font-semibold
              text-red-700
            "
          >
            {error}
          </div>
        )}

        <div
          className="
            mt-5 rounded-2xl
            bg-slate-950 p-5
            text-white
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-3
            "
          >
            <span
              className="
                text-sm font-bold
                text-slate-300
              "
            >
              Total
            </span>

            <strong
              className="
                text-2xl font-black
              "
            >
              {formatearMoneda(total)}
            </strong>
          </div>

          <p
            className="
              mt-2 text-xs
              leading-relaxed
              text-slate-400
            "
          >
            Al confirmar, se generará un
            número de pedido y pasará
            directamente a preparación.
          </p>
        </div>

        <div
          className="
            mt-5 grid gap-3
            sm:grid-cols-2
          "
        >
          <button
            type="button"
            disabled={cargando}
            onClick={limpiarFormulario}
            className="
              inline-flex items-center
              justify-center gap-2
              rounded-xl border
              border-slate-300
              bg-white px-4 py-3
              text-sm font-bold
              text-slate-700
              hover:bg-slate-100
              disabled:opacity-50
            "
          >
            <X size={18} />
            Limpiar
          </button>

          <button
            type="submit"
            disabled={
              cargando ||
              carrito.length === 0
            }
            className="
              inline-flex items-center
              justify-center gap-2
              rounded-xl
              bg-red-700 px-4 py-3
              text-sm font-bold
              text-white
              hover:bg-red-800
              disabled:cursor-not-allowed
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

            Confirmar pedido
          </button>
        </div>
      </aside>
    </form>
  );
}

export default FormularioVenta;