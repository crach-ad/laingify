import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { buildPortfolio } from "@/lib/portfolio";
import PortfolioView from "@/components/PortfolioView";
import PrintButton from "@/components/PrintButton";
import { authorizedRewriteClass, reflectionSnapshot } from "@/lib/reflection-rewrite";
import ReopenReflection from "@/app/instruct/review/[learnerId]/[moduleId]/ReopenReflection";

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
  const [rewriteClass, { latest, pending }] = await Promise.all([
    authorizedRewriteClass(prisma, orgIds, learnerId, moduleId),
    reflectionSnapshot(prisma, learnerId, moduleId),
  ]);

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
      <section className="portfolio-chrome card mb-6 p-5" aria-label="Instructor reflection review">
        <h2 className="text-base font-semibold">Reflection review</h2>
        <Link href={`/instruct/review/${learnerId}/${moduleId}`} className="mt-2 inline-block text-sm underline">
          Review reflection and feedback →
        </Link>
        {pending && <p role="status" className="mt-3 text-sm">Awaiting rewritten reflection</p>}
        {rewriteClass && <ReopenReflection learnerId={learnerId} moduleId={moduleId} submissionId={!pending && latest?.content.trim() ? latest.id : null} format={latest?.audioUrl ? "audio" : "written"} />}
      </section>
      <PortfolioView data={data} />
    </main>
  );
}
