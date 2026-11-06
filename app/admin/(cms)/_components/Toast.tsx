"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Push = (message: string) => void;
const ToastContext = createContext<Push>(() => {});

export const useToast = () => useContext(ToastContext);

/** Renders a polite live region (always present so screen readers register it) and auto-dismisses messages. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string }[]>([]);
  const next = useRef(1);
  const push = useCallback<Push>((message) => {
    const id = next.current++;
    setItems((list) => [...list, { id, message }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast"><span>{t.message}</span></div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
