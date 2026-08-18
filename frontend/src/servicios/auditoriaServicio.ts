import type { UsuarioSesion } from "../tipos/auth";
import type {
  FiltroAuditoria,
  RegistrarAuditoriaDto,
  RegistroAuditoria,
} from "../tipos/auditoria";

import { apiReporting, crearErrorApi } from "./apiCliente";
import { invalidarCacheReporting } from "./reportingFuenteServicio";

export async function registrarEventoAuditoria(
  datos: RegistrarAuditoriaDto,
  usuario: UsuarioSesion | null,
): Promise<RegistroAuditoria> {
  void usuario;

  try {
    const respuesta = await apiReporting.post<RegistroAuditoria>(
      "/reportes/auditoria",
      datos,
    );
    invalidarCacheReporting();
    return respuesta.data;
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible registrar el evento de auditoría.",
    );
  }
}

export async function listarAuditoria(
  filtro: FiltroAuditoria = {},
): Promise<RegistroAuditoria[]> {
  try {
    const respuesta = await apiReporting.get<RegistroAuditoria[]>(
      "/reportes/auditoria",
      {
        params: {
          fechaDesde: filtro.fechaDesde,
          fechaHasta: filtro.fechaHasta,
          usuarioId: filtro.usuarioId,
          modulo: filtro.modulo,
          nivel: filtro.nivel,
          texto: filtro.texto,
        },
      },
    );

    return [...respuesta.data].sort(
      (a, b) =>
        new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
    );
  } catch (error) {
    throw crearErrorApi(
      error,
      "No fue posible consultar la bitácora de auditoría.",
    );
  }
}
