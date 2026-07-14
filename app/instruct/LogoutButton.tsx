"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/instruct/logout", { method: "POST" });
        router.push("/instruct/login");
      }}
      className="shrink-0 text-sm font-medium transition-colors hover:text-[var(--text)]"
      style={{ color: "var(--faint)" }}
    >
      Sign out
    </button>
  );
}
