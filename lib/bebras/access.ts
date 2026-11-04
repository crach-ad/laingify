import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { BEBRAS_TITLES, setForTitle, BEBRAS_TOPIC } from './challenges';
export async function bebrasAccess(requestedSet?:string|null){
 const session=await getSession();if(!session)return null;
 const roster=await prisma.rosterEntry.findUnique({where:{classId_learnerId:{classId:session.classId,learnerId:session.learnerId}}});if(!roster)return null;
 const assignments=await prisma.classModule.findMany({where:{classId:session.classId,module:{title:{in:BEBRAS_TITLES},topic:BEBRAS_TOPIC,org:{classes:{some:{id:session.classId}}}}},include:{module:true,class:true},orderBy:[{order:'asc'},{id:'asc'}]});
 const assignment=requestedSet?assignments.find(a=>setForTitle(a.module.title)===requestedSet):assignments[0];
 return assignment?{session,assignment,assignments,setId:setForTitle(assignment.module.title)}:null;
}
