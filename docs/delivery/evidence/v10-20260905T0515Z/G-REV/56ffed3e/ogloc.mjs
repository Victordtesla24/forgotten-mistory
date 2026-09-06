import sharp from 'sharp';
const {data,info}=await sharp('dl/og-image.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
const W=info.width,H=info.height,C=info.channels;
let n40=0,n20=0; const band=new Map(); let minX=1e9,maxX=0,minY=1e9,maxY=0; const samples=[];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*C;const r=data[i],g=data[i+1],b=data[i+2];
 const c=Math.max(Math.abs(r-g),Math.abs(g-b),Math.abs(r-b));
 if(c>20)n20++;
 if(c>40){n40++;const k=`${Math.floor(y/100)*100}`;band.set(k,(band.get(k)||0)+1);
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  if(samples.length<5)samples.push({x,y,r,g,b,c});}}
console.log('px chroma>20:',n20,`(${(100*n20/(W*H)).toFixed(2)}%)`);
console.log('px chroma>40:',n40,`(${(100*n40/(W*H)).toFixed(2)}%)  bbox x[${minX}..${maxX}] y[${minY}..${maxY}]`);
console.log('by 100px row band:',[...band.entries()].sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}:${v}`).join(' '));
console.log('samples:',samples);
