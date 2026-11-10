"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Settings = { letterSet: string; pace: string; scope: string };

export async function typingAction(body: Record<string, unknown>) {
  const res = await fetch("/api/instruct/typing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function SettingsFields({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const field = (key: keyof Settings, label: string, options: [string, string][]) => (
    <label className="flex flex-col gap-1">
      <span className="mono-label">{label}</span>
      <select value={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.value })} className="field h-10 px-3 text-sm">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {field("scope", "Practice", [["full", "Full · 150 leaps"], ["letters", "Letters · 100"], ["words", "Words · 50"]])}
      {field("letterSet", "Letters", [["all", "All letters"], ["home", "Home row"], ["top", "Top row"], ["bottom", "Bottom row"]])}
      {field("pace", "Difficulty", [["easy", "Easy · hints, 2 misses"], ["medium", "Medium · 8 s or 3 misses"], ["hard", "Hard · words, 4 s or 1 miss"], ["expert", "Expert · words to sentences, 3 s"]])}
    </div>
  );
}

// Setup for one class: assignment, practice settings, sign-in, students.
export default function TypingSetup(props: {
  classId: string;
  assigned: boolean;
  settings: Settings;
  // False until the teacher saves settings: students then choose their own.
  settingsSaved: boolean;
  minAuthTier: number;
  classCode: string;
  entryPath: string;
  withoutPin: number;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(props.settings);
  const [students, setStudents] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function run(label: string, body: Record<string, unknown>, done: string) {
    setBusy(label);
    setMessage(null);
    try {
      await typingAction({ classId: props.classId, ...body });
      setMessage({ text: done });
      router.refresh();
      return true;
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Something went wrong.", error: true });
      return false;
    } finally {
      setBusy("");
    }
  }

  if (!props.assigned) {
    return (
      <div className="card mt-6 p-6">
        <h2 className="text-lg font-semibold">Letter Leaper isn&apos;t assigned to this class yet</h2>
        <p className="muted mt-1 text-sm">Assigning adds the Keyboard Skills module (game, screenshot checkpoint, and reflection) to this class&apos;s projects.</p>
        <button disabled={!!busy} onClick={() => run("assign", { action: "assign" }, "Letter Leaper assigned.")} className="btn-primary mt-4 h-11 px-5 text-sm">
          {busy ? "Assigning…" : "Assign Letter Leaper"}
        </button>
        {message && <p className="mt-3 text-sm" style={{ color: message.error ? "var(--danger)" : "var(--accent)" }} role="status">{message.text}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-2">
      <div className="card p-5">
        <div className="overline mb-3">Practice settings</div>
        <SettingsFields value={settings} onChange={setSettings} />
        <p className="muted mt-2 text-xs">
          {props.settingsSaved
            ? "Every student sees these settings locked in the game, whether or not their practice is being recorded."
            : "Not set yet — students choose their own letters and difficulty. Save to lock these for everyone."}{" "}
          Easy lights up the next key and has no timer; two wrong letters on the same target cause a fall. Medium and hard also have time limits. Every fall sends Milo 10 leaps back down, stopping at the start of the climb. Hard is words from the first leap (2 to 5 letters), so it ignores the letter row.
        </p>
        <button disabled={!!busy} onClick={() => run("settings", { action: "settings", settings }, "Settings saved.")} className="btn-primary mt-3 h-10 px-4 text-sm">
          {busy === "settings" ? "Saving…" : "Save settings"}
        </button>
      </div>

      <div className="card p-5">
        <div className="overline mb-3">Student sign-in</div>
        <p className="text-sm">
          Class code <span className="display font-semibold" style={{ color: "var(--accent)" }}>{props.classCode}</span> · entry link{" "}
          <Link href={props.entryPath} className="underline">{props.entryPath}</Link>
        </p>
        <p className="muted mt-2 text-sm">Students enter the class code and select their name. No PIN is needed, and their practice is saved. <Link href={`/instruct/class/${props.classId}/typing/pins`} className="underline">Print sign-in cards</Link></p>
        <label className="mt-4 flex flex-col gap-1">
          <span className="mono-label">Add students (one name per line)</span>
          <textarea value={students} onChange={(e) => setStudents(e.target.value)} rows={3} className="field px-3 py-2 text-sm" placeholder={"Maya B\nLeo K"} />
        </label>
        <button
          disabled={!!busy || !students.trim()}
          onClick={async () => {
            if (await run("add", { action: "add-students", students }, "Students added — they can select their names to sign in.")) setStudents("");
          }}
          className="btn-ghost mt-2 h-10 px-4 text-sm"
        >
          {busy === "add" ? "Adding…" : "Add students"}
        </button>
      </div>
      {message && (
        <p className="text-sm lg:col-span-2" style={{ color: message.error ? "var(--danger)" : "var(--accent)" }} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
