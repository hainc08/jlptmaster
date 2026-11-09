"use client";

import { useSyncExternalStore } from "react";

/**
 * A string preference kept in localStorage. Storage can be blocked (private mode, policies), so
 * reads and writes never throw; when a write fails the value lives in memory for this page.
 * The server snapshot is always `null`, so the first client render matches the server markup.
 */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  );
}
