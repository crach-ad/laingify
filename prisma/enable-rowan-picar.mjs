// Additive setup. Preview first; --apply creates only Rowan's private class and its six lessons.
import { PrismaClient } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { moduleWriter, checkCheckpoints } from './seed-lib.mjs';
import { createPicarModules, picarModuleDefinitions } from './picar-pro-modules.mjs';
export const ROWAN_ORG_ID='laingify-private-lessons-crachad';
export const ROWAN_CLASS_CODE='ROWAN';
export const ROWAN_CLASS_NAME='Lessons with Rowan';
export const ROWAN_INSTRUCTOR_EMAIL='crachad.laing@gmail.com';
export const ROWAN_ALTERNATE_INSTRUCTOR_EMAIL='crachad@lainglaing.com';
export async function setupRowan(prisma,{apply=false}={}) {
  const instructor=await prisma.instructor.findUnique({where:{email:ROWAN_INSTRUCTOR_EMAIL},select:{id:true,displayName:true}});
  if (!instructor) throw new Error('The main Coach Crachad account could not be verified.');
  const alternate=await prisma.instructor.findUnique({where:{email:ROWAN_ALTERNATE_INSTRUCTOR_EMAIL},select:{id:true,displayName:true}});
  const instructorIds=[...new Set([instructor.id,...(alternate ? [alternate.id] : [])])];
  const existing=await prisma.class.findUnique({where:{classCode:ROWAN_CLASS_CODE},select:{id:true,orgId:true,name:true}});
  if (existing && (existing.orgId!==ROWAN_ORG_ID || existing.name!==ROWAN_CLASS_NAME)) throw new Error('ROWAN is already used by another class. No changes were made.');
  const plan={className:ROWAN_CLASS_NAME,classCode:ROWAN_CLASS_CODE,organization:'Private Lessons',instructor:ROWAN_INSTRUCTOR_EMAIL,lessons:picarModuleDefinitions().map(m=>m.title),apply};
  if (!apply) return plan;
  const result=await prisma.$transaction(async tx=>{
    const org=await tx.org.upsert({where:{id:ROWAN_ORG_ID},update:{},create:{id:ROWAN_ORG_ID,name:'Private Lessons',context:'community'}});
    // Preserve the instructor's home organization and all existing access.
    for (const id of instructorIds) await tx.instructor.update({where:{id},data:{accessOrgs:{connect:{id:org.id}}}});
    const klass=await tx.class.upsert({where:{classCode:ROWAN_CLASS_CODE},update:{},create:{orgId:org.id,name:ROWAN_CLASS_NAME,classCode:ROWAN_CLASS_CODE,band:'YOUTH',minAuthTier:1}});
    const modules=await createPicarModules(moduleWriter(tx,org,true));
    await checkCheckpoints(tx,modules);
    for (const [order,mod] of modules.entries()) await tx.classModule.upsert({where:{classId_moduleId:{classId:klass.id,moduleId:mod.id}},update:{},create:{classId:klass.id,moduleId:mod.id,order}});
    const enrolled=await tx.rosterEntry.findFirst({where:{classId:klass.id,learner:{displayName:'Rowan'}},select:{learnerId:true}});
    let learnerId=enrolled?.learnerId,initialPin;
    if (!enrolled) {
      initialPin=String(randomInt(1000,10000));
      const learner=await tx.learner.create({data:{displayName:'Rowan',band:'YOUTH',pin:initialPin,sprite:{create:{name:'Helper'}}}});
      learnerId=learner.id;
      await tx.rosterEntry.create({data:{classId:klass.id,learnerId:learner.id}});
    }
    return {classId:klass.id,learnerId,initialPin,modules:modules.map(m=>({id:m.id,title:m.title}))};
  },{timeout:60000});
  const count=await prisma.classModule.count({where:{classId:result.classId,moduleId:{in:result.modules.map(m=>m.id)}}});
  if(count!==6)throw new Error('The six lesson assignments could not be verified.');
  return {...plan,...result,verifiedAssignments:count};
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1],'file:').href) {
  const prisma=new PrismaClient();
  try { console.log(JSON.stringify(await setupRowan(prisma,{apply:process.argv.includes('--apply')}),null,2)); }
  catch(error){console.error(error instanceof Error ? error.message : 'Rowan setup failed.');process.exitCode=1;}
  finally{await prisma.$disconnect();}
}
