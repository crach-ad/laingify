import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { BEBRAS_TITLE, BEBRAS_TOPIC } from './challenges';
export async function bebrasAccess(){
 const session=await getSession();if(!session)return null;
 const roster=await prisma.rosterEntry.findUnique({where:{classId_learnerId:{classId:session.classId,learnerId:session.learnerId}}});if(!roster)return null;
 const assignment=await prisma.classModule.findFirst({where:{classId:session.classId,module:{title:BEBRAS_TITLE,topic:BEBRAS_TOPIC,org:{classes:{some:{id:session.classId}}}}},include:{module:true,class:true}});
 return assignment?{session,assignment}:null;
}
