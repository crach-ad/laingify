export const FLOOR = .85;
export const CEILING = 9.1;
export function flightStep(y:number, velocity:number, boosting:boolean, dt:number) {
 const step=Math.min(.05,Math.max(0,dt));
 const nextVelocity=Math.max(-7,Math.min(6.5,velocity+(boosting?19:-12)*step));
 const nextY=Math.max(FLOOR,Math.min(CEILING,y+nextVelocity*step));
 return { y:nextY, velocity:nextY===FLOOR||nextY===CEILING?0:nextVelocity };
}
export function beamCollision(px:number,py:number,x:number,y:number,angle:number,length:number,radius=.65){
 const dx=Math.cos(angle)*length/2,dy=Math.sin(angle)*length/2;
 const ax=x-dx,ay=y-dy,bx=x+dx,by=y+dy;
 const t=Math.max(0,Math.min(1,((px-ax)*(bx-ax)+(py-ay)*(by-ay))/(length*length)));
 return Math.hypot(px-(ax+t*(bx-ax)),py-(ay+t*(by-ay)))<radius;
}

export const DRAGON_COLORS = [
 {id:"ember",name:"Ember",body:"#f58f48",head:"#ffb76a",wings:"#78cbb2",accent:"#ffda94"},
 {id:"ocean",name:"Ocean",body:"#328ee5",head:"#75c5ff",wings:"#93e9dc",accent:"#c1eeff"},
 {id:"orchid",name:"Orchid",body:"#9960d6",head:"#cb9bfa",wings:"#f2a9d5",accent:"#f0d6ff"},
 {id:"mint",name:"Mint",body:"#37b992",head:"#7ce8b9",wings:"#9ab9ff",accent:"#daffba"},
 {id:"rose",name:"Rose",body:"#e15b91",head:"#ff9cbe",wings:"#c1acff",accent:"#ffe0ce"},
 {id:"storm",name:"Storm",body:"#637993",head:"#a4bbd1",wings:"#67e1ed",accent:"#e0f3fa"},
] as const;
export function dragonColor(id:string){return DRAGON_COLORS.find(c=>c.id===id)||DRAGON_COLORS[0];}
