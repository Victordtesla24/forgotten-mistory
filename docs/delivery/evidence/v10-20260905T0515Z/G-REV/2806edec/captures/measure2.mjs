// Time-controlled measurement. The field animates on uTime, so a single-frame
// diff mixes shimmer with the dimension response. We average N frames per state
// (shimmer averages out; the rotation/lit-sector structure persists) and also
// capture a SAME-active baseline (animation-only floor). If cross-dimension
// mean-diffs sit well above the same-active floor, the shader provably tracks
// the active dimension.
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const EXE = '/opt/ms-playwright/chromium-1234/chrome-linux64/chrome';
const OUT = new URL('.', import.meta.url).pathname;
const LIVE = 'https://forgotten-mistory.web.app/?gl=force#about';
const GOLDS = [[0xc9,0xa8,0x4c],[0xd4,0xb6,0x5c],[0xe8,0xd5,0xa3]];

function meanImage(pngs){
  const w=pngs[0].width,h=pngs[0].height,acc=new Float64Array(w*h*4);
  for(const pg of pngs){const d=pg.data;const n=Math.min(d.length,acc.length);for(let i=0;i<n;i++)acc[i]+=d[i];}
  const out=new Uint8Array(w*h*4);for(let i=0;i<acc.length;i++)out[i]=Math.round(acc[i]/pngs.length);
  return {width:w,height:h,data:out};
}
function meanDiff(a,b){const n=Math.min(a.data.length,b.data.length);let s=0;for(let i=0;i<n;i+=4){s+=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);}return +(s/(n/4)).toFixed(2);}// mean abs RGB delta per pixel (0..765)
function goldFrac(pg){let opq=0,g=0;const d=pg.data;for(let i=0;i<d.length;i+=4){if(d[i+3]<24)continue;opq++;for(const[gr,gg,gb]of GOLDS){if(Math.abs(d[i]-gr)<28&&Math.abs(d[i+1]-gg)<28&&Math.abs(d[i+2]-gb)<28){g++;break;}}}return{opq,gold:g,goldFrac:opq?+(g/opq).toFixed(5):0};}
// Angle (deg, 0=up, cw) of the brightest-region centroid — the rotated pattern.
function brightAngle(pg){const{width:w,height:h,data:d}=pg;const cx=w/2,cy=h/2;let sx=0,sy=0,sw=0,max=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const l=(d[i]+d[i+1]+d[i+2])/3*(d[i+3]/255);if(l>max)max=l;}
  const thr=max*0.7;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const l=(d[i]+d[i+1]+d[i+2])/3*(d[i+3]/255);if(l>=thr){const wgt=l-thr;sx+=(x-cx)*wgt;sy+=(y-cy)*wgt;sw+=wgt;}}
  if(sw===0)return null;const mx=sx/sw,my=sy/sw;const ang=Math.atan2(mx,-my)*180/Math.PI;return{angleDeg:+ang.toFixed(1),radius:+Math.hypot(mx,my).toFixed(1),max:+max.toFixed(1)};}

const b=await chromium.launch({executablePath:EXE,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(LIVE,{waitUntil:'networkidle',timeout:60000});
const buildCommit=await p.$eval('meta[name="build-commit"]',m=>m.getAttribute('content')).catch(()=>null);
await p.evaluate(()=>document.querySelector('#about')?.scrollIntoView({block:'center'}));
await p.waitForTimeout(1500);
const canvas=await p.waitForSelector('[data-scene="about-field"] canvas',{timeout:20000}).catch(()=>null);
await p.addStyleTag({content:'#about svg{opacity:0!important;visibility:hidden!important}'});
await p.waitForTimeout(200);

async function frames(n){const arr=[];for(let k=0;k<n;k++){await p.waitForTimeout(160);const buf=await canvas.screenshot();arr.push(PNG.sync.read(buf));}return arr;}
async function state(label,hoverIdx){
  if(hoverIdx==null){await p.mouse.move(5,5);} else {const lis=await p.$$('#about ol li'); if(lis[hoverIdx]) await lis[hoverIdx].hover().catch(()=>{});}
  await p.waitForTimeout(1300); // settle rotation ease + ramp
  const fr=await frames(6);
  const mean=meanImage(fr);
  const axis=await p.evaluate(()=>document.querySelector('#about [data-axis]')?.getAttribute('data-axis')??null);
  PNG.sync && fs.writeFileSync(`${OUT}mean-${label}.png`, PNG.sync.write(Object.assign(new PNG({width:mean.width,height:mean.height}),{data:Buffer.from(mean.data)})));
  return {label,axis,mean,...goldFrac(mean),bright:brightAngle(mean)};
}

const rest=await state('rest',null);
const restB=await state('restB',null);           // same-active repeat → animation floor
const h0=await state('h0',0);
const h2=await state('h2',2);
const h5=await state('h5',5);
const h9=await state('h9',9);
const S=[rest,restB,h0,h2,h5,h9];

const floor=meanDiff(rest.mean,restB.mean);       // same active(3) vs itself
const cross=[
  ['rest(3)->h0',meanDiff(rest.mean,h0.mean)],
  ['rest(3)->h9',meanDiff(rest.mean,h9.mean)],
  ['h0->h2',meanDiff(h0.mean,h2.mean)],
  ['h0->h5',meanDiff(h0.mean,h5.mean)],
  ['h0->h9',meanDiff(h0.mean,h9.mean)],
  ['h2->h9',meanDiff(h2.mean,h9.mean)],
];
const report={live:LIVE,buildCommit,
  states:S.map(s=>({label:s.label,axis:s.axis,goldFrac:s.goldFrac,gold:s.gold,bright:s.bright})),
  animationFloor_meanAbsRGB:floor,
  crossDimension_meanAbsRGB:cross,
  interpretation:'meanAbsRGB is 0..765 per-pixel; floor=same active repeated, cross=different active. angleDeg is the bright-pattern orientation.'};
fs.writeFileSync(`${OUT}measure2-report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await b.close();
