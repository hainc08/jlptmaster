"use client";

import { useState } from "react";
import { SidePanel } from "../../_components/SidePanel";
import { apiPatch, errorMessage } from "../../_lib/api";

export interface Level {
  code: string;
  name: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "COMING_SOON";
  enabled: boolean;
  passScore: number;
  displayOrder: number;
  lessons: number;
  exams: number;
  enrolled: number;
}

interface Props {
  level: Level;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function LevelEditPanel({ level, onClose, onSaved }: Props) {
  const [name, setName] = useState(level.name);
  const [description, setDescription] = useState(level.description);
  const [passScore, setPassScore] = useState(level.passScore);
  const [enabled, setEnabled] = useState(level.enabled);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canEnable = level.status === "PUBLISHED";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const patch: { name?: string; description?: string; passScore?: number; enabled?: boolean } = {};
    if (name.trim() !== level.name) patch.name = name.trim();
    if (description !== level.description) patch.description = description;
    if (passScore !== level.passScore) patch.passScore = passScore;
    if (enabled !== level.enabled) patch.enabled = enabled;
    if (!Object.keys(patch).length) return onClose();
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/api/v1/admin/levels/${level.code}`, patch);
      onSaved(`${level.code} saved`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SidePanel open title={`Edit ${level.code}`} onClose={onClose}
      footer={<><button type="button" className="btn text" onClick={onClose}>Cancel</button><button type="submit" form="edit-level-form" className="btn filled" disabled={busy}>Save changes</button></>}>
      <form id="edit-level-form" onSubmit={save} noValidate style={{ display: "contents" }}>
        {error && <p role="alert" style={{ color: "var(--err)" }}>{error}</p>}
        <div className="field">
          <label htmlFor="lv-name">Name</label>
          <input id="lv-name" className="in" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lv-desc">Description</label>
          <textarea id="lv-desc" className="ta" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lv-pass">Pass score: <b>{passScore}%</b></label>
          <input id="lv-pass" type="range" min={30} max={100} step={5} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} style={{ accentColor: "var(--primary)" }} />
          <span className="hint">Minimum percentage to mark an exam as passed (30–100).</span>
        </div>
        <div className="row-between" style={{ border: 0, padding: 0 }}>
          <div>
            <b id="lv-enabled-l">Enabled for learners</b>
            <div className="muted">{canEnable ? "Visible on the learner site." : "Only published levels can be enabled."}</div>
          </div>
          <label className="sw">
            <input type="checkbox" role="switch" aria-labelledby="lv-enabled-l" checked={enabled} disabled={!canEnable} onChange={(e) => setEnabled(e.target.checked)} />
            <i />
          </label>
        </div>
      </form>
    </SidePanel>
  );
}
