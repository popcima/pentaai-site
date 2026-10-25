"""Add a blog entry and metadata to this supplied static Next.js export.
A fresh Next.js source build must incorporate these changes in source instead.
"""
from pathlib import Path
import hashlib,json,re,os
from site_icons import install_icons
site=Path(os.environ.get('PENTA_SITE_ROOT',Path(__file__).resolve().parents[1]/'site')).resolve()
home=site/'index.html'
s=home.read_text()
if '<!-- penta-blog-meta -->' not in s:
 data={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':'https://pentaai.site/#organization','name':'Penta AI','url':'https://pentaai.site/','logo':'https://pentaai.site/assets/penta-mark.svg'},{'@type':'WebSite','@id':'https://pentaai.site/#website','name':'Penta AI','url':'https://pentaai.site/','publisher':{'@id':'https://pentaai.site/#organization'}}]}
 meta='<!-- penta-blog-meta --><link rel="canonical" href="https://pentaai.site/"/><meta property="og:title" content="Penta AI: Inspect Website Colors, Fonts and CSS"/><meta property="og:description" content="Explore Penta AI for Chrome and practical guides to inspecting website typography, colors, CSS and design tokens."/><meta property="og:type" content="website"/><meta property="og:url" content="https://pentaai.site/"/><meta property="og:image" content="https://pentaai.site/blog/images/design-system.webp"/><meta name="twitter:card" content="summary_large_image"/><script type="application/ld+json">'+json.dumps(data,separators=(',',':'))+'</script>'
 s=s.replace('</head>',meta+'</head>',1)
 old='<nav class="header-nav" aria-label="Main navigation" id="main-navigation"><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#faq">FAQs</a></nav>'
 new=old.replace('</nav>','<a href="/blog/">Blog</a></nav>')
 if old not in s: raise SystemExit('Unexpected home navigation: review the export before patching.')
 s=s.replace(old,new,1);home.write_text(s)
oldfile=site/'_next/static/chunks/app/page-9211f3857300919a.js'
original=oldfile.read_text()
old='children:[["Features","features"],["Pricing","pricing"],["FAQs","faq"]].map(([e,n])=>(0,o.jsx)("a",{href:`#${n}`'
new='children:[["Features","features"],["Pricing","pricing"],["FAQs","faq"],["Blog","/blog/"]].map(([e,n])=>(0,o.jsx)("a",{href:n.startsWith("/")?n:`#${n}`'
if old not in original: raise SystemExit('Unexpected client bundle: review before patching.')
updated=original.replace(old,new,1)
name='page-'+hashlib.sha256(updated.encode()).hexdigest()[:16]+'.js'
newfile=oldfile.with_name(name);newfile.write_text(updated)
for p in site.rglob('*'):
 if p.is_file() and p.suffix in {'.html','.txt','.js','.json'} and p!=oldfile and p!=newfile:
  txt=p.read_text();revised=txt.replace(oldfile.name,name)
  if revised!=txt:p.write_text(revised)
print('Home Blog link, canonical, social metadata, organization schema integrated; client bundle:',name)
install_icons(site)
