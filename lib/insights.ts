// Insights query layer (ANALYTICS.md Phase B1). Pure reads, per class, all
// returning plain serializable data so the same functions feed the console
// tab, the weekly digest, and term reports.
//
// Volume note: Evidence.url holds inline media (data URLs) — every query here
// selects only ids/timestamps, never content columns.

import { prisma } from "./db.ts";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// ISO-week key like "2026-W34" (UTC-based; fine at weekly granularity).
export function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day); // Thursday of this week
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function lastWeekKeys(n: number, from = new Date()): string[] {
  const keys: string[] = [];
  const d = new Date(from);
  for (let i = 0; i < n; i++) {
    keys.unshift(isoWeek(d));
    d.setUTCDate(d.getUTCDate() - 7);
  }
  return keys;
}

async function rosterIds(classId: string): Promise<string[]> {
  const roster = await prisma.rosterEntry.findMany({ where: { classId }, select: { learnerId: true } });
  return roster.map((r) => r.learnerId);
}

// Timestamped activity markers for a set of learners (evidence, submissions,
// events) — the raw material for "active" and streaks.
async function activityStamps(learnerIds: string[], since: Date) {
  const [evidence, submissions, events] = await Promise.all([
    prisma.evidence.findMany({
      where: { learnerId: { in: learnerIds }, createdAt: { gte: since } },
      select: { learnerId: true, createdAt: true },
    }),
    prisma.submission.findMany({
      where: { learnerId: { in: learnerIds }, createdAt: { gte: since } },
      select: { learnerId: true, createdAt: true },
    }),
    prisma.learnerEvent.findMany({
      where: { learnerId: { in: learnerIds }, createdAt: { gte: since } },
      select: { learnerId: true, createdAt: true },
    }),
  ]);
  return [...evidence, ...submissions, ...events];
}

// ---------------------------------------------------------------------------
// Weekly engagement
// ---------------------------------------------------------------------------

export type WeeklyActive = {
  weeks: { week: string; active: number; returning: number }[];
  activeThisWeek: number;
  retentionPct: number | null; // of last week's actives, % back this week
};

export async function weeklyActive(classId: string, weekCount = 10): Promise<WeeklyActive> {
  const ids = await rosterIds(classId);
  const keys = lastWeekKeys(weekCount);
  const since = new Date(Date.now() - weekCount * 7 * 86400000);
  const stamps = ids.length ? await activityStamps(ids, since) : [];

  const byWeek = new Map<string, Set<string>>(keys.map((k) => [k, new Set()]));
  for (const s of stamps) {
    const set = byWeek.get(isoWeek(s.createdAt));
    if (set) set.add(s.learnerId);
  }
  const weeks = keys.map((week, i) => {
    const cur = byWeek.get(week)!;
    const prev = i > 0 ? byWeek.get(keys[i - 1])! : new Set<string>();
    return { week, active: cur.size, returning: [...cur].filter((id) => prev.has(id)).length };
  });
  const last = weeks[weeks.length - 1];
  const prev = weeks[weeks.length - 2];
  return {
    weeks,
    activeThisWeek: last?.active ?? 0,
    retentionPct: prev && prev.active > 0 ? Math.round((last.returning / prev.active) * 100) : null,
  };
}

// ---------------------------------------------------------------------------
// Module funnel
// ---------------------------------------------------------------------------

export type NamedRef = { learnerId: string; displayName: string };

export type FunnelRow = {
  moduleId: string;
  title: string;
  badgeIcon: string;
  topic: string;
  started: number;
  someEvidence: number;
  wrapUp: number;
  badge: number;
  medianMinutes: number | null; // from timeOnTaskSeconds where > 0
  // Who is parked in each gap — the analysis a teacher acts on.
  stuck: {
    noEvidence: NamedRef[]; // started, nothing captured yet
    noWrapUp: NamedRef[]; // evidence in, wrap-up missing
    noBadge: NamedRef[]; // wrap-up in, badge still not earned
    done: NamedRef[];
  };
};

