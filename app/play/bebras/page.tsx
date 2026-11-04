import { redirect } from 'next/navigation';
import Link from 'next/link';
import { bebrasAccess } from '@/lib/bebras/access';
import { challengesFor,setForTitle } from '@/lib/bebras/challenges';
import BebrasGame from './BebrasGame';
export const metadata={title:'Bebras challenges | Laingify'};
export default async function BebrasPage({searchParams}:{searchParams:Promise<{set?:string}>}){
  const {set}=await searchParams;
  const ctx=await bebrasAccess(set);
  if(!ctx)redirect('/join');
  if(!set&&ctx.assignments.length>1)return <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10"><Link href="/learn" className="muted">← Back to dashboard</Link><h1 className="mt-8 text-4xl font-semibold">Choose your Bebras challenge</h1><p className="muted mt-4">Each sequence saves its own progress and completion time. No time limit.</p><div className="mt-8 grid gap-6 md:grid-cols-2">{ctx.assignments.map(a=>{const id=setForTitle(a.module.title);return <Link key={a.id} href={`/play/bebras?set=${id}`} className="card card-interactive flex min-h-64 flex-col rounded-3xl p-8"><span aria-hidden className="text-5xl">🧩</span><h2 className="mt-6 text-2xl font-semibold">{a.module.title}</h2><p className="muted mt-3">{challengesFor(id).length} puzzles · Your pace</p><span className="mt-auto pt-6 font-semibold">Start or continue →</span></Link>})}</div></main>;
  return <BebrasGame key={ctx.setId} className={ctx.assignment.class.name} setId={ctx.setId} dashboardReturn={ctx.assignment.class.classCode.startsWith('KCSB-')}/>;
}
