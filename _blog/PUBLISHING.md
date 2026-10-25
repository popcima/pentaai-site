# Penta AI publishing workflow

Live site: https://pentaai.site/
Repository: https://github.com/popcima/pentaai-site
Publishing branch: `main`; GitHub Pages serves the repository root.

The deployed repository stores editable blog content and generators under `_blog/`. Generated pages, images, sitemap, feed and robots.txt live at the repository root. Keep `.nojekyll`, `CNAME`, the homepage and the Google verification HTML file intact.

## Daily run

The daily target is 20 new, distinct English articles for US readers at 09:00 Africa/Casablanca. Publication volume is a target, not a traffic forecast. Each article must answer a real task relevant to website inspection, typography, color, CSS, design tokens, accessibility or design handoff. Do not create near-duplicate keyword pages or filler to reach the number.

1. Fetch and fast-forward the repository before work; preserve unrelated changes. Count posts with today's `published` date and avoid exceeding 20 total new publications for that local date.
2. Read `content/posts.json` and search existing titles, queries and bodies to avoid overlapping articles. Use Search Console performance when accessible and SE Ranking US metrics when available. Unknown volumes remain unknown; never invent them or bypass CAPTCHA.
3. Research primary documentation and write original useful examples. Keep unreviewed drafts outside `content/posts.json`. Only ready-to-publish content belongs in that canonical file.
4. Add a unique slug, title, description, category, query, preparation date, substantive article body, related slugs, accurate image alt text, and relevant cover metadata. Use the approved homepage-style illustrations; extend the illustration source only when an existing illustration does not fit. Never claim a fabricated product test, author, testimonial or result.
5. Keep the explicit download link on every post: https://chromewebstore.google.com/detail/penta-ai-%E2%80%94-design-inspect/eegbmfbkbanoplfkokflhinkcemmkjjp . The generator adds it automatically.
6. Stamp only new posts with their actual first-publication date. Never rewrite older publication dates. Set `modified` on an old post only for a substantive update.
7. Run publication regression tests and site validation. Check representative desktop/mobile pages, all new links and assets, and ensure unique metadata and truthful structured data. Review useful content and sources before pushing.
8. Commit the intended changes, push normally to `main` (never force-push), wait for GitHub Pages, then verify the new public article URLs and sitemap return successfully. Report published URLs and any actual blocker. A successful local build or push alone does not establish that the site is live.

## Commands in the deployed repository

From repository root, with today's actual local date substituted:

```sh
python3 _blog/scripts/test_publication.py
PENTA_SITE_ROOT="$PWD" python3 _blog/scripts/build_blog.py --publish-date YYYY-MM-DD --published-only
PENTA_SITE_ROOT="$PWD" python3 _blog/scripts/verify_site.py
```

`--publish-date` persists dates only for undated articles. A later normal live rebuild uses:

```sh
PENTA_SITE_ROOT="$PWD" python3 _blog/scripts/build_blog.py --published-only
```

Generated image assets are committed and do not need regeneration on each run. To rebuild them, Node and sharp are required:

```sh
PENTA_SITE_ROOT="$PWD" node _blog/scripts/build_section_covers.cjs
PENTA_SITE_ROOT="$PWD" node _blog/scripts/build_hero_images.cjs
```

The covers are defined by six topic examples. For a new article, use the correct existing cover fields or add a new topic illustration and manifest entry. Do not run a generator that expects a new slug until the corresponding article exists.

## Search Console

The property `https://pentaai.site/` was verified on 25 October 2026 with the Google-provided HTML file. Keep `googleea7e001102cf52e5.html` publicly accessible for continuing verification. The sitemap `https://pentaai.site/sitemap.xml` was submitted and Google reported successful processing with 10 discovered pages. Normal sitemap updates are discovered at the same URL; do not use Google's restricted Indexing API for ordinary blog articles.

The active Codex automation is “Penta AI daily blog publishing,” scheduled daily at 09:00 Africa/Casablanca, beginning 26 October 2026. It resumes this chat and targets 20 useful articles per day, subject to content validation and actual publishing access. Keep Codex available on this computer for local scheduled work. Review `_blog/publication-log.json` and the canonical article dates before each batch to avoid duplicate publication.

Search Console acceptance is not a guarantee of indexing, ranking or traffic. Check impressions/clicks after data begins accruing and refine the topic plan from actual evidence.
