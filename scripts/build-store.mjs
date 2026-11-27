import fs from 'node:fs';
import products from '../src/store-products.js';
import categories from '../src/store-categories.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const comparisonPath = '/blog/admin-dashboard-v2-vs-dashboard-v12/';

const dashboardFaqs = {
 'dashbord-v2': {
  contents: 'You receive both V2 dashboard variants in one ZIP. It contains the React source, styles, assets and demo interactions. The video shows the portfolio overview, transaction list and management screens.',
  customize: 'Start with the Recent Transaction table. Change one example row and its status, then adjust the labels and accent color in the project styles. To display real transactions, supply the records from your own service.'
 },
 'dashboard-v12': {
  contents: 'You receive the editable React project, styles, assets and demo interactions in one ZIP. The preview shows the Dashboard 1, Dashboard 2 and Admin view selector. Each bundled view comes with the same purchase.',
  customize: 'Choose the view your users will open first. Try changing a payment-goal label and the chart values in the dashboard, or the table columns in the admin view. Use your own data and access controls when connecting the interface to a live application.'
 }
};

function dashboardQuestions(product) {
 const answers = dashboardFaqs[product.slug];
 if (!answers) return '';
 return `<section class="policy-block dashboard-faq" aria-label="Buyer questions">
  <h2>Questions about ${esc(product.name)}</h2>
  <h3>What files and views do I receive?</h3><p>${esc(answers.contents)}</p>
  <h3>What do I need to run it locally?</h3><p>Unzip the download on a computer with Node.js and open the included setup instructions. Use the package manager and start command listed for that project. After installing its dependencies, open the local address printed by the development server.</p>
  <h3>How can I customize the dashboard?</h3><p>${esc(answers.customize)}</p>
  <p><a href="${comparisonPath}">Compare Admin Dashboard V2 and Dashboard V12 side by side</a>.</p>
 </section>`;
}

