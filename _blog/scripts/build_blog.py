#!/usr/bin/env python3
"""Build Penta AI's dependency-free static blog from content/posts.json.

Usage: python3 scripts/build_blog.py [--publish-date YYYY-MM-DD]
The output site/ directory is a GitHub Pages deployable artifact. Existing
homepage files are deliberately outside this generator's ownership.
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
from email.utils import format_datetime
from html import escape, unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from site_icons import ICON_LINKS

ROOT = Path(__file__).resolve().parents[1]
SITE = Path(os.environ.get("PENTA_SITE_ROOT", ROOT / "site")).resolve()
BASE = "https://pentaai.site"
EXTENSION = "https://chromewebstore.google.com/detail/penta-ai-%E2%80%94-design-inspect/eegbmfbkbanoplfkokflhinkcemmkjjp"
# Keep reusable blog styling separate from the HTML templates.
CSS = (ROOT / 'scripts/blog.css').read_text(encoding='utf-8')

JS = r'''
(() => {
  'use strict';
  // Navigation is shared by every page, including pages without search.
  const menu = document.getElementById('navigation-toggle');
  const navigation = document.getElementById('main-navigation');
  if (menu && navigation) {
    const setOpen = (open, restoreFocus = false) => {
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.textContent = open ? '×' : '☰';
      navigation.classList.toggle('open', open);
      if (restoreFocus) menu.focus();
    };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
      if (open) navigation.querySelector('a').focus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setOpen(false, true);
      }
    });
    document.addEventListener('click', event => {
      if (!navigation.contains(event.target) && !menu.contains(event.target)) setOpen(false);
    });
    navigation.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });
    navigation.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!navigation.contains(document.activeElement) && document.activeElement !== menu) setOpen(false);
      });
    });
    window.matchMedia('(max-width: 440px)').addEventListener('change', () => setOpen(false));
    // Without JS, the mobile navigation remains a visible, wrapping link row.
    document.documentElement.classList.add('js-enabled');
  }
  const search = document.getElementById('guide-search');
  if (!search) return;
  const tools = document.querySelectorAll('.search-tools');
  tools.forEach(el => { el.hidden = false; });
  const rows = [...document.querySelectorAll('#guide-list .article-row')];
  const filters = [...document.querySelectorAll('.filter')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty-state');
  let category = 'all';
  const normalize = text => text.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  function update() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    rows.forEach(row => {
      const match = (category === 'all' || row.dataset.category === category) && words.every(word => normalize(row.dataset.search).includes(word));
      row.hidden = !match;
      if (match) visible++;
    });
    count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}${category === 'all' ? '' : ' in ' + category}${search.value.trim() ? ' matching “' + search.value.trim() + '”' : ''}`;
    empty.hidden = visible !== 0;
  }
  search.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    update();
  }));
  document.getElementById('reset-search').addEventListener('click', () => {
    search.value = '';
    category = 'all';
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.dataset.category === 'all')));
    update();
    search.focus();
  });
  update();
})();
'''


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data):
        self.parts.append(data)


def plain(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()


def json_ld(data) -> str:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def pretty_date(value: str) -> str:
    d = date.fromisoformat(value)
    return f"{d.day} {d.strftime('%B %Y')}"


def url(post: dict) -> str:
    return f"/blog/{post['slug']}/"


def org() -> dict:
    return {"@type": "Organization", "@id": BASE + "/#organization", "name": "Penta AI", "url": BASE + "/", "logo": {"@type": "ImageObject", "url": BASE + "/assets/penta-mark.svg"}}


def chrome_icon(monochrome=False) -> str:
    colors = ["currentColor"] * 3 if monochrome else ["#FDD24B", "#EA4335", "#34A853"]
    center = "#fff" if monochrome else "#4285F4"
    spokes = '<path d="m3 7 5 8m4 8 5-9m5-7H12" stroke="#fff" stroke-width="1.2"/>' if monochrome else ''
    return f'<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="{colors[0]}"/><path d="M12 1a11 11 0 0 1 9.5 5.5H12a5.5 5.5 0 0 0-4.8 8.2L2.5 6.5A11 11 0 0 1 12 1Z" fill="{colors[1]}"/><path d="M2.5 6.5 7.2 14.7A5.5 5.5 0 0 0 16.8 14.7L12 23A11 11 0 0 1 2.5 6.5Z" fill="{colors[2]}"/><circle cx="12" cy="12" r="5" fill="{center}" stroke="#fff" stroke-width="1.4"/>{spokes}</svg>'


def cursor_icon() -> str:
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 3 7.1 18 2.6-7.3L21 11 4 3Z"/></svg>'


def brand() -> str:
    return '<a class="brand" href="/" aria-label="Penta AI home"><span class="brand-icon"><img src="/assets/penta-mark.svg" width="21" height="24" alt="" aria-hidden="true"></span><span>Penta AI</span></a>'


def header(active: str = "blog") -> str:
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap header-inner">{brand()}
<nav class="header-nav" aria-label="Main navigation" id="main-navigation"><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/#faq">FAQs</a><a href="/blog/" aria-current="{'page' if active == 'blog' else 'location'}">Blog</a></nav>
<a class="plain-button get-link" href="{EXTENSION}">{chrome_icon(monochrome=True)}<span>Get Penta AI</span></a><button class="menu-button" type="button" id="navigation-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="main-navigation">☰</button></div></header>'''


def footer() -> str:
    return f'''<footer class="site-footer"><div class="wrap footer-inner"><div>{brand()}<p class="footer-note">© 2026 Penta AI</p></div><div class="footer-links"><nav aria-label="Footer navigation" class="footer-nav"><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/#faq">FAQs</a><a href="/blog/">Blog</a><a href="/privacy/">Privacy</a></nav><nav aria-label="Blog resources" class="footer-nav footer-secondary"><a href="/blog/about/">Editorial policy</a><a href="/feed.xml">RSS feed</a><a href="/privacy/#your-choices">Data deletion</a></nav><a class="plain-button get-link" href="{EXTENSION}">{chrome_icon(monochrome=True)}Get Penta AI</a></div></div></footer>'''


def document(title: str, description: str, path: str, content: str, schema: dict, *, article=False, image=None, image_alt=None, published=None, active="blog") -> str:
    social_image = image or "/blog/images/design-system.webp"
    social_image = social_image if social_image.startswith("https://") else BASE + social_image
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title><meta name="description" content="{escape(description, quote=True)}"><link rel="canonical" href="{BASE}{path}">
<meta name="theme-color" content="#0b0d0b"><meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:site_name" content="Penta AI"><meta property="og:locale" content="en_US"><meta property="og:title" content="{escape(title, quote=True)}"><meta property="og:description" content="{escape(description, quote=True)}"><meta property="og:url" content="{BASE}{path}"><meta property="og:image" content="{escape(social_image, quote=True)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{escape(image_alt or title, quote=True)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(title, quote=True)}"><meta name="twitter:description" content="{escape(description, quote=True)}"><meta name="twitter:image" content="{escape(social_image, quote=True)}">
{f'<meta property="article:published_time" content="{published}">' if published else ''}
{ICON_LINKS}<link rel="alternate" type="application/rss+xml" title="Penta AI Guides" href="/feed.xml">
<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/blog/blog.css"><script type="application/ld+json">{json_ld(schema)}</script><script src="/blog/blog.js" defer></script>
</head><body>{header(active)}{content}{footer()}</body></html>'''


def cover_image(post: dict, *, sizes: str, eager=False) -> str:
    """Responsive interface illustration; diagram metadata remains separate."""
    source = post.get("cover")
    if not source:
        return ''
    variants = []
    for field, width in [("coverThumbnail", 320), ("coverSmall", 640), ("cover", 1200)]:
        if post.get(field):
            variants.append(f"{escape(post[field], quote=True)} {width}w")
    priority = ' fetchpriority="high"' if eager else ''
    return f'<img src="{escape(source, quote=True)}" srcset="{", ".join(variants)}" sizes="{escape(sizes, quote=True)}" alt="{escape(post.get("coverAlt", "Illustrative interface example."), quote=True)}" width="{post.get("coverWidth", 1200)}" height="{post.get("coverHeight", 630)}" loading="{"eager" if eager else "lazy"}" decoding="async"{priority}>'


def art(post: dict, feature=False) -> str:
    if post.get("cover"):
        if feature:
            return '<div class="feature-cover">' + cover_image(post, sizes='(max-width: 639px) calc(100vw - 56px), (max-width: 1100px) 46vw, 480px', eager=True) + '</div>'
        return '<div class="row-cover">' + cover_image(post, sizes='(max-width: 639px) calc(100vw - 32px), 180px') + '</div>'
    if feature:
        return '''<div class="feature-art" aria-hidden="true"><div class="specimen"><div class="specimen-top"><span>DESIGN FIELD NOTES</span><span>001 — WEB</span></div><div class="specimen-type">Aa.</div><div class="specimen-sub">TYPE · COLOR · SPACE<br>Understand the details.</div><div class="specimen-swatches"><i></i><i></i><i></i><i></i><i></i></div><div class="specimen-bottom"><span>FROM PIXELS TO PATTERNS</span><span>↗</span></div></div></div>'''
    term = (post["title"] + post["category"]).lower()
    if "color" in term or "palette" in term:
        return '<div class="row-art palette" aria-hidden="true">' + ''.join(f'<b style="--swatch:{c}"></b>' for c in ["#e7efdf", "#b5e7c4", "#86b197", "#527b60", "#34533f"]) + '</div>'
    if "font" in term or "type" in term:
        return '<div class="row-art" aria-hidden="true">Ag.</div>'
    if "token" in term or "system" in term:
        return '<div class="row-art tokens" aria-hidden="true"><i style="--r:0"></i><i style="--r:4px"></i><i style="--r:50%"></i></div>'
    if "asset" in term or "svg" in term:
        return '<div class="row-art assets" aria-hidden="true">.svg</div>'
    return '<div class="row-art code" aria-hidden="true">{ design }</div>'


def row(post: dict, index: int, related=False) -> str:
    searchable = f"{post['title']} {post['description']} {post['category']} {post['keyword']}"
    return f'''<article class="article-row{' has-cover' if post.get('cover') else ''}" data-category="{escape(post['category'], quote=True)}" data-search="{escape(searchable, quote=True)}"><span class="row-number" aria-hidden="true">{index:02}</span><div class="row-copy"><div class="row-meta"><span>{escape(post['category'])}</span><span class="row-time">{post['readMinutes']} min read</span></div><h3><a href="{url(post)}">{escape(post['title'])}</a></h3><p>{escape(post['description'])}</p></div>{art(post) if post.get('cover') or not related else ''}<span class="row-arrow" aria-hidden="true">↗</span></article>'''


def build_index(posts: list[dict]) -> str:
    first = posts[0]
    categories = list(dict.fromkeys(p["category"] for p in posts))
    controls = '<button class="filter" type="button" data-category="all" aria-pressed="true">All guides</button>' + ''.join(f'<button class="filter" type="button" data-category="{escape(c, quote=True)}" aria-pressed="false">{escape(c)}</button>' for c in categories)
    content = f'''<main id="main" class="wrap"><section class="home-hero" aria-labelledby="blog-title"><div class="eyebrow">Colors · Fonts · CSS · Design systems</div><h1 id="blog-title">Good design.<br>Under the <span class="sticker">surface</span>.</h1><p class="hero-note">Practical guides to the fonts, colors, CSS and systems that make websites work.</p><div class="hero-ctas"><a class="glossy-button blue-button" href="#guides">{cursor_icon()}Browse guides</a><a class="glossy-button" href="{EXTENSION}">{chrome_icon()}Get Penta AI</a></div></section>
<section class="featured" aria-labelledby="featured-title"><div class="feature-copy"><span class="feature-kicker">Start here / {escape(first['category'])}</span><h2 id="featured-title"><a href="{url(first)}">{escape(first['title'])}</a></h2><p>{escape(first['description'])}</p><a class="glossy-button blue-button" href="{url(first)}">{cursor_icon()}Read guide</a></div>{art(first, feature=True)}</section>
<section id="guides" aria-labelledby="all-guides-title"><div class="section-heading"><h2 id="all-guides-title">The guide library</h2><div class="search-tools" hidden><label class="searchbox" for="guide-search"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="m12 12 5 5" stroke="currentColor" stroke-width="1.2"/></svg><input type="search" id="guide-search" placeholder="Search guides" aria-label="Search guides" autocomplete="off"></label></div></div><div class="search-tools" hidden><div class="filterbar" role="group" aria-label="Filter guides by topic">{controls}</div><p id="result-count" class="result-count" role="status" aria-live="polite">{len(posts)} guides</p></div><noscript><p class="noscript">All guides are listed below. Search and topic filters are available with JavaScript enabled.</p></noscript><div class="article-list" id="guide-list">{''.join(row(p, i + 1) for i, p in enumerate(posts))}</div><div id="empty-state" class="empty-state" hidden><h3>No matching guides yet.</h3><p>Try a broader topic such as fonts, colors, CSS or design tokens.</p><button id="reset-search" class="reset-search glossy-button" type="button">Clear search and filters</button></div></section>
<aside class="editorial-band"><div><span class="section-label">A practical point of view</span><h2>Learn what you’re looking at.</h2><p>Each guide turns a visual detail into a repeatable workflow, with examples, browser tools and links to primary documentation.</p></div><div><span class="section-label">Made for curious builders</span><p>For designers inspecting a reference, developers rebuilding a component, and anyone turning a website into a clearer brief. <a href="/blog/about/">Read our editorial approach</a>.</p></div></aside></main>'''
    schema = {"@context": "https://schema.org", "@graph": [org(), {"@type": "Blog", "@id": BASE + "/blog/#blog", "name": "Penta AI Guides", "description": "Practical guides to website fonts, colors, CSS, and design systems.", "url": BASE + "/blog/", "inLanguage": "en", "publisher": {"@id": BASE + "/#organization"}, "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": BASE + url(p)} for p in posts]}]}
    return document("Website Design, CSS & Design System Guides | Penta AI", "Learn how to identify website fonts, extract color palettes, inspect CSS and build design tokens with practical guides from Penta AI.", "/blog/", content, schema, image=first.get("cover"), image_alt=first.get("coverAlt"))


def add_heading_ids(body: str) -> tuple[str, list[tuple[str, str]]]:
    headings = []
    used = set()
    def convert(match):
        attrs, text = match.group(1), match.group(2)
        existing = re.search(r'\bid=["\']([^"\']+)["\']', attrs)
        ident = existing.group(1) if existing else re.sub(r"[^a-z0-9]+", "-", plain(text).lower()).strip("-") or "section"
        original, n = ident, 2
        while ident in used:
            ident = f"{original}-{n}"
            n += 1
        used.add(ident)
        if existing:
            attrs = re.sub(r'\s*\bid=["\'][^"\']+["\']', '', attrs)
        headings.append((ident, plain(text)))
        return f'<h2{attrs} id="{escape(ident, quote=True)}">{text}</h2>'
    return re.sub(r"<h2([^>]*)>(.*?)</h2>", convert, body, flags=re.S), headings


def build_article(post: dict, posts: list[dict], publish_date: str | None) -> str:
    publish_date = post.get("published") or publish_date
    body, headings = add_heading_ids(post["body"])
    body = re.sub(r"(<table\b.*?</table>)", r'<div class="table-scroll">\1</div>', body, flags=re.S)
    actual_date = publish_date or post["date"]
    date_label = "Published" if publish_date else "Prepared"
    toc = ''.join(f'<li><a href="#{escape(ident, quote=True)}">{escape(text)}</a></li>' for ident, text in headings)
    related_slugs = post.get("related", [])
    related = [p for p in posts if p["slug"] in related_slugs and p["slug"] != post["slug"]]
    if not related:
        related = [p for p in posts if p["slug"] != post["slug"]][:3]
    image_markup = f'<figure class="article-diagram"><img src="{escape(post["image"], quote=True)}" alt="{escape(post.get("imageAlt", post["title"]), quote=True)}" width="1200" height="630" loading="lazy" decoding="async"><figcaption>Original explanatory diagram. Values and layouts are illustrative.</figcaption></figure>' if post.get("showImage") and post.get("image") else ''
    # Keep the original diagram after the first section, rather than stacking
    # two large visuals before readers can reach the article's answer.
    section_starts = list(re.finditer(r'<h2\b', body))
    insertion = section_starts[1].start() if len(section_starts) > 1 else len(body)
    body = body[:insertion] + image_markup + body[insertion:]
    cover_markup = '<figure class="article-cover">' + cover_image(post, sizes='(max-width: 639px) calc(100vw - 32px), (max-width: 1100px) calc(100vw - 48px), 1024px', eager=True) + '<figcaption>Illustrative interface example. <a href="/blog/about/#visuals">About our visuals</a>.</figcaption></figure>' if post.get("cover") else ''
    content = f'''<main id="main" class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Guides</a><span aria-hidden="true">/</span><span aria-current="page">{escape(post['category'])}</span></nav>
<header class="article-header"><div class="eyebrow">{escape(post['category'])}</div><h1>{escape(post['title'])}</h1><p class="article-deck">{escape(post['description'])}</p><div class="article-byline"><a href="/blog/about/">By Penta AI</a><span>{date_label} <time datetime="{actual_date}">{pretty_date(actual_date)}</time></span><span>{post['readMinutes']} min read</span></div></header>
{cover_markup}<div class="article-layout"><aside class="toc"><nav aria-label="Table of contents"><p>In this guide</p><ol>{toc}</ol></nav></aside><article class="prose">{body}<aside class="article-cta"><h2>Get a closer look.</h2><p>Explore Penta AI’s website inspection tools for colors, fonts, assets and design exports.</p><a class="glossy-button blue-button download-button" href="{EXTENSION}">{chrome_icon()}<span>Download Penta AI for Chrome</span></a></aside></article></div>
<section class="related" aria-labelledby="related-title"><div class="section-heading"><h2 id="related-title">Keep exploring</h2><a class="text-link" href="/blog/">All guides <span aria-hidden="true">↗</span></a></div>{''.join(row(p, i + 1, related=True) for i, p in enumerate(related[:3]))}</section></main>'''
    article_schema = {"@type": "BlogPosting", "@id": BASE + url(post) + "#article", "headline": post["title"], "description": post["description"], "mainEntityOfPage": {"@type": "WebPage", "@id": BASE + url(post)}, "url": BASE + url(post), "inLanguage": "en", "articleSection": post["category"], "keywords": [post["keyword"]], "author": {"@type": "Organization", "name": "Penta AI", "url": BASE + "/blog/about/"}, "publisher": {"@id": BASE + "/#organization"}, "wordCount": len(plain(post["body"]).split()), "image": BASE + (post.get("cover") or post.get("image", "/assets/hero-poster.webp")), "dateCreated": post["date"]}
    if publish_date:
        article_schema["datePublished"] = publish_date
        article_schema["dateModified"] = post.get("modified", publish_date)
    breadcrumbs = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"}, {"@type": "ListItem", "position": 2, "name": "Guides", "item": BASE + "/blog/"}, {"@type": "ListItem", "position": 3, "name": post["title"], "item": BASE + url(post)}]}
    schema = {"@context": "https://schema.org", "@graph": [org(), article_schema, breadcrumbs]}
    return document(post["title"] + " | Penta AI", post["description"], url(post), content, schema, article=True, image=post.get("cover") or post.get("image"), image_alt=post.get("coverAlt") or post.get("imageAlt"), published=publish_date, active="article")


def build_about(posts: list[dict]) -> str:
    cover = next((p for p in posts if p["slug"] == "design-md-for-ai" and p.get("cover")), posts[0])
    cover_markup = '<figure class="about-cover">' + cover_image(cover, sizes='(max-width: 639px) calc(100vw - 32px), 760px', eager=True) + '<figcaption>Illustrative interface example.</figcaption></figure>' if cover.get("cover") else ''
    content = f'''<main id="main" class="wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Guides</a><span aria-hidden="true">/</span><span aria-current="page">Editorial policy</span></nav><article class="about-layout prose"><div class="eyebrow">Our editorial approach</div><h1>Useful details.<br>Clear sources.</h1>{cover_markup}<p>These guides are published by Penta AI, a website design inspection product. They explain how to inspect fonts, colors, CSS and design systems, and how to turn observations into useful work.</p><h2>Who these guides are for</h2><p>Designers who want to understand a reference, developers who need to inspect an interface, and builders who use AI coding tools and need a more precise design brief.</p><h2>How we explain a workflow</h2><p>We favor concrete steps, worked examples and links to primary documentation. Sample values and code illustrate a method; they are not measurements of a named website unless the guide says so. Browser interfaces and third-party tools can change, so verify the current documentation when a step looks different.</p><h2>What we disclose</h2><p>Penta AI is the publisher and benefits when readers choose the product. Product links are clearly labeled. Educational workflows can also use browser tools. We do not present hypothetical examples as customer results, invent authors or testimonials, or claim firsthand testing without describing it.</p><h2 id="visuals">About our visuals</h2><p>Covers are original interface illustrations inspired by the visual examples on the Penta AI homepage. They illustrate inspection concepts and are not live product screenshots. Diagrams are original explanatory visuals with illustrative values and layouts.</p><h2>Sources and maintenance</h2><p>Material technical claims link to the documentation that supports them. Dates describe when a guide was prepared or published; they do not establish that a tool is unchanged. Substantive corrections should update the guide and its modification date.</p><h2>Using a reference responsibly</h2><p>Inspection helps you understand how an interface works. Reuse your own material, licensed assets, or material you have permission to use. A visible image, logo, font or implementation is not automatically available for republication.</p><p><a href="/blog/">Explore the guide library</a> or <a href="/">learn about Penta AI</a>.</p></article></main>'''
    schema = {"@context": "https://schema.org", "@graph": [org(), {"@type": "AboutPage", "name": "Penta AI Editorial Policy", "url": BASE + "/blog/about/", "about": {"@id": BASE + "/#organization"}}]}
    return document("Our Editorial Approach | Penta AI Guides", "How Penta AI publishes practical design inspection guides, uses primary sources, labels examples and discloses its connection to the product.", "/blog/about/", content, schema, image=cover.get("cover"), image_alt=cover.get("coverAlt"), active="about")


def build_xml(posts: list[dict], publish_date: str | None):
    sitemap = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in ["/", "/privacy/", "/blog/", "/blog/about/"] + [url(p) for p in posts]:
        item = ET.SubElement(sitemap, "url")
        ET.SubElement(item, "loc").text = BASE + path
        article = next((p for p in posts if url(p) == path), None)
        if article and (article.get("published") or publish_date):
            ET.SubElement(item, "lastmod").text = article.get("modified") or article.get("published") or publish_date
    ET.indent(sitemap)
    ET.ElementTree(sitemap).write(SITE / "sitemap.xml", encoding="utf-8", xml_declaration=True)
    feed = ET.Element("rss", version="2.0")
    channel = ET.SubElement(feed, "channel")
    for key, value in [("title", "Penta AI Guides"), ("link", BASE + "/blog/"), ("description", "Practical guides to website fonts, colors, CSS and design systems."), ("language", "en")]:
        ET.SubElement(channel, key).text = value
    # Each article keeps its original publication date across later builds.
    published = [p for p in posts if p.get("published") or publish_date]
    if published:
        latest = max(p.get("modified") or p.get("published") or publish_date for p in published)
        ET.SubElement(channel, "lastBuildDate").text = format_datetime(datetime.combine(date.fromisoformat(latest), datetime.min.time(), timezone.utc))
        for post in published:
            first_published = post.get("published") or publish_date
            pub_rfc = format_datetime(datetime.combine(date.fromisoformat(first_published), datetime.min.time(), timezone.utc))
            item = ET.SubElement(channel, "item")
            for key, value in [("title", post["title"]), ("link", BASE + url(post)), ("description", post["description"]), ("category", post["category"]), ("pubDate", pub_rfc)]:
                ET.SubElement(item, key).text = value
            ET.SubElement(item, "guid", isPermaLink="true").text = BASE + url(post)
    ET.indent(feed)
    ET.ElementTree(feed).write(SITE / "feed.xml", encoding="utf-8", xml_declaration=True)
    (SITE / "robots.txt").write_text("User-agent: *\nAllow: /\nDisallow: /_blog/\n\nSitemap: https://pentaai.site/sitemap.xml\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--publish-date", help="Stamp only articles without a first-publication date; existing dates are preserved")
    parser.add_argument("--published-only", action="store_true", help="Include only published articles in the live build")
    args = parser.parse_args()
    if args.publish_date:
        date.fromisoformat(args.publish_date)
    source = ROOT / "content/posts.json"
    if not source.is_file():
        parser.error(f"No content file: {source}")
    posts = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(posts, list) or not posts:
        parser.error("posts.json must contain a non-empty array")
    seen = set()
    for post in posts:
        for field in ["slug", "title", "description", "category", "keyword", "date", "body"]:
            if not isinstance(post.get(field), str) or not post[field].strip():
                parser.error(f"Missing or invalid {field}")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", post["slug"]) or post["slug"] == "about":
            parser.error(f"Invalid or reserved slug: {post['slug']}")
        if post["slug"] in seen:
            parser.error(f"Duplicate slug: {post['slug']}")
        seen.add(post["slug"])
        date.fromisoformat(post["date"])
        if post.get("published"):
            date.fromisoformat(post["published"])
        if post.get("modified"):
            date.fromisoformat(post["modified"])
            if post.get("published") and post["modified"] < post["published"]:
                parser.error(f"Modification predates publication: {post['slug']}")
        if re.search(r"<h1\b|<script\b|\son\w+\s*=|javascript:", post["body"], re.I):
            parser.error(f"Unsafe HTML or duplicate H1 in {post['slug']}")
        post.setdefault("readMinutes", max(1, round(len(plain(post["body"]).split()) / 210)))
        if not isinstance(post["readMinutes"], int) or post["readMinutes"] < 1:
            parser.error(f"Invalid reading time in {post['slug']}")
        if post.get("image") and (not post["image"].startswith("/") or post["image"].startswith("//") or ".." in post["image"]):
            parser.error(f"Image must be a local root-relative URL in {post['slug']}")
    for post in posts:
        missing = set(post.get("related", [])) - seen
        if missing:
            parser.error(f"Unknown related slugs in {post['slug']}: {sorted(missing)}")
    if args.publish_date:
        for post in posts:
            if not post.get("published"):
                post["published"] = args.publish_date
        source.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.published_only:
        drafts = [p for p in posts if not p.get("published")]
        # Refuse a potentially stale public draft instead of silently leaving it live.
        for post in drafts:
            if (SITE / "blog" / post["slug"] / "index.html").exists():
                parser.error(f"Draft already has a public file; move it out of the site before publishing: {post['slug']}")
        posts = [p for p in posts if p.get("published")]
        if not posts:
            parser.error("No published articles to build")
    blog = SITE / "blog"
    blog.mkdir(parents=True, exist_ok=True)
    (blog / "blog.css").write_text(CSS.strip() + "\n", encoding="utf-8")
    (blog / "blog.js").write_text(JS.strip() + "\n", encoding="utf-8")
    (blog / "index.html").write_text(build_index(posts), encoding="utf-8")
    (blog / "about").mkdir(exist_ok=True)
    (blog / "about/index.html").write_text(build_about(posts), encoding="utf-8")
    for post in posts:
        target = blog / post["slug"]
        target.mkdir(exist_ok=True)
        (target / "index.html").write_text(build_article(post, posts, args.publish_date), encoding="utf-8")
    build_xml(posts, args.publish_date)
    print(f"Built {len(posts)} guides + blog index + editorial policy in {SITE}")
    print(f"Published articles: {sum(bool(p.get('published')) for p in posts)}; prepared articles: {sum(not p.get('published') for p in posts)}")


if __name__ == "__main__":
    main()
