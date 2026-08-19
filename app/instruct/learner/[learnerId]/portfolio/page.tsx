import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { buildPortfolio } from "@/lib/portfolio";
import PortfolioView from "@/components/PortfolioView";
import PrintButton from "@/components/PrintButton";

// The one-tap full portfolio: every module this learner has COMPLETED, in
// course order, as a single scrollable (and printable) document.
export default async function FullPortfolioPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  const { learnerId } = await params;
  const { orgIds } = await requireInstructor();

  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    include: { roster: { include: { class: true } } },
  });
  const rosterEntry = learner?.roster.find((r) => orgIds.includes(r.class.orgId));
  if (!learner || !rosterEntry) notFound();

  const [classModules, projects, progress] = await Promise.all([
    prisma.classModule.findMany({
      where: { classId: rosterEntry.classId },
      orderBy: { order: "asc" },
    }),
    prisma.project.findMany({ where: { learnerId } }),
    prisma.moduleProgress.findMany({ where: { learnerId, status: "COMPLETED" } }),
  ]);
  const completedIds = new Set([
    ...projects.map((p) => p.moduleId),
    ...progress.map((p) => p.moduleId),
  ]);
  const completedInOrder = classModules.filter((cm) => completedIds.has(cm.moduleId));

  const datas = (
    await Promise.all(completedInOrder.map((cm) => buildPortfolio(learnerId, cm.moduleId)))
  ).filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="portfolio-chrome mb-6 flex items-center justify-between">
        <Link
          href={`/instruct/learner/${learnerId}`}
          className="text-sm font-medium transition-colors hover:text-[var(--text)]"
          style={{ color: "var(--faint)" }}
        >
          ← {learner.displayName}&apos;s profile
        </Link>
        {datas.length > 0 && (
          <div className="flex items-center gap-2">
            <a
              href={`/instruct/learner/${learnerId}/portfolio/download`}
              className="btn-ghost h-11 px-4 text-sm"
            >
              💾 Save file
            </a>
            <PrintButton />
          </div>
        )}
      </div>

      <div className="portfolio-chrome card mb-8 flex items-center gap-4 p-5">
        <span className="text-3xl">📖</span>
        <div className="min-w-0 flex-1">
          <div className="display text-base font-semibold">Complete portfolio</div>
          <p className="muted mt-0.5 text-[13px]">
            {datas.length === 0
              ? "No completed projects yet — the portfolio grows as they finish projects."
              : `${datas.length} completed project${datas.length === 1 ? "" : "s"}, in course order. Save or print the whole thing in one go.`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {datas.map((data) => (
          <PortfolioView key={data.module.title} data={data} />
        ))}
      </div>
    </main>
  );
}
