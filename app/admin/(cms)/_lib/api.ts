export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body (e.g. CSV or proxy error page) */
  }
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "REQUEST_FAILED", err?.message ?? `Request failed (${res.status})`);
  }
  return (json ?? (text as unknown)) as T;
}

export const apiGet = <T>(url: string) => request<T>("GET", url);
export const apiPost = <T = void>(url: string, body?: unknown) => request<T>("POST", url, body ?? {});
export const apiPatch = <T>(url: string, body: unknown) => request<T>("PATCH", url, body);
export const apiPut = <T>(url: string, body: unknown) => request<T>("PUT", url, body);
export const apiDelete = (url: string) => request<void>("DELETE", url);

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}
