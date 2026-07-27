"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type RosterName = { learnerId: string; displayName: string };
type ClassInfo = {
  id: string;
  name: string;
  band: string;
  minAuthTier: number;
  selfRegister?: boolean;
  orgName: string;
  context: string;
};

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [klass, setKlass] = useState<ClassInfo | null>(null);
  const [roster, setRoster] = useState<RosterName[]>([]);
  const [learnerId, setLearnerId] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | boolean>(false);

  // Self-registration (camp) classes: create a profile or come back by name.
  async function joinByName(create: boolean) {
    if (!name.trim()) {
      setError("Please type your name first.");
      return;
    }
    setError("");
    setBusy(create ? "create" : "return");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode: code.trim(), name, create }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign you in.");
      router.push("/learn");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/class?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find that class.");
      setKlass(data.class);
      setRoster(data.roster);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!learnerId) {
      setError("Please choose your name.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode: code.trim(), learnerId, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign you in.");
      router.push("/learn");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="animate-fade-up flex flex-col items-center text-center">
        <Logo size={48} />
        <div className="overline mt-6">Laing Learning</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Join your class</h1>
        <p className="muted mt-2 text-sm">Enter your class code to begin.</p>
      </header>

      {!klass ? (
        <form
          onSubmit={lookup}
          className="animate-fade-up card flex flex-col gap-4 p-6"
          style={{ animationDelay: "0.06s" }}
        >
          <label className="flex flex-col gap-2">
            <span className="mono-label">Class code</span>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. HAPPY"
              className="field px-4 py-3 text-lg uppercase tracking-[0.2em]"
            />
          </label>
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" disabled={!!busy || !code.trim()} className="btn-primary h-12 text-sm">
            {busy ? "Looking…" : "Find my class"}
          </button>
        </form>
      ) : klass.selfRegister ? (
        <div className="animate-fade-up card flex flex-col gap-5 p-6">
          <div className="tile p-4 text-center">
            <p className="mono-label">{klass.orgName}</p>
            <p className="mt-1 text-lg font-semibold" style={{ color: "var(--heading)" }}>
              {klass.name}
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="mono-label">Your name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinByName(false)}
              placeholder="e.g. Maya"
              maxLength={40}
              className="field px-4 py-3 text-lg"
            />
            <span className="muted text-xs">
              First time? You&apos;ll create your profile with a selfie next. Coming back? Use the
              exact same name as before — it&apos;s your account code.
            </span>
          </label>

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => joinByName(true)}
              disabled={!!busy || !name.trim()}
              className="btn-primary h-12 text-sm"
            >
              {busy === "create" ? "Creating your profile…" : "🌟 I'm new here — create my profile"}
            </button>
            <button
              type="button"
              onClick={() => joinByName(false)}
              disabled={!!busy || !name.trim()}
              className="btn-ghost h-12 text-sm"
            >
              {busy === "return" ? "Finding you…" : "👋 I'm coming back"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setKlass(null);
              setRoster([]);
              setName("");
              setError("");
            }}
            className="muted self-start rounded-xl px-1 py-1 text-sm font-medium transition-colors hover:text-[var(--text)]"
          >
            ← Back
          </button>
        </div>
      ) : (
        <form onSubmit={join} className="animate-fade-up card flex flex-col gap-5 p-6">
          <div className="tile p-4 text-center">
            <p className="mono-label">{klass.orgName}</p>
            <p className="mt-1 text-lg font-semibold" style={{ color: "var(--heading)" }}>
              {klass.name}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="mono-label">Who are you?</span>
            <div className="grid grid-cols-2 gap-2">
              {roster.map((r) => (
                <button
                  type="button"
                  key={r.learnerId}
                  onClick={() => setLearnerId(r.learnerId)}
                  className="rounded-xl border px-4 py-3 text-left font-medium transition-colors"
                  style={
                    learnerId === r.learnerId
                      ? {
                          borderColor: "var(--accent-border)",
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                        }
                      : { borderColor: "var(--border)", background: "var(--card-hover)" }
                  }
                >
                  {r.displayName}
                </button>
              ))}
            </div>
            {roster.length === 0 && <p className="text-sm muted">No one is on this roster yet.</p>}
          </div>

          {klass.minAuthTier >= 1 && (
            <label className="flex flex-col gap-2">
              <span className="mono-label">Your PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputMode="numeric"
                placeholder="••••"
                className="field w-36 px-4 py-3 text-center text-lg tracking-[0.5em]"
              />
            </label>
          )}

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setKlass(null);
                setRoster([]);
                setLearnerId("");
                setPin("");
                setError("");
              }}
              className="muted rounded-xl px-4 py-3 font-medium transition-colors hover:text-[var(--text)]"
            >
              ← Back
            </button>
            <button type="submit" disabled={!!busy || !learnerId} className="btn-primary h-12 flex-1 text-sm">
              {busy ? "Signing in…" : "Let's go"}
            </button>
          </div>
        </form>
      )}

      <p className="animate-fade-up text-center text-sm" style={{ animationDelay: "0.12s" }}>
        <Link href="/instruct/login" className="muted transition-colors hover:text-[var(--text)]">
          Instructor? Sign in here
        </Link>
      </p>
    </main>
  );
}
