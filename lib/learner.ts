// Server-side helper for learner-facing pages: resolves the active session into
// the learner, their class, and their Sprite, or sends them back to /join.
// (Cookie session is not a security boundary — see lib/session.ts / PRD §11.)

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function requireLearner() {
  const session = await getSession();
  if (!session) redirect("/join");

  const [learner, klass] = await Promise.all([
    prisma.learner.findUnique({
      where: { id: session.learnerId },
      include: { sprite: true },
    }),
    prisma.class.findUnique({ where: { id: session.classId } }),
  ]);
  if (!learner || !klass) redirect("/join");

  // The Sprite persists across classes; ensure one exists (PRD §8).
  const sprite =
    learner.sprite ??
    (await prisma.sprite.create({ data: { learnerId: learner.id } }));

  return { learner, klass, sprite };
}
