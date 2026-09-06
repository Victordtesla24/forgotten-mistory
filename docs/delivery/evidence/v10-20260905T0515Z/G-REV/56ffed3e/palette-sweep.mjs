import { chromium } from 'playwright'; import fs from 'node:fs'; import sharp from 'sharp';
async function sweep(label, extraArgs) {
  const b = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader', ...extraArgs] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForTimeout(2500);
  await p.evaluate(async () => { const H=document.body.scrollHeight; for(let y=0;y<H;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));} window.scrollTo(0,0); });
  await p.waitForTimeout(2000);
  const buf = await p.screenshot({ fullPage: true });
  fs.writeFileSync(`fullpage-${label}.png`, buf);
  await b.close();
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width*info.height; let gt4=0,max=0,gold=0,nonGold=0,satN=0; const ng=[];
  for (let i=0;i<data.length;i+=info.channels){ const r=data[i],g=data[i+1],bb=data[i+2];
    const ch=Math.max(Math.abs(r-g),Math.abs(g-bb),Math.abs(r-bb)); if(ch>max)max=ch; if(ch>4)gt4++;
    const mx=Math.max(r,g,bb),mn=Math.min(r,g,bb),d=mx-mn,s=mx?d/mx:0;
    if(s>0.25){satN++; let h=0; if(d){ if(mx===r)h=60*((((g-bb)/d)%6+6)%6); else if(mx===g)h=60*((bb-r)/d+2); else h=60*((r-g)/d+4);} if(h<0)h+=360;
      if(h>=35&&h<=60)gold++; else {nonGold++; if(ng.length<8)ng.push({r,g,b:bb,h:+h.toFixed(1),s:+s.toFixed(2),idx:i/info.channels});}}}
  return { label, w:info.width, h:info.height, pixels:n, maxChroma:max, pxChromaGT4:gt4, pctChromaLE4:+(100*(n-gt4)/n).toFixed(4),
    pxSatGT025:satN, pxSatGT025_goldHue:gold, pxSatGT025_nonGoldHue:nonGold, pctNonGold:+(100*nonGold/n).toFixed(5), nonGoldSamples:ng };
}
const a = await sweep('lcd-on', []);
const c = await sweep('lcd-off', ['--disable-lcd-text','--disable-font-subpixel-positioning','--force-color-profile=srgb']);
fs.writeFileSync('palette-sweep.json', JSON.stringify([a,c],null,2));
console.log(JSON.stringify([a,c],null,2));
