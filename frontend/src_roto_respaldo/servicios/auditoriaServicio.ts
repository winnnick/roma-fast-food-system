import type {
  UsuarioSesion,
} from "../tipos/auth";

import type {
  FiltroAuditoria,
  RegistrarAuditoriaDto,
  RegistroAuditoria,
  ResumenAuditoria,
} from "../tipos/auditoria";

const CLAVE_AUDITORIA =
  "roma-auditoria-v1";

const CAMPOS_SENSIBLES = new Set([
  "password",
  "contrasena",
  "contraseña",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "secret",
  "secreto",
]);

function esperar(
  milisegundos: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milisegundos,
    );
  });
}

function obtenerSiguienteId(
  registros: RegistroAuditoria[],
): number {
  if (registros.length === 0) {
    return 1;
  }

  return (
    Math.max(
      ...registros.map(
        (registro) => registro.id,
      ),
    ) + 1
  );
}

function clonarRegistro(
  registro: RegistroAuditoria,
): RegistroAuditoria {
  return {
    ...registro,
    datosAnteriores:
      sanitizarDetalle(
        registro.datosAnteriores,
      ),
    datosPosteriores:
      sanitizarDetalle(
        registro.datosPosteriores,
      ),
  };
}

function normalizarTexto(
  valor: string,
  nombreCampo: string,
  minimo: number,
  maximo: number,
): string {
  const texto = valor.trim();

  if (
    texto.length < minimo ||
    texto.length > maximo
  ) {
    throw new Error(
      `${nombreCampo} debe contener entre ${minimo} y ${maximo} caracteres.`,
    );
  }

  return texto;
}

function sanitizarObjeto(
  objeto: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(objeto).map(
      ([clave, valor]) => {
        const claveNormalizada =
          clave
            .toLocaleLowerCase("es")
            .replaceAll("-", "")
            .replaceAll("_", "");

        const esSensible =
          CAMPOS_SENSIBLES.has(
            clave.toLocaleLowerCase("es"),
          ) ||
          CAMPOS_SENSIBLES.has(
            claveNormalizada,
          );

        if (esSensible) {
          return [clave, "[PROTEGIDO]"];
        }

        return [
          clave,
          sanitizarDetalle(valor),
        ];
      },
    ),
  );
}

function limitarDetalle(
  detalle: unknown,
): unknown {
  if (detalle === null) {
    return null;
  }

  try {
    const serializado =
      JSON.stringify(detalle);

    if (serializado.length <= 12000) {
      return detalle;
    }

    return {
      resumen:
        "El detalle fue omitido porque superaba el tamaño permitido para la bitácora local.",
      longitudOriginal:
        serializado.length,
    };
  } catch {
    return {
      resumen:
        "El detalle no pudo serializarse de forma segura.",
    };
  }
}

function sanitizarDetalle(
  valor: unknown,
): unknown {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (Array.isArray(valor)) {
    return limitarDetalle(
      valor.map(sanitizarDetalle),
    );
  }

  if (typeof valor === "object") {
    return limitarDetalle(
      sanitizarObjeto(
        valor as Record<
          string,
          unknown
        >,
      ),
    );
  }

  return String(valor);
}

function guardarRegistros(
  registros: RegistroAuditoria[],
): void {
  localStorage.setItem(
    CLAVE_AUDITORIA,
    JSON.stringify(
      registros.map(clonarRegistro),
    ),
  );
}

function obtenerRegistrosPersistidos():
  RegistroAuditoria[] {
  const datos =
    localStorage.getItem(
      CLAVE_AUDITORIA,
    );

  if (!datos) {
    guardarRegistros([]);
    return [];
  }

  try {
    const registros = JSON.parse(
      datos,
    ) as RegistroAuditoria[];

    if (!Array.isArray(registros)) {
      throw new Error(
        "La bitácora no es válida.",
      );
    }

    return registros.map(
      clonarRegistro,
    );
  } catch {
    guardarRegistros([]);
    return [];
  }
}

function crearLimitesFecha(
  fechaDesde?: string,
  fechaHasta?: string,
): {
  desde: number | null;
  hasta: number | null;
} {
  return {
    desde: fechaDesde
      ? new Date(
          `${fechaDesde}T00:00:00`,
        ).getTime()
      : null,

    hasta: fechaHasta
      ? new Date(
          `${fechaHasta}T23:59:59.999`,
        ).getTime()
      : null,
  };
}

