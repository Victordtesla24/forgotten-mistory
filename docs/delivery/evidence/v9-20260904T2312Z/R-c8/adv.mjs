import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
const OUT='/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8';
const URL='https://forgotten-mistory.web.app/?gl=force';
const R={};
const browser=await chromium.launch({channel:'chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
async function run(name,vw,vh,opts={}){
  const ctx=await browser.newContext({viewport:{width:vw,height:vh},reducedMotion:opts.rm?'reduce':'no-preference'});
  const page=await ctx.newPage();
  const errs=[],warns=[],pageerrs=[],failed=[],media=[];
  page.on('console',m=>{const t=m.type();if(t==='error')errs.push(m.text().slice(0,300));else if(t==='warning')warns.push(m.text().slice(0,160));});
  page.on('pageerror',e=>pageerrs.push(String(e).slice(0,300)));
  page.on('requestfailed',r=>failed.push(r.url()+' :: '+(r.failure()?.errorText||'')));
  page.on('response',r=>{const u=r.url();if(/\.(mp4|png|jpg|jpeg|webp|mp3|wav|svg|webm)(\?|$)/i.test(u))media.push({u,s:r.status()});});
  await page.goto(URL,{waitUntil:'load',timeout:60000});
  await page.waitForTimeout(3500);
  const o={viewport:`${vw}x${vh}`,reducedMotion:!!opts.rm,consoleErrors:errs,pageErrors:pageerrs,failedRequests:failed,consoleWarnings:[...new Set(warns)].slice(0,8),mediaRequests:[...new Set(media.map(m=>m.u))]};
  // sections
  o.sections=await page.evaluate(()=>{
    const ids=['hero','about','experience','skills','vitrine','listen'];
    const order=[...document.querySelectorAll('section[id],div[id]')].map(e=>e.id).filter(i=>ids.includes(i));
    return ids.map(id=>{const el=document.getElementById(id);if(!el)return{id,present:false};
      const h=el.querySelector('h1,h2,[role="heading"]');
      let vis=false,txt='';
      if(h){const r=h.getBoundingClientRect();const cs=getComputedStyle(h);txt=(h.innerText||'').trim().slice(0,90);
        vis=r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&parseFloat(cs.opacity||'1')>0.01;}
      return{id,present:true,headingTag:h?h.tagName:null,headingText:txt,headingVisible:vis};}).concat([{domOrder:order}]);
  });
  // minivic launcher
  o.minivic=await page.evaluate(()=>{const b=document.querySelector('[data-testid="minivic-toggle"]');if(!b)return{present:false};
    const r=b.getBoundingClientRect();return{present:true,rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},
      bottomRight:r.x>innerWidth*0.6&&r.y>innerHeight*0.6,label:(b.getAttribute('aria-label')||b.innerText||'').trim().slice(0,60)};});
  if(opts.rm){
    o.autoplay=await page.evaluate(()=>{
      const vids=[...document.querySelectorAll('video')].map(v=>({src:(v.currentSrc||v.src||'').split('/').pop(),paused:v.paused,autoplay:v.autoplay,t:v.currentTime}));
      const anims=document.getAnimations?document.getAnimations().filter(a=>a.playState==='running').map(a=>{
        const t=a.effect&&a.effect.target;const d=a.effect&&a.effect.getTiming?a.effect.getTiming():{};
        return{el:t?(t.tagName+'.'+(t.className&&t.className.baseVal!==undefined?t.className.baseVal:String(t.className||'')).slice(0,40)):'?',dur:d.duration,iter:String(d.iterations)};}):[];
      return{videos:vids,runningAnimations:anims.slice(0,15),runningCount:anims.length};});
    o.heroReadable=await page.evaluate(()=>{const h=document.querySelector('#hero h1');if(!h)return{ok:false};
      const cs=getComputedStyle(h);const r=h.getBoundingClientRect();
      return{text:h.innerText.trim().slice(0,60),opacity:cs.opacity,transform:cs.transform,w:Math.round(r.width),h:Math.round(r.height),color:cs.color};});
    await page.screenshot({path:`${OUT}/adv-${name}.png`});
  } else {
    // axe
    try{const res=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      o.axe={total:res.violations.length,serious:res.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,targets:v.nodes.slice(0,3).map(n=>n.target.join(' '))})),
        moderateMinor:res.violations.filter(v=>!['serious','critical'].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,targets:v.nodes.slice(0,2).map(n=>n.target.join(' '))}))};}
    catch(e){o.axe={error:String(e).slice(0,200)};}
    // keyboard
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.keyboard.press('Tab');
    const tabs=[];
    for(let i=0;i<16;i++){
      const d=await page.evaluate(()=>{const a=document.activeElement;if(!a)return null;
        const r=a.getBoundingClientRect();const cs=getComputedStyle(a);
        return{tag:a.tagName,id:a.id||null,testid:a.getAttribute('data-testid')||null,text:(a.innerText||a.getAttribute('aria-label')||a.value||'').trim().slice(0,50),href:a.getAttribute('href')||null,
          visible:r.width>0&&r.height>0&&r.top>-200&&r.top<innerHeight+200,outline:cs.outlineWidth+' '+cs.outlineStyle,boxShadow:cs.boxShadow.slice(0,40)};});
      tabs.push(d); if(i<15) await page.keyboard.press('Tab');
    }
    o.tabOrder=tabs;
  }
  await ctx.close();
  return o;
}
R.d1440=await run('1440',1440,900);
R.m390=await run('390',390,844);
R.rm1440=await run('rm1440',1440,900,{rm:true});
await browser.close();
fs.writeFileSync(`${OUT}/adversarial-report.json`,JSON.stringify(R,null,2));
console.log('WROTE');
console.log('1440 errs',R.d1440.consoleErrors.length,'pageerr',R.d1440.pageErrors.length,'failed',R.d1440.failedRequests.length);
console.log('390 errs',R.m390.consoleErrors.length,'pageerr',R.m390.pageErrors.length,'failed',R.m390.failedRequests.length);
console.log('axe1440 serious',JSON.stringify(R.d1440.axe.serious));
console.log('axe1440 other',JSON.stringify(R.d1440.axe.moderateMinor));
console.log('axe390 serious',JSON.stringify(R.m390.axe.serious));
console.log('axe390 other',JSON.stringify(R.m390.axe.moderateMinor));
console.log('sections1440',JSON.stringify(R.d1440.sections));
console.log('minivic',JSON.stringify(R.d1440.minivic),JSON.stringify(R.m390.minivic));
console.log('RM',JSON.stringify(R.rm1440.autoplay),JSON.stringify(R.rm1440.heroReadable));
console.log('TAB',JSON.stringify(R.d1440.tabOrder));
console.log('MEDIA',JSON.stringify(R.d1440.mediaRequests));
