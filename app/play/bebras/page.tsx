import { redirect } from 'next/navigation';
import { bebrasAccess } from '@/lib/bebras/access';
import BebrasGame from './BebrasGame';
export default async function BebrasPage(){const ctx=await bebrasAccess();if(!ctx)redirect('/join');return <BebrasGame className={ctx.assignment.class.name}/>;}
