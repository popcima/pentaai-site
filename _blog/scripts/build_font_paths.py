#!/usr/bin/env python3
"""Refresh bundled illustration glyph paths from the site's exact local fonts.

Optional authoring dependency: fonttools and brotli. Normal illustration builds
use the committed JSON paths and sharp only; no OS fonts or web fonts are used.
"""
from pathlib import Path
import hashlib
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
CHARACTERS = ''.join(chr(n) for n in range(32, 127)) + '·×—–→↗↓“”’'
FACES = [
    ('inter400', 'inter-latin.woff2', 400),
    ('inter500', 'inter-latin.woff2', 500),
    ('inter600', 'inter-latin.woff2', 600),
    ('inter700', 'inter-latin.woff2', 700),
    ('mono400', 'geist-mono.woff2', 400),
    ('serif400', 'instrument-serif.woff2', 400),
]
result = {'description': 'Glyph outlines from supplied local fonts; no OS fallback.', 'fonts': {}}
for key, filename, weight in FACES:
    path = ROOT / 'site/fonts' / filename
    font = TTFont(path)
    glyphs = font.getGlyphSet(location={'wght': weight} if 'fvar' in font else None)
    cmap = font.getBestCmap()
    encoded = {}
    for char in CHARACTERS:
        if ord(char) not in cmap:
            continue
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        encoded[char] = {'path': pen.getCommands(), 'width': glyph.width}
    result['fonts'][key] = {'source': '/fonts/' + filename, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'weight': weight, 'unitsPerEm': font['head'].unitsPerEm, 'glyphs': encoded}
(ROOT / 'scripts/illustration-fonts.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print('Wrote exact font paths for', len(result['fonts']), 'faces')
