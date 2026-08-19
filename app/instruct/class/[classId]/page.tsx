import Link from "next/link";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/instructor";
import { loadClassOverviews } from "@/lib/instructor-data";
import { bandConfig } from "@/lib/bands";
import { ConsoleHeader, ReviewQueue, RosterList } from "../../ConsoleParts";

// One class: its review queue and roster progress. Learner rows open the
// learner profile; queue rows open the review screen.
export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const { instructor, orgs, orgIds } = await requireInstructor();
  const [klass] = await loadClassOverviews(orgIds, classId);
  if (!klass) notFound();
  const band = bandConfig(klass.band);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={orgs.map((o) => o.name).join(" · ")} instructorName={instructor.displayName} />

      <Link href="/instruct" className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← All classes
      </Link>

      <section className="animate-fade-up mt-6">
        <div className="overline mb-3">{klass.orgName}</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{klass.name}</h1>
            <p className="muted mt-1.5 text-sm">
              {band.label} band · ages {band.ageRange} · {klass.moduleCount} project{klass.moduleCount === 1 ? "" : "s"} ·{" "}
              {klass.roster.length} learner{klass.roster.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="card px-4 py-3">
            <span className="mono-label">Class code</span>
            <span className="display ml-3 text-lg font-semibold" style={{ color: "var(--accent)" }}>
              {klass.classCode}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="card px-4 py-3">
            <span className="display text-2xl font-semibold" style={{ color: "var(--info)" }}>{klass.activeLearners}</span>
            <span className="mono-label ml-2">active</span>
          </span>
          <span className="card px-4 py-3">
            <span className="display text-2xl font-semibold" style={{ color: "var(--accent)" }}>{klass.badgesEarned}</span>
            <span className="mono-label ml-2">badges earned</span>
          </span>
          <span className="card px-4 py-3">
            <span className="display text-2xl font-semibold">{klass.queue.length}</span>
            <span className="mono-label ml-2">to review</span>
          </span>
        </div>
      </section>

      {klass.queue.length > 0 && (
        <section className="animate-fade-up mt-10" style={{ animationDelay: "0.05s" }}>
          <div className="overline mb-3">Review queue</div>
          <h2 className="text-xl font-semibold tracking-tight">Awaiting your review</h2>
          <ReviewQueue queue={klass.queue} showClass={false} />
        </section>
      )}

      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.1s" }}>
        <div className="overline mb-3">Roster</div>
        <h2 className="text-xl font-semibold tracking-tight">Progress overview</h2>
        <div className="card mt-5 p-5">
          <RosterList roster={klass.roster} />
        </div>
      </section>
    </main>
  );
}