export async function moduleFunnel(classId: string): Promise<FunnelRow[]> {
  const [roster, assigned] = await Promise.all([
    prisma.rosterEntry.findMany({
      where: { classId },
      include: { learner: { select: { id: true, displayName: true } } },
    }),
    prisma.classModule.findMany({
      where: { classId },
      orderBy: { order: "asc" },
      include: { module: { select: { id: true, title: true, badgeIcon: true, topic: true } } },
    }),
  ]);
  const ids = roster.map((r) => r.learnerId);
  const nameOf = new Map(roster.map((r) => [r.learnerId, r.learner.displayName]));
  const ref = (id: string): NamedRef => ({ learnerId: id, displayName: nameOf.get(id) ?? id });
  const emptyStuck = () => ({ noEvidence: [], noWrapUp: [], noBadge: [], done: [] });
  if (ids.length === 0) return assigned.map((a) => ({ moduleId: a.moduleId, title: a.module.title, badgeIcon: a.module.badgeIcon, topic: a.module.topic, started: 0, someEvidence: 0, wrapUp: 0, badge: 0, medianMinutes: null, stuck: emptyStuck() }));

  const moduleIds = assigned.map((a) => a.moduleId);
  const [progress, evidence, submissions, projects] = await Promise.all([
    prisma.moduleProgress.findMany({
      where: { learnerId: { in: ids }, moduleId: { in: moduleIds } },
      select: { learnerId: true, moduleId: true, status: true, timeOnTaskSeconds: true },
    }),
    prisma.evidence.findMany({
      where: { learnerId: { in: ids }, moduleId: { in: moduleIds } },
      select: { learnerId: true, moduleId: true },
    }),
    prisma.submission.findMany({
      where: { learnerId: { in: ids }, moduleId: { in: moduleIds } },
      select: { learnerId: true, moduleId: true },
    }),
    prisma.project.findMany({
      where: { learnerId: { in: ids }, moduleId: { in: moduleIds } },
      select: { learnerId: true, moduleId: true },
    }),
  ]);

  const key = (l: string, m: string) => `${l}:${m}`;
  const evSet = new Set(evidence.map((e) => key(e.learnerId, e.moduleId)));
  const subSet = new Set(submissions.map((s) => key(s.learnerId, s.moduleId)));
  const badgeSet = new Set([
    ...projects.map((p) => key(p.learnerId, p.moduleId)),
    ...progress.filter((p) => p.status === "COMPLETED").map((p) => key(p.learnerId, p.moduleId)),
  ]);

  return assigned.map((a) => {
    const m = a.moduleId;
    const rows = progress.filter((p) => p.moduleId === m);
    const times = rows.map((p) => p.timeOnTaskSeconds).filter((t) => t > 0).sort((x, y) => x - y);
    const stuck = { noEvidence: [] as NamedRef[], noWrapUp: [] as NamedRef[], noBadge: [] as NamedRef[], done: [] as NamedRef[] };
    for (const p of rows) {
      const k = key(p.learnerId, m);
      if (badgeSet.has(k)) stuck.done.push(ref(p.learnerId));
      else if (subSet.has(k)) stuck.noBadge.push(ref(p.learnerId));
      else if (evSet.has(k)) stuck.noWrapUp.push(ref(p.learnerId));
      else stuck.noEvidence.push(ref(p.learnerId));
    }
    return {
      moduleId: m,
      title: a.module.title,
      badgeIcon: a.module.badgeIcon,
      topic: a.module.topic,
      started: rows.length,
      someEvidence: rows.filter((p) => evSet.has(key(p.learnerId, m))).length,
      wrapUp: rows.filter((p) => subSet.has(key(p.learnerId, m))).length,
      badge: rows.filter((p) => badgeSet.has(key(p.learnerId, m))).length,
      medianMinutes: times.length ? Math.round(times[Math.floor(times.length / 2)] / 60) : null,
      stuck,
    };
  });
}

// ---------------------------------------------------------------------------
// Writing growth
// ---------------------------------------------------------------------------

export type WritingRow = {
  learnerId: string;
  displayName: string;
  counts: { createdAt: string; words: number }[]; // chronological wrap-up word counts
  trend: "up" | "down" | "flat" | null;
};

