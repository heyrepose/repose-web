import type { ApiErrorBody, ApiSuccess } from "@repose/api-types";
import { useAuthStore } from "./auth-store";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  details?: Record<string, unknown>;

  constructor(body: ApiErrorBody["error"]) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.errorCode = body.errorCode;
    this.details = body.details;
  }
}

/** User-facing toast copy; in development includes status, errorCode, and details. */
export function getErrorToastMessage(
  error: unknown,
  fallback: string,
): string {
  const isDev = process.env.NODE_ENV === "development";

  if (error instanceof ApiError) {
    if (!isDev) return error.message;
    const lines = [error.message, `${error.statusCode} · ${error.errorCode}`];
    if (error.details && Object.keys(error.details).length > 0) {
      try {
        lines.push(JSON.stringify(error.details, null, 2));
      } catch {
        // ignore non-serializable details
      }
    }
    return lines.join("\n");
  }

  if (isDev && error instanceof Error) {
    return `${fallback}\n${error.name}: ${error.message}`;
  }

  return fallback;
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        useAuthStore.getState().clearSession();
        return false;
      }
      const json = (await res.json()) as ApiSuccess<{
        accessToken: string;
        user?: AuthUserShape;
      }>;
      const { accessToken, user } = json.data;
      const current = useAuthStore.getState();
      useAuthStore.getState().setSession({
        accessToken,
        user: user ?? current.user,
      });
      return true;
    } catch {
      useAuthStore.getState().clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

type AuthUserShape = {
  id: string;
  fullName?: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  avatarUrl?: string | null;
};

export type ApiFetchOptions = RequestInit & {
  /** Skip attaching Authorization header */
  skipAuth?: boolean;
  /** Already retried after refresh */
  _retried?: boolean;
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth, _retried, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !skipAuth && !_retried) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...init, _retried: true });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const json = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiErrorBody
    | null;

  if (!res.ok) {
    const err =
      json && "error" in json
        ? json.error
        : {
            statusCode: res.status,
            message: res.statusText || "Request failed",
            errorCode: "UNKNOWN",
          };
    throw new ApiError(err);
  }

  if (json && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

/** Like apiFetch but also returns `meta` (search facets, cursors, unreadCount). */
export async function apiFetchWithMeta<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<{ data: T; meta?: import("@repose/api-types").ApiMeta }> {
  const { skipAuth, _retried, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !skipAuth && !_retried) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetchWithMeta<T>(path, { ...init, _retried: true });
    }
  }

  const json = (await res.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiErrorBody
    | null;

  if (!res.ok) {
    const err =
      json && "error" in json
        ? json.error
        : {
            statusCode: res.status,
            message: res.statusText || "Request failed",
            errorCode: "UNKNOWN",
          };
    throw new ApiError(err);
  }

  if (json && "data" in json) {
    return { data: json.data as T, meta: json.meta };
  }

  return { data: json as T };
}

/** Server-side fetch (no auth store). Returns data or null on failure. */
export async function serverFetch<T>(
  path: string,
  init?: RequestInit & { next?: NextFetchRequestConfig; cache?: RequestCache },
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(
      `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
      {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      },
    );
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as ApiSuccess<T>;
    return { data: json.data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
