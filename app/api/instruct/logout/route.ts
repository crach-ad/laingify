import { NextResponse } from "next/server";
import { clearInstructorSession } from "@/lib/session";

export async function POST() {
  await clearInstructorSession();
  return NextResponse.json({ ok: true });
}
