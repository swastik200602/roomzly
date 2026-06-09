type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

let accessTokenGetter: (() => string | null) | undefined;
let sessionRefresher: (() => Promise<string | null>) | undefined;
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

export function registerAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

export function registerSessionRefresher(refresher: () => Promise<string | null>) {
  sessionRefresher = refresher;
}

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function resolveApiBase() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (import.meta.env.PROD) {
    throw new Error("Missing VITE_API_URL. Set it to the production backend API URL before building.");
  }
  return "http://localhost:4000/api/v1";
}

const API_BASE = resolveApiBase();

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

function createTimeoutSignal(signal?: AbortSignal, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => {
    controller.abort("timeout");
  }, timeoutMs);

  const abort = () => controller.abort(signal?.reason ?? "aborted");
  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    clear() {
      globalThis.clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    },
  };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await apiRequestEnvelope<T>(path, options);
  return payload.data;
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  return apiFetchInternal(path, options, true);
}

export async function apiRequestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  return apiRequestEnvelopeInternal<T>(path, options, true);
}

async function apiFetchInternal(
  path: string,
  options: RequestOptions = {},
  allowRefresh: boolean,
): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = accessTokenGetter?.();
  const { timeoutMs: _timeoutMs, ...fetchOptions } = options;
  const timeout = createTimeoutSignal(options.signal, options.timeoutMs);

  if (!headers.has("content-type") && !(options.body instanceof FormData) && options.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (token) headers.set("authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      credentials: "include",
      headers,
      signal: timeout.signal,
      body:
        options.body instanceof FormData
          ? options.body
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
    });
  } catch (error) {
    const code = timeout.signal.aborted ? "NETWORK_TIMEOUT" : "NETWORK_UNAVAILABLE";
    const message =
      code === "NETWORK_TIMEOUT"
        ? "The Roomzly API did not respond in time."
        : "Could not connect to the Roomzly API.";
    throw new ApiError(code, message, error);
  } finally {
    timeout.clear();
  }

  if (response.status === 401 && allowRefresh && path !== "/auth/refresh" && sessionRefresher) {
    const nextToken = await sessionRefresher();
    if (nextToken) return apiFetchInternal(path, options, false);
  }

  return response;
}

async function apiRequestEnvelopeInternal<T>(
  path: string,
  options: RequestOptions = {},
  allowRefresh: boolean,
): Promise<ApiSuccess<T>> {
  const response = await apiFetchInternal(path, options, allowRefresh);

  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, payload.error.details);
  }
  return payload;
}
