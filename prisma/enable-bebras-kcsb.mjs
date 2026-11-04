// Preview by default. --remove-keyboarding removes only class assignments, preserving all work.
// node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs --castors --class KCSB-4 --remove-keyboarding [--apply]
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
const year2024=process.argv.includes('--2024');
const castors=process.argv.includes('--castors');const title=year2024?'Bebras Juniors 2024':castors?'Bebras Castors 2025':'Bebras Juniors 2025';
const classIndex=process.argv.indexOf('--class');
const classCode=classIndex<0?null:process.argv[classIndex+1];
const removeKeyboarding=process.argv.includes('--remove-keyboarding');
if(classIndex>=0&&!/^KCSB-[1-8]$/.test(classCode??''))throw Error('Provide an exact --class KCSB-1 through KCSB-8.');
if(removeKeyboarding&&!classCode)throw Error('--remove-keyboarding requires an explicit --class.');
const keyboardTopics=['Keyboard Skills','Keyboarding Skills'];
const prisma=new PrismaClient();const content=JSON.parse(await readFile(new URL(year2024?'../lib/bebras/juniors-2024.json':castors?'../lib/bebras/castors.json':'../lib/bebras/content.json',import.meta.url),'utf8'));
try{
 const org=await prisma.org.findFirst({where:{name:'KCSB Computing'},include:{classes:true}});if(!org)throw Error('KCSB Computing was not found.');
 const classes=org.classes.filter(c=>classCode?c.classCode===classCode:year2024?['KCSB-6','KCSB-8'].includes(c.classCode):castors?c.classCode==='KCSB-3':/^(?:year\s*6\b|yr\s*6(?:\b|[a-z]$))/i.test(c.name)||c.classCode==='KCSB-6');if(!classes.length)throw Error('No matching KCSB classes found.');
 const keyboardAssignments=removeKeyboarding?await prisma.classModule.findMany({where:{classId:{in:classes.map(c=>c.id)},module:{orgId:org.id,topic:{in:keyboardTopics}}},select:{id:true,classId:true,moduleId:true,order:true,module:{select:{title:true,topic:true}}}}):[];
 console.log(JSON.stringify({removeKeyboarding:keyboardAssignments,organization:org.name,classes:classes.map(c=>({id:c.id,name:c.name,code:c.classCode})),challenges:content.length,apply:process.argv.includes('--apply')}));
 if(process.argv.includes('--apply')){
  const mod=await prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'bebras-rollout:'+org.id}))`;
   const existing=await tx.module.findFirst({where:{orgId:org.id,title}});
   const data={orgId:org.id,title,summary:`${content.length} computational-thinking challenges. Save and revisit answers, record completion time without a cutoff, and review results after finishing.`,topic:'Computational Thinking',board:'',badgeName:'Bebras Explorer',badgeIcon:'🧩',badgeDescription:`Explore all ${content.length} ${castors?'Castor':'Junior'} challenges.`,contentJson:JSON.stringify([{type:'text',text:`Complete the ${content.length} UK Bebras ${year2024?'2024':'2025'} ${castors?'Castor':'Junior'} challenges in their original order. Move between questions, save your answers, and finish to see your results. Completion time is recorded without a cutoff.`},{type:'link',text:'Open the challenge sequence',url:`/play/bebras?set=${year2024?'juniors-2024':castors?'castors':'juniors'}`}])};
   const mod=existing?await tx.module.update({where:{id:existing.id},data}):await tx.module.create({data});
   for(const [i,c] of content.entries()){
    const criterion=await tx.criterion.findFirst({where:{moduleId:mod.id,label:c.title}});const d={moduleId:mod.id,label:c.title,description:c.skills.join(', '),order:i,checkType:'AUTO',required:true};
    if(criterion)await tx.criterion.update({where:{id:criterion.id},data:d});else await tx.criterion.create({data:d});
   }
   for(const c of classes){const last=await tx.classModule.aggregate({where:{classId:c.id},_max:{order:true}});await tx.classModule.upsert({where:{classId_moduleId:{classId:c.id,moduleId:mod.id}},update:{},create:{classId:c.id,moduleId:mod.id,order:(last._max.order??-1)+1}});}
   if(removeKeyboarding)await tx.classModule.deleteMany({where:{id:{in:keyboardAssignments.map(a=>a.id)},classId:{in:classes.map(c=>c.id)}}});
   return mod;
  },{timeout:30000});
  const assigned=await prisma.classModule.findMany({where:{moduleId:mod.id,classId:{in:classes.map(c=>c.id)}},select:{class:{select:{name:true,classCode:true}},moduleId:true}});
  if(assigned.length!==classes.length)throw Error('Assignment verification failed.');const remaining=removeKeyboarding?await prisma.classModule.count({where:{classId:{in:classes.map(c=>c.id)},module:{topic:{in:keyboardTopics}}}}):0;if(remaining)throw Error('Keyboard assignment removal verification failed.');console.log(JSON.stringify({verified:true,assignments:assigned,removedKeyboardAssignments:keyboardAssignments.length}));
 }
}catch(e){console.error(e.message);process.exitCode=1;}finally{await prisma.$disconnect()}
