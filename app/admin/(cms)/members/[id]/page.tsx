"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useCms } from "../../_components/CmsContext";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { Icon } from "../../_components/Icon";
import { SidePanel } from "../../_components/SidePanel";
import { EmptyState, ErrorState, Skeleton } from "../../_components/States";
import { StatusChip, memberChip } from "../../_components/StatusChip";
import { useToast } from "../../_components/Toast";
import { ApiError, apiDelete, apiPatch, apiPost, errorMessage } from "../../_lib/api";
import { formatDate, initials } from "../../_lib/format";
import { useFetch } from "../../_lib/useFetch";
import { MemberTabs, type MemberDetail } from "./_components/MemberTabs";

type Dialog = null | "suspend" | "reset" | "level" | "delete";
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useCms();
  const router = useRouter();
  const toast = useToast();
  const url = `/api/v1/admin/members/${encodeURIComponent(id)}`;
  const { data, error, reload } = useFetch<{ data: MemberDetail }>(url);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [level, setLevel] = useState("N5");
  const [editing, setEditing] = useState(false);

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <div className="page"><EmptyState icon="error" title="Member not found" hint="They may have been deleted." action={<Link className="btn tonal" href="/admin/members">Back to members</Link>} /></div>;
    }
    return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;
  }
  if (!data) return <div className="page"><Skeleton rows={3} /></div>;

  const m = data.data;
  const suspended = m.status === "SUSPENDED";

  const act = async (run: () => Promise<unknown>, message: string | ((r: unknown) => string), after?: () => void) => {
    setDialog(null);
    try {
      const r = await run();
      toast(typeof message === "function" ? message(r) : message);
      if (after) after(); else reload();
    } catch (e) {
      toast(errorMessage(e));
    }
  };

  return (
    <div className="page">
      <div className="crumbs"><Link href="/admin/members">Members</Link> / {m.displayName}</div>
      <section className="card profile" style={{ marginBottom: 16 }}>
        <span className="avatar" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }} aria-hidden="true">{initials(m.displayName)}</span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h1 className="t-display jp">{m.displayName}</h1>
            <StatusChip kind={memberChip(m.status)} />
          </div>
          <div className="meta"><span>{m.email}</span><span>ID {m.id}</span><span>Joined {formatDate(m.joinedAt, lang)}</span></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn outline" onClick={() => setEditing(true)}><Icon name="edit" />Edit</button>
          <button type="button" className="btn outline" onClick={() => setDialog("reset")}><Icon name="key" />Reset password</button>
          <button type="button" className="btn outline" onClick={() => { setLevel(m.level); setDialog("level"); }}><Icon name="school" />Change level</button>
          <button type="button" className="btn outline" onClick={() => setDialog("suspend")}><Icon name="block" />{suspended ? "Reactivate" : "Suspend"}</button>
          <button type="button" className="btn danger-o" onClick={() => setDialog("delete")}><Icon name="del" />Delete</button>
        </div>
      </section>

      <MemberTabs m={m} lang={lang} />

      <ConfirmDialog open={dialog === "suspend"} danger={!suspended} title={suspended ? "Reactivate account?" : "Suspend account?"}
        body={suspended ? `${m.displayName} will be able to sign in again.` : `${m.displayName} will be signed out and blocked from exams until reactivated.`}
        confirmLabel={suspended ? "Reactivate account" : "Suspend account"} onCancel={() => setDialog(null)}
        onConfirm={() => act(() => apiPost(`${url}/${suspended ? "reactivate" : "suspend"}`), suspended ? "Account reactivated" : "Account suspended")} />
      <ConfirmDialog open={dialog === "reset"} title="Reset password?"
        body="Email delivery isn’t set up yet, so this signs the member out of every device. No reset link can be sent from here."
        confirmLabel="Sign out everywhere" onCancel={() => setDialog(null)}
        onConfirm={() => act(() => apiPost<{ data: { sessionsRevoked: number } }>(`${url}/reset-password`),
          (r) => { const n = (r as { data: { sessionsRevoked: number } }).data.sessionsRevoked; return `${n} session${n === 1 ? "" : "s"} signed out. No email was sent — email delivery isn’t set up yet.`; })} />
      <ConfirmDialog open={dialog === "level"} title="Change level" confirmLabel="Apply" onCancel={() => setDialog(null)}
        onConfirm={() => act(() => apiPost(`${url}/change-level`, { level }), `Level changed to ${level}`)}>
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="cl-level">New level</label>
          <select id="cl-level" className="sel" value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        </div>
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "delete"} danger title="Delete this member?"
        body="This removes the member’s personal details and signs them out everywhere. Their exam history is kept without identifying information. This can’t be undone."
        confirmLabel="Delete member" onCancel={() => setDialog(null)}
        onConfirm={() => act(() => apiDelete(url), "Member deleted", () => router.push("/admin/members"))} />
      <EditPanel key={m.id + m.email + m.displayName} open={editing} m={m} url={url} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); toast("Profile saved"); reload(); }} />
    </div>
  );
}

function EditPanel({ open, m, url, onClose, onSaved }: { open: boolean; m: MemberDetail; url: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(m.displayName);
  const [email, setEmail] = useState(m.email);
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Full name is required";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email address";
    setErrors(next);
    if (next.name || next.email) return;
    const patch: { displayName?: string; email?: string } = {};
    if (name.trim() !== m.displayName) patch.displayName = name.trim();
    if (email.trim() !== m.email) patch.email = email.trim();
    if (!Object.keys(patch).length) return onClose();
    setBusy(true);
    try {
      await apiPatch(url, patch);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") setErrors({ email: "A member with this email already exists" });
      else setErrors({ form: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SidePanel open={open} title="Edit member" onClose={onClose}
      footer={<><button type="button" className="btn text" onClick={onClose}>Cancel</button><button type="submit" form="edit-member-form" className="btn filled" disabled={busy}>Save</button></>}>
      <form id="edit-member-form" onSubmit={save} noValidate style={{ display: "contents" }}>
        {errors.form && <p role="alert" style={{ color: "var(--err)" }}>{errors.form}</p>}
        <div className="field">
          <label htmlFor="em-name">Full name</label>
          <input id="em-name" className={`in ${errors.name ? "err" : ""}`} value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <span className="hint" style={{ color: "var(--err)" }}>{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="em-email">Email</label>
          <input id="em-email" type="email" className={`in ${errors.email ? "err" : ""}`} value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <span className="hint" style={{ color: "var(--err)" }}>{errors.email}</span>}
        </div>
      </form>
    </SidePanel>
  );
}
