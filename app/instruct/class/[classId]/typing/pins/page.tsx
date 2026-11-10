import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireInstructorClass } from "@/lib/typing-access";
import PrintButton from "@/components/PrintButton";

// Printable sign-in cards: class code, entry link, and student name.
export default async function TypingPinCards({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const ctx = await requireInstructorClass(classId);
  const { klass } = ctx;
  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true } } },
    orderBy: { learner: { displayName: "asc" } },
  });
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const entry = `${proto}://${host}/join?code=${encodeURIComponent(klass.classCode)}`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/instruct/class/${klass.id}/typing`} className="muted text-sm hover:text-[var(--text)]">
          ← {klass.name} · typing progress
        </Link>
        <PrintButton />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{klass.name} · sign-in cards</h1>
      <p className="muted mt-1 text-sm">
        Go to <span className="font-medium">{entry}</span>, and select your name. No PIN is needed.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {roster.map((r) => (
          <div key={r.learner.id} className="card break-inside-avoid p-4">
            <div className="display text-base font-semibold">{r.learner.displayName}</div>
            <div className="mono-label mt-2">Class code</div>
            <div className="text-lg font-semibold tracking-[0.15em]">{klass.classCode}</div>
            <p className="muted mt-2 text-sm">Select your name to sign in.</p>
          </div>
        ))}
      </div>
      {roster.length === 0 && <p className="muted mt-6 text-sm">No students yet.</p>}
    </main>
  );
}
