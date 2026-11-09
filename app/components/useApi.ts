"use client";

import { useCallback, useEffect, useState } from "react";

export type ApiState<T> =
  | { status: "loading"; data?: undefined; httpStatus?: undefined }
  | { status: "ok"; data: T; httpStatus: number }
  | { status: "error"; data?: undefined; httpStatus?: number };

/**
 * GET a JSON endpoint and expose loading / ok / error plus a retry. State only changes inside the
 * fetch callbacks, and a late response for an unmounted component is ignored.
 */
export function useApi<T = unknown>(url: string | null): ApiState<T> & { retry: () => void } {
  const [state, setState] = useState<ApiState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          if (alive) setState({ status: "error", httpStatus: res.status });
          return;
        }
        const json = (await res.json()) as T;
        if (alive) setState({ status: "ok", data: json, httpStatus: res.status });
      })
      .catch(() => {
        if (alive) setState({ status: "error" });
      });
    return () => {
      alive = false;
    };
  }, [url, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}
