# DevMania
Responsive black, white and neon-orange portfolio for Alain Badran.

## Deploy anywhere
The complete static website lives in `dist/`. No build command or dependencies are required. For Cloudflare Pages, select `dist` as the output directory and leave the build command empty. Add `dev-mania.com` and `www.dev-mania.com` in your hosting provider’s custom-domain settings before changing DNS.

## Content
Edit `dist/index.html` to add projects, services and contact details. Styles are in `dist/style.css`; the accessible, pausable 3D flip carousel and local project brief download are in `dist/app.js`. The supplied carousel artwork in `dist/assets/` has been corrected to DevMania using image generation. The official logo is unchanged.

## Before public launch
Provide the intended business email or WhatsApp number, then replace the local brief-download handler with a real contact path. The current form explicitly does not send enquiries. Confirm the complete project list and links. Connect the desired GitHub repository (https://github.com/alainbad/DevMania), currently inaccessible through the connected GitHub account. The temporary Sites deployment does not configure Cloudflare DNS or the custom domain.

## Interactive Portfolio OS

The portfolio is progressively enhanced: existing HTML, project imagery, links and WhatsApp contact remain usable independently of the new features.

### Editing and building

- `src/projects.json` is the canonical registry for cards, search, recommendations, terminal and counters. Unknown launch dates and technologies are omitted.
- `src/index.template.html` retains the original page and contains build slots.
- `src/os.js` and `src/os.css` implement the session-only boot, command palette, filtering, modal shell, status and Konami glow.
- `src/builder.js` and `src/terminal.js` are loaded on demand.
- `server/worker.js` handles `/api/idea` and serves an allowlisted public asset map. Server and repository files are never public routes.
- Run `node scripts/build.mjs`, `node tests/portfolio.mjs`, and `node --check src/os.js` before publishing. No external packages are required.
- `dist/` is generated and committed for Sites publication. Do not edit generated card content independently of the registry.

### AI activation (manual setup required)

Use the OpenAI Developers plugin's API-key workflow to configure the Sites secrets `OPENAI_API_KEY` and a supported `OPENAI_MODEL`. Do not paste secrets into source files or public HTML. Redeploy after configuring runtime values.

Until these are configured, the endpoint returns 503 and the builder explicitly identifies the result as a suggested project starter, preserves the visitor's idea, and supports editable WhatsApp handoff. AI-provider output is not yet verified against a live provider. The server validates input and generated output, uses a request timeout, rejects foreign origins, and limits requests to five per IP per minute per Worker isolate. This basic limiter is not a global account spending cap.

### Validation record

23 automated checks passed: mobile/logistics/AI/booking matching; truthful no-match and newest responses; terminal parsing and shell-injection non-execution; schema rejection; fallback preservation; all 13 cards, descriptions and working URLs retained; public asset serving; private-source route rejection; missing-AI fallback; server validation; mocked provider success/invalid responses; rate limiting. Existing JavaScript and new modules pass syntax checks.

Native dialogs provide focus containment, Escape dismissal and trigger focus return. Responsive rules cover narrow portrait and short landscape viewports; reduced motion skips boot and suppresses transitions. Visual browser QA is not available for this buildless Worker in the managed preview environment, so real-device visual and keyboard checks remain to be confirmed.

No analytics tracker was added. Event hooks use an existing `dataLayer` when present and dispatch `devmania:analytics` events otherwise. No client idea text or personal contact data is included in event metadata. No live analytics backend is configured.

Optional Phase 2 additions in the supplied specification are deferred. Latest-project ranking remains unavailable until launch dates are supplied. Project counts describe registry entries (Trackora has separate app and website entries). No fabricated progress percentages are used.
