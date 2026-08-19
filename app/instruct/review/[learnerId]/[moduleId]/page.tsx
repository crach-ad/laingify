import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { evaluateModule } from "@/lib/completion";
import CriterionDecision from "./CriterionDecision";
import ReplyBox from "./ReplyBox";

// One learner × one module: everything an instructor needs to decide —
// submissions with auto-feedback, evidence, criteria (with approve/revoke on
// the human-judged ones), and the discussion threads.
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ learnerId: string; moduleId: string }>;
}) {
  const { learnerId, moduleId } = await params;
  const { orgIds } = await requireInstructor();

  const [learner, module] = await Promise.all([
    prisma.learner.findUnique({
      where: { id: learnerId },
      include: { roster: { include: { class: true } } },
    }),
    prisma.module.findUnique({ where: { id: moduleId } }),
  ]);
  // Both the module and the learner (via a class roster) must belong to one of the instructor's orgs.
  if (!module || !orgIds.includes(module.orgId)) notFound();
  if (!learner || !learner.roster.some((r) => orgIds.includes(r.class.orgId))) notFound();

  const [{ criteria, complete }, submissions, evidence, threads, project] = await Promise.all([
    evaluateModule(learnerId, moduleId),
    prisma.submission.findMany({
      where: { learnerId, moduleId },
      orderBy: { createdAt: "desc" },
      include: { feedback: true },
    }),
    prisma.evidence.findMany({ where: { learnerId, moduleId }, orderBy: { createdAt: "asc" } }),
    prisma.discussionThread.findMany({
      where: { learnerId, moduleId },
      orderBy: { createdAt: "asc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.project.findUnique({ where: { learnerId_moduleId: { learnerId, moduleId } } }),
  ]);

  const latest = submissions[0];
  const critLabel = new Map(criteria.map((c) => [c.id, c.label]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link
        href="/instruct"
        className="text-sm font-medium transition-colors hover:text-[var(--text)]"
        style={{ color: "var(--faint)" }}
      >
        ← Review queue
      </Link>

      {/* Header */}
      <header className="animate-fade-up mt-5 flex items-start gap-4">
        <span className="tile flex h-14 w-14 shrink-0 items-center justify-center rounded-[13px] text-3xl">
          {module.badgeIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="overline mb-1.5">Review</div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {learner.displayName} · {module.title}
          </h1>
          <p className="muted mt-1.5 text-sm">{module.summary}</p>
          <Link
            href={`/instruct/learner/${learner.id}`}
            className="mono-label mt-2 inline-block transition-colors hover:text-[var(--accent)]"
          >
            View {learner.displayName}&apos;s profile →
          </Link>
        </div>
        <span className={`pill mt-1 shrink-0 ${complete ? "pill-done" : "pill-progress"}`}>
          {complete ? "Complete" : "In progress"}
        </span>
      </header>

      {project && (
        <div
          className="animate-fade-up mt-6 rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)", color: "var(--body)" }}
        >
          <span className="font-semibold" style={{ color: "var(--accent)" }}>
            {module.badgeName} awarded.
          </span>{" "}
          {project.summary}
        </div>
      )}

      {/* Criteria */}
      <section className="animate-fade-up mt-9" style={{ animationDelay: "0.06s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Criteria</h2>
          <span className="mono-label">
            {criteria.filter((c) => c.status === "MET").length} / {criteria.length} met
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {criteria.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold" style={{ color: "var(--heading)" }}>
                    {c.label}
                  </span>
                  <span className="mono-label">{c.checkType}</span>
                </div>
                {c.description && <p className="muted mt-1 text-[13px]">{c.description}</p>}
                {c.decidedBy && (
                  <p className="mono-label mt-1.5 text-[10px]">Decided by {c.decidedBy}</p>
                )}
              </div>
              <span
                className={`pill shrink-0 ${
                  c.status === "MET" ? "pill-done" : c.status === "IN_PROGRESS" ? "pill-progress" : "pill-idle"
                }`}
              >
                {c.status === "MET" ? "Met" : c.status === "IN_PROGRESS" ? "In progress" : "Not started"}
              </span>
              {(c.checkType === "RUBRIC" || c.checkType === "HYBRID") && (
                <CriterionDecision learnerId={learnerId} criterionId={c.id} met={c.status === "MET"} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Latest submission + auto-feedback */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-base font-semibold">Submission</h2>
        {latest ? (
          <div className="card mt-4 p-5">
            {latest.criterionId && (
              <div className="mono-label mb-2">{critLabel.get(latest.criterionId) ?? "Submission"}</div>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--body)" }}>
              {latest.content}
            </p>
            {latest.feedback && (
              <div className="tile mt-4 p-4">
                <div className="mono-label mb-1.5">Auto-feedback</div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--body)" }}>
                  {latest.feedback.summary}
                </p>
                {latest.feedback.nextSteps && (
                  <p className="muted mt-2 text-[13px]">Next steps: {latest.feedback.nextSteps}</p>
                )}
              </div>
            )}
            {submissions.length > 1 && (
              <p className="mono-label mt-3">
                {submissions.length - 1} earlier submission{submissions.length === 2 ? "" : "s"}
              </p>
            )}
          </div>
        ) : (
          <p className="muted mt-4 text-sm">No written submission yet.</p>
        )}
      </section>

      {/* Evidence */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.14s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Evidence</h2>
          <span className="mono-label">{evidence.length} item{evidence.length === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {evidence.map((e) => (
            <div key={e.id} className="card flex items-start gap-4 p-4">
              <span className="pill pill-idle shrink-0">{e.type}</span>
              <div className="min-w-0 flex-1 text-sm" style={{ color: "var(--body)" }}>
                {e.url && e.type === "PHOTO" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.url}
                    alt={e.caption ?? "Learner evidence"}
                    className="mb-2 max-h-64 rounded-lg border border-[var(--border-soft)]"
                  />
                )}
                {e.text && <p className="whitespace-pre-wrap leading-relaxed">{e.text}</p>}
                {e.url && e.type !== "PHOTO" && (
                  <a href={e.url} className="underline" style={{ color: "var(--info-text)" }}>
                    {e.url}
                  </a>
                )}
                {e.caption && <p className="muted mt-1 text-[13px]">{e.caption}</p>}
              </div>
            </div>
          ))}
          {evidence.length === 0 && <p className="muted text-sm">No evidence submitted yet.</p>}
        </div>
      </section>

      {/* Discussion */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.18s" }}>
        <h2 className="text-base font-semibold">Discussion</h2>
        <div className="mt-4 flex flex-col gap-4">
          {threads.map((t) => (
            <div key={t.id} className="card p-5">
              {t.seed && <p className="mono-label mb-3">Opened from feedback: {t.seed}</p>}
              <div className="flex flex-col gap-2.5">
                {t.messages.map((m) => (
                  <div key={m.id} className="flex gap-3 text-sm">
                    <span
                      className="mono-label w-24 shrink-0 pt-0.5"
                      style={{
                        color:
                          m.authorRole === "INSTRUCTOR"
                            ? "var(--accent)"
                            : m.authorRole === "SPRITE"
                              ? "var(--info-text)"
                              : "var(--faint)",
                      }}
                    >
                      {m.authorRole === "LEARNER" ? learner.displayName : m.authorRole.toLowerCase()}
                    </span>
                    <p className="min-w-0 flex-1 leading-relaxed" style={{ color: "var(--body)" }}>
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>
              <ReplyBox threadId={t.id} />
            </div>
          ))}
          {threads.length === 0 && <p className="muted text-sm">No discussion threads yet.</p>}
        </div>
      </section>
    </main>
  );
}
