#!/usr/bin/env node
/** Format the existing Penta brand mark for browser tabs and home screens. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const site = path.resolve(process.env.PENTA_SITE_ROOT || path.join(__dirname, '../site'));
const mark = fs.readFileSync(path.join(site, 'assets/penta-mark.svg'), 'utf8');
const artwork = mark.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#101013"/><g transform="translate(28 19) scale(1.125)">${artwork}</g></svg>\n`;

(async () => {
  fs.writeFileSync(path.join(site, 'favicon.svg'), svg);
  for (const [name, size] of [['favicon-96x96.png', 96], ['apple-touch-icon.png', 180]]) {
    await sharp(Buffer.from(svg)).resize(size, size).flatten({background:'#101013'}).png().toFile(path.join(site, name));
  }
  // PNG-compressed ICO frames are supported by modern browsers and Windows.
  const sizes = [16, 32, 48];
  const frames = await Promise.all(sizes.map(size => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach((frame, i) => {
    const entry = 6 + i * 16;
    header[entry] = header[entry + 1] = sizes[i];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frame.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += frame.length;
  });
  fs.writeFileSync(path.join(site, 'favicon.ico'), Buffer.concat([header, ...frames]));
  console.log('Built SVG, 96px PNG, 180px Apple touch icon and 16/32/48px ICO.');
})().catch(error => { console.error(error); process.exitCode = 1; });

