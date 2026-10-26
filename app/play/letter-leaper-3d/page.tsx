import ClientEntry from "./ClientEntry";

export const metadata = {
  title: "Letter Leaper 3D — local preview | laingify",
  description: "A ten-leap jungle preview of Letter Leaper in 3D. Nothing is saved.",
  robots: { index: false, follow: false },
};

// Local 3D prototype of Letter Leaper (ten leaps, jungle only). The existing
// game at /play/letter-leaper and /play/typing is unchanged.
export default function LetterLeaper3DPage() {
  return <ClientEntry />;
}
