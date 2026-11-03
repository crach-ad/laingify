// Additive only. Preview by default; --apply assigns without resetting any work.
// node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs [--apply]
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
const prisma=new PrismaClient();const content=JSON.parse(await readFile(new URL('../lib/bebras/content.json',import.meta.url),'utf8'));
try{
 const org=await prisma.org.findFirst({where:{name:'KCSB Computing'},include:{classes:true}});if(!org)throw Error('KCSB Computing was not found.');
 const classes=org.classes.filter(c=>/^(?:year\s*6\b|yr\s*6(?:\b|[a-z]$))/i.test(c.name)||c.classCode==='KCSB-6');if(!classes.length)throw Error('No KCSB Year 6 classes matched.');
 console.log(JSON.stringify({organization:org.name,classes:classes.map(c=>({id:c.id,name:c.name,code:c.classCode})),challenges:content.length,apply:process.argv.includes('--apply')}));
 if(process.argv.includes('--apply')){
  const mod=await prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'bebras-rollout:'+org.id}))`;
   const existing=await tx.module.findFirst({where:{orgId:org.id,title:'Bebras Juniors 2025'}});
   const data={orgId:org.id,title:'Bebras Juniors 2025',summary:'15 computational-thinking challenges. Save and revisit answers, record completion time without a cutoff, and review results after finishing.',topic:'Computational Thinking',board:'',badgeName:'Bebras Explorer',badgeIcon:'🧩',badgeDescription:'Explore all 15 Junior challenges.',contentJson:JSON.stringify([{type:'text',text:'Complete the 15 UK Bebras 2025 Junior challenges in their original order. Move between questions, save your answers, and finish to see your results. Completion time is recorded without a cutoff.'},{type:'link',text:'Open the challenge sequence',url:'/play/mouse/bebras'}])};
   const mod=existing?await tx.module.update({where:{id:existing.id},data}):await tx.module.create({data});
   for(const [i,c] of content.entries()){
    const criterion=await tx.criterion.findFirst({where:{moduleId:mod.id,label:c.title}});const d={moduleId:mod.id,label:c.title,description:c.skills.join(', '),order:i,checkType:'AUTO',required:true};
    if(criterion)await tx.criterion.update({where:{id:criterion.id},data:d});else await tx.criterion.create({data:d});
   }
   for(const c of classes){const last=await tx.classModule.aggregate({where:{classId:c.id},_max:{order:true}});await tx.classModule.upsert({where:{classId_moduleId:{classId:c.id,moduleId:mod.id}},update:{},create:{classId:c.id,moduleId:mod.id,order:(last._max.order??-1)+1}});}
   return mod;
  },{timeout:30000});
  const assigned=await prisma.classModule.findMany({where:{moduleId:mod.id,classId:{in:classes.map(c=>c.id)}},select:{class:{select:{name:true,classCode:true}},moduleId:true}});
  if(assigned.length!==classes.length)throw Error('Assignment verification failed.');console.log(JSON.stringify({verified:true,assignments:assigned}));
 }
}catch(e){console.error(e.message);process.exitCode=1;}finally{await prisma.$disconnect()}
