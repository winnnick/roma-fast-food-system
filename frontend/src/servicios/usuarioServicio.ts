import type {
  ActualizarAccesosUsuarioDto,
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  EstadoUsuario,
  Usuario,
} from "../tipos/usuario";

import {
  apiAuth,
  crearErrorApi,
} from "./apiCliente";

export async function listarUsuarios(): Promise<
  Usuario[]
> {
  try {
    const respuesta =
      await apiAuth.get<Usuario[]>(
        "/usuarios",
      );

    return [...respuesta.data].sort(
      (a, b) => b.id - a.id,
    );
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cargar los usuarios.",
    );
  }
}

export async function crearUsuario(
  datos: CrearUsuarioDto,
): Promise<Usuario> {
  try {
    const respuesta =
      await apiAuth.post<Usuario>(
        "/usuarios",
        {
          username: datos.username.trim(),
          nombreCompleto:
            datos.nombreCompleto.trim(),
          rol: datos.rol,
          roles:
            datos.roles?.length
              ? datos.roles
              : [datos.rol],
          password: datos.password,
        },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible registrar el usuario.",
    );
  }
}

export async function actualizarUsuario(
  id: number,
  datos: ActualizarUsuarioDto,
): Promise<Usuario> {
  try {
    const payload: Record<
      string,
      unknown
    > = {
      username: datos.username.trim(),
      nombreCompleto:
        datos.nombreCompleto.trim(),
      rol: datos.rol,
      roles:
        datos.roles?.length
          ? datos.roles
          : [datos.rol],
    };

    if (datos.password?.trim()) {
      payload.password = datos.password;
    }

    const respuesta =
      await apiAuth.put<Usuario>(
        `/usuarios/${id}`,
        payload,
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar el usuario.",
    );
  }
}

export async function actualizarAccesosUsuario(
  id: number,
  datos: ActualizarAccesosUsuarioDto,
): Promise<Usuario> {
  try {
    const respuesta =
      await apiAuth.put<Usuario>(
        `/usuarios/${id}/accesos`,
        {
          roles: datos.roles,
          permisosAdicionales:
            datos.permisosAdicionales,
        },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible actualizar los accesos del usuario.",
    );
  }
}

export async function cambiarEstadoUsuario(
  id: number,
  nuevoEstado: EstadoUsuario,
): Promise<Usuario> {
  try {
    const respuesta =
      await apiAuth.patch<Usuario>(
        `/usuarios/${id}/estado`,
        {
          estado: nuevoEstado,
        },
      );

    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible cambiar el estado del usuario.",
    );
  }
}
