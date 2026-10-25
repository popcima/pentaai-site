#!/usr/bin/env node
/** Rebuild homepage-matched UI covers. Requires sharp; no OS fonts or network.
 * Text is authored here, then drawn with the site's exact bundled glyph paths.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const {text,escape}=require('./svg_text.cjs');
const fonts=require('./illustration-fonts.json');
const root=path.resolve(__dirname,'..');
const destination=path.join(process.env.PENTA_SITE_ROOT || path.join(root,'site'),'blog/covers');
fs.mkdirSync(destination,{recursive:true});
const rect=(x,y,w,h,fill='#fff',stroke='#e9e8ea',radius=18,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
const line=(x1,y1,x2,y2,color='#e9e8ea',width=2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
const mono=(x,y,value,size=28,fill='#6e6e73',anchor='start')=>text(x,y,value,size,fill,'Geist Mono',400,anchor);
const frame=(label,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escape(label)}"><defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#101013" flood-opacity=".05"/></filter></defs><rect width="1200" height="630" fill="#f5f5f5"/>${body}</svg>`;
const pill=(x,y,w,h,label,fill='#fff',ink='#101013',fontSize=34)=>rect(x,y,w,h,fill,'#e9e8ea',h/2,'filter="url(#shadow)"')+text(x+w/2,y+h/2+fontSize*.34,label,fontSize,ink,'Inter',400,'middle');
const pointer=(x,y,scale=3)=>`<g transform="translate(${x} ${y}) rotate(-8) scale(${scale})"><path d="m4 3 7.1 18 2.6-7.3L21 11 4 3Z" fill="#101013" stroke="#101013" stroke-width="1.2" stroke-linejoin="round"/></g>`;
const lum=hex=>{const a=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]};
const contrast=(lum('#ffffff')+.05)/(lum('#4a4a52')+.05);

const covers=[
 {name:'design-system-ui',slug:'extract-design-system-from-website',component:'.tokens-example',alt:'A light design token inspector with accent color, card radius, typography and shadow values.',
  svg:frame('Illustrative design token inspector',
   rect(140,84,920,462,'#fff','#e0dfe1',22,'filter="url(#shadow)"')+line(140,154,1060,154)+`<circle cx="179" cy="120" r="7" fill="#0f7fff"/>`+mono(201,131,'Design tokens',28)+
   [['--accent','#0f7fff'],['--radius-card','16px'],['--text-lg','18px/1.5'],['--shadow-card','0 1px 2px']].map((v,i)=>mono(180,222+i*83,v[0],31,'#8395b7')+mono(1018,222+i*83,v[1],31,'#6e6e73','end')).join(''))},
 {name:'website-fonts-ui',slug:'find-font-on-website',component:'.font-example',alt:'Three Inter letter specimens with 56px, 18px and 14px labels and a row of font weights.',
  svg:frame('Illustrative website typography specimens',
   text(330,316,'Aa',166,'#101013','Inter',600,'middle')+text(646,316,'Aa',100,'#101013','Inter',600,'middle')+text(902,316,'Aa',70,'#101013','Inter',600,'middle')+
   text(330,379,'56px',31,'#6e6e73','Inter',400,'middle')+text(646,379,'18px',31,'#6e6e73','Inter',400,'middle')+text(902,379,'14px',31,'#6e6e73','Inter',400,'middle')+
   mono(600,498,'Inter · 400 500 600 700',30,'#6e6e73','middle'))},
 {name:'color-palette-ui',slug:'extract-website-color-palette',component:'.color-example',alt:`Blue, black, gray and light gray swatches with an example text pair and its calculated ${contrast.toFixed(2)} to 1 contrast ratio.`,
  svg:frame('Illustrative website color palette',
   ['#0f7fff','#101013','#6e6e73','#d6d5d7'].map((c,i)=>rect(100+i*255,172,235,170,c,'#ffffff40',18,'filter="url(#shadow)"')).join('')+
   mono(220,448,'#4A4A52 on #FFF',29)+rect(722,402,255,66,'#101013','#101013',33)+mono(849,445,contrast.toFixed(2)+' AAA',25,'#fff','middle'))},
 {name:'css-inspection-ui',slug:'inspect-website-css',component:'.inspect-example',alt:'A white add to chrome button with a blue inspection outline, dimension label and black cursor.',
  svg:frame('Illustrative CSS element inspection',
   mono(600,174,'button · 173 × 40',28,'#1a66d6','middle')+rect(276,226,648,178,'none','#1a66d6',1)+
   [[276,226],[924,226],[276,404],[924,404]].map(([x,y])=>rect(x-5,y-5,10,10,'#fff','#1a66d6',0)).join('')+
   pill(296,246,608,138,'add to chrome','#fff','#101013',45)+pointer(866,430,3.2))},
 {name:'tailwind-theme-ui',slug:'website-design-tokens-to-tailwind',component:'.tokens-example + .inspect-example',alt:'Tailwind v4 theme variables mapped to a site accent and panel radius, with matching utility chips.',
  svg:frame('Illustrative Tailwind v4 theme token mapping',
   rect(95,74,1010,482,'#fff','#e0dfe1',22,'filter="url(#shadow)"')+mono(136,141,'@theme inline {',31,'#101013')+
   mono(163,212,'--color-accent:',28,'#8395b7')+mono(1046,212,'var(--site-accent);',28,'#6e6e73','end')+
   mono(163,279,'--radius-panel:',28,'#8395b7')+mono(1046,279,'var(--site-panel-radius);',25,'#6e6e73','end')+
   mono(136,344,'}',31,'#101013')+line(95,378,1105,378)+
   pill(135,421,281,73,'bg-accent','#b9e8c7','#183224',26)+pill(442,421,307,73,'rounded-panel','#f5f5f5','#101013',25)+
   rect(791,421,274,73,'#f5f5f5','#e9e8ea',16)+text(928,467,'Component',25,'#101013','Inter',500,'middle'))},
 {name:'design-md-ui',slug:'design-md-for-ai',component:'.markdown-example',alt:'A white DESIGN.md document window with a blue status dot and illustrative colors and typography sections.',
  svg:frame('Illustrative DESIGN.md document window',
   rect(140,68,920,494,'#fff','#e0dfe1',22,'filter="url(#shadow)"')+line(140,148,1060,148)+`<circle cx="185" cy="108" r="9" fill="#0f7fff"/>`+mono(212,121,'DESIGN.md',31)+
   mono(178,218,'## Colors',34,'#101013')+mono(178,278,'- accent: #0f7fff',32,'#6e6e73')+mono(178,368,'## Type',34,'#101013')+mono(178,428,'- family: Inter',32,'#6e6e73')+mono(178,488,'- body: 18px / 1.5',32,'#6e6e73'))}
];

(async()=>{
 const postsPath=path.join(root,'content/posts.json');const posts=JSON.parse(fs.readFileSync(postsPath,'utf8'));
 const manifest={version:1,description:'Original illustrative interface examples matched to Penta AI homepage feature components. Not product screenshots.',caption:'Illustrative interface example.',reference:{html:'pentaai-site-main/index.html',css:'pentaai-site-main/_next/static/css/8a05ec3a957e43eb.css',surfaces:['#f5f5f5','#ffffff'],accent:'#0f7fff'},fonts:Object.fromEntries(Object.entries(fonts.fonts).map(([k,v])=>[k,{source:v.source,sha256:v.sha256,weight:v.weight}])),contrast:{foreground:'#4a4a52',background:'#ffffff',ratio:contrast,formula:'WCAG relative luminance (lighter + 0.05) / (darker + 0.05)'},assets:[]};
 for(const cover of covers){
  const svgPath=path.join(destination,cover.name+'.svg');fs.writeFileSync(svgPath,cover.svg);
  const entry={name:cover.name,slug:cover.slug,componentReference:cover.component,alt:cover.alt,source:'/blog/covers/'+cover.name+'.svg',variants:[]};
  const post=posts.find(p=>p.slug===cover.slug);if(!post)throw Error('Unknown post '+cover.slug);
  for(const [field,suffix,width,height] of [['cover','',1200,630],['coverSmall','-640',640,336],['coverThumbnail','-320',320,168]]){
   const target=path.join(destination,cover.name+suffix+'.webp');await sharp(Buffer.from(cover.svg)).resize(width,height).webp({quality:91,effort:6}).toFile(target);
   const src='/blog/covers/'+cover.name+suffix+'.webp';post[field]=src;entry.variants.push({path:src,width,height,bytes:fs.statSync(target).size});
  }
  post.coverAlt=cover.alt;post.coverWidth=1200;post.coverHeight=630;
  for(const key of Object.keys(post))if(key.startsWith('photo'))delete post[key];
  manifest.assets.push(entry);console.log(cover.name+' generated');
 }
 fs.writeFileSync(postsPath,JSON.stringify(posts,null,2)+'\n');fs.writeFileSync(path.join(root,'content/cover-assets.json'),JSON.stringify(manifest,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
