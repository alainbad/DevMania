# DevMania
Responsive black, white and neon-orange portfolio for Alain Badran.

## Deploy anywhere
The complete static website lives in `dist/`. No build command or dependencies are required. For Cloudflare Pages, select `dist` as the output directory and leave the build command empty. Add `dev-mania.com` and `www.dev-mania.com` in your hosting provider’s custom-domain settings before changing DNS.

## Content
Edit `dist/index.html` to add projects, services and contact details. Styles are in `dist/style.css`; the accessible, pausable 3D flip carousel and local project brief download are in `dist/app.js`. The supplied carousel artwork in `dist/assets/` has been corrected to DevMania using image generation. The official logo is unchanged.

## Before public launch
Provide the intended business email or WhatsApp number, then replace the local brief-download handler with a real contact path. The current form explicitly does not send enquiries. Confirm the complete project list and links. Connect the desired GitHub repository (https://github.com/alainbad/DevMania), currently inaccessible through the connected GitHub account. The temporary Sites deployment does not configure Cloudflare DNS or the custom domain.
