// Shared helpers for the per-org seed scripts (seed-abaco.mjs, seed-kcsb.mjs).
//
// Every module is authored as { title, topic, summary, badge*, contentJson,
// criteria: { create: [...] } } and written with createModule(), which either
// creates it (full seed) or upserts it in place by title (content-update
// mode) so learners' work is never touched.

export const block = (type, props) => ({ type, ...props });

// Every module ends the same way: a written wrap-up built on the playbook's
// three reflection questions.
export const wrapUpPrompt = (extra = "") =>
  block("prompt", {
    text:
      "Last step — your written wrap-up. Answer the three questions: What worked? What challenged you? What would you improve?" +
      (extra ? " " + extra : "") +
      " Then your portfolio builds itself from everything you captured today.",
  });

export const wrapUpCriterion = (order, description) => ({
  label: "Written wrap-up",
  description,
  checkType: "AUTO",
  required: true,
  order,
});

export const photoCriterion = (order, label, description) => ({
  label,
  description,
  checkType: "AUTO",
  requiresEvidenceType: "PHOTO",
  required: true,
  order,
});

export const audioCriterion = (order, label, description) => ({
  label,
  description,
  checkType: "AUTO",
  requiresEvidenceType: "AUDIO",
  required: true,
  order,
});

export const textCriterion = (order, label, description) => ({
  label,
  description,
  checkType: "AUTO",
  requiresEvidenceType: "TEXT",
  required: true,
  order,
});

// Build a createModule(data) bound to a prisma client, an org and a mode.
// Full seed: plain create. Update mode: upsert by title; criteria are matched
// by label — matched ones are updated, new ones added, and ones no longer in
// the seed are retired (required: false) rather than deleted, because learner
// evidence and statuses reference them.
export function moduleWriter(prisma, org, update) {
  return async function createModule(data) {
    data = { ...data, orgId: org.id };
    if (!update) return prisma.module.create({ data });
    const { criteria, ...fields } = data;
    const defs = criteria.create;
    const existing = await prisma.module.findFirst({
      where: { orgId: org.id, title: fields.title },
      include: { criteria: true },
    });
    if (!existing) {
      console.log(`  + new module: ${fields.title}`);
      return prisma.module.create({ data });
    }
    await prisma.module.update({
      where: { id: existing.id },
      data: { ...fields, version: { increment: 1 } },
    });
    for (const def of defs) {
      const match = existing.criteria.find((c) => c.label === def.label);
      if (match) {
        await prisma.criterion.update({ where: { id: match.id }, data: def });
      } else {
        await prisma.criterion.create({ data: { ...def, moduleId: existing.id } });
        console.log(`    + new criterion "${def.label}" in ${fields.title}`);
      }
    }
    for (const c of existing.criteria) {
      if (!defs.find((d) => d.label === c.label) && c.required) {
        await prisma.criterion.update({ where: { id: c.id }, data: { required: false } });
        console.log(`    - retired criterion "${c.label}" in ${fields.title}`);
      }
    }
    console.log(`  ~ updated: ${fields.title}`);
    return prisma.module.findUnique({ where: { id: existing.id } });
  };
}

// Make a class's module list match `modules` (and their order) without
// touching the roster — safe mid-term.
export async function syncClassModules(prisma, classId, modules) {
  await prisma.classModule.deleteMany({
    where: { classId, moduleId: { notIn: modules.map((m) => m.id) } },
  });
  for (let i = 0; i < modules.length; i++) {
    const existing = await prisma.classModule.findFirst({
      where: { classId, moduleId: modules[i].id },
    });
    if (existing) await prisma.classModule.update({ where: { id: existing.id }, data: { order: i } });
    else await prisma.classModule.create({ data: { classId, moduleId: modules[i].id, order: i } });
  }
}

// Sanity check: every checkpoint must reference an existing criterion label,
// and every evidence-backed criterion must have a checkpoint.
export async function checkCheckpoints(prisma, modules) {
  for (const mod of modules) {
    const blocks = JSON.parse(mod.contentJson);
    const criteria = await prisma.criterion.findMany({ where: { moduleId: mod.id } });
    const labels = new Set(criteria.map((c) => c.label));
    const checkpointLabels = blocks
      .filter((b) => b.type === "checkpoint")
      .map((b) => b.criterionLabel);
    for (const l of checkpointLabels) {
      if (!labels.has(l)) throw new Error(`"${mod.title}": checkpoint references missing criterion "${l}"`);
    }
    for (const c of criteria.filter((c) => c.requiresEvidenceType)) {
      if (!checkpointLabels.includes(c.label))
        throw new Error(`"${mod.title}": criterion "${c.label}" has no checkpoint`);
    }
  }
}
