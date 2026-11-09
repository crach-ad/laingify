// Targets exactly the current Letter Leaper class assignments. Dry run by default.
import {PrismaClient} from '@prisma/client';
import {moduleWriter,checkCheckpoints} from './seed-lib.mjs';
import {createEmberModule,EMBER_TITLE} from './ember-jet-module.mjs';
const prisma=new PrismaClient();
try{
 const assignments=await prisma.classModule.findMany({where:{module:{title:'Letter Leaper: Moonbound'}},select:{class:{select:{id:true,orgId:true,name:true,classCode:true}},module:{select:{orgId:true}}}});
 const classes=[...new Map(assignments.filter(a=>a.class.orgId===a.module.orgId).map(a=>[a.class.id,a.class])).values()];
 if(!classes.length)throw Error('No Letter Leaper classes found; no changes made.');
 console.log(JSON.stringify({module:EMBER_TITLE,apply:process.argv.includes('--apply'),classes:classes.map(c=>({name:c.name,code:c.classCode}))}));
 if(process.argv.includes('--apply'))await prisma.$transaction(async tx=>{
  for(const orgId of new Set(classes.map(c=>c.orgId))){const write=moduleWriter(tx,{id:orgId},true);const mod=await createEmberModule(({blocks,criteria,...data})=>write({...data,contentJson:JSON.stringify(blocks),criteria:{create:criteria}}));await checkCheckpoints(tx,[mod]);for(const c of classes.filter(c=>c.orgId===orgId)){const last=await tx.classModule.aggregate({where:{classId:c.id},_max:{order:true}});await tx.classModule.upsert({where:{classId_moduleId:{classId:c.id,moduleId:mod.id}},create:{classId:c.id,moduleId:mod.id,order:(last._max.order??-1)+1},update:{}});}}
  console.log(JSON.stringify({assignedClasses:classes.length}));
 },{timeout:30000});
}finally{await prisma.$disconnect();}
