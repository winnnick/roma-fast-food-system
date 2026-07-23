import type {
  SesionUsuario,
  UsuarioSesion,
} from "../tipos/auth";

import type {
  RegistrarAuditoriaDto,
} from "../tipos/auditoria";

import {
  registrarEventoAuditoria,
} from "./auditoriaServicio";

const CLAVE_SESION = "roma-sesion";

function obtenerUsuarioSesionActual():
  UsuarioSesion | null {
  const datos =
    localStorage.getItem(
      CLAVE_SESION,
    );

  if (!datos) {
    return null;
  }

  try {
    const sesion = JSON.parse(
      datos,
    ) as SesionUsuario;

    return sesion.usuario ?? null;
  } catch {
    return null;
  }
}

/**
 * Registra una acción sin permitir que un problema en la bitácora
 * interrumpa la operación principal del sistema.
 */
export async function auditarAccion(
  datos: RegistrarAuditoriaDto,
  usuarioExplicito?:
    UsuarioSesion | null,
): Promise<void> {
  try {
    await registrarEventoAuditoria(
      datos,
      usuarioExplicito === undefined
        ? obtenerUsuarioSesionActual()
        : usuarioExplicito,
    );
  } catch {
    // La auditoría nunca debe revertir una operación ya confirmada.
  }
}
