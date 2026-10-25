'use strict';
// Source text remains editable in illustration scripts. SVG glyphs use the
// project's exact font outlines, so rasterization cannot substitute OS fonts.
const data = require('./illustration-fonts.json');
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const faceFor = (family='Inter', weight=400) => /mono/i.test(family) ? 'mono400' : /georgia|instrument/i.test(family) || (/serif/i.test(family) && !/sans-serif/i.test(family)) ? 'serif400' : `inter${[400,500,600,700].reduce((a,b)=>Math.abs(b-weight)<Math.abs(a-weight)?b:a,400)}`;
function textWidth(value,size=22,family='Inter',weight=400){const font=data.fonts[faceFor(family,weight)];return [...String(value)].reduce((sum,char)=>{if(!font.glyphs[char])throw new Error('Missing exact glyph: '+char);return sum+font.glyphs[char].width},0)*size/font.unitsPerEm;}
function text(x,y,value,size=22,fill='#101013',family='Inter',weight=400,anchor='start'){
  const font=data.fonts[faceFor(family,weight)];const width=textWidth(value,size,family,weight);if(anchor==='middle')x-=width/2;if(anchor==='end')x-=width;
  let cursor=0;
  const paths=[...String(value)].map(char=>{const glyph=font.glyphs[char];if(!glyph)throw new Error('Missing exact glyph: '+char);const path=glyph.path?`<path transform="translate(${cursor} 0)" d="${glyph.path}"/>`:'';cursor+=glyph.width;return path;}).join('');
  return `<g aria-label="${escape(value)}" data-font="${faceFor(family,weight)}" fill="${fill}" transform="translate(${x} ${y}) scale(${size/font.unitsPerEm} ${-size/font.unitsPerEm})">${paths}</g>`;
}
module.exports={text,textWidth,escape};
