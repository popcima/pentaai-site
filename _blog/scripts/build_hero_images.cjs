#!/usr/bin/env node
/** Rebuild original 1200×630 educational diagrams and social previews.
 * Requires sharp. Run `node scripts/build_hero_images.cjs` from any directory.
 * All artwork is authored here; no remote images, fonts, or assets are fetched.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const {text: outlinedText} = require('./svg_text.cjs');
const root = path.resolve(__dirname, '..');
const imageDir = path.join(process.env.PENTA_SITE_ROOT || path.join(root, 'site'), 'blog', 'images');
fs.mkdirSync(imageDir, {recursive: true});
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// Light homepage framing; example swatch fills are preserved verbatim.
const ink = fill => ['#b5e7c4','#9de4b8'].includes(fill) ? '#0f7fff' : ['#d8efdf','#edf2e9','#f1f3ed','#d6e4d9','#17251c'].includes(fill) ? '#101013' : '#6e6e73';
const text = (x,y,value,size=22,fill='#101013',family='Inter',weight=400) => outlinedText(x,y,value,size,fill==='#101013'?fill:ink(fill),family,weight);
const mono = (x,y,value,size=18,fill='#6e6e73') => text(x,y,value,size,fill,'Geist Mono');
const surfaces = {'#17251c':'#fff','#111c15':'#fff','#101b14':'#fff','#263f2e':'#e9e8ea','#203b2a':'#e8f2ff','#7d9986':'#b9babe','#465e4e':'#d6d5d7'};
const rect = (x,y,w,h,fill='#fff',stroke='#e0dfe1',r=12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${surfaces[fill]||fill}" stroke="${stroke==='none'?'none':'#d9dadd'}"/>`;
const line = (x1,y1,x2,y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#e0dfe1" fill="none"/>`;
const arrow = (x1,y1,x2,y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#0f7fff" stroke-width="2" marker-end="url(#arrow)"/>`;
const frame = (number,topic,title,subtitle,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="none" stroke="#0f7fff"/></marker></defs><rect width="1200" height="630" fill="#f5f5f5"/><path d="M62 86H1138M62 573H1138" stroke="#dedee0"/><circle cx="68" cy="50" r="5" fill="#0f7fff"/>${mono(86,56,'PENTA AI  /  FIELD NOTES',15,'#6e6e73')}${mono(912,56,`${number}  /  ${topic}`,13,'#6e6e73')}${text(62,157,title,50,'#101013','Inter',400)}${text(64,198,subtitle,20,'#6e6e73')}${body}${mono(64,607,'pentaai.site/blog',14)}${mono(877,607,'ILLUSTRATIVE EXAMPLE',12,'#6e6e73')}</svg>`;

const diagrams = [
  {
    name:'design-system', slug:'extract-design-system-from-website',
    alt:'A website reference connects to four reusable design-system layers: color, typography, spacing and shape.',
    svg:frame('01','SYSTEMS','From a page to a design system.','Inspect the evidence. Name the patterns. Build reusable rules.',
      rect(64,254,244,267,'#111c15','#58755f')+mono(83,282,'PAGE REFERENCE',13)+line(64,298,308,298)+rect(85,319,202,23,'#b5e7c4','none')+rect(85,355,134,7,'#7d9986','none')+rect(85,373,172,7,'#465e4e','none')+rect(85,404,93,73,'#263f2e','#465e4e',7)+rect(190,404,97,73,'#263f2e','#465e4e',7)+arrow(332,387,384,387)+
      [['COLOR','--color-action','#b5e7c4'],['TYPE','--font-heading','Aa'],['SPACE','--space-section','64px'],['SHAPE','--radius-card','12px']].map((v,i)=>{const x=414+i*184;return rect(x,254,166,267)+mono(x+17,284,v[0],13)+line(x,302,x+166,302)+(i===0?rect(x+35,334,96,84,v[2],'none',0):text(x+23,397,v[2],i===1?74:32,'#d8efdf',i===1?'Georgia, serif':'Arial, sans-serif'))+mono(x+14,469,v[1],11)+text(x+16,495,['Semantic roles','Rendered styles','Repeated rhythm','Shared geometry'][i],12,'#a9b6ac');}).join(''))
  },
  {
    name:'typography', slug:'find-font-on-website',
    alt:'A typography specimen shows the distinction between a declared font-family list and the font actually rendered by the browser.',
    svg:frame('02','TYPOGRAPHY','Find the font behind the letters.','Check the rendered font, then inspect the CSS that shapes it.',
      rect(64,254,462,267,'#17251c','#52745c')+text(105,432,'Aa.',170,'#d8efdf','Georgia, serif')+mono(105,491,'A TYPE SPECIMEN',13)+line(562,254,562,521)+mono(602,281,'DECLARED FONT FAMILY',13)+text(602,322,'"Example Serif", Georgia, serif',24,'#edf2e9')+mono(602,376,'RENDERED FONT',13)+text(602,414,'The font the browser actually used',22,'#b5e7c4')+mono(602,467,'ALSO CHECK',13)+text(602,501,'Weight  ·  Size  ·  Line height',23,'#d6e4d9'))
  },
  {
    name:'color-palette', slug:'extract-website-color-palette',
    alt:'Five example website colors are organized into background, surface, text, accent and border roles.',
    svg:frame('03','COLOR','Turn colors into a useful palette.','Capture what is visible, then assign a role to each color.',
      [['BACKGROUND','#0B100C'],['SURFACE','#17251C'],['TEXT','#F1F3ED'],['ACCENT','#B5E7C4'],['BORDER','#3B5443']].map((v,i)=>{const x=64+i*217;return rect(x,256,202,180,v[1],'#52745c')+mono(x,471,v[0],13)+text(x,507,v[1],23,'#d6e4d9');}).join(''))
  },
  {
    name:'css-inspection', slug:'inspect-website-css',
    alt:'A selected example button connects to CSS declarations for padding, border radius and background color.',
    svg:frame('04','CSS','Understand what the browser renders.','Select an element. Read the winning declarations. Test a change.',
      rect(64,254,420,267,'#111c15','#52745c')+mono(86,283,'SELECTED ELEMENT',13)+line(64,300,484,300)+rect(134,342,280,105,'#203b2a','#8fbfa0')+rect(153,361,242,67,'#b5e7c4','none',8)+text(203,403,'Example button',21,'#17251c')+mono(134,485,'padding 16px 24px',14)+arrow(504,388,568,388)+rect(597,254,539,267,'#101b14','#52745c')+mono(620,285,'STYLES',13)+line(597,300,1136,300)+mono(622,343,'.button {',20,'#b5e7c4')+mono(646,381,'padding: 16px 24px;',20)+mono(646,419,'border-radius: 8px;',20)+mono(646,457,'background: var(--accent);',20)+mono(622,495,'}',20,'#b5e7c4'))
  },
  {
    name:'tailwind-tokens', slug:'website-design-tokens-to-tailwind',
    alt:'An observed accent color and spacing value are mapped to named Tailwind v4 theme variables and corresponding utility classes.',
    svg:frame('05','TOKENS','From observed styles to theme tokens.','Give values a name, then use the same rules across your interface.',
      rect(64,254,293,266,'#17251c','#52745c')+mono(86,285,'OBSERVED VALUES',13)+line(64,301,357,301)+rect(88,332,54,54,'#b5e7c4','none')+mono(164,366,'#b5e7c4',20)+mono(88,435,'section gap',15)+text(88,482,'64px',35,'#edf2e9')+arrow(380,387,430,387)+rect(459,254,677,266,'#101b14','#52745c')+mono(483,285,'TAILWIND CSS V4',13)+line(459,301,1136,301)+mono(483,343,'@theme {',21,'#b5e7c4')+mono(505,382,'--color-accent: #b5e7c4;',21)+mono(505,421,'--spacing-section: 4rem;',21)+mono(483,460,'}',21,'#b5e7c4')+mono(483,499,'bg-accent     gap-section',16,'#d6e4d9'))
  },
  {
    name:'design-md', slug:'design-md-for-ai',
    alt:'A DESIGN.md document organizes colors, typography, spacing and component states into an explicit brief for an AI coding tool.',
    svg:frame('06','AI BRIEFS','A clearer brief for your coding agent.','Write down the visual decisions that a screenshot leaves ambiguous.',
      rect(64,254,440,267,'#17251c','#52745c')+mono(87,286,'OBSERVE',13)+line(64,301,504,301)+[['Colors','roles + values'],['Typography','family + scale'],['Layout','spacing + limits'],['Components','states + behavior']].map((v,i)=>text(87,342+i*46,v[0],20,'#edf2e9')+mono(257,341+i*46,v[1],13)).join('')+arrow(526,387,580,387)+rect(609,254,527,267,'#101b14','#52745c')+mono(633,286,'DESIGN.md',16,'#b5e7c4')+line(609,301,1136,301)+mono(633,342,'# Project design brief',20,'#edf2e9')+mono(633,381,'## Colors and typography',19)+mono(633,420,'## Spacing and layout',19)+mono(633,459,'## Component states',19)+mono(633,498,'## Acceptance checks',19))
  }
];

(async()=>{
  for(const diagram of diagrams){
    const svgPath=path.join(imageDir,diagram.name+'.svg');
    const webpPath=path.join(imageDir,diagram.name+'.webp');
    fs.writeFileSync(svgPath,diagram.svg);
    await sharp(Buffer.from(diagram.svg)).webp({quality:91}).toFile(webpPath);
    const meta=await sharp(webpPath).metadata();
    if(meta.width!==1200||meta.height!==630)throw new Error('Unexpected image dimensions: '+diagram.name);
    process.stdout.write(`${diagram.name}.webp: ${meta.width}×${meta.height}\n`);
  }
  const postsPath=path.join(root,'content','posts.json');
  const posts=JSON.parse(fs.readFileSync(postsPath,'utf8'));
  for(const diagram of diagrams){
    const post=posts.find(item=>item.slug===diagram.slug);
    if(!post)throw new Error('No post matching '+diagram.slug);
    post.image='/blog/images/'+diagram.name+'.webp';
    post.showImage=true;
    post.imageAlt=diagram.alt;
  }
  fs.writeFileSync(postsPath,JSON.stringify(posts,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
