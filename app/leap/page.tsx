import { redirect } from "next/navigation";

export default function LeapPage() {
  redirect("/games/letter-leaper/index.html?mode=public");
}