export async function writingGrowth(classId: string): Promise<WritingRow[]> {
  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true } } },
    orderBy: { learner: { displayName: "asc" } },
  });
  const ids = roster.map((r) => r.learnerId);
  if (ids.length === 0) return [];
  const subs = await prisma.submission.findMany({
    where: { learnerId: { in: ids } },
    orderBy: { createdAt: "asc" },
    select: { learnerId: true, content: true, createdAt: true },
  });
  return roster
    .map((r) => {
      const counts = subs
        .filter((s) => s.learnerId === r.learnerId)
        .map((s) => ({ createdAt: s.createdAt.toISOString(), words: s.content.split(/\s+/).filter(Boolean).length }));
      let trend: WritingRow["trend"] = null;
      if (counts.length >= 2) {
        const half = Math.ceil(counts.length / 2);
        const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
        const first = avg(counts.slice(0, half).map((c) => c.words));
        const second = avg(counts.slice(half).map((c) => c.words));
        trend = second > first * 1.15 ? "up" : second < first * 0.85 ? "down" : "flat";
      }
      return { learnerId: r.learnerId, displayName: r.learner.displayName, counts, trend };
    })
    .filter((r) => r.counts.length > 0);
}

// ---------------------------------------------------------------------------
// Strand coverage (badges by topic)
// ---------------------------------------------------------------------------

export type CoverageMatrix = {
  topics: string[];
  rows: { learnerId: string; displayName: string; byTopic: number[]; total: number }[];
};

export async function strandCoverage(classId: string): Promise<CoverageMatrix> {
  const [roster, assigned] = await Promise.all([
    prisma.rosterEntry.findMany({
      where: { classId },
      include: { learner: { select: { id: true, displayName: true } } },
      orderBy: { learner: { displayName: "asc" } },
    }),
    prisma.classModule.findMany({
      where: { classId },
      orderBy: { order: "asc" },
      include: { module: { select: { id: true, topic: true, title: true } } },
    }),
  ]);
  const topics: string[] = [];
  const topicOf = new Map<string, string>();
  for (const a of assigned) {
    const t = a.module.topic || a.module.title;
    if (!topics.includes(t)) topics.push(t);
    topicOf.set(a.moduleId, t);
  }
  const ids = roster.map((r) => r.learnerId);
  const projects = ids.length
    ? await prisma.project.findMany({
        where: { learnerId: { in: ids }, moduleId: { in: [...topicOf.keys()] } },
        select: { learnerId: true, moduleId: true },
      })
    : [];
  const rows = roster.map((r) => {
    const byTopic = topics.map(
      (t) => projects.filter((p) => p.learnerId === r.learnerId && topicOf.get(p.moduleId) === t).length,
    );
    return { learnerId: r.learnerId, displayName: r.learner.displayName, byTopic, total: byTopic.reduce((a, b) => a + b, 0) };
  });
  return { topics, rows };
}

// ---------------------------------------------------------------------------
// Step pacing + track mix (event-based; empty until events accrue)
// ---------------------------------------------------------------------------

export type StepPacing = { step: number; views: number; medianMin: number; p90Min: number }[];

export async function stepPacing(moduleId: string): Promise<StepPacing> {
  const events = await prisma.learnerEvent.findMany({
    where: { moduleId, type: "step_view" },
    select: { meta: true },
  });
  const byStep = new Map<number, number[]>();
  for (const e of events) {
    try {
      const meta = JSON.parse(e.meta) as { step?: number; dwellMs?: number };
      if (typeof meta.step !== "number" || typeof meta.dwellMs !== "number" || meta.dwellMs <= 0) continue;
      const list = byStep.get(meta.step) ?? [];
      list.push(Math.min(meta.dwellMs, 5 * 60 * 1000));
      byStep.set(meta.step, list);
    } catch {
      /* skip malformed */
    }
  }
  const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor(xs.length * p))];
  return [...byStep.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([step, list]) => {
      const sorted = [...list].sort((x, y) => x - y);
      return {
        step,
        views: sorted.length,
        medianMin: Math.round((pct(sorted, 0.5) / 60000) * 10) / 10,
        p90Min: Math.round((pct(sorted, 0.9) / 60000) * 10) / 10,
      };
    });
}

