import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import cloudflare from '../.cloudflare/index.js';
import {companyPaths} from '../scripts/navigation.mjs';
const home=fs.readFileSync('dist/index.html','utf8');
const projects=JSON.parse(fs.readFileSync('dist/projects.json','utf8'));
assert(home.includes(`<strong>${projects.length}</strong><span>Projects</span>`));
const breakdown=['Websites','Apps','SaaS'].map(category=>[category,projects.filter(p=>p.categories[0]===category).length]);
assert.equal(breakdown.reduce((total,[,n])=>total+n,0),projects.length);
for(const [label,n] of breakdown)assert(home.includes(`<strong>${n}</strong><span>${label}</span>`));
assert(home.includes(`${projects.filter(p=>p.capabilities.includes('ai')).length} of these projects include AI.`));
assert(!home.includes('Discuss your project'));
assert(!home.includes('data-project-id='));assert(!home.includes('id="services"'));assert(!home.includes('Hi, I’m Alain'));
for(const path of companyPaths){
 const html=fs.readFileSync('dist'+path+'index.html','utf8');
 assert.equal((html.match(/<h1>/g)||[]).length,1);assert(html.includes('href="/">Home</a>'));
 if(['/projects/','/scope/','/about/','/contact/','/support/'].includes(path))assert(html.includes(`href="${path}" aria-current="page"`));assert(html.includes(`href="https://www.dev-mania.com${path}"`));
 assert(fs.readFileSync('dist/sitemap.xml','utf8').includes('https://www.dev-mania.com'+path));
 assert.equal((await worker.fetch(new Request('https://www.dev-mania.com'+path),{})).status,200);
 assert.equal((await cloudflare.fetch(new Request('https://www.dev-mania.com'+path),{ASSETS:{fetch:()=>new Response('asset')}})).status,200);
 assert.equal((await worker.fetch(new Request('https://www.dev-mania.com'+path.slice(0,-1)),{})).status,308);
 for(const [,link] of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){if(link==='/')continue;assert(fs.existsSync('dist'+link+(link.endsWith('/')?'index.html':'')),link);}
}
const contact=fs.readFileSync('dist/contact/index.html','utf8'),support=fs.readFileSync('dist/support/index.html','utf8');
assert(contact.includes('mailto:alainbadran@dev-mania.com'));assert(contact.includes('https://wa.me/971566407476'));assert(contact.includes('Dubai, United Arab Emirates'));
assert(support.includes('mailto:support@dev-mania.com'));assert(support.includes('https://wa.me/9613957585'));
assert.equal((fs.readFileSync('dist/projects/index.html','utf8').match(/data-project-id=/g)||[]).length,projects.length);
console.log('PASS separate company pages, short homepage, count, contact links, Home links, SEO and Worker routing');
