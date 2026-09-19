import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/instructor";
import { ConsoleHeader } from "../../../ConsoleParts";

// Tap-to-login QR codes: each roster row's RosterEntry.nfcToken (see
// prisma/schema.prisma, provisioned via `npm run provision:nfc`) is also a
// valid /nfc/[token] login link — the same mechanism built for NFC tags,
// just scanned with a camera instead of tapped. Built for classroom iPads,
// which have no NFC tag reader at all (iPhones/Android do — those can still
// use the physical tags). Read-only: run the provisioning script to add or
// regenerate tokens, this page only displays what already exists.
export default async function ClassQrPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const { instructor, orgs, orgIds } = await requireInstructor();

  const klass = await prisma.class.findUnique({
    where: { id: classId },
    include: { roster: { include: { learner: true }, orderBy: { learner: { displayName: "asc" } } } },
  });
  if (!klass || !orgIds.includes(klass.orgId)) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3210";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const cards = await Promise.all(
    klass.roster.map(async (entry) => {
      if (!entry.learner || !entry.nfcToken) return { entry, qr: null, url: null };
      const url = `${origin}/nfc/${entry.nfcToken}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      return { entry, qr, url };
    }),
  );
  const provisioned = cards.filter((c) => c.qr);
  const unprovisioned = cards.filter((c) => !c.qr);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <ConsoleHeader orgLabel={orgs.map((o) => o.name).join(" · ")} instructorName={instructor.displayName} />

      <Link href={`/instruct/class/${klass.id}`} className="muted mt-8 inline-block text-sm transition-colors hover:text-[var(--text)]">
        ← {klass.name}
      </Link>

      <section className="animate-fade-up mt-6">
        <div className="overline mb-1.5">Tap-to-login</div>
        <h1 className="text-3xl font-semibold tracking-tight">Sign-in QR codes</h1>
        <p className="muted mt-1.5 text-sm">
          Each student scans their own code with the iPad's Camera app — no typing, straight into their dashboard.
          {provisioned.length > 0 ? ` ${provisioned.length} of ${klass.roster.length} students ready.` : ""}
        </p>
      </section>

      {unprovisioned.length > 0 && (
        <div className="card mt-6 border-l-4 p-4" style={{ borderLeftColor: "var(--danger)" }}>
          <p className="text-sm" style={{ color: "var(--body)" }}>
            {unprovisioned.length} student{unprovisioned.length === 1 ? "" : "s"} not yet provisioned:{" "}
            {unprovisioned.map((c) => c.entry.learner?.displayName).join(", ")}. Run{" "}
            <code className="rounded bg-[var(--tile)] px-1.5 py-0.5 font-mono text-[12px]">npm run provision:nfc</code> to generate their codes.
          </p>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {provisioned.map(({ entry, qr }) => (
          <div key={entry.id} className="card flex flex-col items-center gap-3 p-5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL, not an optimizable remote image */}
            <img src={qr!} alt={`Sign-in QR code for ${entry.learner?.displayName}`} width={160} height={160} className="rounded-lg" />
            <span className="display text-sm font-semibold">{entry.learner?.displayName}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
