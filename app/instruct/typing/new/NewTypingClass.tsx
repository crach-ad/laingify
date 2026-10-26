"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsFields, typingAction } from "../../class/[classId]/typing/TypingSetup";

export default function NewTypingClass({ orgs, bands }: { orgs: { id: string; name: string }[]; bands: { key: string; label: string }[] }) {
  const router = useRouter();
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [name, setName] = useState("");
  const [band, setBand] = useState("YOUTH");
  const [students, setStudents] = useState("");
  const [settings, setSettings] = useState({ letterSet: "all", pace: "relaxed", scope: "full" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { classId } = await typingAction({ action: "create-class", orgId, name, band, students, settings });
      router.push(`/instruct/class/${classId}/typing`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-6 flex flex-col gap-4 p-6">
      {orgs.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="mono-label">Organization</span>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="field h-10 px-3 text-sm">
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-1">
          <span className="mono-label">Class name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} placeholder="e.g. Year 3 Typing Club" className="field h-10 px-3 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="mono-label">Age band</span>
          <select value={band} onChange={(e) => setBand(e.target.value)} className="field h-10 px-3 text-sm">
            {bands.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        </label>
      </div>
      <SettingsFields value={settings} onChange={setSettings} />
      <label className="flex flex-col gap-1">
        <span className="mono-label">Students (one name per line — first name and last initial is enough)</span>
        <textarea value={students} onChange={(e) => setStudents(e.target.value)} required rows={8} className="field px-3 py-2 text-sm" placeholder={"Maya B\nLeo K\nAmara S"} />
      </label>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }} role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary h-12 text-sm">
        {busy ? "Creating…" : "Create classroom"}
      </button>
    </form>
  );
}
