import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2000);
const h=await page.evaluate(()=>document.documentElement.scrollHeight);
for(let y=0;y<h;y+=700){await page.evaluate(v=>scrollTo(0,v),y); await page.waitForTimeout(60);} 
await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(800);

const targets = [
 ['skip-link','.skip-link'], ['logo','.logo'], ['nav-cv','.nav-cv'], ['menu-toggle','.menu-toggle'],
 ['hero primary','[class*=Hero_primaryAction]'], ['hero secondary','[class*=Hero_secondaryAction]'], ['hero link','[class*=Hero_link]'],
 ['about provenance link','#about .About_provenance a, #about a'], ['about item','#about li[class*=About_item]'],
 ['exp trackButton','[class*=Experience_trackButton]'], ['exp roleToggle','[class*=Experience_roleToggle]'],
 ['bench node','[class*=Bench_node]'], ['skills filter','[class*=Skills_filter]'],
 ['vitrine plate','#vitrine li'], ['vitrine source','[class*=Vitrine_source]'],
 ['listen channel','[class*=Listen_channel]'], ['footer link','[class*=Footer_link]'],
];
const CSS_KEYS=['color','backgroundColor','borderColor','opacity','transform','textDecorationLine','borderBottomColor','boxShadow','filter','outlineStyle'];
const grab = (sel)=>page.evaluate(({sel,CSS_KEYS})=>{
  const el=document.querySelector(sel); if(!el) return null; const cs=getComputedStyle(el);
  const o={}; CSS_KEYS.forEach(k=>o[k]=cs[k]);
  const bef=getComputedStyle(el,'::before'); o['_before']=bef.opacity+'|'+bef.transform+'|'+bef.backgroundColor+'|'+bef.width;
  const aft=getComputedStyle(el,'::after'); o['_after']=aft.opacity+'|'+aft.transform+'|'+aft.backgroundColor+'|'+aft.width;
  return o;
},{sel,CSS_KEYS});

console.log('label | hover-delta | active-delta');
for (const [label,sel] of targets){
  const el = await page.$(sel); if(!el){ console.log(`${label} | MISSING`); continue; }
  try { await el.scrollIntoViewIfNeeded(); } catch(e){}
  await page.evaluate(s=>{const e=document.querySelector(s); if(e) e.scrollIntoView({block:'center'});}, sel);
  await page.waitForTimeout(250);
  const rest = await grab(sel);
  try{ await el.hover({force:true}); }catch(e){ console.log(`${label} | HOVER-FAILED ${e.message.slice(0,40)}`); continue; } await page.waitForTimeout(500);
  const hov = await grab(sel);
  const dh = rest&&hov ? Object.keys(rest).filter(k=>rest[k]!==hov[k]) : ['?'];
  await page.mouse.down(); await page.waitForTimeout(220);
  const act = await grab(sel);
  await page.mouse.up();
  const da = hov&&act ? Object.keys(hov).filter(k=>hov[k]!==act[k]) : ['?'];
  await page.mouse.move(0,0); await page.waitForTimeout(200);
  console.log(`${label} | hover:[${dh.join(',')||'NONE'}] | active:[${da.join(',')||'NONE'}]`);
}
await browser.close();
