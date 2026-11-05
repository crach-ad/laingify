// Run with a private manifest and server environment; media and roster data stay out of Git.
// node --env-file=<private-env> scripts/import-pitch-videos.mjs <manifest.json> [--apply]
// Manifest: {classId, moduleId, criterionId, videos:[{learnerId, path, caption}]}
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('A reviewed manifest is required.');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();
const bucket = 'student-pitch-videos';
const digest = data => createHash('sha256').update(data).digest('hex');
const base = `${process.env.SUPABASE_URL}/storage/v1`;
const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
async function request(path, options = {}) {
  const response = await fetch(base + path, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`Storage ${response.status}: ${path}`);
  return response;
}
try {
  const { classId, moduleId, criterionId } = manifest;
  const klass = await prisma.class.findUnique({ where: { id: classId }, include: { org: true, roster: true, modules: true } });
  const criterion = await prisma.criterion.findUnique({ where: { id: criterionId }, include: { module: true } });
  if (klass?.org.name !== 'IgniteHer' || criterion?.module.orgId !== klass.orgId || criterion.moduleId !== moduleId || criterion.requiresEvidenceType !== 'VIDEO' || criterion.module.title !== 'Elevator Pitch Analysis' || !klass.modules.some(m => m.moduleId === moduleId)) throw new Error('Not an assigned IgniteHer pitch video activity.');
  if (!Array.isArray(manifest.videos) || !manifest.videos.length) throw new Error('No videos.');
  const videos = manifest.videos.map(v => {
    if (!klass.roster.some(r => r.learnerId === v.learnerId)) throw new Error('Student is not in this class.');
    const data = fs.readFileSync(v.path);
    if (!data.length || data.length > 50 * 1024 * 1024) throw new Error('Video must be under 50 MB.');
    const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', v.path]));
    if (!info.format.format_name.includes('mp4') || !info.streams.some(s => s.codec_type === 'video' && s.codec_name === 'h264') || !info.streams.some(s => s.codec_type === 'audio' && s.codec_name === 'aac')) throw new Error('Expected a browser-compatible MP4 with audio.');
    const hash = digest(data);
    const id = 'pitch-import-' + digest([classId, moduleId, criterionId, v.learnerId, hash].join(':')).slice(0, 40);
    const path = [v.learnerId, moduleId, criterionId, id].map(encodeURIComponent).join('/');
    return { ...v, id, path, hash, data };
  });
  if (new Set(videos.map(v => v.id)).size !== videos.length) throw new Error('Duplicate files for the same student.');
  console.log(JSON.stringify({ apply, videos: videos.map(({id,learnerId,caption,data}) => ({id,learnerId,caption,bytes:data.length})) }, null, 2));
  if (apply) {
    const config = await (await request(`/bucket/${bucket}`)).json();
    if (config.public !== false) throw new Error('Video bucket must be private.');
    // Upload and verify all objects before recording any evidence. Stable IDs
    // allow safe retry after interruption without duplicate takes or overwrites.
    for (const v of videos) {
      const existing = await fetch(`${base}/object/info/${bucket}/${v.path}`, { headers });
      if (!existing.ok) {
        if (![400,404].includes(existing.status)) throw new Error('Cannot check existing storage object.');
        await request(`/object/${bucket}/${v.path}`, { method: 'POST', headers: { 'Content-Type': 'video/mp4', 'x-upsert': 'false' }, body: v.data });
      }
      const stored = Buffer.from(await (await request(`/object/authenticated/${bucket}/${v.path}`)).arrayBuffer());
      if (digest(stored) !== v.hash) throw new Error('Stored video checksum mismatch.');
      console.log(`Verified ${v.caption}`);
    }
    await prisma.$transaction(async tx => {
      for (const v of videos) {
        const prior = await tx.evidence.findUnique({ where: { id: v.id } });
        if (prior && (prior.learnerId !== v.learnerId || prior.moduleId !== moduleId || prior.criterionId !== criterionId || prior.type !== 'VIDEO')) throw new Error('Evidence ID collision.');
        await tx.evidence.upsert({ where: { id: v.id }, update: {}, create: { id: v.id, learnerId: v.learnerId, moduleId, criterionId, type: 'VIDEO', url: `/api/evidence/video/${v.id}`, caption: v.caption } });
        await tx.criterionStatus.upsert({ where: { learnerId_criterionId: { learnerId: v.learnerId, criterionId } }, create: { learnerId: v.learnerId, criterionId, status: 'MET', decidedBy: 'system' }, update: { status: 'MET', decidedBy: 'system' } });
        await tx.moduleProgress.upsert({ where: { learnerId_moduleId: { learnerId: v.learnerId, moduleId } }, create: { learnerId: v.learnerId, moduleId, status: 'IN_PROGRESS' }, update: {} });
        const project = await tx.project.findUnique({ where: { learnerId_moduleId: { learnerId: v.learnerId, moduleId } } });
        if (project) await tx.project.update({ where: { id: project.id }, data: { evidenceJson: JSON.stringify([...new Set([...JSON.parse(project.evidenceJson), v.id])]) } });
      }
    }, { timeout: 60000 });
    // Reflection is deliberately untouched: supplying footage does not mean
    // the student has watched it, reflected, or earned the completion badge.
    const count = await prisma.evidence.count({ where: { id: { in: videos.map(v => v.id) } } });
    if (count !== videos.length) throw new Error('Import verification failed.');
    fs.writeFileSync(manifestPath + '.receipt.json', JSON.stringify({ classId, moduleId, criterionId, importedAt: new Date(), videos: videos.map(({id,learnerId,caption,hash,path}) => ({id,learnerId,caption,hash,path})) }, null, 2), { mode: 0o600 });
    console.log(`Imported ${count} videos for ${new Set(videos.map(v => v.learnerId)).size} students.`);
  }
} finally { await prisma.$disconnect(); }
