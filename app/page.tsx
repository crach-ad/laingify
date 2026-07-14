import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Entry point: signed-in learners go to their dashboard, everyone else joins.
export default async function Home() {
  const session = await getSession();
  redirect(session ? "/learn" : "/join");
}
