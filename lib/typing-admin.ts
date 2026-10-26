// Instructor actions for Letter Leaper classrooms. Callers check access first
// (lib/typing-access.ts → instructorClass / the instructor's orgIds).

import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { createLetterLeaperModule } from "@/prisma/letter-leaper-module.mjs";
import { LETTER_LEAPER_TITLE, type PracticeSettings } from "@/lib/typing-access";
import { LETTER_SETS, PACES, SCOPES } from "@/lib/typing-events";

type Tx = Prisma.TransactionClient;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function parseSettings(v: unknown): PracticeSettings | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  const ok = (x: unknown, list: readonly string[]) => typeof x === "string" && list.includes(x);
  return ok(s.letterSet, LETTER_SETS) && ok(s.pace, PACES) && ok(s.scope, SCOPES)
    ? { letterSet: s.letterSet, pace: s.pace, scope: s.scope } as PracticeSettings
    : null;
}

// One name per line; 2–40 characters; no duplicates (case-insensitive).
export function parseNames(text: unknown, existing: string[] = []): { ok: true; names: string[] } | { ok: false; error: string } {
  if (typeof text !== "string") return { ok: false, error: "Add at least one student name." };
  const names = text.split(/\r?\n/).map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean);
  if (!names.length) return { ok: false, error: "Add at least one student name." };
  if (names.length > 60) return { ok: false, error: "Add up to 60 students at a time." };
  const seen = new Set(existing.map((n) => n.toLowerCase()));
  for (const n of names) {
    if (n.length < 2 || n.length > 40) return { ok: false, error: `“${n.slice(0, 40)}” must be 2–40 characters.` };
    if (seen.has(n.toLowerCase())) return { ok: false, error: `“${n}” is already in this class — add a last initial to tell them apart.` };
    seen.add(n.toLowerCase());
  }
  return { ok: true, names };
}

export const newPin = () => String(randomInt(0, 10_000)).padStart(4, "0");

async function newClassCode(tx: Tx) {
  for (let i = 0; i < 20; i++) {
    const code = "TYPE-" + Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join("");
    if (!(await tx.class.findUnique({ where: { classCode: code } }))) return code;
  }
  throw new Error("Couldn't find a free class code.");
}

// The org's Letter Leaper module, creating it (with this teacher's name in the
// learner-facing text) the first time the org uses it.
async function ensureModule(tx: Tx, orgId: string, teacher: string) {
  const existing = await tx.module.findFirst({ where: { orgId, title: LETTER_LEAPER_TITLE }, select: { id: true } });
  if (existing) return existing.id;
  const mod = await createLetterLeaperModule(
    ({ blocks, criteria, ...data }: { blocks: unknown[]; criteria: Prisma.CriterionCreateWithoutModuleInput[] } & Omit<Prisma.ModuleUncheckedCreateInput, "contentJson" | "orgId">) =>
      tx.module.create({ data: { ...data, orgId, contentJson: JSON.stringify(blocks), criteria: { create: criteria } } }),
    { teacher },
  );
  return mod.id as string;
}

async function assignInTx(tx: Tx, classId: string, orgId: string, teacher: string, settings?: PracticeSettings) {
  const moduleId = await ensureModule(tx, orgId, teacher);
  const last = await tx.classModule.aggregate({ where: { classId }, _max: { order: true } });
  await tx.classModule.upsert({
    where: { classId_moduleId: { classId, moduleId } },
    update: {},
    create: { classId, moduleId, order: (last._max.order ?? -1) + 1 },
  });
  await tx.typingAssignment.upsert({
    where: { classId },
    update: { moduleId, ...(settings ?? {}) },
    create: { classId, moduleId, ...(settings ?? {}) },
  });
  return moduleId;
}

async function addLearners(tx: Tx, classId: string, band: string, names: string[]) {
  for (const displayName of names) {
    await tx.learner.create({ data: { displayName, band, pin: newPin(), roster: { create: { classId } } } });
  }
}

export async function createTypingClass(input: { orgId: string; name: string; band: string; names: string[]; settings: PracticeSettings; teacher: string }) {
  return prisma.$transaction(async (tx) => {
    const klass = await tx.class.create({
      // PIN sign-in from the start, so every student's progress is recorded.
      data: { orgId: input.orgId, name: input.name, band: input.band, classCode: await newClassCode(tx), minAuthTier: 1 },
    });
    await assignInTx(tx, klass.id, input.orgId, input.teacher, input.settings);
    await addLearners(tx, klass.id, input.band, input.names);
    return klass;
  }, { timeout: 30_000 });
}

export async function assignLetterLeaper(klass: { id: string; orgId: string }, teacher: string) {
  return prisma.$transaction((tx) => assignInTx(tx, klass.id, klass.orgId, teacher), { timeout: 30_000 });
}

export async function saveSettings(classId: string, settings: PracticeSettings) {
  return prisma.typingAssignment.update({ where: { classId }, data: settings });
}

// Switch an open (name-only) class to PIN sign-in: give every learner without
// a PIN a new one. Self-registration stops; the teacher adds new students.
export async function enablePins(classId: string) {
  return prisma.$transaction(async (tx) => {
    const roster = await tx.rosterEntry.findMany({ where: { classId }, include: { learner: { select: { id: true, pin: true } } } });
    for (const r of roster) if (!r.learner.pin) await tx.learner.update({ where: { id: r.learner.id }, data: { pin: newPin() } });
    await tx.class.update({ where: { id: classId }, data: { minAuthTier: 1 } });
  }, { timeout: 30_000 });
}

export async function addStudents(klass: { id: string; band: string }, text: unknown) {
  const roster = await prisma.rosterEntry.findMany({ where: { classId: klass.id }, include: { learner: { select: { displayName: true } } } });
  const parsed = parseNames(text, roster.map((r) => r.learner.displayName));
  if (!parsed.ok) return parsed;
  await prisma.$transaction((tx) => addLearners(tx, klass.id, klass.band, parsed.names), { timeout: 30_000 });
  return { ok: true as const, added: parsed.names.length };
}
