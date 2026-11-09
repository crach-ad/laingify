"use client";
import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {initialRunnerStats,runnerPoints,type RunnerStats} from "@/lib/dragon-runner";
import {beamCollision,dragonColor} from "@/lib/dragon-flight";
import {ZONES,zoneAt,patternAt} from "@/lib/ember-jet";
import {createFlightSkills} from "./FlightSkills";
import {type MouseSkill,type SkillResult} from "@/lib/ember-skills";
import s from "./dragon.module.css";
type Props={focus:MouseSkill|"mixed";onSkill:(skill:MouseSkill,result:SkillResult)=>void;dragonId:string;run:number;mode:string;active:boolean;paused:boolean;onStats:(stats:RunnerStats)=>void;onEnd:(stats:RunnerStats)=>void;onEvent:(text:string)=>void};
export default function DragonWorld(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;const [error,setError]=useState(false);
 useEffect(()=>{
 const container=host.current;if(!container)return;const palette=dragonColor(props.dragonId);
 let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color("#14334a");scene.fog=new THREE.Fog("#14334a",55,110);
 const camera=new THREE.PerspectiveCamera(43,1,.1,150);camera.position.set(4,7,22);camera.lookAt(2,4.8,0);
 scene.add(new THREE.HemisphereLight(0xb7f6ff,0x192341,2.8));const light=new THREE.DirectionalLight(0xffdeb4,3);light.position.set(-8,16,12);light.castShadow=true;Object.assign(light.shadow.camera,{left:-20,right:20,top:15,bottom:-15});light.shadow.mapSize.set(1024,1024);scene.add(light);
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[];
 function mesh(geo:THREE.BufferGeometry,color:string,x:number,y:number,z:number,parent:THREE.Object3D=scene,glow=false){geometries.push(geo);const mat=new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.15,flatShading:true,...(glow?{emissive:color,emissiveIntensity:1.7}:{})});materials.push(mat);const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!glow;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w:number,h:number,d:number,c:string,x:number,y:number,z:number,p:THREE.Object3D=scene,glow=false)=>mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,p,glow);
 // A deep, open-sided research hangar: visible floor, rear windows and ceiling trusses.
 const panels:THREE.Group[]=[];
 for(let i=0;i<15;i++){const g=new THREE.Group();g.position.x=-30+i*8;scene.add(g);panels.push(g);
  box(7.95,.45,9,"#34465f",0,-.35,0,g);box(7.95,.35,9,"#26384d",0,10.6,0,g);
  box(.16,.025,9,"#72899b",3.9,-.1,0,g);box(8,.1,.13,"#67ffea",0,.05,3.6,g,true);box(8,.1,.13,"#5df5f0",0,10.35,3.6,g,true);
  box(.4,11,.45,"#52617b",0,5,-4.4,g);box(7.6,.5,.4,"#556c81",4,2,-4.5,g);box(7.6,.3,.4,"#556c81",4,8.5,-4.5,g);
  const glass=box(7.4,6.1,.06,"#307f98",4,5.2,-4.7,g);const gm=glass.material as THREE.MeshStandardMaterial;gm.transparent=true;gm.opacity=.23;
  box(2.4,.12,1.1,"#c6fffb",3,10.1,0,g,true);
  box(2,1.4,.65,"#1c344c",1.8,.7,-3.5,g);box(1.4,.7,.04,"#54cfcc",1.8,.9,-3.14,g,true);
  for(let j=0;j<3;j++)box(.6,.025,.2,"#e7a961",-2+j*.85,-.1,2.6,g);
  mesh(new THREE.CylinderGeometry(.12,.12,8,8),"#e7ad6f",0,9.7,-3.5,g).rotation.z=Math.PI/2;
 }
 const skyline:THREE.Group[]=[];for(let i=0;i<18;i++){const g=new THREE.Group();g.position.x=-35+i*7;scene.add(g);skyline.push(g);box(4,4+i%5*2,4,"#254e66",0,1,-15-i%3*4,g);for(let j=0;j<3;j++)box(.35,.2,.1,"#55b8cf",j-1,3,-12.9-i%3*4,g,true);}
 mesh(new THREE.SphereGeometry(4,24,16),"#ffe1ae",27,15,-40,scene,true);
 // Original dragon with a twin-tank jetpack, goggles, flame and a smoke trail.
 const dragon=new THREE.Group();dragon.position.set(-5,4,0);dragon.rotation.y=Math.PI/2;scene.add(dragon);
 mesh(new THREE.SphereGeometry(.57,16,12),palette.body,0,0,0,dragon).scale.set(1,1.1,1.25);
 mesh(new THREE.SphereGeometry(.6,16,12),palette.head,0,.65,.35,dragon);
 mesh(new THREE.SphereGeometry(.37,12,10),palette.accent,0,.45,.89,dragon).scale.set(1,.7,1);
 const wings:THREE.Mesh[]=[];
 for(const side of [-1,1]){mesh(new THREE.SphereGeometry(.21,12,10),"#374455",side*.42,.76,.67,dragon);mesh(new THREE.SphereGeometry(.15,12,10),"#69edeb",side*.45,.77,.79,dragon);mesh(new THREE.ConeGeometry(.13,.45,5),"#fff2bc",side*.34,1.25,.15,dragon);mesh(new THREE.SphereGeometry(.2,10,8),palette.body,side*.4,-.5,.3,dragon);const wing=mesh(new THREE.ConeGeometry(.55,.9,3),palette.wings,side*.7,.02,-.1,dragon);wing.scale.z=.18;wing.rotation.z=side*1.4;wings.push(wing);mesh(new THREE.CylinderGeometry(.22,.22,.95,12),"#708a9c",side*.28,.05,-.68,dragon);mesh(new THREE.CylinderGeometry(.23,.15,.18,12),"#26364b",side*.28,-.5,-.68,dragon);}
 const tail=mesh(new THREE.ConeGeometry(.23,1.35,7),palette.body,0,-.3,-.9,dragon);tail.rotation.x=-1.9;
 const flame=new THREE.Group();flame.position.set(0,-.55,-.68);dragon.add(flame);for(const side of [-1,1]){const f=mesh(new THREE.ConeGeometry(.23,1.1,9),"#ffb34b",side*.28,-.5,0,flame,true);f.rotation.z=Math.PI;const core=mesh(new THREE.ConeGeometry(.12,.7,9),"#d7fffa",side*.28,-.27,0,flame,true);core.rotation.z=Math.PI;}
 const bubble=mesh(new THREE.SphereGeometry(1.15,20,16),"#54ffe0",0,.2,0,dragon);const bm=bubble.material as THREE.MeshStandardMaterial;bm.transparent=true;bm.opacity=.2;bm.depthWrite=false;bubble.visible=false;
 const smoke=Array.from({length:25},()=>{const m=mesh(new THREE.IcosahedronGeometry(.18,1),"#bbd1da",0,0,0);(m.material as THREE.MeshStandardMaterial).transparent=true;m.visible=false;return {mesh:m,life:0};});let smokeCursor=0,smokeClock=0;
 type Item={group:THREE.Group;kind:"beam"|"coin"|"shield"|"missile";angle:number;spin:number;length:number;used:boolean};const items:Item[]=[];
 const coinGeo=new THREE.CylinderGeometry(.28,.28,.12,16),coinMat=new THREE.MeshStandardMaterial({color:"#ffd563",emissive:"#e9a326",emissiveIntensity:.6,metalness:.7,roughness:.2});geometries.push(coinGeo);materials.push(coinMat);
 const beamGeo=new THREE.CylinderGeometry(.1,.1,1,8),beamMat=new THREE.MeshStandardMaterial({color:"#ffaac5",emissive:"#ff235e",emissiveIntensity:3});geometries.push(beamGeo);materials.push(beamMat);
 const capGeo=new THREE.SphereGeometry(.29,12,10),capMat=new THREE.MeshStandardMaterial({color:"#535771",metalness:.7,roughness:.3});geometries.push(capGeo);materials.push(capMat);
 const shieldGeo=new THREE.OctahedronGeometry(.45),shieldMat=new THREE.MeshStandardMaterial({color:"#6cfff0",emissive:"#20e3cb",emissiveIntensity:1});geometries.push(shieldGeo);materials.push(shieldMat);
 const missileGeo=new THREE.ConeGeometry(.3,1.4,10),missileMat=new THREE.MeshStandardMaterial({color:"#ed6b68",emissive:"#ab213a",emissiveIntensity:.4});geometries.push(missileGeo);materials.push(missileMat);
 function add(kind:Item['kind'],x:number,y:number,angle=0,spin=0,length=3){const g=new THREE.Group();g.position.set(x,y,0);scene.add(g);
  if(kind==="beam"){const beam=new THREE.Mesh(beamGeo,beamMat);beam.rotation.z=Math.PI/2;beam.scale.y=length;g.add(beam);for(const side of [-1,1]){const cap=new THREE.Mesh(capGeo,capMat);cap.position.x=side*length/2;g.add(cap);}g.rotation.z=angle;}
  else{const m=new THREE.Mesh(kind==="coin"?coinGeo:kind==="shield"?shieldGeo:missileGeo,kind==="coin"?coinMat:kind==="shield"?shieldMat:missileMat);if(kind==="coin")m.rotation.x=Math.PI/2;if(kind==="missile")m.rotation.z=Math.PI/2;g.add(m);}
  items.push({group:g,kind,angle,spin,length,used:false});}
 let row=0;function spawn(x:number){const pattern=patternAt(row);for(const b of pattern.beams)add("beam",x+b.offset,b.y,b.angle,b.spin,b.length);for(let j=0;j<6;j++)add("coin",x+6+j*1.1,pattern.coinY+Math.sin(j*.7)*.25);if(row%5===3)add("shield",x+14,5);row++;}

 for(let x=15;x<90;x+=25)spawn(x);
 const warning=box(70,.04,.04,"#ff456b",12,4,.2,scene,true);warning.visible=false;
 const warningIcon=mesh(new THREE.OctahedronGeometry(.4),"#ff5069",9,4,.3,scene,true);warningIcon.visible=false;
 const decor=new THREE.Group();scene.add(decor);const reactors:THREE.Mesh[]=[];for(let i=0;i<5;i++){const ring=mesh(new THREE.TorusGeometry(2,.15,8,28),"#ff85be",i*9-10,5,-7,decor,true);reactors.push(ring);}const crystals:THREE.Mesh[]=[];for(let i=0;i<9;i++){const c=mesh(new THREE.OctahedronGeometry(1.4),"#88eeb4",i*6-15,1+(i%3)*2,-6,decor,true);c.scale.y=2;crystals.push(c);}reactors.forEach(m=>m.visible=false);crystals.forEach(m=>m.visible=false);let currentZone=0;
 let stats={...initialRunnerStats},elapsed=0,distance=0,velocity=0,boosting=false,targetY=4,ended=false,invincible=0,flash=0,lastTick=0,last=performance.now(),frame=0,nextSpawn=25,nextMissile=18,warningTime=0,warningY=4;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute("aria-label","Flight controls. Grab the dragon and drag up or down. Release to hover. Arrow keys are an alternative.");
 const flightSkills=createFlightSkills(scene,camera,container,canvas,{focus:()=>latest.current.focus,enabled:()=>latest.current.active&&!latest.current.paused&&!ended,onAttempt:(skill,result)=>latest.current.onSkill(skill,result),onReward:skill=>{if(skill==='right'||skill==='drag'){stats.shield=true;latest.current.onEvent(skill==='right'?'SHIELD DRONE ACTIVATED':'CRYSTAL DOCKED · SHIELD CHARGED');}else{for(const item of items)if(item.kind==='beam'||item.kind==='missile'){item.used=true;item.group.visible=false;}invincible=4;latest.current.onEvent(skill==='left'?'ORB BURST · LASERS CLEARED':'SIGNAL DECODED · SAFE PASSAGE');}}});
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let heldPointer:number|null=null,previousY=0;
 function down(e:PointerEvent){if(flightSkills.down(e))return;if(e.button!==0||!latest.current.active||latest.current.paused)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);if(!ray.intersectObject(dragon,true).length)return;boosting=true;heldPointer=e.pointerId;previousY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.focus();}
 function move(e:PointerEvent){if(flightSkills.move(e))return;if(heldPointer!==e.pointerId||latest.current.paused)return;targetY=THREE.MathUtils.clamp(targetY+(previousY-e.clientY)/container!.clientHeight*17,.85,9.1);previousY=e.clientY;}
 function up(e?:PointerEvent){if(e&&flightSkills.up(e,e.type==="pointercancel"||e.type==="lostpointercapture"))return;boosting=false;if(e&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);heldPointer=null;}
 function blur(){boosting=false;heldPointer=null;}
 function key(e:KeyboardEvent){if(!["ArrowUp","ArrowDown"].includes(e.code))return;e.preventDefault();if(latest.current.active&&!latest.current.paused)targetY=THREE.MathUtils.clamp(targetY+(e.code==="ArrowUp"?.65:-.65),.85,9.1);}
 canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("lostpointercapture",up);canvas.addEventListener("keydown",key);window.addEventListener("blur",blur);
 const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,w<760?1.5:2));renderer.shadowMap.enabled=w>=760;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w/h<1?37:22;camera.fov=w/h<1?47:43;camera.lookAt(2,4.8,0);camera.updateProjectionMatrix();});resize.observe(container);
 function snapshot(){return {...stats,distance:Math.floor(distance),elapsed:Math.max(1,Math.floor(elapsed*1000)),score:runnerPoints(Math.floor(distance),stats.apples,stats.combo)};}
 function hit(){if(invincible>0)return;if(stats.shield){stats.shield=false;latest.current.onEvent("SHIELD ABSORBED THE HIT");}else{stats.hearts--;stats.chain=0;flash=.35;latest.current.onEvent(stats.hearts?"ZAPPED! Keep flying.":"FLIGHT COMPLETE");}invincible=1.7;if(stats.hearts<=0){ended=true;latest.current.onStats(snapshot());latest.current.onEnd(snapshot());}}
 function animate(now:number){frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;const p=latest.current,running=p.active&&!p.paused&&!ended,idle=!p.active&&!ended;const time=now/1000;
  if(idle)dragon.position.x=6;else if(running)dragon.position.x=-5;
  if(p.paused||!p.active)boosting=false;
  if(running){elapsed+=dt;stats.speed=Math.min(p.mode==="rush"?20:16,(p.mode==="rush"?10:7)+elapsed*.065);distance+=stats.speed*dt;const zi=zoneAt(distance);if(zi!==currentZone){currentZone=zi;const zone=ZONES[zi];scene.background=new THREE.Color(zone.sky);if(scene.fog instanceof THREE.Fog)scene.fog.color.set(zone.sky);for(const panel of panels)panel.traverse(obj=>{if(obj instanceof THREE.Mesh){const mat=obj.material as THREE.MeshStandardMaterial;if(mat.emissiveIntensity>1)mat.emissive.set(zone.rail);else mat.color.lerp(new THREE.Color(zone.floor),.45);}});reactors.forEach(m=>m.visible=zi===1);crystals.forEach(m=>m.visible=zi===2);p.onEvent(`ZONE ${zi+1} · ${zone.name.toUpperCase()}`);}const previousHeight=dragon.position.y;dragon.position.y=THREE.MathUtils.damp(dragon.position.y,targetY,16,dt);velocity=dt?(dragon.position.y-previousHeight)/dt:0;invincible=Math.max(0,invincible-dt);flash=Math.max(0,flash-dt);if(distance>=nextSpawn){spawn(90);nextSpawn+=25;}
   if(elapsed>=nextMissile&&warningTime<=0){warningY=dragon.position.y;warningTime=1.8;nextMissile=elapsed+12;p.onEvent("MISSILE LOCK · CHANGE ALTITUDE!");}
   if(warningTime>0){warningTime-=dt;warning.position.y=warningY;warningIcon.position.y=warningY;if(warningTime<=0)add("missile",19,warningY);}
  }else if(idle)dragon.position.y=4+Math.sin(time*1.5)*.25;
  warning.visible=running&&warningTime>0&&Math.sin(time*20)>0;warningIcon.visible=running&&warningTime>0;
  const step=running?stats.speed*dt:idle?2*dt:0;panels.forEach(g=>{g.position.x-=step;if(g.position.x<-40)g.position.x+=120;});skyline.forEach(g=>{g.position.x-=step*.3;if(g.position.x<-45)g.position.x+=126;});
  if(!p.paused){reactors.forEach(r=>r.rotation.z+=dt*.3);crystals.forEach(c=>c.rotation.y+=dt*.2);dragon.rotation.z=THREE.MathUtils.damp(dragon.rotation.z,running?velocity*.035:0,5,dt);wings.forEach((w,i)=>w.rotation.z=(i===0?-1:1)*(1.3+Math.sin(time*(boosting?14:4))*.16));tail.rotation.z=Math.sin(time*4)*.1;}
  dragon.visible=invincible<=0||Math.floor(time*12)%2===0;bubble.visible=stats.shield;flame.visible=boosting&&running;flame.scale.y=.8+Math.sin(time*50)*.2;
  if(running&&boosting){smokeClock+=dt;if(smokeClock>.035){smokeClock=0;const puff=smoke[smokeCursor++%smoke.length];puff.life=.7;puff.mesh.position.set(-5.6,dragon.position.y-.7,0);puff.mesh.visible=true;}}
  for(const puff of smoke)if(puff.life>0&&!p.paused){puff.life-=dt;puff.mesh.position.x-=dt*3;puff.mesh.position.y-=dt*1.5;puff.mesh.scale.setScalar(1+(1-puff.life/.7)*2);(puff.mesh.material as THREE.MeshStandardMaterial).opacity=Math.max(0,puff.life/.7*.4);puff.mesh.visible=puff.life>0;}
  for(let i=items.length-1;i>=0;i--){const item=items[i],previousX=item.group.position.x;if(running){item.group.position.x-=step*(item.kind==="missile"?2.5:1);if(item.spin){item.angle+=dt*item.spin;item.group.rotation.z=item.angle;}if(item.kind==="coin")item.group.rotation.y+=dt*2;}
   const x=item.group.position.x,y=item.group.position.y;
   if(running&&!item.used){const collision=item.kind==="beam"?beamCollision(-5,dragon.position.y,x,y,item.angle,item.length,.75):Math.hypot((item.kind==="missile"?Math.max(x,Math.min(previousX,-5)):x)+5,y-dragon.position.y)<(item.kind==="missile"?.95:.8);
    if(collision){item.used=true;if(item.kind==="coin"){item.group.visible=false;stats.apples++;stats.chain++;stats.combo=Math.max(stats.combo,stats.chain);if(stats.chain%6===0)p.onEvent(`${stats.chain} COIN COMBO!`);}else if(item.kind==="shield"){item.group.visible=false;stats.shield=true;p.onEvent("SHIELD ONLINE");}else{hit();}}
   }
   if(x<-13){if(item.kind==="coin"&&!item.used)stats.chain=0;scene.remove(item.group);items.splice(i,1);}
  }
  camera.position.y=7+(flash>0?Math.sin(now*.08)*.12:0);if(running&&now-lastTick>100){p.onStats(snapshot());lastTick=now;}flightSkills.update(dt,running);renderer.render(scene,camera);
 }frame=requestAnimationFrame(animate);
 return()=>{cancelAnimationFrame(frame);flightSkills.dispose();resize.disconnect();canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("lostpointercapture",up);canvas.removeEventListener("keydown",key);window.removeEventListener("blur",blur);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();};
 },[props.run,props.dragonId]);
 return <div className={s.world} ref={host}>{error&&<p className={s.error}>WebGL is unavailable. Enable browser hardware acceleration to fly.</p>}</div>;
}
