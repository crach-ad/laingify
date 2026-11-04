import { redirect } from 'next/navigation';
export default async function LegacyBebrasPage({searchParams}:{searchParams:Promise<{set?:string}>}){const {set}=await searchParams;redirect('/play/bebras'+(set?'?set='+encodeURIComponent(set):''));}
