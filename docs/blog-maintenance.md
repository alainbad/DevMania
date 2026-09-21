# DevMania Journal

Published collection: 25 original practical guides, grouped into Web Development (5), App Development (4), API Integration (4), ChatGPT (4), Claude (4), and AI in General (4).

Edit content in `src/blog/posts.json`. Each entry has a unique slug, title, description, stable publication date, sections, and optional official references. Examples are illustrative; the visible editorial notice discloses AI assistance. Do not add invented client outcomes, author credentials, publication history, or provider claims.

Run `node scripts/build-cloudflare.mjs` and `node tests/blog.mjs`. The build generates static article URLs, six topic pages, the blog index, JSON-LD, canonical and social metadata, sitemap and robots.txt. These pages are readable without JavaScript. Blog CSS is separate from portfolio interactions.

Publishing follows the existing main branch Cloudflare build. There is no new API dependency. Cloudflare serves directory index pages through the asset binding. The embedded Worker path also recognizes blog directory URLs and returns 404 for missing articles.

After publication, submit https://www.dev-mania.com/sitemap.xml in the domain's Google Search Console property. This is a separate account action; generating a sitemap does not submit it or guarantee indexing. Track indexing and enquiries, then improve articles based on genuine reader questions. Update content dates only when content changes, and recheck provider-specific references when changing product advice.

Validation: all 25 article slugs unique; all have five substantive sections; internal page links resolve; canonical URLs and sitemap agree; JSON-LD parses; private paths remain unavailable; existing AI route behaviour retained.
