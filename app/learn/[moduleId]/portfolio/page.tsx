import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/lib/learner";
import { buildPortfolio } from "@/lib/portfolio";
import PortfolioView from "@/components/PortfolioView";
import PrintButton from "@/components/PrintButton";

export default async function LearnerPortfolioPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const { learner } = await requireLearner();

  const data = await buildPortfolio(learner.id, moduleId);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="portfolio-chrome mb-6 flex items-center justify-between gap-3">
        <Link
          href={`/learn/${moduleId}`}
          className="text-sm font-medium transition-colors hover:text-[var(--text)]"
          style={{ color: "var(--faint)" }}
        >
          ← Back to the module
        </Link>
        <div className="flex items-center gap-2">
          <a href={`/learn/${moduleId}/portfolio/download`} className="btn-ghost h-11 px-4 text-sm">
            💾 Save file
          </a>
          <PrintButton />
        </div>
      </div>
      <PortfolioView data={data} />
    </main>
  );
}
