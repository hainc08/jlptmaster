"use client";

import { Icon } from "../../_components/Icon";
import { MODULES, MODULE_LABEL, ROLES, type Matrix, type RoleKey, type RuleErrors, type Settings } from "./types";

const err = { color: "var(--err)" } as const;

interface PanelProps {
  s: Settings;
  errors: RuleErrors;
  onChange: (next: Settings) => void;
}

export function GeneralPanel({ s, errors, onChange }: PanelProps) {
  return (
    <section className="card card-pad" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 className="t-sub">General</h2>
      <div className="field">
        <label htmlFor="st-site">Site name</label>
        <input id="st-site" className={`in ${errors.siteName ? "err" : ""}`} value={s.general.siteName} aria-invalid={!!errors.siteName} onChange={(e) => onChange({ ...s, general: { ...s.general, siteName: e.target.value } })} />
        {errors.siteName ? <span className="hint" style={err}>{errors.siteName}</span> : <span className="hint">Shown in the browser tab and emails.</span>}
      </div>
      <div className="field">
        <span className="lbl-s">Logo</span>
        <div className="logo-drop">
          <div className="logo jp" aria-hidden="true">J</div>
          <div>
            <button type="button" className="btn outline sm" disabled><Icon name="upload" />Replace logo</button>
            <div className="hint" style={{ marginTop: 4 }}>Logo upload is not available yet.</div>
          </div>
        </div>
      </div>
      <div className="field">
        <label htmlFor="st-lang">Default language</label>
        <select id="st-lang" className="sel" value={s.general.defaultLanguage} onChange={(e) => onChange({ ...s, general: { ...s.general, defaultLanguage: e.target.value as Settings["general"]["defaultLanguage"] } })}>
          <option value="vi">Tiếng Việt</option><option value="en">English</option><option value="ja">日本語</option>
        </select>
      </div>
    </section>
  );
}

const num = (v: string) => (v === "" ? NaN : Number(v));
const show = (n: number) => (Number.isNaN(n) ? "" : n);

export function ExamRulesPanel({ s, errors, onChange }: PanelProps) {
  const set = (patch: Partial<Settings["examRules"]>) => onChange({ ...s, examRules: { ...s.examRules, ...patch } });
  return (
    <section className="card card-pad" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 className="t-sub">Exam rules</h2>
      <p className="muted">Stored only — the exam engine does not use these values yet.</p>
      <div className="field">
        <label htmlFor="st-time">Time limit (minutes)</label>
        <input id="st-time" type="number" className={`in ${errors.timeLimitMin ? "err" : ""}`} min={10} max={240} value={show(s.examRules.timeLimitMin)} aria-invalid={!!errors.timeLimitMin} onChange={(e) => set({ timeLimitMin: num(e.target.value) })} />
        {errors.timeLimitMin && <span className="hint" style={err}>{errors.timeLimitMin}</span>}
      </div>
      <div className="field">
        <label htmlFor="st-retake">Retake limit (per exam, per week)</label>
        <input id="st-retake" type="number" className={`in ${errors.retakeLimit ? "err" : ""}`} min={0} max={10} value={show(s.examRules.retakeLimit)} aria-invalid={!!errors.retakeLimit} onChange={(e) => set({ retakeLimit: num(e.target.value) })} />
        {errors.retakeLimit && <span className="hint" style={err}>{errors.retakeLimit}</span>}
      </div>
      <div className="field">
        <label htmlFor="st-pass">Passing threshold: <b>{s.examRules.passThreshold}%</b></label>
        <input id="st-pass" type="range" min={30} max={100} step={5} value={s.examRules.passThreshold} style={{ accentColor: "var(--primary)" }} onChange={(e) => set({ passThreshold: Number(e.target.value) })} />
        <span className="hint">Default for levels without their own pass score.</span>
      </div>
    </section>
  );
}

export function RolesPanel({ matrix, onChange }: { matrix: Matrix; onChange: (m: Matrix) => void }) {
  const locked = (role: RoleKey, mod: (typeof MODULES)[number]) => role === "OWNER" || (role === "ADMIN" && (mod === "settings" || mod === "dashboard"));
  return (
    <section className="card">
      <div style={{ padding: "20px 24px 8px" }}>
        <h2 className="t-sub">Roles and permissions</h2>
        <p className="muted">Check the modules each role can open. OWNER is fixed, and ADMIN always keeps Dashboard and Settings so permissions can never be locked out.</p>
      </div>
      <div className="tbl-wrap" style={{ maxHeight: "none" }}>
        <table className="matrix">
          <thead><tr><th scope="col">Role</th>{MODULES.map((m) => <th key={m} scope="col">{MODULE_LABEL[m]}</th>)}</tr></thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role}>
                <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: 14, color: "inherit", background: "transparent", position: "static" }}>{role}</th>
                {MODULES.map((mod) => (
                  <td key={mod}>
                    <input type="checkbox" className="cb" aria-label={`${role} · ${MODULE_LABEL[mod]}`} checked={matrix[role][mod]} disabled={locked(role, mod)}
                      onChange={(e) => onChange({ ...matrix, [role]: { ...matrix[role], [mod]: e.target.checked } })} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const TEMPLATES: [keyof Settings["notifications"], string, string][] = [
  ["welcome", "Welcome email", "Sent after registration"],
  ["passwordReset", "Password reset", "Sent when a reset is requested"],
  ["examResult", "Exam result", "Sent when a learner finishes an exam"],
  ["weeklyDigest", "Weekly progress digest", "Monday 08:00 (ICT)"],
  ["suspension", "Suspension notice", "Sent when an account is suspended"],
  ["planExpiry", "Plan expiry reminder", "7 days before a plan expires"],
];

export function NotificationsPanel({ s, onChange }: PanelProps) {
  return (
    <section className="card card-pad" style={{ maxWidth: 720 }}>
      <h2 className="t-sub">Email templates</h2>
      <p className="muted">Stored only — no emails are sent yet.</p>
      {TEMPLATES.map(([key, title, hint]) => (
        <div key={key} className="tpl">
          <div><b id={`tpl-${key}`}>{title}</b><div className="muted">{hint}</div></div>
          <label className="sw">
            <input type="checkbox" role="switch" aria-labelledby={`tpl-${key}`} checked={s.notifications[key]} onChange={(e) => onChange({ ...s, notifications: { ...s.notifications, [key]: e.target.checked } })} />
            <i />
          </label>
        </div>
      ))}
    </section>
  );
}
