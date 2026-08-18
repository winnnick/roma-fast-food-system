import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import type { SesionUsuario } from "../tipos/auth";

export const CLAVE_SESION_API = "roma-sesion";

export const EVENTO_SESION_API_ACTUALIZADA = "roma-sesion-api-actualizada";

const URL_AUTH =
  (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3101/api/v1";

const URL_OPERATIONS =
  (import.meta.env.VITE_OPERATIONS_API_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3102/api/v1";

const URL_INVENTORY =
  (import.meta.env.VITE_INVENTORY_API_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3103/api/v1";

const URL_REPORTING =
  (import.meta.env.VITE_REPORTING_API_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3104/api/v1";

interface RespuestaErrorApi {
  message?: unknown;
  detail?: unknown;
  title?: unknown;
  error?: unknown;
}

interface ConfiguracionReintento extends InternalAxiosRequestConfig {
  _romaReintento?: boolean;
}

function leerSesionPersistida(): SesionUsuario | null {
  const valor = localStorage.getItem(CLAVE_SESION_API);

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(valor) as SesionUsuario;
  } catch {
    localStorage.removeItem(CLAVE_SESION_API);
    return null;
  }
}

function notificarSesion(sesion: SesionUsuario | null): void {
  window.dispatchEvent(
    new CustomEvent(EVENTO_SESION_API_ACTUALIZADA, {
      detail: sesion,
    }),
  );
}

export function guardarSesionApi(sesion: SesionUsuario): void {
  localStorage.setItem(CLAVE_SESION_API, JSON.stringify(sesion));
  notificarSesion(sesion);
}

export function limpiarSesionApi(): void {
  localStorage.removeItem(CLAVE_SESION_API);
  notificarSesion(null);
}

export function obtenerAccessTokenApi(): string | null {
  return leerSesionPersistida()?.accessToken ?? null;
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

export const apiOperations = axios.create({
  baseURL: URL_OPERATIONS,
  withCredentials: true,
  timeout: 12_000,
});

export const apiOperationsPublic = axios.create({
  baseURL: URL_OPERATIONS,
  timeout: 12_000,
});

export const apiInventory = axios.create({
  baseURL: URL_INVENTORY,
  withCredentials: true,
  timeout: 12_000,
});

export const apiReporting = axios.create({
  baseURL: URL_REPORTING,
  withCredentials: true,
  timeout: 15_000,
});

let renovacionEnCurso: Promise<SesionUsuario> | null = null;

interface JwtPayloadMinimo {
  exp?: unknown;
}

function obtenerExpiracionJwt(token: string): number | null {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      return null;
    }

    const payloadBase64 = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(partes[1].length / 4) * 4, "=");

    const payload = JSON.parse(
      window.atob(payloadBase64),
    ) as JwtPayloadMinimo;

    return typeof payload.exp === "number"
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

function tokenExpiraPronto(
  token: string,
  margenMilisegundos = 30_000,
): boolean {
  const expiracion = obtenerExpiracionJwt(token);

  return expiracion !== null
    ? expiracion - Date.now() <= margenMilisegundos
    : false;
}

async function agregarBearer(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  let token = obtenerAccessTokenApi();

  if (
    token &&
    !esRutaSinRenovacion(config) &&
    tokenExpiraPronto(token)
  ) {
    const sesion = await renovarSesion();
    token = sesion.accessToken;
  }

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
}

async function renovarSesion(): Promise<SesionUsuario> {
  if (!renovacionEnCurso) {
    renovacionEnCurso = clienteRefresh
      .post<SesionUsuario>("/auth/refresh")
      .then((respuesta) => {
        guardarSesionApi(respuesta.data);
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
  config: InternalAxiosRequestConfig | undefined,
): boolean {
  const url = config?.url ?? "";

  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

function configurarInterceptors(cliente: AxiosInstance): void {
  cliente.interceptors.request.use(agregarBearer);

  cliente.interceptors.response.use(
    (respuesta) => respuesta,
    async (error: AxiosError) => {
      const config = error.config as ConfiguracionReintento | undefined;

      if (
        error.response?.status !== 401 ||
        !config ||
        config._romaReintento ||
        esRutaSinRenovacion(config)
      ) {
        throw error;
      }

      config._romaReintento = true;

      const sesion = await renovarSesion();

      config.headers.set("Authorization", `Bearer ${sesion.accessToken}`);

      return cliente.request(config);
    },
  );
}

configurarInterceptors(apiAuth);
configurarInterceptors(apiOperations);
configurarInterceptors(apiInventory);
configurarInterceptors(apiReporting);

function obtenerErrorAxios(error: unknown): AxiosError | null {
  if (axios.isAxiosError(error)) {
    return error;
  }

  if (error instanceof Error && error.cause && error.cause !== error) {
    return obtenerErrorAxios(error.cause);
  }

  return null;
}

export function esEstadoErrorApi(error: unknown, estado: number): boolean {
  return obtenerErrorAxios(error)?.response?.status === estado;
}

export function obtenerPermisosSesionApi(): string[] {
  const sesion = leerSesionPersistida();

  return Array.isArray(sesion?.usuario?.permisos)
    ? sesion.usuario.permisos
    : [];
}

export function sesionTienePermisoApi(...permisos: string[]): boolean {
  const permisosSesion = obtenerPermisosSesionApi();

  return permisos.some((permiso) => permisosSesion.includes(permiso));
}

export function obtenerMensajeErrorApi(
  error: unknown,
  respaldo = "No fue posible completar la operación.",
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : respaldo;
  }

  if (!error.response) {
    return "No fue posible conectar con el servidor. Verifica que los servicios estén en ejecución.";
  }

  const datos = error.response.data as RespuestaErrorApi | undefined;

  if (Array.isArray(datos?.message)) {
    const mensajes = datos.message.filter(
      (item): item is string => typeof item === "string",
    );

    if (mensajes.length > 0) {
      return mensajes.join(" ");
    }
  }

  if (typeof datos?.message === "string") {
    return datos.message;
  }

  if (typeof datos?.detail === "string") {
    return datos.detail;
  }

  if (typeof datos?.title === "string") {
    return datos.title;
  }

  return respaldo;
}
export function crearErrorApi(
  error: unknown,
  respaldo = "No fue posible completar la operación.",
): Error {
  return new Error(obtenerMensajeErrorApi(error, respaldo), { cause: error });
}
