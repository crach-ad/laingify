import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { bandConfig } from "@/lib/bands";

// One learner, whole-program view for instructors: progress across every
// assigned module, badges and assembled projects (the portfolio), and a trail
// of their latest evidence — with jump-offs into the review screen.
export default async function LearnerProfilePage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  const { learnerId } = await params;
  const { orgIds } = await requireInstructor();

  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    include: { sprite: true, roster: { include: { class: true } } },
  });
  const entry = learner?.roster.find((r) => orgIds.includes(r.class.orgId));
  if (!learner || !entry) notFound();
  const klass = entry.class;
  const band = bandConfig(klass.band);

  const [classModules, progress, statuses, projects, evidence, submissions, threads, spriteChats] =
    await Promise.all([
      prisma.classModule.findMany({
        where: { classId: klass.id },
        orderBy: { order: "asc" },
        include: { module: { include: { criteria: true } } },
      }),
      prisma.moduleProgress.findMany({ where: { learnerId } }),
      prisma.criterionStatus.findMany({ where: { learnerId } }),
      prisma.project.findMany({ where: { learnerId }, orderBy: { createdAt: "asc" } }),
      prisma.evidence.findMany({ where: { learnerId }, orderBy: { createdAt: "desc" } }),
      prisma.submission.findMany({ where: { learnerId } }),
      prisma.discussionThread.findMany({
        where: { learnerId },
        orderBy: { createdAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.spriteInteraction.findMany({ where: { learnerId }, orderBy: { createdAt: "desc" } }),
    ]);

  const progressByModule = new Map(progress.map((p) => [p.moduleId, p]));
  const statusByCriterion = new Map(statuses.map((s) => [s.criterionId, s]));
  const projectByModule = new Map(projects.map((p) => [p.moduleId, p]));
  const moduleById = new Map(classModules.map((cm) => [cm.moduleId, cm.module]));

  const fmtDuration = (s: number) =>
    s >= 3600
      ? `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`
      : `${Math.floor(s / 60)}m`;

  const rows = classModules.map((cm) => {
    const m = cm.module;
    const prog = progressByModule.get(m.id);
    const done = !!projectByModule.get(m.id) || prog?.status === "COMPLETED";
    const started = !!prog;
    const required = m.criteria.filter((c) => c.required);
    const met = required.filter((c) => statusByCriterion.get(c.id)?.status === "MET").length;
    const pct = done ? 100 : required.length === 0 ? 0 : Math.round((met / required.length) * 100);
    const workCount =
      evidence.filter((e) => e.moduleId === m.id).length +
      submissions.filter((s) => s.moduleId === m.id).length;
    // Same definition as the review queue: human decisions this learner is waiting on.
    const awaiting = started
      ? m.criteria.filter((c) => {
          const s = statusByCriterion.get(c.id)?.status ?? "NOT_STARTED";
          if (c.checkType === "RUBRIC") return s !== "MET";
          if (c.checkType === "HYBRID") return s === "IN_PROGRESS";
          return false;
        }).length
      : 0;
    return {
      m,
      done,
      started,
      met,
      required: required.length,
      pct,
      awaiting,
      workCount,
      seconds: prog?.timeOnTaskSeconds ?? 0,
    };
  });

  const badges = rows.filter((r) => projectByModule.has(r.m.id));
  const inProgressCount = rows.filter((r) => r.started && !r.done).length;
  const totalSeconds = progress.reduce((sum, p) => sum + p.timeOnTaskSeconds, 0);
  const timeOnTask = fmtDuration(totalSeconds);

  // Learner-driven timestamps only (instructor replies excluded).
  const learnerDates = [
    ...evidence.map((e) => e.createdAt),
    ...submissions.map((s) => s.createdAt),
    ...threads.flatMap((t) =>
      t.messages.filter((msg) => msg.authorRole === "LEARNER").map((msg) => msg.createdAt),
    ),
    ...spriteChats.map((c) => c.createdAt),
    ...progress.map((p) => p.startedAt),
  ];
  const lastActive = learnerDates.length
    ? new Date(Math.max(...learnerDates.map((d) => d.getTime())))
    : null;

  // Everything the learner (or the conversation around them) produced, newest first.
  type Activity = {
    key: string;
    at: Date;
    kind: string;
    moduleTitle: string;
    text: string | null;
    imageUrl?: string | null;
    flag?: string | null;
  };
  const moduleTitle = (id: string) => moduleById.get(id)?.title ?? "Module";
  const activity: Activity[] = [
    ...evidence.map((e) => ({
      key: `e-${e.id}`,
      at: e.createdAt,
      kind: e.type === "PHOTO" ? "📸 Photo" : e.type === "AUDIO" ? "🎙️ Voice note" : "📝 Note",
      moduleTitle: moduleTitle(e.moduleId),
      text: e.text ?? e.caption,
      imageUrl: e.type === "PHOTO" ? e.url : null,
    })),
    ...submissions.map((s) => ({
      key: `s-${s.id}`,
      at: s.createdAt,
      kind: "✍️ Writing",
      moduleTitle: moduleTitle(s.moduleId),
      text: s.content,
    })),
    ...threads.flatMap((t) =>
      t.messages
        .filter((msg) => msg.authorRole !== "SPRITE")
        .map((msg) => ({
          key: `m-${msg.id}`,
          at: msg.createdAt,
          kind: msg.authorRole === "LEARNER" ? "💬 Discussion" : "💬 Your reply",
          moduleTitle: moduleTitle(t.moduleId),
          text: msg.body,
        })),
    ),
    ...spriteChats.map((c) => ({
      key: `sp-${c.id}`,
      at: c.createdAt,
      kind: "✨ Sprite chat",
      moduleTitle: moduleTitle(c.moduleId),
      text: c.userMessage,
      flag: c.answerSeeking ? "answer-seeking" : null,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const DAY_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const TIME_FMT = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link
        href={`/instruct/class/${klass.id}`}
        className="text-sm font-medium transition-colors hover:text-[var(--text)]"
        style={{ color: "var(--faint)" }}
      >
        ← {klass.name}
      </Link>

      {/* Identity */}
      <header className="animate-fade-up mt-5 flex items-start gap-4">
        {learner.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={learner.photoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-[var(--border)] object-cover"
          />
        ) : (
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xl font-semibold"
            style={{ background: "var(--tile)", color: "var(--accent)", fontFamily: "var(--font-grotesk)" }}
          >
            {learner.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="overline mb-1.5">Learner profile</div>
          <h1 className="text-3xl font-semibold tracking-tight">{learner.displayName}</h1>
          <p className="muted mt-1.5 text-sm">
            {klass.name} · Ages {band.ageRange.replace("≈", "")}
            {learner.sprite && (
              <>
                {" "}
                · Sprite: {learner.sprite.avatar} {learner.sprite.name}
              </>
            )}
          </p>
        </div>
        <Link
          href={`/instruct/learner/${learner.id}/portfolio`}
          className="btn-primary h-11 shrink-0 px-4 text-sm"
        >
          📖 Full portfolio
        </Link>
      </header>

      {/* Stats */}
      <section className="animate-fade-up mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ animationDelay: "0.06s" }}>
        {[
          { value: badges.length, label: "Badges", color: "var(--accent)" },
          { value: inProgressCount, label: "In progress", color: "var(--info-text)" },
          { value: evidence.length + submissions.length, label: "Work items", color: "var(--heading)" },
          { value: timeOnTask, label: "Time on task", color: "var(--heading)" },
          { value: spriteChats.length, label: "Sprite chats", color: "var(--heading)" },
          { value: lastActive ? DAY_FMT.format(lastActive) : "—", label: "Last active", color: "var(--heading)" },
        ].map((s) => (
          <div key={s.label} className="card rounded-[14px] p-4">
            <div className="display text-[24px] font-semibold leading-none" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="mono-label mt-2 text-[10.5px]">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Badges */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Badges</h2>
          <span className="mono-label">
            {badges.length} / {rows.length} earned
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {rows.map(({ m }) => {
            const has = projectByModule.has(m.id);
            return (
              <div
                key={m.id}
                title={m.badgeDescription}
                className="flex items-center gap-2.5 rounded-xl border py-2 pl-3 pr-4"
                style={
                  has
                    ? { borderColor: "rgba(182,242,77,0.28)", background: "rgba(182,242,77,0.06)" }
                    : { borderColor: "var(--border-soft)", background: "#0f1115" }
                }
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                  style={{
                    background: has ? "rgba(182,242,77,0.14)" : "var(--tile)",
                    filter: has ? "none" : "grayscale(1) opacity(0.45)",
                  }}
                >
                  {m.badgeIcon}
                </span>
                <span className="text-sm font-semibold" style={{ color: has ? "var(--heading)" : "#5a616c" }}>
                  {m.badgeName}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Module progress */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.14s" }}>
        <h2 className="text-base font-semibold">Modules</h2>
        <div className="mt-4 flex flex-col gap-3">
          {rows.map(({ m, done, started, met, required, pct, awaiting, seconds }) => {
            const inner = (
              <div className={`card flex items-center gap-4 p-4 ${started ? "card-interactive" : ""}`}>
                <span className="tile flex h-10 w-10 shrink-0 items-center justify-center text-lg">
                  {m.badgeIcon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5">
                    <span className="display text-[15px] font-semibold">{m.title}</span>
                    {awaiting > 0 && (
                      <span className="pill pill-warn !py-0.5 !text-[11px]">
                        {awaiting} awaiting review
                      </span>
                    )}
                  </span>
                  <span className="mt-2 flex items-center gap-3">
                    <span className="bar max-w-[220px] flex-1">
                      <span
                        style={{
                          width: `${pct}%`,
                          background: done ? "var(--accent)" : started ? "var(--info)" : "#3a3f49",
                        }}
                      />
                    </span>
                    <span className="mono-label">
                      {met}/{required} criteria
                      {seconds > 0 && <> · {fmtDuration(seconds)}</>}
                    </span>
                  </span>
                </span>
                <span className={`pill shrink-0 ${done ? "pill-done" : started ? "pill-progress" : "pill-idle"}`}>
                  {done ? "Done" : started ? "In progress" : "Not started"}
                </span>
              </div>
            );
            // Only started modules have anything to review.
            return started ? (
              <Link key={m.id} href={`/instruct/review/${learner.id}/${m.id}`} className="block">
                {inner}
              </Link>
            ) : (
              <div key={m.id}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* Portfolio — a snapshot can be generated at any point, not just at the finish line. */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.18s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Portfolio</h2>
          <span className="mono-label">
            {projects.length} complete · {inProgressCount} in progress
          </span>
        </div>
        <p className="muted mt-1.5 text-[13px]">
          View or download a snapshot at any point — unfinished modules are marked “Work in progress”.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {rows.map(({ m, done, started, met, required, workCount }) => {
            const project = projectByModule.get(m.id);
            const hasWork = started || workCount > 0;
            return (
              <div key={m.id} className="card p-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{m.badgeIcon}</span>
                  <span className="display text-[15px] font-semibold">{m.title}</span>
                  <span
                    className={`pill ml-auto shrink-0 ${done ? "pill-done" : hasWork ? "pill-progress" : "pill-idle"}`}
                  >
                    {done ? m.badgeName : hasWork ? "In progress" : "Not started"}
                  </span>
                </div>
                <p className="muted mt-2.5 text-[13px] leading-relaxed">
                  {done && project
                    ? project.summary
                    : hasWork
                      ? `${workCount} work item${workCount === 1 ? "" : "s"} captured so far · ${met} of ${required} steps done.`
                      : "Nothing captured yet — the portfolio builds as they work."}
                </p>
                {hasWork && (
                  <div className="mt-3 flex items-center gap-5">
                    <Link
                      href={`/instruct/learner/${learner.id}/portfolio/${m.id}`}
                      className="mono-label transition-colors hover:text-[var(--accent)]"
                    >
                      View portfolio →
                    </Link>
                    <a
                      href={`/instruct/learner/${learner.id}/portfolio/${m.id}/download`}
                      className="mono-label transition-colors hover:text-[var(--accent)]"
                    >
                      💾 Download
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="muted text-sm">No modules assigned to this class yet.</p>
          )}
        </div>
      </section>

      {/* Discussions */}
      {threads.length > 0 && (
        <section className="animate-fade-up mt-10" style={{ animationDelay: "0.22s" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Discussions</h2>
            <span className="mono-label">
              {threads.filter((t) => !t.resolved).length} open
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {threads.map((t) => {
              const last = t.messages[t.messages.length - 1];
              const who =
                last?.authorRole === "LEARNER"
                  ? learner.displayName.split(" ")[0]
                  : last?.authorRole === "SPRITE"
                    ? "Sprite"
                    : "You";
              return (
                <Link key={t.id} href={`/instruct/review/${learner.id}/${t.moduleId}`} className="block">
                  <div className="card card-interactive flex items-start gap-4 p-4">
                    <span className={`pill shrink-0 ${t.resolved ? "pill-done" : "pill-warn"}`}>
                      {t.resolved ? "Resolved" : "Open"}
                    </span>
                    <div className="min-w-0 flex-1 text-sm" style={{ color: "var(--body)" }}>
                      <p className="mono-label mb-1">
                        {moduleTitle(t.moduleId)} · {t.messages.length} message{t.messages.length === 1 ? "" : "s"}
                      </p>
                      {last && <p className="line-clamp-2 leading-relaxed">{who}: {last.body}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent activity: evidence, writing, discussion, and Sprite chats in one stream */}
      <section className="animate-fade-up mt-10" style={{ animationDelay: "0.26s" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Recent activity</h2>
          {activity.length > 12 && (
            <span className="mono-label">latest 12 of {activity.length}</span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {activity.slice(0, 12).map((a) => (
            <div key={a.key} className="card flex items-start gap-4 p-4">
              <span className="pill pill-idle shrink-0">{a.kind}</span>
              <div className="min-w-0 flex-1 text-sm" style={{ color: "var(--body)" }}>
                <p className="mono-label mb-1 flex items-center gap-2">
                  <span>{a.moduleTitle} · {TIME_FMT.format(a.at)}</span>
                  {a.flag && <span className="pill pill-warn !py-0 !text-[10px]">{a.flag}</span>}
                </p>
                {a.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.imageUrl}
                    alt={a.text ?? "Learner evidence"}
                    className="mb-2 max-h-44 rounded-lg border border-[var(--border-soft)]"
                  />
                )}
                {a.text && <p className="line-clamp-3 whitespace-pre-wrap leading-relaxed">{a.text}</p>}
              </div>
            </div>
          ))}
          {activity.length === 0 && <p className="muted text-sm">No activity yet.</p>}
        </div>
      </section>
    </main>
  );
}