export function buildStore(){
 const base=fs.readFileSync('dist/store/index.html','utf8').replaceAll('<link rel="stylesheet" href="/store.css">','');const files=[];
 const nav=active=>`<nav class="store-tabs" aria-label="Design categories"><a href="/store/" ${!active?'aria-current="page"':''}>All designs</a>${Object.entries(categories).map(([k,n])=>`<a href="/store/${k}/" ${active===k?'aria-current="page"':''}>${n} <span class="store-category-count">${products.filter(p=>p.categories.includes(k)).length}</span></a>`).join('')}</nav>`;
 const buy=p=>`<button type="button" class="button store-buy" data-buy="${p.slug}" disabled>Checkout coming soon</button>`;
 const preview=p=>p.previewVideo?`<div class="store-image"><video class="store-card-video" controls playsinline preload="metadata" poster="${p.preview}" aria-label="${esc(p.name)} video preview"><source src="${esc(p.previewVideo)}" type="video/mp4">Your browser does not support video. <a href="${esc(p.previewVideo)}">Watch the preview</a>.</video></div>`:`<a class="store-image" href="/store/design/${p.slug}/"><img src="${p.preview}" alt="${esc(p.name)} preview" loading="lazy" width="1000" height="760"></a>`;
 const card=p=>`<article class="store-card">${preview(p)}<div class="store-card-body"><p class="store-label">${p.categories.map(c=>categories[c]).join(' · ')}</p><h2><a href="/store/design/${p.slug}/">${esc(p.name)}</a></h2><p>${esc(p.description)}</p><div class="store-price"><strong>$2</strong><span>USD · one-time</span></div><a class="button" href="/store/design/${p.slug}/">${p.kind==='prompt-pack'?'View prompt pack':'View design'}</a>${buy(p)}</div></article>`;
 function write(path,title,description,content){
  let html=base.replace(/<title>.*?<\/title>/,`<title>${esc(title)} | DevMania</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(description)}">`).replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${esc(title)} | DevMania">`).replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${esc(description)}">`).replaceAll('https://www.dev-mania.com/store/','https://www.dev-mania.com'+path).replace('</head>','<link rel="stylesheet" href="/store.css"></head>');
  html=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main"><section class="section company-page store-page">${content}<dialog id="store-email-dialog" class="store-email-dialog" aria-labelledby="store-email-title"><form><button type="button" class="store-dialog-close" aria-label="Close checkout" onclick="this.closest('dialog').close()">×</button><span class="eyebrow">SECURE CHECKOUT</span><h2 id="store-email-title">Where should we send your download?</h2><p data-checkout-design></p><label for="store-delivery-email">Email address</label><input id="store-delivery-email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"><p class="store-help">We’ll send your private download link here after payment. You’ll pay securely on Ziina.</p><button type="submit" class="button">Continue to payment · $2</button><p class="store-help">By continuing, you agree to our <a href="/terms/">terms</a> and <a href="/refunds/">refund policy</a>. See our <a href="/privacy/">privacy policy</a>.</p></form></dialog><div class="store-feedback"><p id="store-status" role="status">Checking checkout availability…</p><div id="store-downloads"></div></div><p class="store-help">A digital ZIP download for each product. Prompt packs require your own n8n and model access; third-party subscriptions and usage fees are separate. The amount and any applicable tax are shown before payment. After confirmed payment, download here or from the private link sent to your checkout email.</p><p class="store-help">Questions about a design or order? <a href="/support/">Contact DevMania</a>.</p><noscript><p>Enable JavaScript to use secure checkout.</p></noscript></section><script src="https://cdn.paddle.com/paddle/v2/paddle.js" defer></script><script src="/store.js" defer></script></main>`);
  const file=path.slice(1)+'index.html';fs.mkdirSync('dist/'+path.slice(1),{recursive:true});fs.writeFileSync('dist/'+file,html);files.push(file);
 }
 const hero=(title,desc)=>`<span class="eyebrow">DEVMANIA / INSTANT DIGITAL STORE</span><h1>${title}</h1><p class="page-intro">${desc}</p>`;
 write('/store/','Instant Digital Store','AI setup prompts and editable UI source projects. $2 USD per product.',hero('Ideas you can build with.','Explore 66 digital products across 12 categories. Choose a full AI setup prompt or an original UI source project. <strong>$2 USD per product.</strong>')+nav()+`<div class="store-grid">${products.map(card).join('')}</div>`);
 for(const [key,name] of Object.entries(categories)){
  const list=products.filter(p=>p.categories.includes(key));
  const note=key==='sidebars'?'<p class="store-help">Dashboard-based sidebars include their full dashboard project. The same design appears in both categories; one purchase includes both.</p>':'';
  write('/store/'+key+'/',name,name+' editable source code. $2 USD per design.',hero(name,key==='ai-prompts'?'Practical setup prompts and guides for your own AI workflows. <strong>$2 USD each; third-party usage fees separate.</strong>':'Original UI interactions. Editable source. <strong>$2 USD each.</strong>')+nav(key)+note+`<div class="store-grid">${list.map(card).join('')}</div>`);
 }
 for(const p of products){
  if(p.kind==='prompt-pack'){
   write('/store/design/'+p.slug+'/',p.name,p.description+' $2 USD one-time.',`<a class="store-back" href="/store/ai-prompts/">← AI Prompts & Automation</a>`+hero(esc(p.name),esc(p.description))+`<div class="store-detail"><video class="store-design-video store-prompt-video" controls playsinline preload="metadata" poster="${p.preview}" aria-label="${esc(p.name)} video preview"><source src="${esc(p.previewVideo)}" type="video/mp4">Your browser does not support video. <a href="${esc(p.previewVideo)}">Watch the preview</a>.</video><div class="store-detail-copy"><p class="store-label">DIGITAL PROMPT PACK · VERSION 1.0</p><div class="store-price"><strong>$2</strong><span>USD · one-time</span></div><ul><li>Full copy-and-paste setup prompt for an AI assistant</li><li>OpenAI drafting, Claude review and Gemini review roles</li><li>Shared history, up to two revisions and unresolved-issue handling</li><li>Privacy instructions, quick start and test checklist</li><li>TXT and Markdown guide files in a ZIP after confirmed payment</li></ul>${buy(p)}<p class="store-help">Requires your own n8n account and supported model access. Subscription and usage fees are separate. Setup depends on your assistant's tools and available nodes. This is a prompt and guide, not an importable workflow, hosted assistant or implementation service.</p><p class="store-help">Model reviews do not guarantee accuracy. Persistent memory and external actions are not included. No affiliation or endorsement by the model providers is implied.</p><p class="store-help">Private download links last 7 days. Save your ZIP after downloading.</p></div></div>`);
   continue;
  }
  const previewVersion=p.categories.some(category=>category==='dashboards'||category==='admin')?4:3;
  write('/store/design/'+p.slug+'/',p.name,p.description+' $2 USD one-time.',`<a class="store-back" href="/store/${p.categories[0]}/">← ${categories[p.categories[0]]}</a>`+hero(esc(p.name),esc(p.description))+`<div class="store-detail"><video${dashboardFaqs[p.slug] ? ' id="preview"' : ''} class="store-design-video" controls playsinline preload="none" poster="${p.preview}" aria-label="${esc(p.name)} video preview"><source src="/store-videos/designs/${p.slug}.mp4?v=${previewVersion}" type="video/mp4">Your browser does not support video. <a href="/store-videos/designs/${p.slug}.mp4?v=${previewVersion}">Watch the preview</a>.</video><div class="store-detail-copy"><p class="store-label">EDITABLE SOURCE CODE</p><div class="store-price"><strong>$2</strong><span>USD · one-time</span></div><ul><li>Complete React project source and styles</li><li>Original demo animations and interactions</li><li>Local setup and build instructions</li><li>ZIP download after confirmed payment</li></ul>${p.categories.length>1?'<p>Includes this dashboard and its sidebar. No separate sidebar purchase needed.</p>':''}${buy(p)}<p class="store-help">${['otp','login'].includes(p.categories[0])?'Authentication UI demo. Connect your own authentication service for live use.':p.categories[0]==='checkout'?'Commerce UI demo. Connect your own checkout and payment services for live use.':p.categories[0]==='interactions'?'Interaction UI demo. Connect your own storage or data service where needed.':p.categories[0]==='websites'?'Frontend website demo. Connect your own backend and booking or contact services for live use.':'Includes the original project assets and any bundled variants.'}</p><p class="store-help">Private download links last 7 days. Save your ZIP after downloading. Demo images and fonts may use external sources.</p></div></div>${dashboardQuestions(p)}`);
 }
 for(const p of products){const name=p.preview.split('/').at(-1);const source='src/store-previews/'+name;if(!fs.existsSync(source))throw Error('Missing product preview: '+p.slug);fs.writeFileSync('dist/assets/'+name,fs.readFileSync(source))}
 fs.mkdirSync('dist/store-videos',{recursive:true});
 // Full collection reels are retained only where a published reel exists.
 for(const c of ['dashboards','sidebars','otp','checkout'])fs.writeFileSync('dist/store-videos/'+c+'.mp4',fs.readFileSync('src/store-videos/'+c+'.mp4'));
 fs.mkdirSync('dist/store-videos/designs',{recursive:true});
 for(const p of products.filter(p=>p.kind!=='prompt-pack'||p.previewVideo))fs.writeFileSync('dist/store-videos/designs/'+p.slug+'.mp4',fs.readFileSync('src/store-videos/designs/'+p.slug+'.mp4'));
 fs.copyFileSync('src/store.css','dist/store.css');
 const sitemap='dist/sitemap.xml';if(fs.existsSync(sitemap)){let xml=fs.readFileSync(sitemap,'utf8');const entries=files.filter(f=>f.endsWith('index.html')).map(f=>'https://www.dev-mania.com/'+f.replace(/index\.html$/,'')).filter(url=>!xml.includes('<loc>'+url+'</loc>'));xml=xml.replace('</urlset>',entries.map(url=>'<url><loc>'+url+'</loc></url>').join('')+'</urlset>');fs.writeFileSync(sitemap,xml)}
 files.push('store.css');return files;
}
