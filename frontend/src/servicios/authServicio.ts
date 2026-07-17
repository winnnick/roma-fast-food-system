import type {
  CredencialesLogin,
  SesionUsuario,
} from "../tipos/auth";

import {
  registrarUltimoAccesoUsuario,
  validarCredencialesUsuario,
} from "./usuarioServicio";

import {
  obtenerPermisosRol,
} from "./rolServicio";

export async function autenticarUsuario(
  credenciales: CredencialesLogin,
): Promise<SesionUsuario> {
  const usuario =
    await validarCredencialesUsuario(
      credenciales.username,
      credenciales.password,
    );

  const permisos =
    await obtenerPermisosRol(
      usuario.rol,
    );

  await registrarUltimoAccesoUsuario(
    usuario.id,
  );

  return {
    usuario: {
      id: usuario.id,
      username: usuario.username,
      nombreCompleto:
        usuario.nombreCompleto,
      rol: usuario.rol,
      permisos,
    },

    accessToken:
      `token-demo-${crypto.randomUUID()}`,

    fechaInicio:
      new Date().toISOString(),
  };
}