export async function trackMix(classId: string): Promise<{ track: string; count: number }[]> {
  const ids = await rosterIds(classId);
  if (ids.length === 0) return [];
  const events = await prisma.learnerEvent.findMany({
    where: { learnerId: { in: ids }, type: "track_pick" },
    select: { learnerId: true, meta: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  // Last pick per learner wins.
  const latest = new Map<string, string>();
  for (const e of events) {
    try {
      const t = (JSON.parse(e.meta) as { track?: string }).track;
      if (t) latest.set(e.learnerId, t);
    } catch {
      /* skip */
    }
  }
  const counts = new Map<string, number>();
  for (const t of latest.values()) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].map(([track, count]) => ({ track, count })).sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

export type AttentionItem = {
  learnerId: string;
  displayName: string;
  reasons: string[];
};

export async function needsAttention(classId: string): Promise<AttentionItem[]> {
  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true } } },
  });
  const ids = roster.map((r) => r.learnerId);
  if (ids.length === 0) return [];
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);

  const [progress, recentStamps, wrapupFails] = await Promise.all([
    prisma.moduleProgress.findMany({
      where: { learnerId: { in: ids }, status: "IN_PROGRESS", startedAt: { lt: twoWeeksAgo } },
      select: { learnerId: true, moduleId: true, startedAt: true },
    }),
    activityStamps(ids, twoWeeksAgo),
    prisma.learnerEvent.findMany({
      where: { learnerId: { in: ids }, type: "wrapup_submitted" },
      select: { learnerId: true, moduleId: true, meta: true },
    }),
  ]);
  const activeRecently = new Set(recentStamps.map((s) => s.learnerId));

  const staleModules = new Map<string, string[]>();
  const staleModuleIds = [...new Set(progress.map((p) => p.moduleId))];
  const modTitles = new Map(
    (await prisma.module.findMany({ where: { id: { in: staleModuleIds } }, select: { id: true, title: true } })).map(
      (m) => [m.id, m.title],
    ),
  );
  for (const p of progress) {
    if (activeRecently.has(p.learnerId)) continue; // still coming — not stalled
    const list = staleModules.get(p.learnerId) ?? [];
    list.push(modTitles.get(p.moduleId) ?? p.moduleId);
    staleModules.set(p.learnerId, list);
  }

  const failCounts = new Map<string, number>();
  for (const e of wrapupFails) {
    try {
      const meta = JSON.parse(e.meta) as { passed?: boolean };
      if (meta.passed === false) failCounts.set(e.learnerId, (failCounts.get(e.learnerId) ?? 0) + 1);
    } catch {
      /* skip */
    }
  }

  const items: AttentionItem[] = [];
  for (const r of roster) {
    const reasons: string[] = [];
    const stale = staleModules.get(r.learnerId);
    if (stale) reasons.push(`no activity in 2+ weeks with ${stale.length === 1 ? `"${stale[0]}"` : `${stale.length} modules`} unfinished`);
    const fails = failCounts.get(r.learnerId) ?? 0;
    if (fails >= 2) reasons.push(`${fails} wrap-ups submitted without completing the module`);
    if (reasons.length > 0) items.push({ learnerId: r.learnerId, displayName: r.learner.displayName, reasons });
  }
  return items.sort((a, b) => b.reasons.length - a.reasons.length);
}

// ---------------------------------------------------------------------------
// Attendance register: one row per learner, one dot per week, grouped by
// join-week cohort — "are kids coming back?" at name level.
// ---------------------------------------------------------------------------

export type RegisterRow = {
  learnerId: string;
  displayName: string;
  joinedWeek: string;
  weeks: boolean[]; // aligned to Register.weekKeys
  activeWeeks: number;
  lastActiveWeeksAgo: number | null; // null = never active
};

export type Register = {
  weekKeys: string[];
  cohorts: { joinedWeek: string; size: number; activeThisWeek: number; rows: RegisterRow[] }[];
};

