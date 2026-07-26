import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildPortfolio } from "@/lib/portfolio";
import { renderPortfolioHtml, portfolioFilename } from "@/lib/portfolio-html";

// Download the signed-in learner's portfolio for this module as a single
// self-contained HTML file (media inline as data URLs — works offline).
export async function GET(_req: Request, ctx: RouteContext<"/learn/[moduleId]/portfolio/download">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { moduleId } = await ctx.params;
  const data = await buildPortfolio(session.learnerId, moduleId);
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return new NextResponse(renderPortfolioHtml(data), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${portfolioFilename(data)}"`,
    },
  });
}
