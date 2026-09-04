import { chromium } from 'playwright';
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle',timeout:90000});
await p.waitForTimeout(3500);
await p.addStyleTag({content:`[class*=Hero_ledgerSource],[class*=Hero_grading]{color:#8A8F9A !important}`});
await p.waitForTimeout(400);
await p.screenshot({path:'/Users/vic/claude/forgotten-mistory/.audit-v7/s1/fixsim.png'});
// backdrop luminance profile: sample a text-free column strip x 1290-1400
await ctx.close(); await b.close();
