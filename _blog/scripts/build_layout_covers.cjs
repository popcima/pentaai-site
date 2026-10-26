#!/usr/bin/env node
/** Original topic diagrams in the homepage's light feature-panel style. */
'use strict';
const fs=require('node:fs'), path=require('node:path'), sharp=require('sharp');
const {text,escape}=require('./svg_text.cjs');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.PENTA_SITE_ROOT || path.join(root,'site'));
const dest=path.join(site,'blog/covers');
const ink='#101013', muted='#6e6e73',blue='#0f7fff',line='#e1e1e5';
const rect=(x,y,w,h,fill='#fff',radius=18,stroke=line)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const t=(x,y,s,size=30,color=ink,anchor='start')=>text(x,y,s,size,color,'Inter',500,anchor);
const m=(x,y,s,size=25,color=muted,anchor='start')=>text(x,y,s,size,color,'Geist Mono',400,anchor);
const rule=(x,y,w)=>`<path d="M${x} ${y}h${w}" stroke="${line}" stroke-width="2"/>`;
const panel=(label,body)=>rect(100,66,1000,498)+`<circle cx="139" cy="107" r="7" fill="${blue}"/>`+m(161,117,label,27)+rule(100,148,1000)+body;
const chip=(x,y,w,label,fill='#f2f5f9',color=ink)=>rect(x,y,w,56,fill,28,fill)+t(x+w/2,y+37,label,23,color,'middle');
const frame=(label,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escape(label)}"><rect width="1200" height="630" fill="#f5f5f5"/>${body}</svg>`;

const items=[
 {slug:'css-container-queries-cards',alt:'A narrow stacked card and a wider side-by-side card responding to their own containers.',svg:()=>panel('One component / two containers',
 rect(140,185,300,320,'#f7f7f8')+rect(164,209,252,124,'#dceaff',12)+t(164,377,'Narrow slot',29)+m(164,425,'Stacked',23)+
 rect(490,185,570,320,'#f7f7f8')+rect(514,237,184,215,'#dceaff',12)+t(730,302,'Wide slot',29)+m(730,351,'Side by side',22))},
 {slug:'position-sticky-not-working',alt:'A sticky sidebar within a tall page region, with a visible top offset and the containing boundary.',svg:()=>panel('Sticky needs room to move',
 rect(145,182,910,335,'#f7f7f8')+rect(169,206,862,36,'#dceaff',6)+rect(169,268,250,150,'#fff',12,'#0f7fff')+t(194,328,'Contents',29)+m(194,372,'top: 5rem',23)+
 [0,1,2,3,4].map(i=>rect(456,273+i*43,535-(i%2)*100,13,'#dedee4',6,'#dedee4')).join('')+m(171,488,'Containing region',23))},
 {slug:'unitless-line-height-css',alt:'Two typography examples showing a unitless 1.5 multiplier producing 24 and 36 pixel line heights for different text sizes.',svg:()=>panel('Inherit a multiplier',
 rect(140,188,435,315)+m(170,237,'16px / 1.5',25)+t(170,304,'Readable text',28)+t(170,346,'on two lines',28)+m(170,451,'24px line height',23)+
 rect(625,188,435,315)+m(655,237,'24px / 1.5',25)+t(655,308,'Larger text',40)+t(655,368,'still fits',40)+m(655,451,'36px line height',23))},
 {slug:'object-fit-cover-contain',alt:'Illustrative contain and cover boxes showing the whole scene with empty space versus a cropped scene filling its box.',svg:()=>panel('Preserve the whole / fill the box',
 `<defs><clipPath id="crop"><rect x="640" y="246" width="400" height="170" rx="10"/></clipPath></defs>`+
 rect(160,210,400,242,'#f0f0f2',12)+rect(217,210,286,242,'#dceaff',0,'#dceaff')+`<circle cx="360" cy="295" r="58" fill="#0f7fff"/><path d="M217 452l115-105 171 105" fill="#8eafe1"/>`+
 rect(640,246,400,170,'#dceaff',10)+`<g clip-path="url(#crop)"><circle cx="840" cy="275" r="85" fill="#0f7fff"/><path d="M640 472l160-150 240 150" fill="#8eafe1"/></g>`+
 m(360,512,'contain',28,ink,'middle')+m(840,512,'cover',28,ink,'middle'))},
 {slug:'css-logical-properties-rtl',alt:'Two notices showing the accent border at the reading-start edge in left-to-right and right-to-left layouts.',svg:()=>panel('Let the start edge follow direction',
 rect(140,220,435,225,'#f7f7f8')+rect(140,220,9,225,'#0f7fff',0,'#0f7fff')+t(181,294,'Start here',32)+m(181,351,'Left to right',24)+
 rect(625,220,435,225,'#f7f7f8')+rect(1051,220,9,225,'#0f7fff',0,'#0f7fff')+t(1018,294,'Start here',32,ink,'end')+m(1018,351,'Right to left',24,muted,'end')+
 m(600,517,'border-inline-start',27,ink,'middle'))},
 {slug:'responsive-images-srcset-sizes',alt:'Three illustrative image candidates labeled 400w, 800w and 1200w above a separate rendered-slot description.',svg:()=>panel('Candidates + rendered slot',
 rect(160,294,150,100,'#dceaff',12)+rect(385,244,225,150,'#dceaff',12)+rect(685,194,300,200,'#dceaff',12)+
 m(235,438,'400w',27,ink,'middle')+m(497,438,'800w',27,ink,'middle')+m(835,438,'1200w',27,ink,'middle')+
 rule(140,466,920)+m(600,519,'sizes describes the layout space',26,ink,'middle'))}
];

(async()=>{
  fs.mkdirSync(dest,{recursive:true});
  const manifest={version:1,description:'Original explanatory illustrations matching Penta AI homepage feature panels. Values are examples; not product screenshots.',assets:[]};
  for(const item of items){
    const svg=frame(item.alt,item.svg());
    fs.writeFileSync(path.join(dest,item.slug+'.svg'),svg);
    const entry={slug:item.slug,alt:item.alt,source:'/blog/covers/'+item.slug+'.svg',variants:[]};
    for(const [field,suffix,w,h] of [['cover','',1200,630],['coverSmall','-640',640,336],['coverThumbnail','-320',320,168]]){
      const file=item.slug+suffix+'.webp';
      await sharp(Buffer.from(svg)).resize(w,h).webp({quality:90,effort:6}).toFile(path.join(dest,file));
      entry.variants.push({field,path:'/blog/covers/'+file,width:w,height:h,bytes:fs.statSync(path.join(dest,file)).size});
    }
    manifest.assets.push(entry);
  }
  fs.writeFileSync(path.join(root,'content/cover-assets-2026-10-26.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Generated '+items.length+' original covers and '+items.length*3+' WebP variants.');
})().catch(error=>{console.error(error);process.exitCode=1;});
