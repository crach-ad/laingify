import { notFound } from 'next/navigation';
import { requireInstructor } from '@/lib/instructor';
import { prisma } from '@/lib/db';
import { results } from '@/lib/bebras/scoring';
import BebrasGame from '@/app/play/bebras/BebrasGame';
export default async function Preview({params}:{params:Promise<{classId:string}>}){const {classId}=await params;const {orgIds}=await requireInstructor();const klass=await prisma.class.findFirst({where:{id:classId,orgId:{in:orgIds}}});if(!klass)notFound();return <BebrasGame className={klass.name} previewExpected={results({})}/>;}
