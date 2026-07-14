"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function InstructorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/instruct/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign you in.");
      router.push("/instruct");
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
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Instructor sign in</h1>
        <p className="muted mt-2 text-sm">Review submissions and approve criteria.</p>
      </header>

      <form
        onSubmit={login}
        className="animate-fade-up card flex flex-col gap-4 p-6"
        style={{ animationDelay: "0.06s" }}
      >
        <label className="flex flex-col gap-2">
          <span className="mono-label">Email</span>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.org"
            className="field px-4 py-3"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="mono-label">PIN</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            placeholder="••••"
            className="field w-36 px-4 py-3 text-center text-lg tracking-[0.5em]"
          />
        </label>
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <button type="submit" disabled={busy || !email.trim() || !pin} className="btn-primary h-12 text-sm">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="animate-fade-up text-center text-sm" style={{ animationDelay: "0.12s" }}>
        <Link href="/join" className="muted transition-colors hover:text-[var(--text)]">
          Learner? Join your class here
        </Link>
      </p>
    </main>
  );
}
