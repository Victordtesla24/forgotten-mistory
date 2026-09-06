// Definitive G-A3 measurement: does the about-field GL shader RESPOND to the
// active dimension, and is the gold accent absent from the shader?
// The site gates the GL scenes off under software rendering; ?gl=force mounts
// the field canvas so the shader itself can be measured (same lever the
// project's own flagship-visibility harness relies on).
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const EXE = '/opt/ms-playwright/chromium-1234/chrome-linux64/chrome';
const OUT = new URL('.', import.meta.url).pathname;
const LIVE = 'https://forgotten-mistory.web.app/?gl=force#about';

const GOLDS = [[0xc9,0xa8,0x4c],[0xd4,0xb6,0x5c],[0xe8,0xd5,0xa3]];
function goldStats(png){let opq=0,gold=0;const{data,width,height}=png;for(let i=0;i<width*height;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2],a=data[i*4+3];if(a<24)continue;opq++;for(const[gr,gg,gb]of GOLDS){if(Math.abs(r-gr)<28&&Math.abs(g-gg)<28&&Math.abs(b-gb)<28){gold++;break;}}}return{opq,gold,goldFrac:opq?gold/opq:0};}
function diffFrac(a,b){const n=Math.min(a.data.length,b.data.length)/4;let d=0;for(let i=0;i<n;i++){const s=Math.abs(a.data[i*4]-b.data[i*4])+Math.abs(a.data[i*4+1]-b.data[i*4+1])+Math.abs(a.data[i*4+2]-b.data[i*4+2])+Math.abs(a.data[i*4+3]-b.data[i*4+3]);if(s>24)d++;}return d/n;}

const b = await chromium.launch({ executablePath: EXE, headless: true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errors=[]; p.on('pageerror',e=>errors.push(String(e).slice(0,160)));
await p.goto(LIVE,{waitUntil:'networkidle',timeout:60000});
const buildCommit = await p.$eval('meta[name="build-commit"]',m=>m.getAttribute('content')).catch(()=>null);
await p.evaluate(()=>document.querySelector('#about')?.scrollIntoView({block:'center'}));
await p.waitForTimeout(1500);

const canvas = await p.waitForSelector('[data-scene="about-field"] canvas',{timeout:20000}).catch(()=>null);
const glLive = await p.evaluate(()=>{const c=document.querySelector('[data-scene="about-field"] canvas');if(!c)return{canvas:false};const g=c.getContext('webgl2')||c.getContext('webgl');return{canvas:true,w:c.width,h:c.height,hasGL:!!g,lost:g?g.isContextLost():null};});

// Hide only the SVG compass chrome so the canvas screenshot is pure shader.
await p.addStyleTag({content:'[data-scene="about-field"] ~ svg,#about svg{opacity:0!important;visibility:hidden!important}'});
await p.waitForTimeout(200);

const readAxis=()=>p.evaluate(()=>document.querySelector('#about [data-axis]')?.getAttribute('data-axis')??null);
const shots=[];
async function snap(label){
  await p.waitForTimeout(1300); // ramp-in 0.72s + rotation ease ~0.72s
  const axis=await readAxis();
  const file=`${OUT}gl-${label}.png`;
  const buf= canvas ? await canvas.screenshot({path:file}) : await p.screenshot({path:file});
  const png=PNG.sync.read(buf);
  const gs=goldStats(png);
  shots.push({label,axis,file:file.split('/').pop(),w:png.width,h:png.height,...gs});
  return png;
}
await p.mouse.move(5,5);
const rest=await snap('rest');
const lis=await p.$$('#about ol li');
const picks=[0,3,6,9].filter(i=>lis[i]);
const pngs={};
for(const i of picks){await lis[i].hover().catch(()=>{});pngs[i]=await snap(`hover-${i}`);}
await p.mouse.move(5,5);

const diffs=[];
for(const i of picks)diffs.push({pair:`rest->h${i}`,axisRest:'3',frac:+diffFrac(rest,pngs[i]).toFixed(4)});
for(let k=1;k<picks.length;k++)diffs.push({pair:`h${picks[0]}->h${picks[k]}`,frac:+diffFrac(pngs[picks[0]],pngs[picks[k]]).toFixed(4)});

const report={live:LIVE,buildCommit,glLive,itemCount:lis.length,shots,diffs,errors};
fs.writeFileSync(`${OUT}measure-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await b.close();
