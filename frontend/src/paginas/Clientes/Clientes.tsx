import {
  Archive,
  ArchiveRestore,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Share2,
  UsersRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../contextos/AuthContext";

import {
  auditarAccion,
} from "../../servicios/auditoriaAccionesServicio";

import {
  actualizarCliente,
  archivarCliente,
  clienteTieneDatosEntrega,
  clienteTieneDatosEntregaCompletos,
  construirTextoEntregaCliente,
  crearCliente,
  listarClientes,
  generarUrlWhatsappEntregaCliente,
  obtenerUltimoPedidoCliente,
  restaurarCliente,
} from "../../servicios/clienteServicio";

import {
  listarVentas,
} from "../../servicios/ventaServicio";

import type {
  Cliente,
  CrearClienteDto,
  ResumenUltimoPedidoCliente,
} from "../../tipos/cliente";

import type {
  Venta,
} from "../../tipos/venta";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import FormularioCliente from "./FormularioCliente";

const CLIENTES_POR_PAGINA = 8;

type FiltroDirectorio =
  | "Directorio"
  | "Con entrega"
  | "Datos incompletos"
  | "Archivados";

function obtenerMensajeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
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

function formatearMoneda(
  valor: number,
): string {
  return `Bs ${new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(valor)}`;
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

function obtenerIniciales(
  nombre: string,
): string {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "CL";
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${
    partes[partes.length - 1][0]
  }`.toUpperCase();
}

function Clientes() {
  const { usuario } = useAuth();

  const puedeGestionar =
    usuario?.permisos.includes(
      "VENTAS_CREAR",
    ) ?? false;

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [ventas, setVentas] =
    useState<Venta[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtro, setFiltro] =
    useState<FiltroDirectorio>(
      "Directorio",
    );

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [clienteParaArchivar, setClienteParaArchivar] =
    useState<Cliente | null>(null);

  const [clienteParaCompartir, setClienteParaCompartir] =
    useState<Cliente | null>(null);

  const [cambiandoArchivo, setCambiandoArchivo] =
    useState(false);

  const [notificacion, setNotificacion] =
    useState<DatosNotificacion | null>(
      null,
    );

  const cerrarNotificacion =
    useCallback(() => {
      setNotificacion(null);
    }, []);

  const cargarDatos =
    useCallback(async () => {
      try {
        setCargando(true);
        setErrorCarga(null);

        const [clientesRespuesta, ventasRespuesta] =
          await Promise.all([
            listarClientes(),
            listarVentas(),
          ]);

        setClientes(clientesRespuesta);
        setVentas(ventasRespuesta);
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    let activo = true;

    Promise.all([
      listarClientes(),
      listarVentas(),
    ])
      .then(
        ([clientesRespuesta, ventasRespuesta]) => {
          if (!activo) {
            return;
          }

          setClientes(clientesRespuesta);
          setVentas(ventasRespuesta);
          setErrorCarga(null);
        },
      )
      .catch((error: unknown) => {
        if (!activo) {
          return;
        }

        setErrorCarga(
          obtenerMensajeError(error),
        );
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const ultimoPedidoPorCliente =
    useMemo(() => {
      const mapa = new Map<
        number,
        ResumenUltimoPedidoCliente | null
      >();

      clientes.forEach((cliente) => {
        mapa.set(
          cliente.id,
          obtenerUltimoPedidoCliente(
            cliente.id,
            ventas,
          ),
        );
      });

      return mapa;
    }, [clientes, ventas]);

  const clientesDirectorio =
    useMemo(
      () =>
        clientes.filter(
          (cliente) => !cliente.archivado,
        ),
      [clientes],
    );

  const clientesFiltrados =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLocaleLowerCase("es");

      return clientes.filter((cliente) => {
        const coincideBusqueda =
          !texto ||
          [
            cliente.nombreCompleto,
            cliente.telefono,
            cliente.numeroDocumento,
            cliente.correo,
            cliente.direccion,
            cliente.zona,
            cliente.referenciaDireccion,
          ].some((valor) =>
            valor
              ?.toLocaleLowerCase("es")
              .includes(texto),
          );

        const coincideFiltro =
          filtro === "Archivados"
            ? cliente.archivado
            : !cliente.archivado &&
              (
                filtro === "Directorio" ||
                (
                  filtro === "Con entrega" &&
                  clienteTieneDatosEntrega(
                    cliente,
                  )
                ) ||
                (
                  filtro === "Datos incompletos" &&
                  !clienteTieneDatosEntregaCompletos(
                    cliente,
                  )
                )
              );

        return (
          coincideBusqueda &&
          coincideFiltro
        );
      });
    }, [clientes, busqueda, filtro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      clientesFiltrados.length /
        CLIENTES_POR_PAGINA,
    ),
  );

  const paginaSegura = Math.min(
    paginaActual,
    totalPaginas,
  );

  const clientesPagina =
    useMemo(() => {
      const inicio =
        (paginaSegura - 1) *
        CLIENTES_POR_PAGINA;

      return clientesFiltrados.slice(
        inicio,
        inicio + CLIENTES_POR_PAGINA,
      );
    }, [clientesFiltrados, paginaSegura]);

  const totalArchivados =
    clientes.length - clientesDirectorio.length;

  const totalConTelefono =
    clientesDirectorio.filter(
      (cliente) => Boolean(cliente.telefono),
    ).length;

  const totalConUbicacion =
    clientesDirectorio.filter(
      clienteTieneDatosEntrega,
    ).length;

  const filtrosActivos =
    Boolean(busqueda) ||
    filtro !== "Directorio";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltro("Directorio");
    setPaginaActual(1);
  }

  function abrirNuevoCliente() {
    if (!puedeGestionar) {
      return;
    }

    setClienteSeleccionado(null);
    setModalAbierto(true);
  }

  function abrirEdicion(
    cliente: Cliente,
  ) {
    if (!puedeGestionar) {
      return;
    }

    setClienteSeleccionado(cliente);
    setModalAbierto(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setClienteSeleccionado(null);
  }

  async function guardarCliente(
    datos: CrearClienteDto,
  ) {
    if (!puedeGestionar) {
      return;
    }

    try {
      setGuardando(true);

      if (clienteSeleccionado) {
        const actualizado =
          await actualizarCliente(
            clienteSeleccionado.id,
            datos,
          );

        await auditarAccion({
          modulo: "Clientes",
          accion: "Actualizar cliente",
          entidad: "Cliente",
          entidadId: actualizado.id,
          descripcion:
            `Se actualizaron los datos de ${actualizado.nombreCompleto}.`,
          datosAnteriores:
            clienteSeleccionado,
          datosPosteriores: actualizado,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Cliente actualizado",
          mensaje:
            "Los datos del cliente y de entrega fueron guardados.",
        });
      } else {
        const creado =
          await crearCliente(datos);

        await auditarAccion({
          modulo: "Clientes",
          accion: "Crear cliente",
          entidad: "Cliente",
          entidadId: creado.id,
          descripcion:
            `Se registró el cliente ${creado.nombreCompleto}.`,
          datosPosteriores: creado,
        });

        setNotificacion({
          tipo: "exito",
          titulo: "Cliente registrado",
          mensaje:
            "El cliente ya puede asociarse a pedidos y entregas.",
        });
      }

      setModalAbierto(false);
      setClienteSeleccionado(null);
      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo: "No se pudo guardar",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setGuardando(false);
    }
  }

  function abrirCompartirEntrega(
    cliente: Cliente,
  ) {
    if (
      !clienteTieneDatosEntrega(
        cliente,
      )
    ) {
      setNotificacion({
        tipo: "info",
        titulo: "Datos incompletos",
        mensaje:
          "Registra una dirección o un enlace de ubicación antes de compartir la entrega.",
      });

      return;
    }

    setClienteParaCompartir(cliente);
  }

  async function copiarDatosEntrega() {
    if (!clienteParaCompartir) {
      return;
    }

    try {
      await copiarTexto(
        construirTextoEntregaCliente(
          clienteParaCompartir,
        ),
      );

      setNotificacion({
        tipo: "exito",
        titulo: "Datos copiados",
        mensaje:
          "La información de entrega está lista para pegarse en el chat del repartidor.",
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

  function abrirWhatsappEntrega() {
    if (!clienteParaCompartir) {
      return;
    }

    window.open(
      generarUrlWhatsappEntregaCliente(
        clienteParaCompartir,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function confirmarArchivado() {
    if (
      !clienteParaArchivar ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setCambiandoArchivo(true);

      const restaurando =
        clienteParaArchivar.archivado;

      const actualizado = restaurando
        ? await restaurarCliente(
            clienteParaArchivar.id,
          )
        : await archivarCliente(
            clienteParaArchivar.id,
          );

      await auditarAccion({
        modulo: "Clientes",
        accion: restaurando
          ? "Restaurar cliente"
          : "Archivar cliente",
        entidad: "Cliente",
        entidadId: actualizado.id,
        descripcion:
          `${actualizado.nombreCompleto} fue ${restaurando ? "restaurado" : "archivado"}.`,
        datosAnteriores:
          clienteParaArchivar,
        datosPosteriores: actualizado,
      });

      setNotificacion({
        tipo: "exito",
        titulo: restaurando
          ? "Cliente restaurado"
          : "Cliente archivado",
        mensaje: restaurando
          ? "Volverá a aparecer en el directorio y en Ventas."
          : "Se conserva su historial, pero ya no aparecerá en nuevas ventas.",
      });

      setClienteParaArchivar(null);
      await cargarDatos();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo actualizar el directorio",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setCambiandoArchivo(false);
    }
  }

  if (cargando) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, indice) => (
              <div
                key={indice}
                className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800"
              />
            ),
          )}
        </div>

        <div className="h-[32rem] rounded-3xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-panel dark:border-red-900/60 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          No se pudieron cargar los clientes
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {errorCarga}
        </p>

        <button
          type="button"
          onClick={() => void cargarDatos()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-800"
        >
          <RefreshCw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <NotificacionFlotante
        notificacion={notificacion}
        alCerrar={cerrarNotificacion}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          titulo="Clientes registrados"
          valor={String(
            clientesDirectorio.length,
          )}
          descripcion="Disponibles en el directorio"
          icono={UsersRound}
          tono="azul"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Con teléfono"
          valor={String(totalConTelefono)}
          descripcion="Contacto disponible"
          icono={Phone}
          tono="verde"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Con ubicación"
          valor={String(totalConUbicacion)}
          descripcion="Dirección o enlace registrado"
          icono={MapPin}
          tono="roma"
          variante="compacta"
        />

        <TarjetaMetrica
          titulo="Clientes archivados"
          valor={String(totalArchivados)}
          descripcion="Conservan su historial"
          icono={Archive}
          tono="neutro"
          variante="compacta"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <header className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950/45 dark:text-red-300">
                <UsersRound size={21} />
              </div>

              <div>
                <h1 className="text-lg font-black text-slate-950 dark:text-white">
                  Directorio de clientes
                </h1>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Contacto y datos preparados para pedidos y entregas.
                </p>
              </div>
            </div>
          </div>

          {puedeGestionar && (
            <button
              type="button"
              onClick={abrirNuevoCliente}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md"
            >
              <Plus size={18} />
              Nuevo cliente
            </button>
          )}
        </header>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_240px_auto] dark:border-slate-700 dark:bg-slate-950/35">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={busqueda}
              placeholder="Nombre, teléfono, dirección, zona o referencia"
              onChange={(evento) => {
                setBusqueda(
                  evento.target.value,
                );
                setPaginaActual(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-red-500 dark:focus:ring-red-950/60"
            />
          </div>

          <select
            value={filtro}
            onChange={(evento) => {
              setFiltro(
                evento.target.value as FiltroDirectorio,
              );
              setPaginaActual(1);
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="Directorio">
              Todos los clientes
            </option>
            <option value="Con entrega">
              Con datos de entrega
            </option>
            <option value="Datos incompletos">
              Datos incompletos
            </option>
            <option value="Archivados">
              Archivados
            </option>
          </select>

          <button
            type="button"
            disabled={!filtrosActivos}
            onClick={limpiarFiltros}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={17} />
            Limpiar
          </button>
        </div>

        <div className="h-[clamp(18rem,36vh,23rem)] overflow-y-auto overscroll-contain p-3 sm:p-4">
          {clientesPagina.length === 0 ? (
            <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 text-center dark:border-slate-700">
              <UsersRound
                size={34}
                className="text-slate-400"
              />

              <h2 className="mt-4 font-black text-slate-900 dark:text-white">
                No se encontraron clientes
              </h2>

              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Ajusta la búsqueda o limpia los filtros para volver al directorio completo.
              </p>

              {filtrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="sticky top-0 z-10 hidden grid-cols-[minmax(220px,1.1fr)_minmax(180px,0.75fr)_minmax(260px,1.15fr)_minmax(190px,0.8fr)_150px] gap-4 rounded-xl bg-white/95 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 backdrop-blur xl:grid dark:bg-slate-900/95 dark:text-slate-400">
                <span>Cliente</span>
                <span>Contacto</span>
                <span>Datos de entrega</span>
                <span>Último pedido</span>
                <span className="text-right">Acciones</span>
              </div>

              {clientesPagina.map((cliente) => {
                const ultimoPedido =
                  ultimoPedidoPorCliente.get(
                    cliente.id,
                  ) ?? null;

                return (
                  <article
                    key={cliente.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50 xl:grid-cols-[minmax(220px,1.1fr)_minmax(180px,0.75fr)_minmax(260px,1.15fr)_minmax(190px,0.8fr)_150px] xl:items-center dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-sm font-black text-red-700 dark:bg-red-950/45 dark:text-red-300">
                        {obtenerIniciales(
                          cliente.nombreCompleto,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950 dark:text-white">
                          {cliente.nombreCompleto}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          CLI-{String(cliente.id).padStart(4, "0")}
                          {cliente.archivado
                            ? " · Archivado"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <Phone
                          size={15}
                          className="shrink-0 text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="truncate">
                          {cliente.telefono ??
                            "Sin teléfono"}
                        </span>
                      </p>

                      {cliente.correo && (
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {cliente.correo}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      {clienteTieneDatosEntrega(
                        cliente,
                      ) ? (
                        <>
                          <p className="flex items-start gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                            />
                            <span className="line-clamp-2">
                              {cliente.direccion ??
                                "Ubicación compartida"}
                            </span>
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {cliente.zona && (
                              <span>
                                {cliente.zona}
                              </span>
                            )}

                            {cliente.ubicacionUrl && (
                              <a
                                href={cliente.ubicacionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline dark:text-blue-300"
                              >
                                Abrir mapa
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Sin ubicación registrada
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      {ultimoPedido ? (
                        <>
                          <p className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                            <Clock3
                              size={15}
                              className="shrink-0 text-violet-600 dark:text-violet-400"
                            />
                            {ultimoPedido.numeroPedido}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {formatearFechaHora(
                              ultimoPedido.fechaHoraRegistro,
                            )}
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-700 dark:text-slate-300">
                            {formatearMoneda(
                              ultimoPedido.total,
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Sin pedidos registrados
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {puedeGestionar && (
                        <>
                          {!cliente.archivado &&
                            clienteTieneDatosEntrega(
                              cliente,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirCompartirEntrega(
                                    cliente,
                                  )
                                }
                                aria-label={`Compartir entrega de ${cliente.nombreCompleto}`}
                                title="Compartir datos de entrega"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/45 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                              >
                                <Share2 size={17} />
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicion(cliente)
                            }
                            aria-label={`Editar ${cliente.nombreCompleto}`}
                            title="Editar cliente"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition-all hover:-translate-y-0.5 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/45 dark:text-blue-300 dark:hover:bg-blue-900/60"
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setClienteParaArchivar(
                                cliente,
                              )
                            }
                            aria-label={`${cliente.archivado ? "Restaurar" : "Archivar"} ${cliente.nombreCompleto}`}
                            title={
                              cliente.archivado
                                ? "Restaurar cliente"
                                : "Archivar cliente"
                            }
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5 ${
                              cliente.archivado
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/45 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            }`}
                          >
                            {cliente.archivado ? (
                              <ArchiveRestore size={17} />
                            ) : (
                              <Archive size={17} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Mostrando {clientesPagina.length} de {clientesFiltrados.length} cliente(s)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaSegura <= 1}
              onClick={() =>
                setPaginaActual(
                  (pagina) => pagina - 1,
                )
              }
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
            >
              Anterior
            </button>

            <span className="min-w-20 text-center text-xs font-black text-slate-500 dark:text-slate-400">
              {paginaSegura} / {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaSegura >= totalPaginas}
              onClick={() =>
                setPaginaActual(
                  (pagina) => pagina + 1,
                )
              }
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
            >
              Siguiente
            </button>
          </div>
        </footer>
      </section>

      <Modal
        abierto={modalAbierto}
        titulo={
          clienteSeleccionado
            ? "Editar cliente"
            : "Nuevo cliente"
        }
        descripcion="Guarda el contacto y la información necesaria para pedidos y entregas."
        ancho="grande"
        alCerrar={cerrarFormulario}
      >
        <FormularioCliente
          cliente={clienteSeleccionado}
          cargando={guardando}
          alGuardar={guardarCliente}
          alCancelar={cerrarFormulario}
        />
      </Modal>

      <Modal
        abierto={Boolean(
          clienteParaCompartir,
        )}
        titulo="Compartir datos de entrega"
        descripcion="Revisa la información antes de copiarla o abrirla en WhatsApp."
        ancho="mediano"
        alCerrar={() =>
          setClienteParaCompartir(null)
        }
      >
        {clienteParaCompartir && (
          <div className="space-y-5 p-5 sm:p-6">
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/35">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <MapPin size={20} />
                </div>

                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white">
                    {clienteParaCompartir.nombreCompleto}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {clienteParaCompartir.telefono ??
                      "Sin teléfono registrado"}
                  </p>
                </div>
              </div>
            </section>

            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {construirTextoEntregaCliente(
                clienteParaCompartir,
              )}
            </pre>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  void copiarDatosEntrega()
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Copy size={17} />
                Copiar datos
              </button>

              <button
                type="button"
                onClick={abrirWhatsappEntrega}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-700"
              >
                <MessageCircle size={17} />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(
          clienteParaArchivar,
        )}
        titulo={
          clienteParaArchivar?.archivado
            ? "Restaurar cliente"
            : "Archivar cliente"
        }
        descripcion={
          clienteParaArchivar?.archivado
            ? `¿Deseas restaurar a ${clienteParaArchivar.nombreCompleto}? Volverá a estar disponible en el selector de Ventas.`
            : `¿Deseas archivar a ${clienteParaArchivar?.nombreCompleto ?? "este cliente"}? Su historial se conservará, pero dejará de aparecer en nuevas ventas.`
        }
        textoConfirmar={
          clienteParaArchivar?.archivado
            ? "Restaurar"
            : "Archivar"
        }
        variante={
          clienteParaArchivar?.archivado
            ? "activar"
            : "peligro"
        }
        centrarIcono
        cargando={cambiandoArchivo}
        alConfirmar={() =>
          void confirmarArchivado()
        }
        alCancelar={() =>
          setClienteParaArchivar(null)
        }
      />
    </div>
  );
}

export default Clientes;
