import sharp from 'sharp';
// A 1x3 horizontal box average cancels RGB subpixel fringing (which is a
// left/right mirrored R/B pair on a glyph stem) but preserves real colour.
for (const [label,pipe] of [['raw', sharp('dl/og-image.png')],
                            ['box3x3', sharp('dl/og-image.png').convolve({width:3,height:3,kernel:[1,1,1,1,1,1,1,1,1],scale:9,offset:0})]]) {
  const {data,info}=await pipe.removeAlpha().raw().toBuffer({resolveWithObject:true});
  const n=info.width*info.height; let max=0,gt4=0,gt20=0,sat=0,ng=0;
  for(let i=0;i<data.length;i+=info.channels){const r=data[i],g=data[i+1],b=data[i+2];
   const c=Math.max(Math.abs(r-g),Math.abs(g-b),Math.abs(r-b)); if(c>max)max=c; if(c>4)gt4++; if(c>20)gt20++;
   const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,s=mx?d/mx:0;
   if(s>0.25){sat++; let h=0; if(d){if(mx===r)h=60*((((g-b)/d)%6+6)%6); else if(mx===g)h=60*((b-r)/d+2); else h=60*((r-g)/d+4);} if(h<0)h+=360; if(!(h>=35&&h<=60))ng++;}}
  console.log(`${label.padEnd(8)} max=${String(max).padStart(3)} px>4=${String(gt4).padStart(6)} px>20=${String(gt20).padStart(6)} sat>.25=${String(sat).padStart(6)} nonGoldHue=${String(ng).padStart(6)} (${(100*ng/n).toFixed(3)}%)`);
}
