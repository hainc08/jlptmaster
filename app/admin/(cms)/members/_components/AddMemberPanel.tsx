"use client";

import { useState } from "react";
import { SidePanel } from "../../_components/SidePanel";
import { apiPost, ApiError } from "../../_lib/api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const PLANS = [["FREE", "Free"], ["STANDARD", "Standard"], ["PREMIUM", "Premium"]];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddMemberPanel({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("N5");
  const [plan, setPlan] = useState("FREE");
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Full name is required";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email address";
    setErrors(next);
    if (next.name || next.email) return;
    setBusy(true);
    try {
      await apiPost("/api/v1/admin/members", { displayName: name.trim(), email: email.trim(), level, plan });
      setName(""); setEmail(""); setLevel("N5"); setPlan("FREE");
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") setErrors({ email: "A member with this email already exists" });
      else setErrors({ form: err instanceof Error ? err.message : "Could not add the member" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SidePanel
      open={open}
      title="Add member"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn text" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-member-form" className="btn filled" disabled={busy}>Add member</button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={submit} noValidate style={{ display: "contents" }}>
        {errors.form && <p role="alert" style={{ color: "var(--err)" }}>{errors.form}</p>}
        <div className="field">
          <label htmlFor="am-name">Full name *</label>
          <input id="am-name" className={`in ${errors.name ? "err" : ""}`} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "am-name-e" : undefined} placeholder="e.g. Nguyễn Văn An" />
          {errors.name && <span id="am-name-e" className="hint" style={{ color: "var(--err)" }}>{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="am-email">Email *</label>
          <input id="am-email" type="email" className={`in ${errors.email ? "err" : ""}`} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "am-email-e" : undefined} placeholder="name@example.com" />
          {errors.email && <span id="am-email-e" className="hint" style={{ color: "var(--err)" }}>{errors.email}</span>}
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="am-level">Level</label>
            <select id="am-level" className="sel" value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="am-plan">Plan</label>
            <select id="am-plan" className="sel" value={plan} onChange={(e) => setPlan(e.target.value)}>{PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
        </div>
      </form>
    </SidePanel>
  );
}
