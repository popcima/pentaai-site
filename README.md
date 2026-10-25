# Penta AI website

Public static website for https://pentaai.site, including the Chrome extension privacy policy at /privacy/.

Hosting: GitHub Pages, main branch, repository root. The .nojekyll file preserves Next.js static assets. CNAME assigns pentaai.site.

These files are a production Next.js static export. Make changes in the Penta AI source project, run npm run build, then copy the contents of out/ into this repository while preserving .git, CNAME, .nojekyll and this README. Commit and push to deploy.

## Blog authoring

The blog is generated from `_blog/content/posts.json`. See [_blog/PUBLISHING.md](_blog/PUBLISHING.md) for the daily publishing workflow, build commands, publication-date behavior and Search Console verification. Keep the root Google verification file when rebuilding the site.
