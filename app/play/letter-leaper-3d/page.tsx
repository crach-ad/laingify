import { redirect } from "next/navigation";

// The 3D preview became Letter Leaper's main scene; this address now leads to the game.
export default function LetterLeaper3DPage() {
  redirect("/play/typing");
}
