"""Keep the exported Next.js pages and static blog on the same site icons."""
from pathlib import Path
import os
import re

ICON_LINKS = '''<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" type="image/x-icon">
<link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png">
<link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">'''


def install_icons(site: Path) -> None:
    for path in site.rglob('*'):
        if path.suffix not in {'.html', '.txt'} or any(part in {'.git', '_blog'} for part in path.relative_to(site).parts):
            continue
        original = path.read_text()
        updated = original
        if path.suffix == '.html' and '</head>' in updated:
            updated = re.sub(r'<link\b[^>]*\brel=["\'](?:icon|shortcut icon|apple-touch-icon)["\'][^>]*>\s*', '', updated)
            updated = updated.replace('</head>', ICON_LINKS + '\n</head>', 1)
        # Next.js also delivers metadata in route payloads and inline JSON strings.
        # Replace only favicon metadata; preserve logo images and organization schema.
        updated = updated.replace('"rel":"icon","href":"/assets/penta-mark.svg"', '"rel":"icon","href":"/favicon.svg","type":"image/svg+xml","sizes":"any"')
        updated = updated.replace(r'\"rel\":\"icon\",\"href\":\"/assets/penta-mark.svg\"', r'\"rel\":\"icon\",\"href\":\"/favicon.svg\",\"type\":\"image/svg+xml\",\"sizes\":\"any\"')
        if updated != original:
            path.write_text(updated)


if __name__ == '__main__':
    install_icons(Path(os.environ.get('PENTA_SITE_ROOT', Path(__file__).resolve().parents[1] / 'site')).resolve())

