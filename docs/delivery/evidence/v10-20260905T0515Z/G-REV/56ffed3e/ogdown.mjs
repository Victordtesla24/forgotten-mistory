import sharp from 'sharp';
for (const [label,p] of [['native 1200x630', sharp('dl/og-image.png')],
                          ['area /4 300x158', sharp('dl/og-image.png').resize(300,158,{kernel:'cubic'})],
                          ['portrait ref', sharp('dl/my_avatar.png')]]) {
  const {data,info}=await p.removeAlpha().raw().toBuffer({resolveWithObject:true});
  const n=info.width*info.height; let max=0,gt4=0,sat=0,ng=0;
  for(let i=0;i<data.length;i+=info.channels){const r=data[i],g=data[i+1],b=data[i+2];
   const c=Math.max(Math.abs(r-g),Math.abs(g-b),Math.abs(r-b)); if(c>max)max=c; if(c>4)gt4++;
   const mx=Math.max(r,g,b),d=mx-Math.min(r,g,b),s=mx?d/mx:0;
   if(s>0.25){sat++; let h=0; if(d){if(mx===r)h=60*((((g-b)/d)%6+6)%6); else if(mx===g)h=60*((b-r)/d+2); else h=60*((r-g)/d+4);} if(h<0)h+=360; if(!(h>=35&&h<=60))ng++;}}
  console.log(`${label.padEnd(18)} ${info.width}x${info.height} max=${String(max).padStart(3)} px>4=${(100*gt4/n).toFixed(3)}% sat>.25 nonGold=${ng} (${(100*ng/n).toFixed(4)}%)`);
}
