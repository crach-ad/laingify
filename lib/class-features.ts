import { prisma } from "@/lib/db";

// Class-specific extras on the learner dashboard. A Letter Leaper header link
// (to /play/letter-leaper, at the class's difficulty) is offered to the
// classes of the teachers listed here: every class in an org that is their
// home org or one they have console access to — Ms. Pamela Smith's Windsor
// School classes, and Crachad Laing's (both his accounts: camp, KCSB,
// IgniteHer, and the orgs he oversees). The button still shows only in
// classes that have the Letter Leaper module.
// Add a teacher's email to offer it to their classes.
const LEAPER_LINK_TEACHERS = ["pamelakristinasmith@gmail.com", "crachad.laing@gmail.com", "crachad@lainglaing.com"];

export async function offersLetterLeaperLink(orgId: string): Promise<boolean> {
  const teacher = await prisma.instructor.findFirst({
    where: { email: { in: LEAPER_LINK_TEACHERS }, OR: [{ orgId }, { accessOrgs: { some: { id: orgId } } }] },
    select: { id: true },
  });
  return teacher !== null;
}
