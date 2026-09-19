import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

// Tap-to-login: a physical NFC tag is written (via the NFC Tools app) with
// the URL to this route. A phone's OS-level NFC reader opens it directly in
// the browser — no app, no Web NFC API, works on iOS and Android alike. The
// token is a per-RosterEntry bearer credential (see prisma/schema.prisma);
// regenerate it to invalidate a lost tag.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const entry = await prisma.rosterEntry.findUnique({ where: { nfcToken: token } });

  // Build the redirect from the Host header the client actually used, not
  // req.url's origin — Next dev normalizes that to "localhost" even when the
  // request came in over the LAN IP, which would strand a phone mid-tap.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const origin = `${proto}://${host}`;

  if (!entry) return NextResponse.redirect(new URL("/join", origin));

  await setSession({ learnerId: entry.learnerId, classId: entry.classId });
  return NextResponse.redirect(new URL("/learn", origin));
}
