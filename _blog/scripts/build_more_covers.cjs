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
 {slug:'fix-web-font-not-loading',alt:'Illustrative font request panel with a missing file, a successful file and a rendered-font specimen.',svg:()=>panel('Font request checklist',
   m(145,210,'Request',23)+m(770,210,'Status',23)+rule(140,232,920)+
   m(145,285,'/fonts/studio.woff2',27,ink)+chip(760,246,175,'404','#fff0ee','#a52e22')+
   m(145,362,'/fonts/studio-regular.woff2',27,ink)+chip(760,323,175,'200','#e6f2e9','#245338')+
   rule(140,407,920)+t(145,503,'Aa',74)+m(350,472,'Rendered face',24)+t(350,515,'Studio Sans / 400',31))},
 {slug:'check-website-color-contrast',alt:'Two illustrative text and background pairs: dark gray on white at 8.48 to 1 and black on white at 21 to 1.',svg:()=>panel('Contrast is a pair',
   rect(140,191,435,294)+t(180,302,'Aa',88,'#4a4a52')+m(180,369,'#4A4A52 / #FFFFFF',23)+chip(178,402,195,'8.48 : 1','#e6f2e9','#245338')+
   rect(625,191,435,294)+t(665,302,'Aa',88,'#000000')+m(665,369,'#000000 / #FFFFFF',23)+chip(663,402,195,'21 : 1','#e6f2e9','#245338'))},
 {slug:'debug-css-specificity-cascade',alt:'Illustrative normal CSS layer comparison showing the overrides layer winning over a components layer.',svg:()=>panel('Normal author declarations',
   rect(142,190,916,120,'#f7f7f8')+m(174,233,'@layer components',25)+t(174,282,'.checkout .button.primary',31)+
   rect(142,338,916,120,'#eef5ff',18,'#94bfff')+m(174,381,'@layer overrides',25,'#1a66d6')+t(174,430,'.button',31)+chip(823,371,190,'Winner','#d9e9ff','#1a66d6')+
   m(145,520,'Layer order before selector weight',27))},
 {slug:'css-grid-vs-flexbox',alt:'A grid diagram with shared columns beside a flex layout with independently sized items on each row.',svg:()=>panel('Choose the layout behavior',
   t(145,218,'Grid',35)+t(650,218,'Flexbox',35)+
   [0,1,2].map(c=>[0,1].map(r=>rect(145+c*142,250+r*100,126,82,c===0?'#e2eeff':'#f0f0f2',12)).join('')).join('')+
   rect(650,250,160,82,'#e2eeff',12)+rect(826,250,228,82,'#f0f0f2',12)+rect(650,350,250,82,'#f0f0f2',12)+rect(916,350,138,82,'#e2eeff',12)+
   m(145,503,'Shared columns',25)+m(650,503,'Each line adapts',25))},
 {slug:'debug-responsive-horizontal-overflow',alt:'Illustrative mobile containers comparing an overflowing fixed-width card with a card constrained to the available width.',svg:()=>panel('Find the overflowing box',
   rect(175,195,345,292,'#f7f7f8',24)+rect(208,246,390,175,'#fff0ee',15,'#e4a39d')+t(242,315,'Fixed width',31)+m(242,365,'Too wide',25,'#a52e22')+
   rect(680,195,345,292,'#f7f7f8',24)+rect(708,246,289,175,'#eef5ff',15,'#94bfff')+t(739,315,'Fits here',31)+m(739,365,'min-width: 0',23,'#1a66d6')+
   m(185,530,'Inspect the constraint',25)+m(690,530,'Retest the content',25))},
 {slug:'css-spacing-scale',alt:'A spacing inventory with bars representing 8, 16, 24 and 32 pixel example distances.',svg:()=>panel('A small spacing inventory',
   [['space-2','8px',8],['space-4','16px',16],['space-6','24px',24],['space-8','32px',32]].map(([label,value,n],i)=>m(145,226+i*91,label,27)+rect(395,191+i*91,n*13,49,'#dceaff',8,'#dceaff')+m(1019,225+i*91,value,26,ink,'end')).join(''))},
 {slug:'fluid-typography-css-clamp',alt:'Three typography specimens increasing from 32 to 44 to 56 pixels with the example fluid clamp expression.',svg:()=>panel('Fluid type / 16px root example',
   t(285,345,'Aa',96,ink,'middle')+t(600,345,'Aa',132,ink,'middle')+t(915,345,'Aa',168,ink,'middle')+
   m(285,400,'32px',27,muted,'middle')+m(600,400,'44px',27,muted,'middle')+m(915,400,'56px',27,muted,'middle')+
   rule(140,438,920)+m(600,504,'clamp(2rem, 1.25rem + 3vw, 3.5rem)',26,ink,'middle'))},
 {slug:'inspect-css-box-shadow',alt:'A layered card elevation illustration labeling a contact shadow and a softer surrounding shadow.',svg:()=>panel('Read each shadow layer',
   `<defs><filter id="lift" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="20" stdDeviation="16" flood-color="#101013" flood-opacity=".15"/></filter></defs><g filter="url(#lift)">`+rect(370,218,460,205,'#fff',22)+`</g>`+
   t(600,312,'Surface',39,ink,'middle')+m(600,363,'border + elevation',24,muted,'middle')+
   m(145,475,'01  contact edge',26)+m(145,523,'02  soft surrounding lift',26)+`<path d="M865 415h160" stroke="${blue}" stroke-width="3"/>`)},
 {slug:'css-border-radius-system',alt:'Three white component shapes illustrating an 8 pixel control radius, a 16 pixel card radius and a pill.',svg:()=>panel('Shape roles',
   rect(150,236,255,168,'#fff',8,'#a7a7af')+rect(472,236,255,168,'#fff',32,'#a7a7af')+rect(794,267,255,108,'#eef5ff',54,'#94bfff')+
   t(277,329,'Control',28,ink,'middle')+t(599,329,'Card',28,ink,'middle')+t(921,329,'Pill',28,'#1a66d6','middle')+
   m(277,473,'8px',27,muted,'middle')+m(599,473,'16px',27,muted,'middle')+m(921,473,'999px',27,muted,'middle'))},
 {slug:'css-custom-property-fallbacks',alt:'A variable debugging diagram distinguishing a missing token using its fallback from an existing length used incorrectly as a color.',svg:()=>panel('Two different variable failures',
   rect(140,191,435,300,'#f7f7f8')+m(172,244,'Token missing',26)+t(172,312,'Use fallback',32)+chip(172,365,330,'color: #243449','#e6f2e9','#245338')+
   rect(625,191,435,300,'#f7f7f8')+m(657,244,'Token = 20px',26)+t(657,312,'Invalid color',32)+chip(657,365,330,'Check the type','#fff0ee','#a52e22'))},
 {slug:'dark-mode-css-tokens',alt:'Light and dark card examples using the same semantic surface and text roles.',svg:()=>panel('Same roles / different values',
   rect(140,188,435,315,'#f5f5f5')+rect(170,218,375,170,'#fff')+t(198,281,'Card surface',31,'#17191c')+t(198,334,'Supporting text',27,'#4a4a52')+m(173,458,'Light theme',25)+
   rect(625,188,435,315,'#101013',18,'#101013')+rect(655,218,375,170,'#1c1c21',18,'#45454e')+t(683,281,'Card surface',31,'#f4f4ee')+t(683,334,'Supporting text',27,'#c4c4cc')+m(658,458,'Dark theme',25,'#c4c4cc'))},
 {slug:'svg-vs-png-website-icons',alt:'A vector arrow beside a deliberately pixelated arrow demonstrating vector geometry and raster pixels.',svg:()=>panel('Match the format to the asset',
   rect(140,190,435,290,'#f7f7f8')+`<path d="M240 330h215m-83-83 83 83-83 83" fill="none" stroke="${blue}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`+
   rect(625,190,435,290,'#f7f7f8')+[[2,0],[3,1],[4,2],[5,3],[4,4],[3,5],[2,6],[0,3],[1,3],[2,3],[3,3],[4,3]].map(([x,y])=>rect(722+x*35,216+y*35,35,35,blue,0,blue)).join('')+
   m(357,532,'Vector paths',25,ink,'middle')+m(842,532,'Raster pixels',25,ink,'middle'))},
 {slug:'accessible-button-states',alt:'Four illustrative save buttons in default, hover, keyboard focus and disabled states.',svg:()=>panel('Review every button state',
   [['Default',160,210,'#183224','#fff'],['Hover',660,210,'#244b35','#fff'],['Focus',160,386,'#183224','#fff'],['Disabled',660,386,'#e2e4e2','#777b77']].map(([label,x,y,bg,fg])=>m(x,y,label,25)+rect(x,y+26,350,90,bg,45,bg)+t(x+175,y+82,'Save changes',28,fg,'middle')+(label==='Focus'?`<rect x="${x-9}" y="${y+17}" width="368" height="108" rx="54" fill="none" stroke="#155eef" stroke-width="4"/>`:'')).join(''))},
 {slug:'design-handoff-checklist',alt:'A design handoff checklist covering tokens, assets, responsive behavior, interaction states and acceptance checks.',svg:()=>panel('Implementation handoff',
   ['Tokens and their roles','Assets and export variants','Responsive layout behavior','Focus, loading and error states','Observable acceptance checks'].map((label,i)=>rect(145,181+i*69,30,30,'#e6f2e9',8,'#e6f2e9')+`<path d="M152 ${196+i*69}l5 5 11-12" stroke="#245338" stroke-width="3" fill="none"/>`+t(200,208+i*69,label,29)).join(''))}
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
  fs.writeFileSync(path.join(root,'content/cover-assets-2026-10-25.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Generated '+items.length+' original covers and '+items.length*3+' WebP variants.');
})().catch(error=>{console.error(error);process.exitCode=1;});
