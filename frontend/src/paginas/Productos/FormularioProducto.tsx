import {
  Boxes,
  ChefHat,
  Image,
  LoaderCircle,
  PackageCheck,
  PackageOpen,
  Plus,
  Save,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import type {
  InsumoInventario,
  RecetaProducto,
} from "../../tipos/inventario";

import type {
  CategoriaProducto,
  ControlInventarioProducto,
  IngredienteProductoDto,
  ModoPreparacionProducto,
  ProductoMenu,
} from "../../tipos/producto";

export interface DatosFormularioProductoIntegrado {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precio: number;
  disponiblePedidosYa: boolean;
  precioPedidosYa: number | null;
  destacado: boolean;
  modoPreparacion:
    ModoPreparacionProducto;
  controlInventario:
    ControlInventarioProducto;
  imagenUrl: string | null;
  ingredientes:
    IngredienteProductoDto[] | null;
}

interface FormularioProductoProps {
  producto: ProductoMenu | null;
  categorias: CategoriaProducto[];
  insumos: InsumoInventario[];
  recetaVigente: RecetaProducto | null;
  cargando: boolean;
  alGuardar: (
    datos:
      DatosFormularioProductoIntegrado,
  ) => Promise<void>;
  alCancelar: () => void;
  puedeGestionarCategorias: boolean;
  alGestionarCategorias: () => void;
  soloInformacionComercial?: boolean;
}

interface FilaIngrediente {
  clave: number;
  insumoId: string;
  cantidad: string;
}

interface EstadoFormularioProducto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  precio: string;
  disponiblePedidosYa: boolean;
  precioPedidosYa: string;
  destacado: boolean;
  modoPreparacion:
    ModoPreparacionProducto;
  controlInventario:
    ControlInventarioProducto;
  imagenUrl: string;
}

interface ErroresProducto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  categoriaId?: string;
  precio?: string;
  precioPedidosYa?: string;
  imagenUrl?: string;
  receta?: string;
}

