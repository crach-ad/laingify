import { notFound } from 'next/navigation';
import { requireInstructor } from '@/lib/instructor';
import { prisma } from '@/lib/db';
import { setForTitle, BEBRAS_TITLES } from '@/lib/bebras/challenges';
import { results } from '@/lib/bebras/scoring';
import BebrasGame from '@/app/play/bebras/BebrasGame';
export default async function Preview({params}:{params:Promise<{classId:string}>}){const {classId}=await params;const {orgIds}=await requireInstructor();const klass=await prisma.class.findFirst({where:{id:classId,orgId:{in:orgIds}},include:{modules:{where:{module:{title:{in:BEBRAS_TITLES}}},include:{module:true}}}});if(!klass)notFound();const setId=setForTitle(klass.modules[0]?.module.title??'');return <BebrasGame className={klass.name} setId={setId} previewExpected={results({},setId)}/>;}
