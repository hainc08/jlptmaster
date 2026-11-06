import { formatNumber } from "../_lib/format";
import type { Lang } from "../_lib/i18n";
import { Icon } from "./Icon";

interface Props {
  page: number;
  perPage: number;
  total: number;
  shown: number;
  lang: Lang;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
}

export function Pagination({ page, perPage, total, shown, lang, onPage, onPerPage }: Props) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = (page - 1) * perPage + shown;
  const pages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="pager">
      <label htmlFor="cms-per-page">Rows per page</label>
      <select id="cms-per-page" className="sel" value={perPage} onChange={(e) => onPerPage(Number(e.target.value))}>
        {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span>{formatNumber(from, lang)}–{formatNumber(to, lang)} of {formatNumber(total, lang)}</span>
      <button type="button" className="icon-btn" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon name="left" /></button>
      <button type="button" className="icon-btn" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><Icon name="right" /></button>
    </div>
  );
}
