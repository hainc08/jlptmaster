"use client";

import { createContext, useContext } from "react";
import type { Lang } from "../_lib/i18n";

export type CmsModule = "dashboard" | "members" | "levels" | "settings" | "audit";

export interface CmsContextValue {
  lang: Lang;
  role: string;
  allowed: readonly CmsModule[];
}

const CmsContext = createContext<CmsContextValue>({ lang: "en", role: "", allowed: [] });

export const CmsProvider = CmsContext.Provider;
export const useCms = () => useContext(CmsContext);
