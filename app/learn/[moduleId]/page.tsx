import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { bandConfig } from "@/lib/bands";
import { requireLearner } from "@/lib/learner";
import { evaluateModule } from "@/lib/completion";
import { slugifyTopic } from "@/lib/topics";
import SpriteChat from "../SpriteChat";
import ModuleWorkspace from "./ModuleWorkspace";
import Lesson from "./Lesson";
import Tutorial from "./Tutorial";

type Block = {
  type: string;
  text?: string;
  url?: string;
  capture?: "photo" | "audio";
  criterionLabel?: string;
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const { learner, klass, sprite } = await requireLearner();
  const band = bandConfig(klass.band);

  // The module must be assigned to this learner's class.
  const assigned = await prisma.classModule.findUnique({
    where: { classId_moduleId: { classId: klass.id, moduleId } },
  });
  if (!assigned) notFound();

  const lessonModule = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!lessonModule) notFound();

  // First visit starts the clock; never downgrade a completed module.
  const existingProgress = await prisma.moduleProgress.findUnique({
    where: { learnerId_moduleId: { learnerId: learner.id, moduleId } },
  });
  if (!existingProgress) {
    await prisma.moduleProgress.create({
      data: { learnerId: learner.id, moduleId, status: "IN_PROGRESS" },
    });
  }

  const [{ criteria, complete }, evidence, lastSubmission, threads, project] = await Promise.all([
    evaluateModule(learner.id, moduleId),
    prisma.evidence.findMany({
      where: { learnerId: learner.id, moduleId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.submission.findFirst({
      where: { learnerId: learner.id, moduleId, feedback: { isNot: null } },
      orderBy: { createdAt: "desc" },
      include: { feedback: true },
    }),
    prisma.discussionThread.findMany({
      where: { learnerId: learner.id, moduleId },
      orderBy: { createdAt: "asc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, authorRole: true, body: true },
        },
      },
    }),
    prisma.project.findUnique({
      where: { learnerId_moduleId: { learnerId: learner.id, moduleId } },
    }),
  ]);

  const blocks: Block[] = JSON.parse(lessonModule.contentJson || "[]");
  // Checkpoint modules (camp format) use the gated step-by-step Tutorial
  // instead of the read-then-workspace Lesson flow.
  const isTutorial = blocks.some((b) => b.type === "checkpoint");
  // For long physical builds, replay the last recorded step rather than jumping
  // past all construction cards to the next evidence upload.
  let initialStep: number | undefined;
  if (blocks.some(b => b.type === "assembly")) {
    const lastView = await prisma.learnerEvent.findFirst({ where: { learnerId: learner.id, moduleId, type: "step_view" }, orderBy: { createdAt: "desc" }, select: { meta: true } });
    try {
      const value = lastView ? JSON.parse(lastView.meta).step : undefined;
      if (Number.isInteger(value) && value >= 0) initialStep = value;
    } catch { /* A missing cursor safely starts the assembly lesson at the beginning. */ }
  }

  // Returning learners (anyone with prior work) skip straight to the activity.
  const hasActivity = complete || evidence.length > 0 || !!lastSubmission || threads.length > 0;
  const fb = lastSubmission?.feedback;
  const initialFeedback = fb
    ? {
        summary: fb.summary,
        metIds: JSON.parse(fb.metJson) as string[],
        missingIds: JSON.parse(fb.missingJson) as string[],
        nextSteps: fb.nextSteps,
        aiUsed: true,
      }
    : null;

  return (
    <main className={`mx-auto w-full max-w-2xl flex-1 px-6 py-8 ${band.textScale}`}>
      <Link
        href={lessonModule.topic ? `/learn/topic/${slugifyTopic(lessonModule.topic)}` : "/learn"}
        className="text-sm font-medium transition-colors hover:text-[var(--text)]"
        style={{ color: "var(--faint)" }}
      >
        ← {lessonModule.topic || "All topics"}
      </Link>

      <header className="animate-fade-up mt-5 flex items-start gap-4">
        <span className="tile flex h-14 w-14 shrink-0 items-center justify-center rounded-[13px] text-3xl">
          {lessonModule.badgeIcon}
        </span>
        <div>
          <div className="overline mb-1.5">Module</div>
          <h1 className="text-3xl font-semibold tracking-tight">{lessonModule.title}</h1>
          <p className="muted mt-1.5 text-sm">{lessonModule.summary}</p>
        </div>
      </header>

      {isTutorial ? (
        <Tutorial
          moduleId={moduleId}
          badge={{ name: lessonModule.badgeName, icon: lessonModule.badgeIcon }}
          blocks={blocks}
          criteria={criteria.map((c) => ({ id: c.id, label: c.label, status: c.status }))}
          evidence={evidence.map((e) => ({ id: e.id, criterionId: e.criterionId, type: e.type, url: e.url, text: e.text }))}
          initialComplete={complete}
          hasSubmission={!!lastSubmission}
          initialStep={initialStep}
        />
      ) : (
        <Lesson blocks={blocks} startRevealed={hasActivity}>
          <ModuleWorkspace
            moduleId={moduleId}
            badge={{ name: lessonModule.badgeName, icon: lessonModule.badgeIcon, description: lessonModule.badgeDescription }}
            spriteName={sprite.name}
            initialCriteria={criteria}
            initialEvidence={evidence.map((e) => ({
              id: e.id,
              type: e.type,
              text: e.text,
              url: e.url,
              caption: e.caption,
            }))}
            initialFeedback={initialFeedback}
            initialThreads={threads.map((t) => ({ id: t.id, seed: t.seed, messages: t.messages }))}
            initialComplete={complete}
            initialProject={project ? { summary: project.summary } : null}
          />
        </Lesson>
      )}

      <SpriteChat
        sprite={{
          name: sprite.name,
          avatar: sprite.avatar,
          color: sprite.color,
          avatarStyle: sprite.avatarStyle,
          avatarSeed: sprite.avatarSeed,
          avatarTraits: sprite.avatarTraits,
          avatarColors: sprite.avatarColors,
        }}
        moduleId={moduleId}
      />
    </main>
  );
}
