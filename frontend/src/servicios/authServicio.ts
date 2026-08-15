import type {
  CredencialesLogin,
  SesionUsuario,
} from "../tipos/auth";

import {
  apiAuth,
  crearErrorApi,
} from "./apiCliente";

interface RespuestaSesionApi
  extends SesionUsuario {
  expiresInSeconds?: number;
}

export async function autenticarUsuario(
  credenciales: CredencialesLogin,
): Promise<SesionUsuario> {
  try {
    const respuesta =
      await apiAuth.post<RespuestaSesionApi>(
        "/auth/login",
        {
          username:
            credenciales.username.trim(),
          password:
            credenciales.password,
        },
      );

    return {
      usuario: respuesta.data.usuario,
      accessToken:
        respuesta.data.accessToken,
      fechaInicio:
        respuesta.data.fechaInicio,
    };
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible iniciar sesión.",
    );
  }
}

export async function cerrarSesionRemota():
  Promise<void> {
  try {
    await apiAuth.post("/auth/logout");
  } catch {
    // El cierre local sigue siendo prioritario si la API no está
    // disponible; el refresh token expirará o será reemplazado en el
    // siguiente inicio de sesión.
  }
}
