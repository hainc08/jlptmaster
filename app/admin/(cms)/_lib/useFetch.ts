"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, ApiError } from "./api";

type State<T> = { key: string; data?: T; error?: ApiError | Error };

/**
 * GET a JSON endpoint. `loading` is derived (the stored result belongs to a different url/nonce),
 * so nothing is set synchronously inside the effect and stale data stays visible while reloading.
 */
export function useFetch<T>(url: string) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "" });
  const key = `${url}#${nonce}`;

  useEffect(() => {
    let cancelled = false;
    apiGet<T>(url).then(
      (data) => !cancelled && setState({ key, data }),
      (error) => !cancelled && setState({ key, error }),
    );
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const settled = state.key === key;
  return {
    data: state.data,
    error: settled ? state.error : undefined,
    loading: !settled,
    reload,
  };
}
