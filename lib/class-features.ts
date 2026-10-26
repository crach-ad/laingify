import { prisma } from "@/lib/db";

// Class-specific extras on the learner dashboard. Letter Leaper's falling
// platforms (a header link to /play/letter-leaper?falls=1) are offered to
// Ms. Pamela Smith's classes: every class in an org whose home instructor she
// is (Windsor School). Add a teacher's email here to offer it to their classes.
const FALLS_TEACHERS = ["pamelakristinasmith@gmail.com"];

export async function offersLetterLeaperFalls(orgId: string): Promise<boolean> {
  const teacher = await prisma.instructor.findFirst({
    where: { orgId, email: { in: FALLS_TEACHERS } },
    select: { id: true },
  });
  return teacher !== null;
}
