import { notFound } from 'next/navigation';
import { requireInstructor } from '@/lib/instructor';
import { prisma } from '@/lib/db';
import { setForTitle, BEBRAS_TITLES } from '@/lib/bebras/challenges';
import { results } from '@/lib/bebras/scoring';
import BebrasGame from '@/app/play/bebras/BebrasGame';
export default async function Preview({params,searchParams}:{params:Promise<{classId:string}>;searchParams:Promise<{set?:string}>}){const {classId}=await params;const {orgIds}=await requireInstructor();const klass=await prisma.class.findFirst({where:{id:classId,orgId:{in:orgIds}},include:{modules:{where:{module:{title:{in:BEBRAS_TITLES}}},include:{module:true}}}});if(!klass)notFound();const requested=(await searchParams).set;const selected=requested?klass.modules.find(a=>setForTitle(a.module.title)===requested):[...klass.modules].sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id))[0];if(!selected)notFound();const setId=setForTitle(selected.module.title);return <BebrasGame key={setId} className={klass.name} setId={setId} previewExpected={results({},setId)}/>;}
