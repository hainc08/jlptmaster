"use client";

import { useRef } from "react";

interface Props<T extends string> {
  tabs: readonly T[];
  value: T;
  onChange: (tab: T) => void;
  label: string;
  idPrefix: string;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export const tabIds = (prefix: string, tab: string) => ({ tab: `${prefix}-tab-${slug(tab)}`, panel: `${prefix}-panel-${slug(tab)}` });

/** WAI-ARIA tablist: roving tabindex, Arrow/Home/End navigation. */
export function TabList<T extends string>({ tabs, value, onChange, label, idPrefix }: Props<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = tabs.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next]);
    refs.current[tabs[next]]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, i) => (
        <button key={tab} ref={(el) => { refs.current[tab] = el; }} type="button" role="tab" id={tabIds(idPrefix, tab).tab}
          aria-selected={tab === value} aria-controls={tabIds(idPrefix, tab).panel} tabIndex={tab === value ? 0 : -1}
          onClick={() => onChange(tab)} onKeyDown={(e) => onKeyDown(e, i)}>{tab}</button>
      ))}
    </div>
  );
}