export async function attendanceRegister(classId: string, weekCount = 10): Promise<Register> {
  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true, createdAt: true } } },
  });
  const weekKeys = lastWeekKeysPublic(weekCount);
  const ids = roster.map((r) => r.learnerId);
  const since = new Date(Date.now() - weekCount * 7 * 86400000);
  const stamps = ids.length ? await activityStamps(ids, since) : [];
  const byLearner = new Map<string, Set<string>>();
  for (const s of stamps) {
    const set = byLearner.get(s.learnerId) ?? new Set<string>();
    set.add(isoWeek(s.createdAt));
    byLearner.set(s.learnerId, set);
  }

  const rows: RegisterRow[] = roster.map((r) => {
    const active = byLearner.get(r.learnerId) ?? new Set<string>();
    const weeks = weekKeys.map((k) => active.has(k));
    const lastIdx = weeks.lastIndexOf(true);
    return {
      learnerId: r.learnerId,
      displayName: r.learner.displayName,
      joinedWeek: isoWeek(r.learner.createdAt),
      weeks,
      activeWeeks: weeks.filter(Boolean).length,
      lastActiveWeeksAgo: lastIdx === -1 ? null : weekKeys.length - 1 - lastIdx,
    };
  });

  const byCohort = new Map<string, RegisterRow[]>();
  for (const r of rows) {
    const list = byCohort.get(r.joinedWeek) ?? [];
    list.push(r);
    byCohort.set(r.joinedWeek, list);
  }
  const thisWeek = weekKeys[weekKeys.length - 1];
  const cohorts = [...byCohort.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([joinedWeek, list]) => ({
      joinedWeek,
      size: list.length,
      activeThisWeek: list.filter((r) => r.weeks[weekKeys.indexOf(thisWeek)]).length,
      rows: list.sort((a, b) => b.activeWeeks - a.activeWeeks || a.displayName.localeCompare(b.displayName)),
    }));
  return { weekKeys, cohorts };
}

function lastWeekKeysPublic(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    keys.unshift(isoWeek(d));
    d.setUTCDate(d.getUTCDate() - 7);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Step analytics for one module in one class: dwell + retries + who's where.
// Step indexes follow each learner's chosen track (they line up exactly for
// modules without a track picker).
// ---------------------------------------------------------------------------

export type StepAnalytics = {
  steps: { step: number; views: number; medianMin: number; p90Min: number; retries: number }[];
  current: { step: number; learners: NamedRef[] }[]; // latest step per unfinished learner
};

export async function stepAnalytics(classId: string, moduleId: string): Promise<StepAnalytics> {
  const roster = await prisma.rosterEntry.findMany({
    where: { classId },
    include: { learner: { select: { id: true, displayName: true } } },
  });
  const ids = roster.map((r) => r.learnerId);
  const nameOf = new Map(roster.map((r) => [r.learnerId, r.learner.displayName]));
  if (ids.length === 0) return { steps: [], current: [] };

  const [events, done] = await Promise.all([
    prisma.learnerEvent.findMany({
      where: { moduleId, learnerId: { in: ids }, type: { in: ["step_view", "checkpoint_retry"] } },
      orderBy: { createdAt: "asc" },
      select: { learnerId: true, type: true, meta: true },
    }),
    prisma.moduleProgress.findMany({
      where: { moduleId, learnerId: { in: ids }, status: "COMPLETED" },
      select: { learnerId: true },
    }),
  ]);
  const finished = new Set(done.map((d) => d.learnerId));

  const dwell = new Map<number, number[]>();
  const retries = new Map<number, number>();
  const latest = new Map<string, number>();
  for (const e of events) {
    let meta: { step?: number; dwellMs?: number };
    try {
      meta = JSON.parse(e.meta);
    } catch {
      continue;
    }
    if (typeof meta.step !== "number") continue;
    if (e.type === "checkpoint_retry") {
      retries.set(meta.step, (retries.get(meta.step) ?? 0) + 1);
      continue;
    }
    if (typeof meta.dwellMs === "number" && meta.dwellMs > 0) {
      const list = dwell.get(meta.step) ?? [];
      list.push(Math.min(meta.dwellMs, 5 * 60 * 1000));
      dwell.set(meta.step, list);
    }
    // step_view logs the step being LEFT — the learner is now one past it.
    latest.set(e.learnerId, meta.step + 1);
  }

  const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor(xs.length * p))];
  const steps = [...dwell.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([step, list]) => {
      const sorted = [...list].sort((x, y) => x - y);
      return {
        step,
        views: sorted.length,
        medianMin: Math.round((pct(sorted, 0.5) / 60000) * 10) / 10,
        p90Min: Math.round((pct(sorted, 0.9) / 60000) * 10) / 10,
        retries: retries.get(step) ?? 0,
      };
    });

  const byStep = new Map<number, NamedRef[]>();
  for (const [learnerId, step] of latest) {
    if (finished.has(learnerId)) continue;
    const list = byStep.get(step) ?? [];
    list.push({ learnerId, displayName: nameOf.get(learnerId) ?? learnerId });
    byStep.set(step, list);
  }
  const current = [...byStep.entries()].sort((a, b) => a[0] - b[0]).map(([step, learners]) => ({ step, learners }));
  return { steps, current };
}

