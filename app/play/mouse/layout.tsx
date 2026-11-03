import { prisma } from '@/lib/db';
import { bebrasAccess } from '@/lib/bebras/access';
import MeadowTabs from './MeadowTabs';

export default async function MouseLayout({children}:{children:React.ReactNode}) {
  const access=await bebrasAccess();
  const mouseAssignment=access?await prisma.classModule.findFirst({where:{classId:access.session.classId,module:{title:'Mouse Meadow',topic:'Mouse Skills',orgId:access.assignment.class.orgId}},select:{id:true}}):null;
  return <>{access&&<MeadowTabs classPlay={!!mouseAssignment}/>} {children}</>;
}
