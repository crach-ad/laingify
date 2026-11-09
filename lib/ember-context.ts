import {prisma} from "@/lib/db";
import {getSession} from "@/lib/session";
import {EMBER_TITLE} from "@/lib/ember-jet";
export async function emberContext(){
 const session=await getSession();
 if(!session||typeof session.classId!=="string"||typeof session.learnerId!=="string")return null;
 const roster=await prisma.rosterEntry.findUnique({where:{classId_learnerId:{classId:session.classId,learnerId:session.learnerId}},select:{class:{select:{orgId:true}}}});
 if(!roster)return null;
 const assignment=await prisma.classModule.findFirst({where:{classId:session.classId,module:{orgId:roster.class.orgId,title:EMBER_TITLE}},select:{moduleId:true}});
 return assignment?{...session,moduleId:assignment.moduleId,scope:`${session.classId}:${session.learnerId}`}:null;
}
