import Link from "next/link";
import { requireInstructor } from "@/lib/instructor";
import { loadClassOverviews } from "@/lib/instructor-data";
import { bandConfig } from "@/lib/bands";
import { ConsoleHeader, ReviewQueue } from "./ConsoleParts";

// Instructor console home: every class this instructor can see, first — one
// card per class with its headline numbers — then the cross-class review
// queue. Each class card opens its own page (roster + that class's queue).
export default async function InstructorDashboard() {
  const { instructor, orgs, orgIds } = await requireInstructor();
  const classes = await loadClassOverviews(orgIds);
  const queue = classes.flatMap((c) => c.queue);
  const multiOrg = orgs.length > 1;

  // Group by org when the instructor spans more than one.
  const groups = orgs
    .map((o) => ({ org: o, classes: classes.filter((c) => c.orgName === o.name) }))
    .filter((g) => g.classes.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={orgs.map((o) => o.name).join(" · ")} instructorName={instructor.displayName} />

      {/* Classes */}
      <section className="animate-fade-up mt-11">
        <div className="overline mb-3">Classes</div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Your classes</h1>
          <span className="mono-label">
            {classes.length} class{classes.length === 1 ? "" : "es"} · {classes.reduce((n, c) => n + c.roster.length, 0)} learners
          </span>
        </div>

        {groups.map((g) => (
          <div key={g.org.id} className="mt-6">
            {multiOrg && <div className="mono-label mb-3">{g.org.name}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              {g.classes.map((c) => {
                const band = bandConfig(c.band);
                return (
                  <Link key={c.id} href={`/instruct/class/${c.id}`} className="block">
                    <div className="card card-interactive flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="display text-lg font-semibold">{c.name}</span>
                        {c.queue.length > 0 ? (
                          <span className="pill pill-warn shrink-0">{c.queue.length} to review</span>
                        ) : (
                          <span className="mono-label shrink-0">Code {c.classCode}</span>
                        )}
                      </div>
                      <div className="muted mt-1 text-[13px]">
                        {band.label} · ages {band.ageRange} · {c.moduleCount} project{c.moduleCount === 1 ? "" : "s"}
                        {c.queue.length > 0 && <> · code {c.classCode}</>}
                      </div>
                      <div className="mt-4 flex items-baseline gap-5">
                        <span>
                          <span className="display text-2xl font-semibold" style={{ color: "var(--accent)" }}>
                            {c.roster.length}
                          </span>
                          <span className="mono-label ml-1.5">learner{c.roster.length === 1 ? "" : "s"}</span>
                        </span>
                        <span>
                          <span className="display text-2xl font-semibold" style={{ color: "var(--info)" }}>
                            {c.activeLearners}
                          </span>
                          <span className="mono-label ml-1.5">active</span>
                        </span>
                        <span>
                          <span className="display text-2xl font-semibold">{c.badgesEarned}</span>
                          <span className="mono-label ml-1.5">badge{c.badgesEarned === 1 ? "" : "s"}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="card mt-6 p-6">
            <p className="muted text-sm">No classes yet.</p>
          </div>
        )}
      </section>

      {/* Review queue across all classes */}
      <section className="animate-fade-up mt-12" style={{ animationDelay: "0.08s" }}>
        <div className="overline mb-3">Review queue</div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Awaiting your review</h2>
          <span className="mono-label">
            {queue.length} item{queue.length === 1 ? "" : "s"}
          </span>
        </div>
        <ReviewQueue queue={queue} showClass />
      </section>
    </main>
  );
}
