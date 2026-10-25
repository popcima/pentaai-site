"""Check generated metadata, structure, assets and internal link targets."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,os,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]; SITE=Path(os.environ.get('PENTA_SITE_ROOT',ROOT/'site')).resolve(); BASE='https://pentaai.site'
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__(convert_charrefs=True);self.links=[];self.assets=[];self.cover_images=[];self.headings=[];self.ids=set();self.meta={};self.canonical=[];self.ld=[];self._ld=False;self._json='';self.feed(s)
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.add(a['id'])
  if t in ['h1','h2','h3','h4','h5','h6']:self.headings.append(int(t[1]))
  if t=='a':self.links.append(a.get('href',''))
  if t=='img':
   assert 'alt' in a,'image missing alt'
   self.assets.append(a.get('src',''))
   if '/blog/covers/' in a.get('src',''):
    self.cover_images.append(a)
    assert a.get('width')=='1200' and a.get('height')=='630','cover missing intrinsic dimensions'
    assert a.get('alt','').strip(),'cover missing descriptive alt text'
    assert a.get('sizes'),'cover missing responsive sizes'
    candidates=[v.strip().split() for v in a.get('srcset','').split(',')]
    assert [c[-1] for c in candidates]==['320w','640w','1200w'],'cover missing responsive candidates'
    self.assets.extend(c[0] for c in candidates)
  if t=='link':
   if a.get('rel')=='canonical':self.canonical.append(a.get('href'))
   if a.get('rel') in ['stylesheet','icon','preload']:self.assets.append(a.get('href',''))
  if t=='script' and a.get('src'):self.assets.append(a['src'])
  if t=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content')
  if t=='script' and a.get('type')=='application/ld+json':self._ld=True;self._json=''
 def handle_data(self,d):
  if self._ld:self._json+=d
 def handle_endtag(self,t):
  if t=='script' and self._ld:self.ld.append(json.loads(self._json));self._ld=False

def resolve(path,current):
 path=unquote(path)
 p=SITE/path.lstrip('/') if path.startswith('/') else current.parent/path
 if path.endswith('/') or p.is_dir():p=p/'index.html'
 return p
fail=[];checked=0
posts=json.loads((ROOT/'content/posts.json').read_text()); slugs={p['slug'] for p in posts}
for f in sorted((SITE/'blog').rglob('*.html')):
 try:
  s=f.read_text();p=Page(s);checked+=1
  expected=BASE+'/'+str(f.parent.relative_to(SITE)).strip('/')+'/'
  assert p.headings.count(1)==1,'expected one h1'
  assert all(b<=a+1 for a,b in zip(p.headings,p.headings[1:])),f'heading jump {p.headings}'
  assert p.canonical==[expected],f'canonical {p.canonical}'
  for k in ['description','viewport','og:title','og:description','og:image','og:url','twitter:card']:
   assert p.meta.get(k),f'missing {k}'
  assert p.meta['og:url']==expected,'OG URL mismatch'
  assert p.ld,'missing structured data'
  assert p.cover_images,'missing interface cover'
  assert '/blog/covers/' in p.meta['og:image'],'social image must use an interface cover'
  assert '/blog/photos/' not in s and 'AI-generated editorial image' not in s,'obsolete photo reference'
  if f.parent.name in slugs:
   assert any('chromewebstore.google.com/detail/penta-ai-' in u for u in p.links),'missing extension CTA'
   assert 'Download Penta AI for Chrome' in s,'missing explicit download label'
   nodes=p.ld[0].get('@graph',[p.ld[0]])
   assert any(x.get('@type')=='BlogPosting' for x in nodes),'missing BlogPosting'
  for u in p.links+p.assets+[p.meta['og:image']]:
   a=urlsplit(u)
   if a.scheme and not u.startswith(BASE):continue
   target=resolve(a.path,f) if a.path else f
   assert target.is_file(),f'missing local target {u}'
   if a.fragment and target.suffix=='.html':assert a.fragment in Page(target.read_text()).ids,f'missing fragment {u}'
 except Exception as e:fail.append({'file':str(f.relative_to(SITE)),'error':str(e)})
for file in ['sitemap.xml','feed.xml']:
 try:ET.parse(SITE/file)
 except Exception as e:fail.append({'file':file,'error':str(e)})
report={'html_pages_checked':checked,'articles':len(posts),'failures':fail,'status':'PASS' if not fail else 'FAIL'}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
raise SystemExit(1 if fail else 0)
