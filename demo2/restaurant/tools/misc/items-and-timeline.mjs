import fs from 'fs';
const src = fs.readFileSync('src/engine/items.ts','utf8');
const re = /^\s*"?([\w-]+)"?: \{ weight: ([\d.]+),.*$/gm; let m; const items=[];
while((m=re.exec(src))){const l=m[0]; items.push({k:m[1],w:+m[2],absurd:/absurd: true/.test(l),animal:/animal: true/.test(l),egg:(l.match(/egg: "([\w-]+)"/)||[])[1],sfx:(l.match(/sfx: "(\w+)"/)||[])[1]});}
const T=items.reduce((a,i)=>a+i.w,0), A=items.filter(i=>i.absurd).reduce((a,i)=>a+i.w,0);
console.log(items.length,'total',T,'absurd',A,(A/T*100).toFixed(2));
for(const i of items) console.log(i.k,i.w,(i.w/T*100).toFixed(2)+'%',i.absurd?'A':'',i.animal?'anim':'',i.egg||'',i.sfx||'');
const eggs=new Set(items.map(i=>i.egg).filter(Boolean)); console.log('itemEggs',eggs.size);
const decl = [...fs.readFileSync('/dev/stdin','utf8').matchAll(/"([\w-]+)"/g)].map(x=>x[1]); decl.forEach(d=>eggs.add(d)); console.log('declared total',eggs.size);
const scenes=[['bar',1.2],['office',1.6],['dining',1.3],['kitchen',1.6],['storage',1.1],['pantry',1.5],['street',1.6],['pond',1.8]];
const tr=[0.9,2,0.7,0.7,0.35,0.7,0.8]; let acc=0;
scenes.forEach(([id,h],i)=>{console.log(`| ${id} | scene | ${acc.toFixed(2)} | ${h} | ${(acc+h).toFixed(2)}`);acc+=h; if(i<tr.length){const n=scenes[i+1][0];console.log(`| ${id}>${n} | tr | ${acc.toFixed(2)} | ${tr[i]} | ${(acc+tr[i]).toFixed(2)}`);acc+=tr[i];}});
console.log('total',acc);
