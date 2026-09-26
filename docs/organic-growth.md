# Organic growth release — 26 September 2026

## Published additions
- /tools/: landing page for free tools.
- /tools/website-brief-builder/: local, editable brief generation, copy and text download.
- /tools/website-launch-checklist/: 20 manual checks, progress and remaining-task download.
- Homepage, service and blog links to these tools; tools linked from all article pages.
- Visitor-initiated LinkedIn and WhatsApp sharing on articles.
- /feed.xml: RSS discovery and subscription support.
- Sitemap expanded from 37 to 40 pages.
- GA4 events: brief_created, brief_copied, brief_downloaded, checklist_downloaded, contact_click, enquiry_handoff, share. These events do not include form contents. Enquiry handoff means the visitor opened WhatsApp; it does not prove a message was sent or a lead was qualified.

## Measurement
Compare organic landing-page sessions, Search Console impressions/clicks and engagement with the tools over several weeks. Separate visitors from qualified enquiries. No traffic forecast or ranking guarantee is made. Do not generate artificial traffic to inflate Analytics.

## Distribution still available
User can share the tools on their LinkedIn profile or relevant communities with a useful explanation. No posts, outbound messages, purchased placement, paid subscriptions or advertising were created in this release. The existing Search Console sitemap URL remains unchanged and now includes the tools.

## Implementation
Run node scripts/build-cloudflare.mjs, npm test, node tests/blog.mjs and node tests/growth.mjs. Tools have no external API dependency. Answers are not stored and reset on reload. RSS includes existing article metadata; it does not fabricate publish dates or fresh modification dates.
