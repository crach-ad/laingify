import { getInstructor } from '@/lib/instructor';
import { ReflectionConflict, reopenReflection } from '@/lib/reflection-rewrite';

export async function POST(req: Request) {
  const auth = await getInstructor();
  if (!auth) return Response.json({ error: 'Sign in as an instructor.' }, { status: 401 });
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  const expectedOrigin = `${url.protocol}//${req.headers.get('host') || url.host}`;
  if (origin && origin !== expectedOrigin) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !['learnerId', 'moduleId', 'submissionId'].every(k => typeof body[k] === 'string' && body[k].length > 0 && body[k].length < 200)) {
    return Response.json({ error: 'Select a reflection to reopen.' }, { status: 400 });
  }
  try {
    const result = await reopenReflection({ learnerId: body.learnerId, moduleId: body.moduleId, submissionId: body.submissionId, instructorId: auth.instructor.id, orgIds: auth.orgIds });
    if ('forbidden' in result) return Response.json({ error: 'You cannot reopen this reflection. It must belong to an assigned module in a WSR class you manage.' }, { status: 403 });
    return Response.json({ ok: true, alreadyReopened: result.alreadyReopened, awaitingRewrite: !result.request.fulfilledAt });
  } catch (error) {
    if (error instanceof ReflectionConflict) return Response.json({ error: error.message }, { status: 409 });
    console.error('Reopen reflection failed', error instanceof Error ? error.name : 'Unknown');
    return Response.json({ error: 'Could not reopen the reflection. Please try again.' }, { status: 500 });
  }
}
