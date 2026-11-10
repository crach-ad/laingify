import { getSession, getInstructorSession } from '@/lib/session';

export async function GET() {
  const [learner, instructor] = await Promise.all([getSession(), getInstructorSession()]);
  return Response.json({ learner: !!learner, instructor: !!instructor }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