function esUrlValida(
  valor: string,
): boolean {
  if (!valor.trim()) {
    return true;
  }

  try {
    const url = new URL(valor);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function obtenerFilasIniciales(
  receta: RecetaProducto | null,
): FilaIngrediente[] {
  if (
    !receta ||
    receta.ingredientes.length === 0
  ) {
    return [
      {
        clave: 1,
        insumoId: "",
        cantidad: "",
      },
    ];
  }

  return receta.ingredientes.map(
    (ingrediente, indice) => ({
      clave: indice + 1,
      insumoId:
        ingrediente.insumoId.toString(),
      cantidad:
        ingrediente.cantidadPorProducto.toString(),
    }),
  );
}

function normalizarIngredientes(
  ingredientes: IngredienteProductoDto[],
): IngredienteProductoDto[] {
  return [...ingredientes]
    .map((ingrediente) => ({
      insumoId: ingrediente.insumoId,
      cantidadPorProducto: Number(
        ingrediente.cantidadPorProducto.toFixed(
          6,
        ),
      ),
    }))
    .sort(
      (a, b) =>
        a.insumoId - b.insumoId,
    );
}

function recetasIguales(
  ingredientesA: IngredienteProductoDto[],
  ingredientesB: IngredienteProductoDto[],
): boolean {
  return (
    JSON.stringify(
      normalizarIngredientes(
        ingredientesA,
      ),
    ) ===
    JSON.stringify(
      normalizarIngredientes(
        ingredientesB,
      ),
    )
  );
}

function FormularioProducto({
  producto,
  categorias,
  insumos,
  recetaVigente,
  cargando,
  alGuardar,
  alCancelar,
  puedeGestionarCategorias,
  alGestionarCategorias,
  soloInformacionComercial = false,
}: FormularioProductoProps) {
  const [formulario, setFormulario] =
    useState<EstadoFormularioProducto>(
      () => ({
        codigo: producto?.codigo ?? "",
        nombre: producto?.nombre ?? "",
        descripcion:
          producto?.descripcion ?? "",
        categoriaId:
          producto?.categoriaId.toString() ??
          "",
        precio:
          producto?.precio.toString() ??
          "",
        disponiblePedidosYa:
          producto?.disponiblePedidosYa ?? false,
        precioPedidosYa:
          producto?.precioPedidosYa?.toString() ?? "",
        destacado:
          producto?.destacado ?? false,
        modoPreparacion:
          producto?.modoPreparacion ??
          "Requiere preparación",
        controlInventario:
          producto?.controlInventario ??
          "Con receta",
        imagenUrl:
          producto?.imagenUrl ?? "",
      }),
    );

  const [filasIngredientes, setFilasIngredientes] =
    useState<FilaIngrediente[]>(
      () =>
        obtenerFilasIniciales(
          recetaVigente,
        ),
    );

  const siguienteClaveIngrediente =
    useRef(
      (recetaVigente?.ingredientes.length ?? 0) + 2,
    );

  const [errores, setErrores] =
    useState<ErroresProducto>({});

  const categoriasDisponibles =
    useMemo(
      () =>
        categorias.filter(
          (categoria) =>
            categoria.estado === "Activo" ||
            categoria.id ===
              producto?.categoriaId,
        ),
      [
        categorias,
        producto?.categoriaId,
      ],
    );

  const insumosDisponibles =
    useMemo(() => {
      const idsActuales = new Set(
        recetaVigente?.ingredientes.map(
          (ingrediente) =>
            ingrediente.insumoId,
        ) ?? [],
      );

      return insumos.filter(
        (insumo) =>
          insumo.estado === "Activo" ||
          idsActuales.has(insumo.id),
      );
    }, [insumos, recetaVigente]);

  const ingredientesIniciales =
    useMemo<IngredienteProductoDto[]>(
      () =>
        recetaVigente?.ingredientes.map(
          (ingrediente) => ({
            insumoId:
              ingrediente.insumoId,
            cantidadPorProducto:
              ingrediente.cantidadPorProducto,
          }),
        ) ?? [],
      [recetaVigente],
    );

  function actualizarCampo<
    Campo extends keyof EstadoFormularioProducto,
  >(
    campo: Campo,
    valor:
      EstadoFormularioProducto[Campo],
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setErrores((actuales) => ({
      ...actuales,
      [campo]: undefined,
    }));
  }

  function agregarIngrediente() {
    setFilasIngredientes(
      (actuales) => [
        ...actuales,
        {
          clave:
            siguienteClaveIngrediente.current++,
          insumoId: "",
          cantidad: "",
        },
      ],
    );

    setErrores((actuales) => ({
      ...actuales,
      receta: undefined,
    }));
  }

  function actualizarIngrediente(
    clave: number,
    campo: "insumoId" | "cantidad",
    valor: string,
  ) {
    setFilasIngredientes(
      (actuales) =>
        actuales.map((fila) =>
          fila.clave === clave
            ? {
                ...fila,
                [campo]: valor,
              }
            : fila,
        ),
    );

    setErrores((actuales) => ({
      ...actuales,
      receta: undefined,
    }));
  }

  function eliminarIngrediente(
    clave: number,
  ) {
    setFilasIngredientes(
      (actuales) => {
        const restantes =
          actuales.filter(
            (fila) =>
              fila.clave !== clave,
          );

        return restantes.length > 0
          ? restantes
          : [
              {
                clave:
                  siguienteClaveIngrediente.current++,
                insumoId: "",
                cantidad: "",
              },
            ];
      },
    );
  }

  function construirIngredientes(): {
    valor: IngredienteProductoDto[] | null;
    valido: boolean;
  } {
    if (
      formulario.controlInventario ===
      "No controla inventario"
    ) {
      return {
        valor: [],
        valido: true,
      };
    }

    const ingredientes:
      IngredienteProductoDto[] = [];

    for (const fila of filasIngredientes) {
      const insumoId = Number(
        fila.insumoId,
      );

      const cantidad = Number(
        fila.cantidad,
      );

      if (
        !fila.insumoId ||
        !fila.cantidad.trim()
      ) {
        setErrores((actuales) => ({
          ...actuales,
          receta:
            "Completa el insumo y la cantidad de cada fila.",
        }));

        return {
          valor: null,
          valido: false,
        };
      }

      if (
        !Number.isInteger(insumoId) ||
        insumoId <= 0 ||
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {
        setErrores((actuales) => ({
          ...actuales,
          receta:
            "Las cantidades de la receta deben ser mayores que cero.",
        }));

        return {
          valor: null,
          valido: false,
        };
      }

      ingredientes.push({
        insumoId,
        cantidadPorProducto:
          cantidad,
      });
    }

    const ids = ingredientes.map(
      (ingrediente) =>
        ingrediente.insumoId,
    );

    if (
      new Set(ids).size !== ids.length
    ) {
      setErrores((actuales) => ({
        ...actuales,
        receta:
          "Un mismo insumo no puede repetirse en la receta.",
      }));

      return {
        valor: null,
        valido: false,
      };
    }

    if (ingredientes.length === 0) {
      setErrores((actuales) => ({
        ...actuales,
        receta:
          "Agrega al menos un insumo o selecciona ‘No controla inventario’.",
      }));

      return {
        valor: null,
        valido: false,
      };
    }

    if (
      producto &&
      recetaVigente &&
      producto.controlInventario ===
        "Con receta" &&
      recetasIguales(
        ingredientes,
        ingredientesIniciales,
      )
    ) {
      return {
        valor: null,
        valido: true,
      };
    }

    return {
      valor: ingredientes,
      valido: true,
    };
  }

  function validarFormulario(): boolean {
    const nuevosErrores:
      ErroresProducto = {};

    const codigo = formulario.codigo
      .trim()
      .toUpperCase();

    const nombre =
      formulario.nombre.trim();

    const descripcion =
      formulario.descripcion.trim();

    const precio = Number(
      formulario.precio,
    );

    if (!codigo) {
      nuevosErrores.codigo =
        "El código es obligatorio.";
    } else if (
      codigo.length < 3 ||
      codigo.length > 20
    ) {
      nuevosErrores.codigo =
        "Debe contener entre 3 y 20 caracteres.";
    } else if (
      !/^[A-Z0-9-]+$/.test(codigo)
    ) {
      nuevosErrores.codigo =
        "Usa letras, números y guiones.";
    }

    if (nombre.length < 3) {
      nuevosErrores.nombre =
        "El nombre debe contener al menos 3 caracteres.";
    } else if (nombre.length > 100) {
      nuevosErrores.nombre =
        "El nombre no puede superar los 100 caracteres.";
    }

    if (descripcion.length < 5) {
      nuevosErrores.descripcion =
        "La descripción debe contener al menos 5 caracteres.";
    } else if (
      descripcion.length > 300
    ) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 300 caracteres.";
    }

    if (!formulario.categoriaId) {
      nuevosErrores.categoriaId =
        "Selecciona una categoría.";
    }

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      nuevosErrores.precio =
        "El precio debe ser mayor que cero.";
    } else if (precio > 100000) {
      nuevosErrores.precio =
        "El precio supera el límite permitido.";
    }

    if (formulario.disponiblePedidosYa) {
      const precioPedidosYa = Number(
        formulario.precioPedidosYa,
      );

      if (
        !Number.isFinite(precioPedidosYa) ||
        precioPedidosYa <= 0
      ) {
        nuevosErrores.precioPedidosYa =
          "Ingresa el precio que se mostrará y registrará para PedidosYa.";
      } else if (precioPedidosYa > 100000) {
        nuevosErrores.precioPedidosYa =
          "El precio de PedidosYa supera el límite permitido.";
      }
    }

    if (
      !esUrlValida(
        formulario.imagenUrl,
      )
    ) {
      nuevosErrores.imagenUrl =
        "Ingresa una dirección web válida.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores)
        .length === 0
    );
  }

  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const resultadoIngredientes =
      soloInformacionComercial
        ? { valor: null, valido: true }
        : construirIngredientes();

    if (!resultadoIngredientes.valido) {
      return;
    }

    const ingredientes =
      resultadoIngredientes.valor;

    await alGuardar({
      codigo: formulario.codigo
        .trim()
        .toUpperCase(),
      nombre:
        formulario.nombre.trim(),
      descripcion:
        formulario.descripcion.trim(),
      categoriaId: Number(
        formulario.categoriaId,
      ),
      precio: Number(
        formulario.precio,
      ),
      disponiblePedidosYa:
        formulario.disponiblePedidosYa,
      precioPedidosYa:
        formulario.disponiblePedidosYa
          ? Number(formulario.precioPedidosYa)
          : null,
      destacado:
        formulario.destacado,
      modoPreparacion:
        formulario.modoPreparacion,
      controlInventario:
        formulario.controlInventario,
      imagenUrl:
        formulario.imagenUrl.trim() ||
        null,
      ingredientes,
    });
  }

  const controlConReceta =
    formulario.controlInventario ===
    "Con receta";

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
    >
      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.75fr)]">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <Boxes size={20} />
            </div>

            <div>
              <h3 className="font-black text-slate-900 dark:text-white">
                Información comercial
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Datos que verá el cajero al registrar una venta.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="codigo-producto"
                className="text-sm font-black text-slate-700 dark:text-slate-200"
              >
                Código interno
              </label>

              <input
                id="codigo-producto"
                type="text"
                value={formulario.codigo}
                maxLength={20}
                disabled={cargando}
                placeholder="Ej.: HAMB-001"
                onChange={(evento) =>
                  actualizarCampo(
                    "codigo",
                    evento.target.value,
                  )
                }
                className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                  errores.codigo
                    ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                    : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
                }`}
              />

              {errores.codigo && (
                <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                  {errores.codigo}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="precio-producto"
                className="text-sm font-black text-slate-700 dark:text-slate-200"
              >
                Precio en local
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                  Bs
                </span>

                <input
                  id="precio-producto"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={formulario.precio}
                  disabled={cargando}
                  placeholder="0,00"
                  onChange={(evento) =>
                    actualizarCampo(
                      "precio",
                      evento.target.value,
                    )
                  }
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm font-black text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                    errores.precio
                      ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                      : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
                  }`}
                />
              </div>

              {errores.precio && (
                <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                  {errores.precio}
                </p>
              )}

              {!errores.precio && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Precio utilizado en las ventas realizadas directamente en el local.
                </p>
              )}
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  Venta por PedidosYa
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Usa el mismo producto y receta, pero permite definir el precio comercial de la plataforma.
                </p>
              </div>

              <button
                type="button"
                disabled={cargando}
                onClick={() => {
                  actualizarCampo(
                    "disponiblePedidosYa",
                    !formulario.disponiblePedidosYa,
                  );

                  if (formulario.disponiblePedidosYa) {
                    actualizarCampo("precioPedidosYa", "");
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-black transition-colors disabled:opacity-50 ${
                  formulario.disponiblePedidosYa
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <PackageCheck size={16} />
                {formulario.disponiblePedidosYa
                  ? "Disponible en PedidosYa"
                  : "No disponible en PedidosYa"}
              </button>
            </div>

            {formulario.disponiblePedidosYa && (
              <div className="mt-4 max-w-sm">
                <label
                  htmlFor="precio-pedidosya-producto"
                  className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  Precio en PedidosYa
                </label>

                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    Bs
                  </span>
                  <input
                    id="precio-pedidosya-producto"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={formulario.precioPedidosYa}
                    disabled={cargando}
                    placeholder="0,00"
                    onChange={(evento) =>
                      actualizarCampo(
                        "precioPedidosYa",
                        evento.target.value,
                      )
                    }
                    className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm font-black text-slate-900 outline-none transition dark:bg-slate-950 dark:text-slate-100 ${
                      errores.precioPedidosYa
                        ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                        : "border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-950/50"
                    }`}
                  />
                </div>

                {errores.precioPedidosYa ? (
                  <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                    {errores.precioPedidosYa}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Este importe se utilizará únicamente cuando el cajero registre el pedido por el canal PedidosYa.
                  </p>
                )}
              </div>
            )}
          </section>

          <div>
            <label
              htmlFor="nombre-producto"
              className="text-sm font-black text-slate-700 dark:text-slate-200"
            >
              Nombre del producto
            </label>

            <input
              id="nombre-producto"
              type="text"
              value={formulario.nombre}
              maxLength={100}
              disabled={cargando}
              placeholder="Ej.: Hamburguesa clásica"
              onChange={(evento) =>
                actualizarCampo(
                  "nombre",
                  evento.target.value,
                )
              }
              className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                errores.nombre
                  ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                  : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
              }`}
            />

            {errores.nombre && (
              <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                {errores.nombre}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <label
                htmlFor="categoria-producto"
                className="text-sm font-black text-slate-700 dark:text-slate-200"
              >
                Categoría
              </label>

              {puedeGestionarCategorias && (
                <button
                  type="button"
                  disabled={cargando}
                  onClick={alGestionarCategorias}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Tags size={14} />
                  Gestionar categorías
                </button>
              )}
            </div>

            <select
              id="categoria-producto"
              value={formulario.categoriaId}
              disabled={cargando}
              onChange={(evento) =>
                actualizarCampo(
                  "categoriaId",
                  evento.target.value,
                )
              }
              className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition dark:bg-slate-950 dark:text-slate-200 ${
                errores.categoriaId
                  ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                  : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
              }`}
            >
              <option value="">
                Selecciona una categoría
              </option>

              {categoriasDisponibles.map(
                (categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nombre}
                    {categoria.estado ===
                    "Inactivo"
                      ? " — Inactiva"
                      : ""}
                  </option>
                ),
              )}
            </select>

            {errores.categoriaId && (
              <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                {errores.categoriaId}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              Flujo del producto
            </p>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={cargando}
                onClick={() =>
                  actualizarCampo(
                    "modoPreparacion",
                    "Requiere preparación",
                  )
                }
                className={`rounded-2xl border p-3 text-left transition-colors disabled:opacity-50 ${
                  formulario.modoPreparacion === "Requiere preparación"
                    ? "border-amber-300 bg-amber-50 ring-2 ring-amber-100 dark:border-amber-700 dark:bg-amber-950/35 dark:ring-amber-950/60"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ChefHat
                    size={17}
                    className={
                      formulario.modoPreparacion === "Requiere preparación"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-slate-400"
                    }
                  />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Requiere preparación
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  El pedido seguirá la cola, preparación y estado listo.
                </p>
              </button>

              <button
                type="button"
                disabled={cargando}
                onClick={() =>
                  actualizarCampo(
                    "modoPreparacion",
                    "Entrega directa",
                  )
                }
                className={`rounded-2xl border p-3 text-left transition-colors disabled:opacity-50 ${
                  formulario.modoPreparacion === "Entrega directa"
                    ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/35 dark:ring-indigo-950/60"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <PackageCheck
                    size={17}
                    className={
                      formulario.modoPreparacion === "Entrega directa"
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-slate-400"
                    }
                  />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Entrega directa
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Si se vende solo, podrá cobrarse y entregarse sin pasar por cocina.
                </p>
              </button>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Si un pedido combina productos de entrega directa con productos que requieren preparación, el pedido completo seguirá el flujo de preparación.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="descripcion-producto"
                className="text-sm font-black text-slate-700 dark:text-slate-200"
              >
                Descripción
              </label>

              <span className="text-xs text-slate-400 dark:text-slate-500">
                {formulario.descripcion.length}/300
              </span>
            </div>

            <textarea
              id="descripcion-producto"
              value={formulario.descripcion}
              rows={3}
              maxLength={300}
              disabled={cargando}
              placeholder="Características principales del producto."
              onChange={(evento) =>
                actualizarCampo(
                  "descripcion",
                  evento.target.value,
                )
              }
              className={`mt-2 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                errores.descripcion
                  ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                  : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
              }`}
            />

            {errores.descripcion && (
              <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                {errores.descripcion}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Image size={20} />
            </div>

            <div>
              <h3 className="font-black text-slate-900 dark:text-white">
                Presentación
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Imagen y prioridad dentro del menú.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="imagen-producto"
              className="text-sm font-black text-slate-700 dark:text-slate-200"
            >
              URL de la imagen
              <span className="ml-2 font-normal text-slate-400">
                Opcional
              </span>
            </label>

            <input
              id="imagen-producto"
              type="url"
              value={formulario.imagenUrl}
              disabled={cargando}
              placeholder="https://..."
              onChange={(evento) =>
                actualizarCampo(
                  "imagenUrl",
                  evento.target.value,
                )
              }
              className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                errores.imagenUrl
                  ? "border-red-400 ring-4 ring-red-100 dark:ring-red-950/50"
                  : "border-slate-300 focus:border-red-600 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:focus:ring-red-950/50"
              }`}
            />

            {errores.imagenUrl && (
              <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                {errores.imagenUrl}
              </p>
            )}
          </div>

          <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60">
            {formulario.imagenUrl.trim() &&
            esUrlValida(
              formulario.imagenUrl,
            ) ? (
              <img
                src={formulario.imagenUrl}
                alt="Vista previa del producto"
                className="h-full w-full object-cover"
                onError={(evento) => {
                  evento.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div className="text-center">
                <Image
                  size={30}
                  className="mx-auto text-slate-300 dark:text-slate-700"
                />
                <p className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                  Vista previa
                </p>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-800/70">
            <div className="flex items-center gap-3">
              <Sparkles
                size={20}
                className="text-amber-500"
              />

              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  Producto destacado
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Recibirá prioridad visual en el catálogo.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={formulario.destacado}
              disabled={cargando}
              onChange={(evento) =>
                actualizarCampo(
                  "destacado",
                  evento.target.checked,
                )
              }
              className="h-5 w-5 accent-red-600"
            />
          </label>
        </section>
      </div>

      {!soloInformacionComercial && (
      <section className="border-t border-slate-200 px-5 py-5 sm:px-6 dark:border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ChefHat size={20} />
            </div>

            <div>
              <h3 className="font-black text-slate-900 dark:text-white">
                Control de inventario
              </h3>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Define los insumos que se descontarán automáticamente cada vez que se registre una venta.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={cargando}
              onClick={() =>
                actualizarCampo(
                  "controlInventario",
                  "Con receta",
                )
              }
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-colors ${
                controlConReceta
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <ChefHat size={17} />
              Con receta
            </button>

            <button
              type="button"
              disabled={cargando}
              onClick={() =>
                actualizarCampo(
                  "controlInventario",
                  "No controla inventario",
                )
              }
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition-colors ${
                !controlConReceta
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <PackageOpen size={17} />
              No controla inventario
            </button>
          </div>
        </div>

        {controlConReceta ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[minmax(0,1fr)_150px_44px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <span>Insumo</span>
              <span>Cantidad</span>
              <span />
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto bg-white p-3 dark:bg-slate-900">
              {filasIngredientes.map(
                (fila) => {
                  const insumoSeleccionado =
                    insumosDisponibles.find(
                      (insumo) =>
                        insumo.id ===
                        Number(
                          fila.insumoId,
                        ),
                    );

                  return (
                    <div
                      key={fila.clave}
                      className="grid grid-cols-[minmax(0,1fr)_150px_44px] gap-3"
                    >
                      <select
                        value={fila.insumoId}
                        disabled={cargando}
                        onChange={(evento) =>
                          actualizarIngrediente(
                            fila.clave,
                            "insumoId",
                            evento.target.value,
                          )
                        }
                        className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-emerald-950/50"
                      >
                        <option value="">
                          Selecciona un insumo
                        </option>

                        {insumosDisponibles.map(
                          (insumo) => (
                            <option
                              key={insumo.id}
                              value={insumo.id}
                            >
                              {insumo.codigo} · {insumo.nombre}
                              {insumo.estado ===
                              "Inactivo"
                                ? " — Inactivo"
                                : ""}
                            </option>
                          ),
                        )}
                      </select>

                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0.000001"
                          step="0.01"
                          value={fila.cantidad}
                          disabled={cargando}
                          placeholder="0"
                          onChange={(evento) =>
                            actualizarIngrediente(
                              fila.clave,
                              "cantidad",
                              evento.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-12 text-sm font-black text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-emerald-950/50"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          {insumoSeleccionado?.unidadBase ??
                            "—"}
                        </span>
                      </div>

                      <button
                        type="button"
                        title="Quitar insumo"
                        disabled={cargando}
                        onClick={() =>
                          eliminarIngrediente(
                            fila.clave,
                          )
                        }
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                },
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                {errores.receta ? (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    {errores.receta}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Las cantidades corresponden al consumo por una unidad vendida.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={cargando}
                onClick={agregarIngrediente}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900/70 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
              >
                <Plus size={16} />
                Agregar insumo
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200">
            Este producto podrá venderse sin descontar insumos. Úsalo solamente cuando realmente no corresponda controlar inventario.
          </div>
        )}
      </section>
      )}

      <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 px-5 py-4 shadow-[0_-10px_24px_-18px_rgba(15,23,42,.55)] backdrop-blur sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="button"
          disabled={cargando}
          onClick={alCancelar}
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <X size={17} />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex min-w-52 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          {producto
            ? "Guardar cambios"
            : "Guardar producto y receta"}
        </button>
      </div>
    </form>
  );
}

export default FormularioProducto;
