"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/join");
      }}
      className="shrink-0 text-sm font-medium transition-colors hover:text-[var(--text)]"
      style={{ color: "var(--faint)" }}
    >
      Sign out
    </button>
  );
}