// ---------------------------------------------------------------------------
// Lesson fit: does a module fit the teaching slot?
// ---------------------------------------------------------------------------

export type TimeFitRow = {
  moduleId: string;
  title: string;
  badgeIcon: string;
  measured: number; // learners with timing data
  buckets: number[]; // counts for 0-15, 15-30, 30-45, 45-60, 60+ minutes
  withinPct: number | null; // % of measured within lessonMinutes
  medianMinutes: number | null;
};

export async function timeFit(classId: string, lessonMinutes = 45): Promise<TimeFitRow[]> {
  const [ids, assigned] = await Promise.all([
    rosterIds(classId),
    prisma.classModule.findMany({
      where: { classId },
      orderBy: { order: "asc" },
      include: { module: { select: { id: true, title: true, badgeIcon: true } } },
    }),
  ]);
  if (ids.length === 0) return [];
  const progress = await prisma.moduleProgress.findMany({
    where: { learnerId: { in: ids }, moduleId: { in: assigned.map((a) => a.moduleId) }, timeOnTaskSeconds: { gt: 0 } },
    select: { moduleId: true, timeOnTaskSeconds: true },
  });
  return assigned
    .map((a) => {
      const mins = progress.filter((p) => p.moduleId === a.moduleId).map((p) => p.timeOnTaskSeconds / 60).sort((x, y) => x - y);
      const buckets = [0, 0, 0, 0, 0];
      for (const m of mins) buckets[Math.min(4, Math.floor(m / 15))]++;
      return {
        moduleId: a.moduleId,
        title: a.module.title,
        badgeIcon: a.module.badgeIcon,
        measured: mins.length,
        buckets,
        withinPct: mins.length ? Math.round((mins.filter((m) => m <= lessonMinutes).length / mins.length) * 100) : null,
        medianMinutes: mins.length ? Math.round(mins[Math.floor(mins.length / 2)]) : null,
      };
    })
    .filter((r) => r.measured > 0);
}

// ---------------------------------------------------------------------------
// One call for the class insights tab / digest
// ---------------------------------------------------------------------------

export async function loadClassInsights(classId: string, lessonMinutes = 45) {
  const [weekly, funnel, writing, coverage, tracks, attention, register, fit] = await Promise.all([
    weeklyActive(classId),
    moduleFunnel(classId),
    writingGrowth(classId),
    strandCoverage(classId),
    trackMix(classId),
    needsAttention(classId),
    attendanceRegister(classId),
    timeFit(classId, lessonMinutes),
  ]);
  return { weekly, funnel, writing, coverage, tracks, attention, register, fit };
}

// Lightweight per-class "active this week" counts for the console home.
export async function activeThisWeekByClass(classIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (classIds.length === 0) return result;
  const roster = await prisma.rosterEntry.findMany({
    where: { classId: { in: classIds } },
    select: { classId: true, learnerId: true },
  });
  const ids = [...new Set(roster.map((r) => r.learnerId))];
  if (ids.length === 0) {
    for (const c of classIds) result.set(c, 0);
    return result;
  }
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const stamps = await activityStamps(ids, weekAgo);
  const active = new Set(stamps.map((s) => s.learnerId));
  for (const c of classIds) {
    result.set(c, new Set(roster.filter((r) => r.classId === c && active.has(r.learnerId)).map((r) => r.learnerId)).size);
  }
  return result;
}