export async function registrarEventoAuditoria(
  datos: RegistrarAuditoriaDto,
  usuario: UsuarioSesion | null,
): Promise<RegistroAuditoria> {
  await esperar(40);

  const registros =
    obtenerRegistrosPersistidos();

  const nuevoRegistro:
    RegistroAuditoria = {
    id:
      obtenerSiguienteId(registros),

    fechaHora:
      new Date().toISOString(),

    usuarioId:
      usuario?.id ?? null,

    usuarioNombre:
      usuario?.nombreCompleto ??
      "Sistema",

    usuarioRol:
      usuario?.rol ?? null,

    modulo: datos.modulo,

    accion: normalizarTexto(
      datos.accion,
      "La acción",
      3,
      100,
    ),

    entidad: normalizarTexto(
      datos.entidad,
      "La entidad",
      2,
      100,
    ),

    entidadId:
      datos.entidadId ?? null,

    descripcion:
      normalizarTexto(
        datos.descripcion,
        "La descripción",
        5,
        500,
      ),

    datosAnteriores:
      sanitizarDetalle(
        datos.datosAnteriores ?? null,
      ),

    datosPosteriores:
      sanitizarDetalle(
        datos.datosPosteriores ?? null,
      ),

    nivel:
      datos.nivel ??
      "Información",

    origen:
      datos.origen ??
      "Interfaz web",
  };

  registros.push(nuevoRegistro);
  guardarRegistros(registros);

  return clonarRegistro(
    nuevoRegistro,
  );
}

export async function listarAuditoria(
  filtro: FiltroAuditoria = {},
): Promise<RegistroAuditoria[]> {
  await esperar(120);

  const texto =
    filtro.texto
      ?.trim()
      .toLocaleLowerCase("es") ??
    "";

  const limites = crearLimitesFecha(
    filtro.fechaDesde,
    filtro.fechaHasta,
  );

  return obtenerRegistrosPersistidos()
    .filter((registro) => {
      const fecha = new Date(
        registro.fechaHora,
      ).getTime();

      const coincideDesde =
        limites.desde === null ||
        fecha >= limites.desde;

      const coincideHasta =
        limites.hasta === null ||
        fecha <= limites.hasta;

      const coincideUsuario =
        filtro.usuarioId === undefined ||
        registro.usuarioId ===
          filtro.usuarioId;

      const coincideModulo =
        filtro.modulo === undefined ||
        registro.modulo ===
          filtro.modulo;

      const coincideNivel =
        filtro.nivel === undefined ||
        registro.nivel ===
          filtro.nivel;

      const contenido = [
        registro.usuarioNombre,
        registro.modulo,
        registro.accion,
        registro.entidad,
        registro.entidadId ?? "",
        registro.descripcion,
      ]
        .join(" ")
        .toLocaleLowerCase("es");

      const coincideTexto =
        !texto ||
        contenido.includes(texto);

      return (
        coincideDesde &&
        coincideHasta &&
        coincideUsuario &&
        coincideModulo &&
        coincideNivel &&
        coincideTexto
      );
    })
    .sort(
      (registroA, registroB) =>
        new Date(
          registroB.fechaHora,
        ).getTime() -
        new Date(
          registroA.fechaHora,
        ).getTime(),
    )
    .map(clonarRegistro);
}

export async function obtenerResumenAuditoria(
  filtro: FiltroAuditoria = {},
): Promise<ResumenAuditoria> {
  const registros =
    await listarAuditoria(filtro);

  return {
    totalEventos: registros.length,

    eventosInformativos:
      registros.filter(
        (registro) =>
          registro.nivel ===
          "Información",
      ).length,

    eventosAdvertencia:
      registros.filter(
        (registro) =>
          registro.nivel ===
          "Advertencia",
      ).length,

    eventosCriticos:
      registros.filter(
        (registro) =>
          registro.nivel ===
          "Crítico",
      ).length,

    usuariosActivos:
      new Set(
        registros
          .map(
            (registro) =>
              registro.usuarioId,
          )
          .filter(
            (usuarioId) =>
              usuarioId !== null,
          ),
      ).size,

    modulosConActividad:
      new Set(
        registros.map(
          (registro) =>
            registro.modulo,
        ),
      ).size,

    ultimoEvento:
      registros[0] ?? null,
  };
}
