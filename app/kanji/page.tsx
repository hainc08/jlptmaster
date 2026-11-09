"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "../components/useApi";
import { Search, X } from "lucide-react";
import { RubyText } from "../components/RubyText";
import { StateView } from "../components/ui/StateView";
import { useT } from "../components/i18n";

export interface KanjiEntity {
  contentItemId?: string;
  id?: string;
  character: string;
  hanViet?: string;
  onyomiJson?: string[];
  kunyomiJson?: string[];
  onyomi?: string;
  kunyomi?: string;
  meaningVi: string;
  strokes?: number;
  strokeCount?: number;
  examplesJson?: { word: string; reading: string; meaning: string }[];
}

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

const on = (k: KanjiEntity) => k.onyomiJson?.join("、") ?? k.onyomi ?? "";
const kun = (k: KanjiEntity) => k.kunyomiJson?.join("、") ?? k.kunyomi ?? "";
const strokes = (k: KanjiEntity) => k.strokes ?? k.strokeCount;

/** Frame 08: N5 kanji handbook with search and a detail sheet. */
export default function KanjiPage() {
  const t = useT();
  const api = useApi<{ data?: KanjiEntity[] }>("/api/v1/kanji?level=N5");
  const failed = api.status === "error";
  const raw = api.status === "ok" ? api.data.data : undefined;
  const list = useMemo(() => (api.status === "ok" ? (Array.isArray(raw) ? raw : []) : null), [api.status, raw]);
  const load = api.retry;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<KanjiEntity | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const shown = useMemo(() => {
    if (!list) return [];
    const needle = fold(q);
    if (!needle) return list;
    return list.filter((k) =>
      [k.character, k.hanViet ?? "", k.meaningVi, on(k), kun(k)].some((f) => fold(f).includes(needle))
    );
  }, [list, q]);

  const close = () => {
    setOpen(null);
    opener.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4">
      <h1 className="text-[22px] font-bold">{t("kanji.title")}</h1>
      <div className="relative">
        <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          aria-label="Tìm kanji"
          placeholder="Tìm theo chữ, âm Hán Việt, nghĩa…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full min-h-12 pl-10 pr-4 rounded-xl border border-outline bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {failed ? (
        <StateView kind="error" title="Không tải được danh sách kanji" action={{ label: "Thử lại", onClick: load }} />
      ) : list === null ? (
        <StateView kind="loading" title="Đang tải kanji" />
      ) : shown.length === 0 ? (
        <StateView kind="empty" title="Không tìm thấy kanji" body="Thử từ khóa khác, ví dụ: nhật, ngày, ニチ." />
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {shown.map((k) => (
            <li key={k.contentItemId ?? k.id ?? k.character}>
              <button
                type="button"
                onClick={(e) => {
                  opener.current = e.currentTarget;
                  setOpen(k);
                }}
                className="w-full aspect-square rounded-2xl border border-border bg-surface flex flex-col items-center justify-center gap-1 hover:border-primary"
              >
                <span className="font-japanese text-4xl font-bold">{k.character}</span>
                <span className="text-xs font-semibold text-muted">{k.hanViet}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <KanjiSheet k={open} onClose={close} />}
    </div>
  );
}

function KanjiSheet({ k, onClose }: { k: KanjiEntity; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Kanji ${k.character}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="w-full sm:max-w-md max-h-[85vh] overflow-auto bg-surface rounded-t-3xl sm:rounded-3xl p-5 flex flex-col gap-4"
      >
        <div className="flex items-start gap-4">
          <span className="font-japanese text-6xl font-bold leading-none">{k.character}</span>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{k.hanViet}</p>
            <p className="text-sm text-muted">{k.meaningVi}</p>
            {strokes(k) ? <p className="text-xs text-muted mt-1">{strokes(k)} nét</p> : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid place-items-center w-12 h-12 rounded-full hover:bg-surface-hover flex-none"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-semibold text-muted">Âm On</dt>
          <dd className="font-japanese">{on(k) || "—"}</dd>
          <dt className="font-semibold text-muted">Âm Kun</dt>
          <dd className="font-japanese">{kun(k) || "—"}</dd>
        </dl>
        {k.examplesJson && k.examplesJson.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">Từ ví dụ</p>
            <ul className="flex flex-col gap-2">
              {k.examplesJson.map((ex, i) => (
                <li key={i} className="rounded-xl bg-background px-3 py-2 flex items-center justify-between gap-3">
                  <span className="text-lg">
                    <RubyText kanji={ex.word} reading={ex.reading} />
                  </span>
                  <span className="text-sm text-muted text-right">{ex.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
