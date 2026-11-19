import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function load(path,deps={}){const output=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const exports={};new Function('require','exports',output)(name=>name in deps?deps[name]:name.startsWith('@/')?{__esModule:true,default:()=>null}:require(name),exports);return exports.default;}
const AssemblyStep=load('../components/AssemblyStep.tsx');
const Tutorial=load('../app/learn/[moduleId]/Tutorial.tsx',{'@/components/AssemblyStep':{__esModule:true,default:AssemblyStep},'motion/react':{motion:new Proxy({},{get:(_,tag)=>({children})=>React.createElement(tag,null,children)})}});
const assembly={type:'assembly',text:'Fit the bracket',urls:['/tutorial/picar-pro/page-02.jpg','/tutorial/picar-pro/page-03.jpg'],sourcePages:[2,3],sourceUrl:'/tutorial/picar-pro/assembly-manual.pdf',materials:['M3 screw'],actions:['Align the holes','Fit the screw']};
function render(extra={}){return renderToStaticMarkup(React.createElement(Tutorial,{moduleId:'test',badge:{name:'Builder',icon:'🔧'},blocks:[assembly,{...assembly,text:'Fit the second bracket'},{type:'checkpoint',criterionLabel:'Photo',capture:'photo'}],criteria:[{id:'photo',label:'Photo',status:'NOT_STARTED'}],evidence:[],initialComplete:false,hasSubmission:false,...extra}));}
test('assembly tutorial renders original diagrams, controls, parts and actions rather than text fallback',()=>{const html=render();for(const value of ['page-02.jpg','Next diagram','Enlarge assembly diagram','M3 screw','Align the holes','Fit the screw'])assert.ok(html.includes(value),value);});
test('physical builds resume the recorded visual card even before the first checkpoint',()=>{const html=render({initialStep:1});assert.ok(html.includes('Fit the second bracket'));assert.ok(html.includes('page-02.jpg'));});
test('missing or invalid resume history starts with the first visual card',()=>{for(const initialStep of [undefined,-2,NaN])assert.ok(render({initialStep}).includes('Fit the bracket'));});
