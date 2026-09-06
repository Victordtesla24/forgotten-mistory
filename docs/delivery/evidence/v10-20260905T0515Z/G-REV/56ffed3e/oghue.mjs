import sharp from 'sharp';
const {data,info}=await sharp('dl/og-image.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
const h=new Map(); let n=0;
for(let i=0;i<data.length;i+=info.channels){const r=data[i],g=data[i+1],b=data[i+2];
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,s=mx?d/mx:0; if(s<=0.25)continue; n++;
 let hu=0; if(d){if(mx===r)hu=60*((((g-b)/d)%6+6)%6); else if(mx===g)hu=60*((b-r)/d+2); else hu=60*((r-g)/d+4);} if(hu<0)hu+=360;
 const k=Math.floor(hu/30)*30; const c=h.get(k)||{n:0,s:null}; c.n++; if(!c.s)c.s={r,g,b,h:+hu.toFixed(1),sat:+s.toFixed(2)}; h.set(k,c);}
console.log('saturated px (>0.25):',n);
[...h.entries()].sort((a,b)=>b[1].n-a[1].n).slice(0,8).forEach(([k,v])=>console.log(`  hue ${k}-${k+30}: ${v.n} px  eg rgb(${v.s.r},${v.s.g},${v.s.b}) h=${v.s.h} s=${v.s.sat}`));
