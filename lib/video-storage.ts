// Private object storage; only the server receives the service-role key.
export const VIDEO_BUCKET = 'student-pitch-videos';
export const VIDEO_LIMIT = 50 * 1024 * 1024;
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export function videoConfig() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Video storage is not configured.');
  return { base: base.replace(/\/$/, '') + '/storage/v1', key };
}
export async function storage(path: string, method = 'GET', body?: object) {
  const { base, key } = videoConfig();
  const r = await fetch(base + path, { method, cache: 'no-store', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error('Video storage request failed. Please try again.');
  return r.json();
}
export function objectPath(learner: string, module: string, criterion: string, id: string) {
  return [learner, module, criterion, id].map(encodeURIComponent).join('/');
}
