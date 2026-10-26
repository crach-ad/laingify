import Link from "next/link";
import { requireInstructor } from "@/lib/instructor";
import { BANDS } from "@/lib/bands";
import { ConsoleHeader } from "../../ConsoleParts";
import NewTypingClass from "./NewTypingClass";

export default async function NewTypingClassPage() {
  const { instructor, orgs } = await requireInstructor();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={orgs.map((o) => o.name).join(" · ")} instructorName={instructor.displayName} />
      <Link href="/instruct" className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← All classes
      </Link>
      <section className="animate-fade-up mt-6">
        <div className="overline mb-3">Keyboard skills</div>
        <h1 className="text-3xl font-semibold tracking-tight">New typing classroom</h1>
        <p className="muted mt-1.5 text-sm">
          Creates a class with Letter Leaper assigned, a class code, and a 4-digit PIN for each student, so every practice session is
          saved to that student&apos;s record. To add Letter Leaper to an existing class instead, open the class and choose ⌨️ Typing.
        </p>
      </section>
      <NewTypingClass
        orgs={orgs.map((o) => ({ id: o.id, name: o.name }))}
        bands={Object.values(BANDS).map((b) => ({ key: b.key, label: `${b.label} (ages ${b.ageRange})` }))}
      />
    </main>
  );
}
