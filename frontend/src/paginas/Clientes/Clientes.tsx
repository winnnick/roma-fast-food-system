import {
  Ban,
  FileCheck2,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
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
  cambiarEstadoCliente,
  crearCliente,
  listarClientes,
} from "../../servicios/clienteServicio";

import type {
  Cliente,
  CrearClienteDto,
  EstadoCliente,
  TipoDocumentoCliente,
} from "../../tipos/cliente";

import NotificacionFlotante, {
  type DatosNotificacion,
} from "../../shared/feedback/NotificacionFlotante";

import Modal from "../../shared/ui/Modal";
import ModalConfirmacion from "../../shared/ui/ModalConfirmacion";
import TarjetaMetrica from "../../shared/ui/TarjetaMetrica";

import FormularioCliente from "./FormularioCliente";

const CLIENTES_POR_PAGINA = 6;

type FiltroEstadoCliente =
  | "Todos"
  | EstadoCliente;

type FiltroDocumentoCliente =
  | "Todos"
  | "Sin documento"
  | TipoDocumentoCliente;

function obtenerMensajeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

function formatearFecha(
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

  const [cargando, setCargando] =
    useState(true);

  const [errorCarga, setErrorCarga] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstadoCliente>(
      "Todos",
    );

  const [
    filtroDocumento,
    setFiltroDocumento,
  ] =
    useState<FiltroDocumentoCliente>(
      "Todos",
    );

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [
    clienteSeleccionado,
    setClienteSeleccionado,
  ] = useState<Cliente | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [
    clienteCambioEstado,
    setClienteCambioEstado,
  ] = useState<Cliente | null>(null);

  const [
    cambiandoEstado,
    setCambiandoEstado,
  ] = useState(false);

  const [
    notificacion,
    setNotificacion,
  ] =
    useState<DatosNotificacion | null>(
      null,
    );

  const cerrarNotificacion =
    useCallback(() => {
      setNotificacion(null);
    }, []);

  const cargarClientes =
    useCallback(async () => {
      try {
        setCargando(true);
        setErrorCarga(null);

        const respuesta =
          await listarClientes();

        setClientes(respuesta);
      } catch (error: unknown) {
        setErrorCarga(
          obtenerMensajeError(error),
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    let componenteActivo = true;

    listarClientes()
      .then((respuesta) => {
        if (!componenteActivo) {
          return;
        }

        setClientes(respuesta);
        setErrorCarga(null);
      })
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
          setCargando(false);
        }
      });

    return () => {
      componenteActivo = false;
    };
  }, []);

  const clientesFiltrados =
    useMemo(() => {
      const textoBusqueda =
        busqueda
          .trim()
          .toLocaleLowerCase("es");

      return clientes.filter(
        (cliente) => {
          const coincideBusqueda =
            !textoBusqueda ||
            cliente.nombreCompleto
              .toLocaleLowerCase("es")
              .includes(textoBusqueda) ||
            cliente.numeroDocumento
              ?.toLocaleLowerCase("es")
              .includes(textoBusqueda) ||
            cliente.telefono
              ?.toLocaleLowerCase("es")
              .includes(textoBusqueda) ||
            cliente.correo
              ?.toLocaleLowerCase("es")
              .includes(textoBusqueda);

          const coincideEstado =
            filtroEstado === "Todos" ||
            cliente.estado ===
              filtroEstado;

          const coincideDocumento =
            filtroDocumento ===
              "Todos" ||
            (
              filtroDocumento ===
                "Sin documento" &&
              !cliente.tipoDocumento
            ) ||
            cliente.tipoDocumento ===
              filtroDocumento;

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideDocumento
          );
        },
      );
    }, [
      clientes,
      busqueda,
      filtroEstado,
      filtroDocumento,
    ]);

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
        inicio +
          CLIENTES_POR_PAGINA,
      );
    }, [
      clientesFiltrados,
      paginaSegura,
    ]);

  const totalActivos =
    clientes.filter(
      (cliente) =>
        cliente.estado === "Activo",
    ).length;

  const totalInactivos =
    clientes.length - totalActivos;

  const totalConDocumento =
    clientes.filter(
      (cliente) =>
        Boolean(
          cliente.numeroDocumento,
        ),
    ).length;

  const totalEmpresas =
    clientes.filter(
      (cliente) =>
        cliente.tipoDocumento ===
        "NIT",
    ).length;

  const filtrosActivos =
    Boolean(busqueda) ||
    filtroEstado !== "Todos" ||
    filtroDocumento !== "Todos";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("Todos");
    setFiltroDocumento("Todos");
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
        const clienteActualizado =
          await actualizarCliente(
            clienteSeleccionado.id,
            datos,
          );

        await auditarAccion({
          modulo: "Clientes",
          accion: "Actualizar cliente",
          entidad: "Cliente",
          entidadId:
            clienteActualizado.id,
          descripcion:
            `Se actualizó el cliente ${clienteActualizado.nombreCompleto}.`,
          datosAnteriores:
            clienteSeleccionado,
          datosPosteriores:
            clienteActualizado,
        });

        setNotificacion({
          tipo: "exito",
          titulo:
            "Cliente actualizado",
          mensaje:
            "La información del cliente fue modificada correctamente.",
        });
      } else {
        const clienteCreado =
          await crearCliente(datos);

        await auditarAccion({
          modulo: "Clientes",
          accion: "Crear cliente",
          entidad: "Cliente",
          entidadId:
            clienteCreado.id,
          descripcion:
            `Se registró el cliente ${clienteCreado.nombreCompleto}.`,
          datosPosteriores:
            clienteCreado,
        });

        setNotificacion({
          tipo: "exito",
          titulo:
            "Cliente registrado",
          mensaje:
            "El nuevo cliente ya puede asociarse a pedidos y ventas.",
        });
      }

      setModalAbierto(false);
      setClienteSeleccionado(null);

      await cargarClientes();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo guardar el cliente",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarCambioEstado() {
    if (
      !clienteCambioEstado ||
      !puedeGestionar
    ) {
      return;
    }

    try {
      setCambiandoEstado(true);

      const nuevoEstado:
        EstadoCliente =
        clienteCambioEstado.estado ===
        "Activo"
          ? "Inactivo"
          : "Activo";

      const clienteActualizado =
        await cambiarEstadoCliente(
          clienteCambioEstado.id,
          nuevoEstado,
        );

      await auditarAccion({
        modulo: "Clientes",
        accion:
          nuevoEstado === "Activo"
            ? "Activar cliente"
            : "Desactivar cliente",
        entidad: "Cliente",
        entidadId:
          clienteActualizado.id,
        descripcion:
          `${clienteActualizado.nombreCompleto} fue ${nuevoEstado === "Activo" ? "activado" : "desactivado"}.`,
        datosAnteriores:
          clienteCambioEstado,
        datosPosteriores:
          clienteActualizado,
      });

      setNotificacion({
        tipo: "exito",
        titulo:
          nuevoEstado === "Activo"
            ? "Cliente activado"
            : "Cliente desactivado",
        mensaje:
          nuevoEstado === "Activo"
            ? "El cliente puede asociarse nuevamente a pedidos y ventas."
            : "El cliente quedó fuera de uso sin eliminar su información histórica.",
      });

      setClienteCambioEstado(null);

      await cargarClientes();
    } catch (error: unknown) {
      setNotificacion({
        tipo: "error",
        titulo:
          "No se pudo cambiar el estado",
        mensaje:
          obtenerMensajeError(error),
      });
    } finally {
      setCambiandoEstado(false);
    }
  }

  if (cargando) {
    return (
      <div className="space-y-6 animate-pulse">
        <div
          className="
            h-44 rounded-3xl
            bg-slate-300
          "
        />

        <div
          className="
            grid grid-cols-1 gap-5
            sm:grid-cols-2 xl:grid-cols-4
          "
        >
          {Array.from({
            length: 4,
          }).map((_, indice) => (
            <div
              key={indice}
              className="
                h-40 rounded-2xl
                bg-white
              "
            />
          ))}
        </div>

        <div
          className="
            h-120 rounded-3xl
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
          border-red-200 bg-white
          p-8 text-center
          shadow-panel
        "
      >
        <h2
          className="
            text-xl font-black
            text-slate-900
          "
        >
          No se pudieron cargar los
          clientes
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
            void cargarClientes()
          }
          className="
            mt-5 inline-flex
            items-center gap-2
            rounded-xl
            bg-red-700 px-5 py-3
            text-sm font-bold
            text-white
            transition-colors
            hover:bg-red-800
          "
        >
          <RotateCcw size={18} />
          Volver a intentar
        </button>
      </section>
    );
  }

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
                inline-flex items-center
                gap-2 rounded-full
                border border-white/15
                bg-white/10
                px-3 py-1.5
                text-xs font-bold
                text-red-100
                backdrop-blur
              "
            >
              <UsersRound size={15} />
              Directorio comercial
            </div>

            <h1
              className="
                mt-4 text-3xl
                font-black tracking-tight
                sm:text-4xl
              "
            >
              Gestión de clientes
            </h1>

            <p
              className="
                mt-3 max-w-2xl
                text-sm leading-relaxed
                text-slate-300
                sm:text-base
              "
            >
              Registra y consulta los
              datos de clientes que podrán
              asociarse a pedidos, ventas
              y comprobantes.
            </p>
          </div>

          {puedeGestionar && (
            <button
              type="button"
              onClick={abrirNuevoCliente}
              className="
                inline-flex items-center
                justify-center gap-2
                rounded-xl
                bg-red-600 px-5 py-3
                text-sm font-bold
                text-white
                shadow-lg
                shadow-red-950/30
                transition-all
                hover:-translate-y-0.5
                hover:bg-red-500
              "
            >
              <Plus size={19} />
              Nuevo cliente
            </button>
          )}
        </div>
      </section>

      <section
        className="
          grid grid-cols-1 gap-5
          sm:grid-cols-2 xl:grid-cols-4
        "
      >
        <TarjetaMetrica
          titulo="Clientes registrados"
          valor={String(clientes.length)}
          descripcion="Total del directorio"
          icono={UsersRound}
          tono="azul"
        />

        <TarjetaMetrica
          titulo="Clientes activos"
          valor={String(totalActivos)}
          descripcion="Disponibles para ventas"
          icono={UserCheck}
          tono="verde"
        />

        <TarjetaMetrica
          titulo="Clientes inactivos"
          valor={String(totalInactivos)}
          descripcion="Registros fuera de uso"
          icono={Ban}
          tono="ambar"
        />

        <TarjetaMetrica
          titulo="Con documento"
          valor={String(
            totalConDocumento,
          )}
          descripcion={`${totalEmpresas} clientes con NIT`}
          icono={FileCheck2}
          tono="roma"
        />
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
            border-b border-slate-100
            p-5 sm:p-6
          "
        >
          <div
            className="
              grid grid-cols-1
              gap-4
              xl:grid-cols-[1fr_220px_220px_auto]
            "
          >
            <div className="relative">
              <Search
                size={19}
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
                placeholder="Buscar por nombre, documento, teléfono o correo..."
                onChange={(evento) => {
                  setBusqueda(
                    evento.target.value,
                  );

                  setPaginaActual(1);
                }}
                className="
                  h-12 w-full
                  rounded-xl border
                  border-slate-300
                  bg-white pl-11 pr-4
                  text-sm outline-none
                  transition-all
                  placeholder:text-slate-400
                  focus:border-red-600
                  focus:ring-4
                  focus:ring-red-100
                "
              />
            </div>

            <select
              value={filtroDocumento}
              onChange={(evento) => {
                setFiltroDocumento(
                  evento.target
                    .value as FiltroDocumentoCliente,
                );

                setPaginaActual(1);
              }}
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-semibold
                text-slate-700
                outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
              "
            >
              <option value="Todos">
                Todos los documentos
              </option>

              <option value="CI">
                Cédula de identidad
              </option>

              <option value="NIT">
                NIT
              </option>

              <option value="Pasaporte">
                Pasaporte
              </option>

              <option value="Otro">
                Otro documento
              </option>

              <option value="Sin documento">
                Sin documento
              </option>
            </select>

            <select
              value={filtroEstado}
              onChange={(evento) => {
                setFiltroEstado(
                  evento.target
                    .value as FiltroEstadoCliente,
                );

                setPaginaActual(1);
              }}
              className="
                h-12 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-semibold
                text-slate-700
                outline-none
                focus:border-red-600
                focus:ring-4
                focus:ring-red-100
              "
            >
              <option value="Todos">
                Todos los estados
              </option>

              <option value="Activo">
                Activos
              </option>

              <option value="Inactivo">
                Inactivos
              </option>
            </select>

            <button
              type="button"
              disabled={!filtrosActivos}
              onClick={limpiarFiltros}
              className="
                inline-flex h-12
                items-center justify-center
                gap-2 rounded-xl
                border border-slate-300
                bg-white px-4
                text-sm font-bold
                text-slate-700
                transition-colors
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <RotateCcw size={17} />
              Limpiar
            </button>
          </div>

          <p
            className="
              mt-4 text-sm
              text-slate-500
            "
          >
            Se encontraron{" "}
            <strong
              className="
                text-slate-800
              "
            >
              {clientesFiltrados.length}
            </strong>{" "}
            clientes.
          </p>
        </div>

        {clientesPagina.length === 0 ? (
          <div
            className="
              flex min-h-80
              flex-col items-center
              justify-center
              p-8 text-center
            "
          >
            <div
              className="
                flex h-16 w-16
                items-center justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
              "
            >
              <Search size={29} />
            </div>

            <h2
              className="
                mt-5 text-lg
                font-black
                text-slate-900
              "
            >
              No existen resultados
            </h2>

            <p
              className="
                mt-2 max-w-md
                text-sm leading-relaxed
                text-slate-500
              "
            >
              Modifica los criterios de
              búsqueda o registra un nuevo
              cliente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
                w-full min-w-[1150px]
              "
            >
              <thead>
                <tr className="bg-slate-50">
                  <th
                    className="
                      px-5 py-4 text-left
                      text-xs font-bold
                      uppercase tracking-wider
                      text-slate-500
                    "
                  >
                    Cliente
                  </th>

                  <th
                    className="
                      px-5 py-4 text-left
                      text-xs font-bold
                      uppercase tracking-wider
                      text-slate-500
                    "
                  >
                    Documento
                  </th>

                  <th
                    className="
                      px-5 py-4 text-left
                      text-xs font-bold
                      uppercase tracking-wider
                      text-slate-500
                    "
                  >
                    Contacto
                  </th>

                  <th
                    className="
                      px-5 py-4 text-left
                      text-xs font-bold
                      uppercase tracking-wider
                      text-slate-500
                    "
                  >
                    Estado
                  </th>

                  <th
                    className="
                      px-5 py-4 text-left
                      text-xs font-bold
                      uppercase tracking-wider
                      text-slate-500
                    "
                  >
                    Actualización
                  </th>

                  <th
                    className="
                      px-5 py-4 text-right
                      text-xs font-bold
                      uppercase tracking-wider
                      text-slate-500
                    "
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y divide-slate-100
                "
              >
                {clientesPagina.map(
                  (cliente) => (
                    <tr
                      key={cliente.id}
                      className="
                        transition-colors
                        hover:bg-slate-50/70
                      "
                    >
                      <td className="px-5 py-4">
                        <div
                          className="
                            flex items-start
                            gap-3
                          "
                        >
                          <div
                            className="
                              flex h-11 w-11
                              shrink-0 items-center
                              justify-center
                              rounded-2xl
                              bg-red-50
                              text-sm font-black
                              text-red-700
                            "
                          >
                            {obtenerIniciales(
                              cliente.nombreCompleto,
                            )}
                          </div>

                          <div>
                            <p
                              className="
                                font-bold
                                text-slate-900
                              "
                            >
                              {
                                cliente.nombreCompleto
                              }
                            </p>

                            {cliente.direccion && (
                              <p
                                className="
                                  mt-1 max-w-xs
                                  text-xs
                                  leading-relaxed
                                  text-slate-500
                                "
                              >
                                {cliente.direccion}
                              </p>
                            )}

                            {cliente.observaciones && (
                              <p
                                className="
                                  mt-1 max-w-xs
                                  text-[11px]
                                  italic
                                  text-slate-400
                                "
                              >
                                {
                                  cliente.observaciones
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {cliente.tipoDocumento &&
                        cliente.numeroDocumento ? (
                          <div>
                            <span
                              className="
                                inline-flex
                                rounded-full
                                bg-blue-50
                                px-3 py-1
                                text-xs font-bold
                                text-blue-700
                              "
                            >
                              {
                                cliente.tipoDocumento
                              }
                            </span>

                            <p
                              className="
                                mt-2 text-sm
                                font-semibold
                                text-slate-700
                              "
                            >
                              {
                                cliente.numeroDocumento
                              }
                            </p>
                          </div>
                        ) : (
                          <span
                            className="
                              text-xs font-semibold
                              text-slate-400
                            "
                          >
                            Sin documento
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          {cliente.telefono ? (
                            <div
                              className="
                                flex items-center
                                gap-2 text-sm
                                text-slate-700
                              "
                            >
                              <Phone
                                size={15}
                                className="
                                  shrink-0
                                  text-emerald-600
                                "
                              />

                              <span>
                                {
                                  cliente.telefono
                                }
                              </span>
                            </div>
                          ) : (
                            <p
                              className="
                                text-xs
                                text-slate-400
                              "
                            >
                              Sin teléfono
                            </p>
                          )}

                          {cliente.correo && (
                            <div
                              className="
                                flex items-center
                                gap-2 text-xs
                                text-slate-500
                              "
                            >
                              <Mail
                                size={14}
                                className="
                                  shrink-0
                                  text-blue-600
                                "
                              />

                              <span>
                                {cliente.correo}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex
                            items-center gap-2
                            rounded-full
                            px-3 py-1
                            text-xs font-bold
                            ${
                              cliente.estado ===
                              "Activo"
                                ? `
                                  bg-emerald-50
                                  text-emerald-700
                                `
                                : `
                                  bg-slate-100
                                  text-slate-600
                                `
                            }
                          `}
                        >
                          <span
                            className={`
                              h-2 w-2
                              rounded-full
                              ${
                                cliente.estado ===
                                "Activo"
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }
                            `}
                          />

                          {cliente.estado}
                        </span>
                      </td>

                      <td
                        className="
                          px-5 py-4
                          text-sm
                          text-slate-600
                        "
                      >
                        {formatearFecha(
                          cliente.fechaActualizacion,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {puedeGestionar ? (
                          <div
                            className="
                              flex items-center
                              justify-end gap-2
                            "
                          >
                            <button
                              type="button"
                              title="Editar cliente"
                              onClick={() =>
                                abrirEdicion(
                                  cliente,
                                )
                              }
                              className="
                                inline-flex
                                items-center gap-2
                                rounded-xl
                                bg-blue-50
                                px-3 py-2
                                text-xs font-bold
                                text-blue-700
                                transition-colors
                                hover:bg-blue-100
                              "
                            >
                              <Pencil size={15} />
                              Editar
                            </button>

                            <button
                              type="button"
                              title={
                                cliente.estado ===
                                "Activo"
                                  ? "Desactivar cliente"
                                  : "Activar cliente"
                              }
                              onClick={() =>
                                setClienteCambioEstado(
                                  cliente,
                                )
                              }
                              className={`
                                inline-flex
                                items-center gap-2
                                rounded-xl px-3 py-2
                                text-xs font-bold
                                transition-colors
                                ${
                                  cliente.estado ===
                                  "Activo"
                                    ? `
                                      bg-red-50
                                      text-red-700
                                      hover:bg-red-100
                                    `
                                    : `
                                      bg-emerald-50
                                      text-emerald-700
                                      hover:bg-emerald-100
                                    `
                                }
                              `}
                            >
                              {cliente.estado ===
                              "Activo" ? (
                                <Ban size={15} />
                              ) : (
                                <UserCheck
                                  size={15}
                                />
                              )}

                              {cliente.estado ===
                              "Activo"
                                ? "Desactivar"
                                : "Activar"}
                            </button>
                          </div>
                        ) : (
                          <p
                            className="
                              text-right
                              text-xs font-semibold
                              text-slate-400
                            "
                          >
                            Solo lectura
                          </p>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        <div
          className="
            flex flex-col gap-4
            border-t border-slate-100
            px-5 py-4 sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          <p
            className="
              text-sm text-slate-500
            "
          >
            Página{" "}
            <strong
              className="
                text-slate-800
              "
            >
              {paginaSegura}
            </strong>{" "}
            de{" "}
            <strong
              className="
                text-slate-800
              "
            >
              {totalPaginas}
            </strong>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaSegura === 1}
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.max(
                      1,
                      pagina - 1,
                    ),
                )
              }
              className="
                rounded-xl border
                border-slate-300
                px-4 py-2
                text-sm font-bold
                text-slate-700
                transition-colors
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={
                paginaSegura ===
                totalPaginas
              }
              onClick={() =>
                setPaginaActual(
                  (pagina) =>
                    Math.min(
                      totalPaginas,
                      pagina + 1,
                    ),
                )
              }
              className="
                rounded-xl border
                border-slate-300
                px-4 py-2
                text-sm font-bold
                text-slate-700
                transition-colors
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      <Modal
        abierto={modalAbierto}
        titulo={
          clienteSeleccionado
            ? "Modificar cliente"
            : "Registrar cliente"
        }
        descripcion={
          clienteSeleccionado
            ? "Actualiza la información del cliente seleccionado."
            : "Completa los datos disponibles para incorporar un cliente al directorio."
        }
        ancho="grande"
        alCerrar={cerrarFormulario}
      >
        <FormularioCliente
          key={
            clienteSeleccionado
              ? `editar-cliente-${clienteSeleccionado.id}`
              : "nuevo-cliente"
          }
          cliente={clienteSeleccionado}
          cargando={guardando}
          alGuardar={guardarCliente}
          alCancelar={cerrarFormulario}
        />
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(
          clienteCambioEstado,
        )}
        titulo={
          clienteCambioEstado?.estado ===
          "Activo"
            ? "Desactivar cliente"
            : "Activar cliente"
        }
        descripcion={
          clienteCambioEstado?.estado ===
          "Activo"
            ? `¿Deseas desactivar a “${clienteCambioEstado.nombreCompleto}”? No podrá seleccionarse en nuevos pedidos, pero su historial se conservará.`
            : `¿Deseas activar a “${clienteCambioEstado?.nombreCompleto ?? ""}”? Podrá asociarse nuevamente a pedidos y ventas.`
        }
        textoConfirmar={
          clienteCambioEstado?.estado ===
          "Activo"
            ? "Sí, desactivar"
            : "Sí, activar"
        }
        variante={
          clienteCambioEstado?.estado ===
          "Activo"
            ? "peligro"
            : "activar"
        }
        cargando={cambiandoEstado}
        alConfirmar={() =>
          void confirmarCambioEstado()
        }
        alCancelar={() => {
          if (!cambiandoEstado) {
            setClienteCambioEstado(null);
          }
        }}
      />
    </div>
  );
}

export default Clientes;