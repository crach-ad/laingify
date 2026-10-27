import { getSession } from '@/lib/session';
import MouseGame from './MouseGame';
export const metadata = { title: 'Mouse Meadow · Laingify', description: 'Grow mouse confidence with playful pointing, clicking and drag-and-drop challenges.' };
export default async function MousePage() {
  const session = await getSession();
  return <MouseGame signedIn={!!session} />;
}
