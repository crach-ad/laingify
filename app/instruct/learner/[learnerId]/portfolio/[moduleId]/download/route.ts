import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";
import { buildPortfolio } from "@/lib/portfolio";
import { renderPortfolioHtml, portfolioFilename } from "@/lib/portfolio-html";

// Instructor download of a learner's portfolio (same self-contained file).
export async function GET(
  _req: Request,
  ctx: RouteContext<"/instruct/learner/[learnerId]/portfolio/[moduleId]/download">,
) {
  const instructor = await getInstructor();
  if (!instructor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { learnerId, moduleId } = await ctx.params;
  const [module, learner] = await Promise.all([
    prisma.module.findUnique({ where: { id: moduleId } }),
    prisma.learner.findUnique({
      where: { id: learnerId },
      include: { roster: { include: { class: true } } },
    }),
  ]);
  if (!module || module.orgId !== instructor.orgId)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!learner || !learner.roster.some((r) => r.class.orgId === instructor.orgId))
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data = await buildPortfolio(learnerId, moduleId);
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return new NextResponse(renderPortfolioHtml(data), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${portfolioFilename(data)}"`,
    },
  });
}
