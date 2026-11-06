"use client";

import { useEffect, useState } from "react";
import { useCms } from "../_components/CmsContext";
import { ErrorState, Skeleton } from "../_components/States";
import { TabList, tabIds } from "../_components/TabList";
import { useToast } from "../_components/Toast";
import { apiPatch, apiPut, errorMessage } from "../_lib/api";
import { t } from "../_lib/i18n";
import { useFetch } from "../_lib/useFetch";
import { ExamRulesPanel, GeneralPanel, NotificationsPanel, RolesPanel } from "./_components/SettingsPanels";
import { sameMatrix, settingsPatch, validateSettings, type Matrix, type Settings } from "./_components/types";

const TABS = ["General", "Exam rules", "Roles and permissions", "Notifications"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const { lang } = useCms();
  const toast = useToast();
  const settings = useFetch<{ data: Settings }>("/api/v1/admin/settings");
  const roles = useFetch<{ data: Matrix }>("/api/v1/admin/settings/roles");
  const [tab, setTab] = useState<Tab>("General");
  const [edits, setEdits] = useState<{ settings?: Settings; matrix?: Matrix }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const savedSettings = settings.data?.data;
  const savedMatrix = roles.data?.data;
  const current = edits.settings ?? savedSettings;
  const currentMatrix = edits.matrix ?? savedMatrix;
  const patch = savedSettings && current ? settingsPatch(savedSettings, current) : undefined;
  const matrixChanged = !!(savedMatrix && currentMatrix && !sameMatrix(savedMatrix, currentMatrix));
  const dirty = !!patch || matrixChanged;
  const errors = current ? validateSettings(current) : {};
  const invalid = Object.keys(errors).length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const header = (
    <div className="page-head">
      <div><div className="crumbs">Home / {t(lang, "settings")}</div><h1 className="t-display">{t(lang, "settings")}</h1></div>
    </div>
  );

  const error = settings.error ?? roles.error;
  if (error) return <div className="page">{header}<ErrorState error={error} onRetry={() => { settings.reload(); roles.reload(); }} /></div>;
  if (!current || !currentMatrix || !savedSettings || !savedMatrix) return <div className="page">{header}<Skeleton rows={4} /></div>;

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (patch) {
        await apiPatch("/api/v1/admin/settings", patch);
        setEdits((e) => ({ ...e, settings: undefined })); // already persisted: never send it twice if the next call fails
        settings.reload();
      }
      if (matrixChanged) {
        await apiPut("/api/v1/admin/settings/roles", currentMatrix);
        setEdits((e) => ({ ...e, matrix: undefined }));
        roles.reload();
      }
      toast("Settings saved");
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const ids = tabIds("st", tab);
  return (
    <div className="page">
      {header}
      <TabList tabs={TABS} value={tab} onChange={setTab} label="Settings sections" idPrefix="st" />
      <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab}>
        {tab === "General" && <GeneralPanel s={current} errors={errors} onChange={(next) => setEdits((e) => ({ ...e, settings: next }))} />}
        {tab === "Exam rules" && <ExamRulesPanel s={current} errors={errors} onChange={(next) => setEdits((e) => ({ ...e, settings: next }))} />}
        {tab === "Roles and permissions" && <RolesPanel matrix={currentMatrix} onChange={(m) => setEdits((e) => ({ ...e, matrix: m }))} />}
        {tab === "Notifications" && <NotificationsPanel s={current} errors={errors} onChange={(next) => setEdits((e) => ({ ...e, settings: next }))} />}
      </div>

      <div className="savebar">
        <span className={`unsaved ${dirty ? "dirty" : ""}`} role="status"><i />{dirty ? "Unsaved changes" : "All changes saved"}</span>
        {saveError && <span role="alert" style={{ color: "var(--err)", fontWeight: 600 }}>{saveError}</span>}
        <span className="spacer" />
        <button type="button" className="btn text" disabled={!dirty || saving} onClick={() => { setEdits({}); setSaveError(null); }}>Discard</button>
        <button type="button" className="btn filled" disabled={!dirty || invalid || saving} onClick={save}>{t(lang, "saveChanges")}</button>
      </div>
    </div>
  );
}
