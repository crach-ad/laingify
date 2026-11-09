import { runnerPoints, type RunnerScore } from "./dragon-runner.ts";
export const EMBER_TITLE="Ember Jet: Hangar Escape";
export const ZONES=[
 {name:"Hangar 07",start:0,sky:"#14334a",floor:"#34465f",rail:"#67ffea",description:"Learn to fly"},
 {name:"Reactor Core",start:400,sky:"#3b183d",floor:"#51405c",rail:"#ff85be",description:"Keep your cool"},
 {name:"Crystal Caverns",start:900,sky:"#153a39",floor:"#345556",rail:"#b3ff82",description:"Find your flow"},
];
export function zoneAt(distance:number){return distance>=900?2:distance>=400?1:0;}
export const MISSIONS=[
 {id:"first-flight",label:"First flight",metric:"distance",target:100},
 {id:"coin-scout",label:"Coin scout",metric:"apples",target:12},
 {id:"steady-hands",label:"Steady hands",metric:"combo",target:6},
 {id:"reactor-pilot",label:"Reach the reactor",metric:"distance",target:400},
 {id:"gold-rush",label:"Collect 30 coins",metric:"apples",target:30},
 {id:"chain-reaction",label:"12-coin chain",metric:"combo",target:12},
 {id:"cavern-explorer",label:"Reach the caverns",metric:"distance",target:900},
 {id:"treasure-hunter",label:"Collect 60 coins",metric:"apples",target:60},
 {id:"skykeeper",label:"Fly 1,500 metres",metric:"distance",target:1500},
] as const;
export function earnedMissions(score:Pick<RunnerScore,"distance"|"apples"|"combo">){return MISSIONS.filter(m=>score[m.metric]>=m.target).map(m=>m.id);}
export type FlightPattern={name:string;coinY:number;beams:{offset:number;y:number;angle:number;length:number;spin:number}[]};
const beam=(y:number,angle:number,length:number,spin=0,offset=0)=>({y,angle,length,spin,offset});
export const FLIGHT_PATTERNS:FlightPattern[]=[
 {name:"Low sweep",coinY:7,beams:[beam(2,.25,4)]},
 {name:"High gate",coinY:2,beams:[beam(7.7,Math.PI/2,3)]},
 {name:"Centre bar",coinY:8,beams:[beam(4.8,0,4)]},
 {name:"Low pillar",coinY:7,beams:[beam(2.5,Math.PI/2,3.4)]},
 {name:"Ceiling sweep",coinY:2,beams:[beam(8,-.25,4)]},
 {name:"Rising diagonal",coinY:2,beams:[beam(6.5,.7,4)]},
 {name:"Reactor rotor",coinY:8,beams:[beam(3.3,0,3,.5)]},
 {name:"Falling diagonal",coinY:7.8,beams:[beam(3,-.7,4)]},
 {name:"High rotor",coinY:2,beams:[beam(7,0,3,-.65)]},
 {name:"Twin floor bars",coinY:7,beams:[beam(2,0,3,0,-2),beam(3.5,0,3,0,3)]},
 {name:"Crystal passage",coinY:5,beams:[beam(1.5,0,3.5),beam(8.5,0,3.5)]},
 {name:"Double ceiling",coinY:2,beams:[beam(7,0,3,0,-2),beam(8,0,3,0,3)]},
];
export function patternAt(row:number){return FLIGHT_PATTERNS[row%FLIGHT_PATTERNS.length];}
export function validFlightResult(value:unknown,mode:string,wallMs:number){
 if(!value||typeof value!=="object")return false;const s=value as RunnerScore;
 if(![s.distance,s.apples,s.combo,s.score,s.elapsed].every(Number.isSafeInteger)||!["cruise","rush"].includes(mode))return false;
 const seconds=s.elapsed/1000,maxSpeed=mode==="rush"?20:16;
 return s.elapsed>=1&&s.elapsed<=wallMs+2000&&s.elapsed<=3600000&&s.distance>=0&&s.distance<=Math.ceil(seconds*maxSpeed)+2&&s.apples>=0&&s.apples<=Math.ceil(s.distance/25)*6+12&&s.combo>=0&&s.combo<=s.apples&&s.score===runnerPoints(s.distance,s.apples,s.combo);
}
