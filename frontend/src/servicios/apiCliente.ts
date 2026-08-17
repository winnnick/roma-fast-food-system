import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import type {
  SesionUsuario,
} from "../tipos/auth";

export const CLAVE_SESION_API =
  "roma-sesion";

export const EVENTO_SESION_API_ACTUALIZADA =
  "roma-sesion-api-actualizada";

const URL_AUTH = (
  import.meta.env.VITE_AUTH_API_URL as
    | string
    | undefined
)?.replace(/\/$/, "") ??
  "http://localhost:3101/api/v1";

const URL_OPERATIONS = (
  import.meta.env
    .VITE_OPERATIONS_API_URL as
    | string
    | undefined
)?.replace(/\/$/, "") ??
  "http://localhost:3102/api/v1";

interface RespuestaErrorApi {
  message?: unknown;
  detail?: unknown;
  title?: unknown;
  error?: unknown;
}

interface ConfiguracionReintento
  extends InternalAxiosRequestConfig {
  _romaReintento?: boolean;
}

function leerSesionPersistida():
  SesionUsuario | null {
  const valor = localStorage.getItem(
    CLAVE_SESION_API,
  );

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(
      valor,
    ) as SesionUsuario;
  } catch {
    localStorage.removeItem(
      CLAVE_SESION_API,
    );
    return null;
  }
}

function notificarSesion(
  sesion: SesionUsuario | null,
): void {
  window.dispatchEvent(
    new CustomEvent(
      EVENTO_SESION_API_ACTUALIZADA,
      {
        detail: sesion,
      },
    ),
  );
}

export function guardarSesionApi(
  sesion: SesionUsuario,
): void {
  localStorage.setItem(
    CLAVE_SESION_API,
    JSON.stringify(sesion),
  );
  notificarSesion(sesion);
}

export function limpiarSesionApi(): void {
  localStorage.removeItem(
    CLAVE_SESION_API,
  );
  notificarSesion(null);
}

export function obtenerAccessTokenApi():
  string | null {
  return (
    leerSesionPersistida()
      ?.accessToken ?? null
  );
}

const clienteRefresh = axios.create({
  baseURL: URL_AUTH,
  withCredentials: true,
  timeout: 12_000,
});

export const apiAuth = axios.create({
  baseURL: URL_AUTH,
  withCredentials: true,
  timeout: 12_000,
});

export const apiOperations =
  axios.create({
    baseURL: URL_OPERATIONS,
    withCredentials: true,
    timeout: 12_000,
  });

export const apiOperationsPublic =
  axios.create({
    baseURL: URL_OPERATIONS,
    timeout: 12_000,
  });

let renovacionEnCurso:
  Promise<SesionUsuario> | null = null;

function agregarBearer(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = obtenerAccessTokenApi();

  if (token) {
    config.headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  return config;
}

async function renovarSesion():
  Promise<SesionUsuario> {
  if (!renovacionEnCurso) {
    renovacionEnCurso = clienteRefresh
      .post<SesionUsuario>(
        "/auth/refresh",
      )
      .then((respuesta) => {
        guardarSesionApi(
          respuesta.data,
        );
        return respuesta.data;
      })
      .catch((error: unknown) => {
        limpiarSesionApi();
        throw error;
      })
      .finally(() => {
        renovacionEnCurso = null;
      });
  }

  return renovacionEnCurso;
}

function esRutaSinRenovacion(
  config:
    | InternalAxiosRequestConfig
    | undefined,
): boolean {
  const url = config?.url ?? "";

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh")
  );
}

function configurarInterceptors(
  cliente: AxiosInstance,
): void {
  cliente.interceptors.request.use(
    agregarBearer,
  );

  cliente.interceptors.response.use(
    (respuesta) => respuesta,
    async (error: AxiosError) => {
      const config =
        error.config as
          | ConfiguracionReintento
          | undefined;

      if (
        error.response?.status !== 401 ||
        !config ||
        config._romaReintento ||
        esRutaSinRenovacion(config)
      ) {
        throw error;
      }

      config._romaReintento = true;

      const sesion =
        await renovarSesion();

      config.headers.set(
        "Authorization",
        `Bearer ${sesion.accessToken}`,
      );

      return cliente.request(config);
    },
  );
}

configurarInterceptors(apiAuth);
configurarInterceptors(apiOperations);

export function esEstadoErrorApi(
  error: unknown,
  estado: number,
): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === estado
  );
}

export function obtenerMensajeErrorApi(
  error: unknown,
  respaldo =
    "No fue posible completar la operación.",
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : respaldo;
  }

  if (!error.response) {
    return "No fue posible conectar con el servidor. Verifica que los servicios estén en ejecución.";
  }

  const datos =
    error.response.data as
      | RespuestaErrorApi
      | undefined;

  if (Array.isArray(datos?.message)) {
    const mensajes = datos.message.filter(
      (item): item is string =>
        typeof item === "string",
    );

    if (mensajes.length > 0) {
      return mensajes.join(" ");
    }
  }

  if (
    typeof datos?.message === "string"
  ) {
    return datos.message;
  }

  if (
    typeof datos?.detail === "string"
  ) {
    return datos.detail;
  }

  if (
    typeof datos?.title === "string"
  ) {
    return datos.title;
  }

  return respaldo;
}
export function crearErrorApi(
  error: unknown,
  respaldo =
    "No fue posible completar la operación.",
): Error {
  return new Error(
    obtenerMensajeErrorApi(
      error,
      respaldo,
    ),
    { cause: error },
  );
}

