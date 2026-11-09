import {redirect,notFound} from "next/navigation";
import {getSession} from "@/lib/session";
import {emberContext} from "@/lib/ember-context";
import DragonDrop from "./DragonDrop";
export const dynamic="force-dynamic";
export const metadata={title:"Ember Jet · Hangar Escape",description:"Fly through three 3D worlds, complete missions, and practise mouse control with your class."};
export default async function Page(){
 if(process.env.NODE_ENV!=="production"&&process.env.DRAGON_DROP_LOCAL==="1")return <DragonDrop localDemo/>;
 if(!await getSession())redirect("/join");
 const ctx=await emberContext();if(!ctx)notFound();
 return <DragonDrop scope={ctx.scope} returnHref="/learn/topic/mouse-skills"/>;
}
