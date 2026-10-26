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
      {field("pace", "Pace", [["relaxed", "Relaxed + hints"], ["steady", "Timed · 8 s"], ["speedy", "Timed · 4 s"]])}
    </div>
  );
}

// Setup for one class: assignment, practice settings, sign-in, students.
export default function TypingSetup(props: {
  classId: string;
  assigned: boolean;
  settings: Settings;
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

  const pinsOn = props.minAuthTier >= 1;
  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-2">
      <div className="card p-5">
        <div className="overline mb-3">Practice settings</div>
        <SettingsFields value={settings} onChange={setSettings} />
        <p className="muted mt-2 text-xs">Students see these settings locked in the game. Relaxed pace lights up the next key (the hint).</p>
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
        {pinsOn ? (
          <p className="muted mt-2 text-sm">
            PIN sign-in is on, so every student&apos;s practice is saved to their record.{" "}
            {props.withoutPin > 0 && <span style={{ color: "var(--warn)" }}>{props.withoutPin} student(s) have no PIN yet. </span>}
            <Link href={`/instruct/class/${props.classId}/typing/pins`} className="underline">Print PIN cards</Link>
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm" style={{ color: "var(--warn)" }}>
              This class signs in by name only, so typing progress isn&apos;t saved — anyone could type a classmate&apos;s name.
            </p>
            <p className="muted mt-1 text-xs">Turning on PINs gives each student a 4-digit PIN. Students then pick their name and enter their PIN; new students are added by you below instead of self-registering. Existing work is unchanged.</p>
            <button disabled={!!busy} onClick={() => run("pins", { action: "enable-pins" }, "PIN sign-in is on. Print the PIN cards for your students.")} className="btn-primary mt-3 h-10 px-4 text-sm">
              {busy === "pins" ? "Turning on…" : "Turn on PIN sign-in"}
            </button>
          </>
        )}
        <label className="mt-4 flex flex-col gap-1">
          <span className="mono-label">Add students (one name per line)</span>
          <textarea value={students} onChange={(e) => setStudents(e.target.value)} rows={3} className="field px-3 py-2 text-sm" placeholder={"Maya B\nLeo K"} />
        </label>
        <button
          disabled={!!busy || !students.trim()}
          onClick={async () => {
            if (await run("add", { action: "add-students", students }, "Students added — they each have a PIN.")) setStudents("");
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
