// Data for the instructor console: classes the instructor can see, each with
// roster progress and the review queue (criteria awaiting a human decision).
// Used by the console home (class list) and the per-class page.

import { prisma } from "@/lib/db";

export type QueueItem = {
  learnerId: string;
  learnerName: string;
  moduleId: string;
  moduleTitle: string;
  badgeIcon: string;
  classId: string;
  className: string;
  pending: string[];
};

export type RosterRow = {
  learnerId: string;
  displayName: string;
  photoUrl: string | null;
  done: number;
  inProgress: number;
  total: number;
};

export type ClassOverview = {
  id: string;
  name: string;
  classCode: string;
  band: string;
  orgName: string;
  moduleCount: number;
  roster: RosterRow[];
  badgesEarned: number;
  activeLearners: number;
  queue: QueueItem[];
};

export async function loadClassOverviews(orgIds: string[], classId?: string): Promise<ClassOverview[]> {
  const classes = await prisma.class.findMany({
    where: { orgId: { in: orgIds }, ...(classId ? { id: classId } : {}) },
    orderBy: [{ org: { createdAt: "asc" } }, { createdAt: "asc" }],
    include: {
      org: true,
      roster: { include: { learner: true }, orderBy: { learner: { displayName: "asc" } } },
      modules: {
        orderBy: { order: "asc" },
        include: { module: { include: { criteria: true } } },
      },
    },
  });

  const learnerIds = [...new Set(classes.flatMap((c) => c.roster.map((r) => r.learnerId)))];
  const [progress, statuses, projects] = await Promise.all([
    prisma.moduleProgress.findMany({ where: { learnerId: { in: learnerIds } } }),
    prisma.criterionStatus.findMany({ where: { learnerId: { in: learnerIds } } }),
    prisma.project.findMany({ where: { learnerId: { in: learnerIds } } }),
  ]);
  const started = new Set(progress.map((p) => `${p.learnerId}:${p.moduleId}`));
  const completed = new Set(
    projects
      .map((p) => `${p.learnerId}:${p.moduleId}`)
      .concat(progress.filter((p) => p.status === "COMPLETED").map((p) => `${p.learnerId}:${p.moduleId}`)),
  );
  const statusMap = new Map(statuses.map((s) => [`${s.learnerId}:${s.criterionId}`, s]));

  return classes.map((klass) => {
    const total = klass.modules.length;
    const roster: RosterRow[] = klass.roster.map((entry) => {
      const done = klass.modules.filter((cm) => completed.has(`${entry.learnerId}:${cm.moduleId}`)).length;
      const inProgress = klass.modules.filter(
        (cm) => started.has(`${entry.learnerId}:${cm.moduleId}`) && !completed.has(`${entry.learnerId}:${cm.moduleId}`),
      ).length;
      return {
        learnerId: entry.learnerId,
        displayName: entry.learner.displayName,
        photoUrl: entry.learner.photoUrl,
        done,
        inProgress,
        total,
      };
    });

    // Review queue: RUBRIC criteria become reviewable once the learner starts
    // the module; HYBRID ones once the auto pre-screen passes (IN_PROGRESS).
    const queue: QueueItem[] = [];
    for (const entry of klass.roster) {
      for (const cm of klass.modules) {
        const m = cm.module;
        if (!started.has(`${entry.learnerId}:${m.id}`)) continue;
        const pending = m.criteria
          .filter((c) => {
            const s = statusMap.get(`${entry.learnerId}:${c.id}`)?.status ?? "NOT_STARTED";
            if (c.checkType === "RUBRIC") return s !== "MET";
            if (c.checkType === "HYBRID") return s === "IN_PROGRESS";
            return false;
          })
          .map((c) => c.label);
        if (pending.length > 0) {
          queue.push({
            learnerId: entry.learnerId,
            learnerName: entry.learner.displayName,
            moduleId: m.id,
            moduleTitle: m.title,
            badgeIcon: m.badgeIcon,
            classId: klass.id,
            className: klass.name,
            pending,
          });
        }
      }
    }

    return {
      id: klass.id,
      name: klass.name,
      classCode: klass.classCode,
      band: klass.band,
      orgName: klass.org.name,
      moduleCount: total,
      roster,
      badgesEarned: roster.reduce((n, r) => n + r.done, 0),
      activeLearners: roster.filter((r) => r.inProgress > 0 || r.done > 0).length,
      queue,
    };
  });
}
