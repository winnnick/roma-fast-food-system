import type {
  CredencialesLogin,
  SesionUsuario,
} from "../tipos/auth";

import {
  registrarUltimoAccesoUsuario,
  validarCredencialesUsuario,
} from "./usuarioServicio";

import {
  obtenerPermisosRoles,
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
    await obtenerPermisosRoles(
      usuario.roles,
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
      roles: [...usuario.roles],
      permisos,
    },

    accessToken:
      `token-demo-${crypto.randomUUID()}`,

    fechaInicio:
      new Date().toISOString(),
  };
}
