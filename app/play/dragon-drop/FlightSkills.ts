import * as THREE from "three";
import {SKILL_KEYS,selectedTextMatches,type MouseSkill,type SkillResult} from "@/lib/ember-skills";
import s from "./dragon.module.css";

// Interactive objects share the scene and camera with the dragon. HTML is used only
// for readable labels and real browser text selection on the floating signal panel.
export function createFlightSkills(scene:THREE.Scene,camera:THREE.Camera,host:HTMLElement,canvas:HTMLCanvasElement,options:{focus:()=>MouseSkill|"mixed";enabled:()=>boolean;onAttempt:(skill:MouseSkill,result:SkillResult)=>void;onReward:(skill:MouseSkill)=>void}){
 const group=new THREE.Group();scene.add(group);
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[];
 function object(geo:THREE.BufferGeometry,color:string){const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.5,metalness:.4,roughness:.25});geometries.push(geo);materials.push(mat);const m=new THREE.Mesh(geo,mat);group.add(m);return m;}
 const target=object(new THREE.IcosahedronGeometry(.7,1),'#ffd36c');
 const ring=object(new THREE.TorusGeometry(1,.13,12,32),'#6cfff0');
 const decoy=object(new THREE.OctahedronGeometry(.6),'#637b90');
 const panel=object(new THREE.BoxGeometry(5,1.65,.2),'#145968');
 const label=document.createElement('div');label.className=s.flightLabel;host.appendChild(label);
 const signal=document.createElement('p');signal.className=s.flightSignal;signal.tabIndex=0;signal.setAttribute('aria-label','Flying signal: highlight the requested words');host.appendChild(signal);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-1),point=new THREE.Vector3();
 let skill:MouseSkill='left',sequence=0,age=0,delay=1,live=false,dragging:number|null=null,dragStart={x:0,y:0},assisted=false,selecting=false,roundAttempts=0;
 const successes:Record<MouseSkill,number>={left:0,right:0,drag:0,highlight:0};
 let level=0,word='moon';
 function cast(x:number,y:number){const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
 function hits(m:THREE.Object3D){return ray.intersectObject(m,true).length>0;}
 function hide(){group.visible=false;label.hidden=true;signal.hidden=true;}
 function attempt(ok:boolean,alternative=false){if(!live||!options.enabled())return;roundAttempts++;if(ok)successes[skill]++;options.onAttempt(skill,{correct:ok?1:0,attempts:1,assisted:ok&&alternative?1:0,level:ok&&successes[skill]%3===0?Math.min(3,successes[skill]/3):0});if(ok){options.onReward(skill);live=false;dragging=null;delay=2;hide();window.getSelection()?.removeAllRanges();}}
 function spawn(){skill=options.focus()==='mixed'?SKILL_KEYS[sequence%4]:options.focus() as MouseSkill;sequence++;age=0;roundAttempts=0;level=Math.min(2,Math.floor(successes[skill]/3));live=true;group.visible=true;group.position.set(3,5.2,1);target.visible=skill!=='highlight';ring.visible=skill==='drag'||skill==='right';decoy.visible=skill==='left'&&level>0;panel.visible=skill==='highlight';target.position.set(skill==='drag'?-2:0,0,0);target.scale.setScalar(1-level*.16);ring.position.set(skill==='drag'?2:0,0,0);ring.scale.setScalar(skill==='drag'?1-level*.18:1.2);decoy.position.set(2,-1.8,0);panel.position.set(0,0,-.15);
  const color=skill==='left'?'#ffd36c':skill==='right'?'#61e9da':'#be8aff';(target.material as THREE.MeshStandardMaterial).color.set(color);(target.material as THREE.MeshStandardMaterial).emissive.set(color);
  const words=[['moon','wings','home'],['silver wings','crystal caves','northern star'],['follow the northern star','open the crystal passage','fly beyond the silver moon']];word=words[level][sequence%3];signal.textContent=`Signal: ${word} ahead`;signal.hidden=skill!=='highlight';label.hidden=false;label.textContent=({left:'LEFT CLICK · Burst the gold orb to clear lasers',right:'RIGHT CLICK · Activate the shield drone',drag:'DRAG & DROP · Carry the crystal into the ring',highlight:`HIGHLIGHT “${word}” · Open a safe passage`})[skill];
 }
 function down(e:PointerEvent){if(!live||!options.enabled())return false;cast(e.clientX,e.clientY);if(skill==='left'&&e.button===0&&(hits(target)||(decoy.visible&&hits(decoy)))){attempt(hits(target),e.pointerType!=='mouse');return true;}if(skill==='right'&&hits(target)){if(e.button===0){attempt(false);label.textContent='Use the RIGHT mouse button on the shield drone';}return true;}if(skill==='drag'&&e.button===0&&hits(target)){dragging=e.pointerId;dragStart={x:e.clientX,y:e.clientY};assisted=e.pointerType!=='mouse';canvas.setPointerCapture(e.pointerId);return true;}return false;}
 function move(e:PointerEvent){if(dragging!==e.pointerId||!options.enabled())return false;cast(e.clientX,e.clientY);if(ray.ray.intersectPlane(plane,point)){target.position.copy(group.worldToLocal(point.clone()));target.position.z=0;}return true;}
 function up(e:PointerEvent,cancel=false){if(dragging!==e.pointerId)return false;dragging=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(cancel){target.position.set(-2,0,0);return true;}cast(e.clientX,e.clientY);const moved=Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y)>12;const hit=ray.ray.intersectPlane(plane,point);const destination=ring.getWorldPosition(new THREE.Vector3());const ok=!!hit&&moved&&point.distanceTo(destination)<(.85-level*.15)*group.scale.x;attempt(ok,assisted);if(!ok)target.position.set(-2,0,0);return true;}
 function context(e:MouseEvent){if(!live||!options.enabled()||skill!=='right')return;cast(e.clientX,e.clientY);if(hits(target)||hits(ring)){e.preventDefault();attempt(true);}}
 function selectStart(e:PointerEvent){selecting=true;assisted=e.pointerType!=='mouse';}
 function selectEnd(){if(!selecting)return;selecting=false;if(!live||skill!=='highlight'||!options.enabled())return;const selection=window.getSelection();if(selection&&signal.contains(selection.anchorNode)&&signal.contains(selection.focusNode))attempt(selectedTextMatches(selection.toString(),word),assisted);}
 signal.addEventListener('pointerdown',selectStart);window.addEventListener('pointerup',selectEnd);canvas.addEventListener('contextmenu',context);
 function project(element:HTMLElement,position:THREE.Vector3){const p=position.clone().project(camera);element.style.left=`${(p.x+1)*host.clientWidth/2}px`;element.style.top=`${(1-p.y)*host.clientHeight/2}px`;}
 hide();
 return {down,move,up,update(dt:number,running:boolean){if(!running){hide();return;}if(!live){delay-=dt;if(delay<=0)spawn();return;}group.visible=true;group.scale.setScalar(host.clientWidth<760?1.6:1);label.hidden=false;signal.hidden=skill!=='highlight';age+=dt;
  // Drones pace the dragon; the hangar, hazards and distance continue moving.
  // Hold the signal's position during selection, never the game clock or scene.
  if(!selecting&&dragging===null){group.position.x=3+Math.sin(age*.3)*level*.4;group.position.y=5.2+Math.sin(age*.5)*level*.2;}
  target.rotation.y+=dt;decoy.rotation.y-=dt;ring.rotation.z+=dt*.4;
  project(label,group.localToWorld(new THREE.Vector3(0,1.8,0)));project(signal,panel.getWorldPosition(new THREE.Vector3()));
  if(age>24&&!selecting&&dragging===null){if(roundAttempts===0)attempt(false);live=false;delay=1;hide();}
 },dispose(){signal.removeEventListener('pointerdown',selectStart);window.removeEventListener('pointerup',selectEnd);canvas.removeEventListener('contextmenu',context);label.remove();signal.remove();scene.remove(group);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
