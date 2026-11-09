import {validSkills,mergeSkills,emptySkills,type SkillReport} from "@/lib/ember-skills";
import {prisma} from "@/lib/db";
import {emberContext} from "@/lib/ember-context";
import {earnedMissions,validFlightResult} from "@/lib/ember-jet";
import {rankRunnerScores,type RunnerScore} from "@/lib/dragon-runner";
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
function meta(raw:string):Record<string,unknown>{try{return JSON.parse(raw);}catch{return {};}}
const validName=(name:unknown):name is string=>typeof name==="string"&&/^[a-zA-Z0-9 _-]{2,20}$/.test(name);
export async function GET(req:Request){try{
 const ctx=await emberContext();if(!ctx)return json({error:"Sign in to a class with Ember Jet assigned."},401);
 const mode=new URL(req.url).searchParams.get("mode")||"cruise";if(!["cruise","rush"].includes(mode))return json({error:"Invalid flight mode."},400);
 const rows=await prisma.learnerEvent.findMany({where:{moduleId:ctx.moduleId,type:"ember_score",meta:{contains:`"classId":${JSON.stringify(ctx.classId)}`},learner:{roster:{some:{classId:ctx.classId}}}},select:{learnerId:true,meta:true}});
 const scores=rows.map(r=>({...meta(r.meta),playerId:r.learnerId})) as RunnerScore[];
 const profile=await prisma.learnerEvent.findUnique({where:{id:`ember-profile:${ctx.scope}`},select:{meta:true}});
 return json({scope:ctx.scope,nickname:profile?meta(profile.meta).nickname:"",skills:mergeSkills(scores.filter(s=>s.playerId===ctx.learnerId).map(s=>s.skills||emptySkills())),missions:[...new Set(scores.filter(s=>s.playerId===ctx.learnerId).flatMap(earnedMissions))],entries:rankRunnerScores(scores.filter(s=>s.mode===mode&&s.skills)).map((s,i)=>({id:String(i+1),nickname:s.nickname,mode:s.mode,distance:s.distance,apples:s.apples,combo:s.combo,score:s.score,elapsed:s.elapsed,skills:s.skills,you:s.playerId===ctx.learnerId}))});
 }catch{return json({error:"Your class leaderboard is unavailable. Please retry."},503);}}
export async function POST(req:Request){try{
 const origin=req.headers.get("origin"),url=new URL(req.url);const expected=`${url.protocol}//${req.headers.get("host")||url.host}`;
 if(!origin||origin!==expected)return json({error:"Save from the game's own page."},403);
 const ctx=await emberContext();if(!ctx)return json({error:"Sign in to a class with Ember Jet assigned."},401);
 const raw=await req.text();if(raw.length>4096)return json({error:"Request too large."},400);
 let body;try{body=JSON.parse(raw);}catch{return json({error:"Invalid request."},400);}
 if(!body||body.scope!==ctx.scope)return json({error:"This run belongs to a different class sign-in."},403);
 if(body.action==="start"){
  if(!validName(body.nickname)||!["cruise","rush"].includes(body.mode))return json({error:"Choose a nickname and flight mode."},400);
  const recent=await prisma.learnerEvent.count({where:{learnerId:ctx.learnerId,type:"ember_start",createdAt:{gte:new Date(Date.now()-60000)}}});if(recent>=12)return json({error:"Take a short break before starting again."},429);
  const id=crypto.randomUUID();
  await prisma.learnerEvent.upsert({where:{id:`ember-profile:${ctx.scope}`},create:{id:`ember-profile:${ctx.scope}`,learnerId:ctx.learnerId,moduleId:ctx.moduleId,type:"ember_profile",meta:JSON.stringify({nickname:body.nickname})},update:{meta:JSON.stringify({nickname:body.nickname})}});
  await prisma.learnerEvent.create({data:{id:`ember-start:${ctx.scope}:${id}`,learnerId:ctx.learnerId,moduleId:ctx.moduleId,type:"ember_start",meta:JSON.stringify({classId:ctx.classId,mode:body.mode,nickname:body.nickname})}});
  return json({id});
 }
 if(body.action!=="finish"||typeof body.id!=="string"||!/^[\w-]{8,80}$/.test(body.id))return json({error:"Invalid run."},400);
 const start=await prisma.learnerEvent.findUnique({where:{id:`ember-start:${ctx.scope}:${body.id}`}});if(!start||start.moduleId!==ctx.moduleId)return json({error:"Start a new flight from this class."},400);
 const started=meta(start.meta);
 if(typeof started.mode!=="string"||!validFlightResult(body,started.mode,Date.now()-start.createdAt.getTime()))return json({error:"This result is outside the flight limits."},400);
 if(body.skills!==undefined&&!validSkills(body.skills))return json({error:"Invalid mouse skill results."},400);
 const {distance,apples,combo,score,elapsed}=body;
 const result={id:body.id,classId:ctx.classId,nickname:started.nickname,mode:started.mode,distance,apples,combo,score,elapsed,skills:body.skills as SkillReport|undefined};
 const saved=await prisma.learnerEvent.upsert({where:{id:`ember-score:${ctx.scope}:${body.id}`},create:{id:`ember-score:${ctx.scope}:${body.id}`,learnerId:ctx.learnerId,moduleId:ctx.moduleId,type:"ember_score",meta:JSON.stringify(result)},update:{}});
 return json({ok:true,missions:earnedMissions(meta(saved.meta) as unknown as RunnerScore)});
 }catch{return json({error:"Could not save your flight. Keep this tab open and retry."},503);}}
