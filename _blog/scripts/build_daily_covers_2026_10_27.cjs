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

const bars=(x,y,widths)=>widths.map((w,i)=>rect(x,y+i*32,w,12,'#dce1e9',6,'#dce1e9')).join('');
const arrow=(x,y,w)=>`<path d="M${x} ${y}h${w}l-12-10m12 10l-12 10" fill="none" stroke="${blue}" stroke-width="4"/>`;
const items=[
 {slug:'z-index-stacking-context-debug',alt:'Two parent stacking contexts with a high-numbered child remaining inside the lower parent layer.',svg:()=>panel('Compare the parent layers',
 rect(150,200,430,280,'#f7f7f8')+m(180,244,'Header / layer 1',25)+rect(182,280,340,155,'#dceaff')+m(208,333,'Menu / 100',28)+bars(208,364,[225,170])+
 rect(620,200,430,280,'#fff',18,blue)+m(650,244,'Page / layer 2',25)+bars(650,290,[330,300,330,245])+m(600,530,'Child values stay local',25,ink,'middle'))},
 {slug:'css-margin-collapse-explained',alt:'A 24 pixel bottom margin and 16 pixel top margin producing one illustrative 24 pixel collapsed gap.',svg:()=>panel('Adjoining positive block margins',
 rect(170,200,530,95,'#dceaff')+t(200,255,'First paragraph',30)+rect(170,295,530,72,'#f4e6b9',0,'#f4e6b9')+rect(170,367,530,95,'#dceaff')+t(200,423,'Next paragraph',30)+
 m(765,250,'24px below',24)+m(765,310,'16px above',24)+arrow(760,346,120)+t(760,407,'24px gap',33)+m(600,527,'Not 40px in this example',24,ink,'middle'))},
 {slug:'css-subgrid-card-alignment',alt:'Two cards with different title lengths sharing aligned body and footer rows through subgrid.',svg:()=>panel('Three shared row tracks',
 rect(155,190,420,316)+rect(625,190,420,316)+t(180,241,'Short title',28)+t(650,241,'A longer title',28)+t(650,278,'on two lines',28)+
 rule(155,299,890)+bars(180,327,[300,225])+bars(650,327,[300,260])+rule(155,412,890)+chip(180,436,185,'Read guide')+chip(650,436,185,'Read guide'))},
 {slug:'css-aspect-ratio-box-sizing',alt:'Two 16 by 9 media boxes at widths of 640 and 320 pixels, illustrating proportional heights of 360 and 180 pixels.',svg:()=>panel('One ratio / two sizes',
 rect(160,211,480,270,'#dceaff')+t(400,341,'16:9',52,blue,'middle')+m(400,389,'640 x 360',26,ink,'middle')+
 rect(735,295,240,135,'#dceaff')+t(855,346,'16:9',32,blue,'middle')+m(855,388,'320 x 180',22,ink,'middle'))},
 {slug:'inspect-css-pseudo-elements',alt:'A heading with a blue decorative accent and a separate inspection panel identifying the before pseudo-element.',svg:()=>panel('Find the owner of the decoration',
 rect(145,215,500,230,'#f7f7f8')+rect(180,270,9,48,blue,4,blue)+t(215,310,'Project details',37)+bars(180,355,[390,290])+
 rect(690,215,365,230)+m(715,260,'::before',28,blue)+m(715,309,'content: ""',24)+m(715,355,'position:',23)+m(715,391,'absolute',23))},
 {slug:'css-multiple-backgrounds-overlay',alt:'A diagram of gradient, photo and base-color layers in front-to-back painting order.',svg:()=>panel('The first image paints on top',
 rect(170,195,700,90,'#e4eaf4')+t(200,249,'1  Translucent gradient',31)+rect(210,300,700,90,'#dceaff')+t(240,354,'2  Background photo',31)+rect(250,405,700,90,'#f1f1f3')+t(280,459,'3  Base color',31))},
 {slug:'prefers-reduced-motion-interface',alt:'A moving button shown with a small lift beside a stationary button that keeps its visible action label.',svg:()=>panel('Keep feedback / reduce movement',
 rect(145,190,430,310)+m(175,237,'No preference',24)+rect(200,325,290,62,'#edf1f6',28,'#edf1f6')+chip(200,306,290,'Save changes','#dceaff',ink)+m(175,466,'Optional lift',24)+
 rect(625,190,430,310)+m(655,237,'Reduced motion',24)+chip(680,325,290,'Save changes','#dceaff',ink)+m(655,466,'Stable position',24))},
 {slug:'accessible-skip-link',alt:'A skip-to-content control above repeated navigation with an arrow leading directly to the main content panel.',svg:()=>panel('Bypass repeated navigation',
 chip(150,177,270,'Skip to content','#dceaff')+rect(150,253,900,76,'#f1f2f5')+m(180,300,'Logo    Features    Pricing    Help',25)+
 rect(150,355,900,156)+t(180,406,'Main content',35)+bars(180,439,[630,475])+`<path d="M110 210v190h30" fill="none" stroke="${blue}" stroke-width="4"/>`)},
 {slug:'native-dialog-keyboard-checklist',alt:'A labeled help dialog over muted page content, with a highlighted close button and Escape key reminder.',svg:()=>panel('Open / focus / close / return',
 rect(145,175,910,345,'#e8ecf2')+bars(170,206,[820,700,800,630,760,700,800,600])+rect(340,215,520,263)+t(375,270,'Export help',34)+bars(375,301,[400,320])+chip(375,385,230,'Close help','#dceaff')+m(660,423,'Esc',27))},
 {slug:'html-form-labels-placeholders',alt:'An email field with a persistent label and separate help text, still visible after an illustrative address is entered.',svg:()=>panel('The label remains after typing',
 t(180,236,'Email address',33)+m(180,285,'We will send the project reply here.',24)+rect(180,318,830,82,'#fff',12,blue)+t(208,370,'team@example.com',31)+m(180,470,'label + input + description',27,blue))},
 {slug:'accessible-form-error-messages',alt:'A project name field with a visible error message connected to the field, preserving the original label.',svg:()=>panel('Name the field / explain the fix',
 t(180,232,'Project name',33)+rect(180,262,830,82,'#fff',12,'#aa3030')+t(180,394,'Enter a project name before continuing.',28,'#8b2020')+m(180,457,'aria-describedby="project-error"',24)+m(180,501,'aria-invalid="true"',24))},
 {slug:'write-alt-text-ui-images',alt:'An illustrative export settings image with SVG selected alongside a concise text description of that meaningful state.',svg:()=>panel('Describe the meaningful state',
 rect(145,205,410,290,'#f7f7f8')+t(180,258,'Export format',30)+chip(180,294,155,'SVG','#dceaff')+chip(355,294,155,'PNG')+bars(180,389,[280,225])+
 rect(605,205,450,290)+m(635,254,'Text alternative',24,blue)+t(635,320,'SVG selected as',29)+t(635,364,'the file format.',29))},
 {slug:'responsive-data-tables',alt:'A narrow scrollable region containing a wider data table with visible column headers and a horizontal scroll indicator.',svg:()=>panel('Keep the table / contain overflow',
 `<defs><clipPath id="tableclip"><rect x="170" y="205" width="860" height="250" rx="12"/></clipPath></defs>`+rect(170,205,860,250)+`<g clip-path="url(#tableclip)">`+
 rect(170,205,1180,62,'#dceaff',0)+m(195,246,'Format',25)+m(460,246,'Typical use',25)+m(780,246,'Review before export',25)+
 m(195,318,'SVG',25)+m(460,318,'Vector icon',25)+m(780,318,'ViewBox and color',25)+rule(170,348,1180)+m(195,401,'PNG',25)+m(460,401,'Raster image',25)+m(780,401,'Pixel dimensions',25)+`</g>`+rect(190,480,820,10,'#e1e1e5',5)+rect(190,480,460,10,blue,5,blue))},
 {slug:'css-long-words-overflow-wrap',alt:'A long filename wrapping over three lines inside a narrow component without changing the underlying text.',svg:()=>panel('Preserve the value / allow wrapping',
 rect(180,207,555,280,'#f7f7f8')+m(212,270,'homepage-navigation-',30)+m(212,319,'component-review-',30)+m(212,368,'notes.txt',30)+m(212,446,'Full value retained',23,blue)+
 m(790,270,'overflow-',25)+m(790,310,'wrap:',25)+t(790,369,'anywhere',28,blue))},
 {slug:'variable-font-axes-css',alt:'A weight-axis specimen showing three example settings, 400, 500 and 700, along a supported range.',svg:()=>panel('Inspect the supported axis range',
 [400,500,700].map((v,i)=>rect(155+i*310,200,270,225)+text(290+i*310,307,'Aa',76,ink,'Inter',v,'middle')+m(290+i*310,380,String(v),27,blue,'middle')).join('')+
 rule(180,475,840)+`<circle cx="660" cy="475" r="10" fill="${blue}"/>`+m(180,525,'300',23)+m(1020,525,'800',23,muted,'end'))},
 {slug:'preload-web-fonts-carefully',alt:'Two schematic resource-discovery timelines comparing a later font request with an earlier preload, without measured timing claims.',svg:()=>panel('Earlier discovery is a hypothesis to test',
 m(160,216,'Baseline',26)+rect(160,240,300,44,'#e4e7ec',8)+rect(485,240,330,44,'#dceaff',8)+m(500,270,'Font request',21)+
 m(160,348,'With preload',26)+rect(160,372,330,44,'#dceaff',8)+m(177,402,'Font request',21)+rect(515,372,300,44,'#e4e7ec',8)+
 arrow(160,470,850)+m(600,527,'Illustrative sequence / not timing data',24,ink,'middle'))},
 {slug:'css-print-styles-guide',alt:'An article screen with navigation beside a simplified print page retaining the title, text and figure.',svg:()=>panel('Keep the content worth saving',
 rect(145,188,430,320,'#f7f7f8')+rect(168,210,384,45,'#dceaff',8)+t(175,297,'Article screen',28)+bars(175,331,[330,280,310])+rect(175,435,170,42,'#e0e5ed',8)+
 rect(665,175,300,350)+t(690,222,'Print view',28)+bars(690,258,[245,220,240,190])+rect(690,400,245,80,'#dceaff',8))},
 {slug:'css-link-underline-styling',alt:'A two-line inline link with underlines that follow both text lines and leave room around the letters.',svg:()=>panel('Test the link when it wraps',
 rect(160,201,880,280,'#f7f7f8')+t(195,265,'Read the typography',45,'#174fa0')+`<path d="M195 281h470" stroke="#174fa0" stroke-width="4"/>`+
 t(195,338,'and spacing guide',45,'#174fa0')+`<path d="M195 354h420" stroke="#174fa0" stroke-width="4"/>`+m(195,434,'offset + thickness + focus',27))},
 {slug:'css-scroll-margin-anchor-links',alt:'A sticky header with a visible clearance gap above the anchor heading, illustrating scroll-margin-top.',svg:()=>panel('Leave room above the destination',
 rect(170,190,860,305,'#f7f7f8')+rect(170,190,860,72,'#dceaff',12)+m(200,235,'Sticky header',27)+rect(170,262,860,65,'#eaf6f0',0,'#eaf6f0')+m(205,305,'scroll-margin-top',24,blue)+t(200,380,'Export options',39)+bars(200,418,[700,580]))},
 {slug:'svg-currentcolor-icons',alt:'Two download buttons in different colors whose inline stroke icons match the button text through currentColor.',svg:()=>panel('One color relationship / two states',
 [0,1].map(i=>{const x=155+i*470,c=i?'#102f65':'#174fa0';return rect(x,240,420,140,'#f7f7f8')+`<path d="M${x+65} 273v48m-15-15 15 15 15-15m-40 22v20h50v-20" stroke="${c}" stroke-width="5" fill="none"/>`+t(x+118,326,'Download',37,c);}).join('')+m(600,475,'stroke="currentColor"',31,blue,'middle'))}
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
  fs.writeFileSync(path.join(root,'content/cover-assets-2026-10-27.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('Generated '+items.length+' original covers and '+items.length*3+' WebP variants.');
})().catch(error=>{console.error(error);process.exitCode=1;});
