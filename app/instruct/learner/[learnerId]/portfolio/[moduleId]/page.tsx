import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { buildPortfolio } from "@/lib/portfolio";
import PortfolioView from "@/components/PortfolioView";
import PrintButton from "@/components/PrintButton";

// Instructor's copy of a learner's portfolio (e.g., to print handouts for
// parents). Same renderer as the learner view.
export default async function InstructorPortfolioPage({
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
  if (!module || !orgIds.includes(module.orgId)) notFound();
  if (!learner || !learner.roster.some((r) => orgIds.includes(r.class.orgId))) notFound();

  const data = await buildPortfolio(learnerId, moduleId);
  if (!data) notFound();

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
        <div className="flex items-center gap-2">
          <a
            href={`/instruct/learner/${learnerId}/portfolio/${moduleId}/download`}
            className="btn-ghost h-11 px-4 text-sm"
          >
            💾 Save file
          </a>
          <PrintButton />
        </div>
      </div>
      <PortfolioView data={data} />
    </main>
  );
}
