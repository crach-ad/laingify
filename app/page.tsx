import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ParticleTitle from "@/components/ParticleTitle";

// Landing: signed-in learners go straight to their dashboard; everyone else
// gets the front door — a particle headline (see components/ParticleTitle)
// and the two ways in.
export default async function Home() {
  const session = await getSession();
  if (session) redirect("/learn");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* Instrument Serif (italic) is only used by the rasterized headline. */}
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap"
      />

      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/laingify-logo-dark.png"
          alt="laingify — Learning Management System for STEM and AI programs"
          className="w-56 max-w-[65vw] sm:w-64"
        />

        <div className="mt-2 w-full">
          <ParticleTitle lines={["Education Reimagined", "For Every Learner"]} color="#e7e9ee" height={200} />
        </div>

        <p className="muted max-w-md text-base">
          Project-based learning where every module ends in something real — built, photographed,
          explained, and saved to a portfolio you can hold up.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/join" className="btn-primary flex h-13 items-center px-8 text-base">
            Join your class →
          </Link>
          <Link href="/instruct/login" className="btn-ghost flex h-13 items-center px-6 text-sm">
            Instructor sign in
          </Link>
        </div>

        <div className="mono-label mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <span>🔨 Build-first modules</span>
          <span>🏅 Badges for finished work</span>
          <span>📖 Portfolios built automatically</span>
        </div>
      </div>
    </main>
  );
}
