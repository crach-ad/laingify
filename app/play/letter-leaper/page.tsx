import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/lib/learner";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Letter Leaper — Moonbound | laingify",
  description: "Practice typing through six terrains, from the jungle to the moon and stars.",
};

export default async function LetterLeaperPage() {
  const { klass } = await requireLearner();
  const assignment = await prisma.classModule.findFirst({
    where: { classId: klass.id, module: { title: "Letter Leaper: Moonbound", orgId: klass.orgId } },
    select: { moduleId: true },
  });
  if (!assignment) notFound();
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-6">
      <Link href={`/learn/${assignment.moduleId}`} className="muted text-sm">
        ← Back to your Letter Leaper module
      </Link>
      <iframe
        src="/games/letter-leaper/index.html"
        title="Letter Leaper: Moonbound typing adventure"
        className="mt-4 h-[1100px] w-full rounded-xl border border-[var(--border-soft)] sm:h-[980px]"
        allow="fullscreen"
      />
    </main>
  );
}
