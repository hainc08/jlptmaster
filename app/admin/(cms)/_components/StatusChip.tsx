export type ChipKind = "active" | "suspended" | "pending" | "expired" | "published" | "draft" | "soon";

const LABEL: Record<ChipKind, string> = {
  active: "Active",
  suspended: "Suspended",
  pending: "Pending",
  expired: "Expired",
  published: "Published",
  draft: "Draft",
  soon: "Coming soon",
};

/** Colour is never the only cue: every chip carries a dot and a text label. */
export function StatusChip({ kind }: { kind: ChipKind }) {
  return <span className={`chip ${kind}`}>{LABEL[kind]}</span>;
}

export const memberChip = (status: string): ChipKind => status.toLowerCase() as ChipKind;
export const levelChip = (status: string): ChipKind => (status === "COMING_SOON" ? "soon" : (status.toLowerCase() as ChipKind));
