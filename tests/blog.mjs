import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../.cloudflare/index.js';
const posts=JSON.parse(fs.readFileSync('src/blog/posts.json','utf8'));
assert.equal(posts.length,25);assert.equal(new Set(posts.map(p=>p.slug)).size,25);assert.equal(new Set(posts.map(p=>p.category)).size,6);
const origin='https://www.dev-mania.com';
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
for(const p of posts){const path='/blog/'+p.slug+'/';const html=fs.readFileSync('dist'+path+'index.html','utf8');assert(html.includes('href="'+origin+path+'"'));assert.equal((html.match(/<h1>/g)||[]).length,1);assert(html.includes(p.title.replace(/&/g,'&amp;')));assert(sitemap.includes('<loc>'+origin+path+'</loc>'));assert(p.sections.length>=5);assert(p.sections.map(s=>s.text).join(' ').split(/\s+/).length>200);for(const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))JSON.parse(m[1]);}
const files=fs.readdirSync('dist/blog',{recursive:true}).filter(x=>x.endsWith('.html'));
for(const file of files){const html=fs.readFileSync('dist/blog/'+file,'utf8');for(const [,href] of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)){if(href==='/')continue;const target='dist'+href+(href.endsWith('/')?'index.html':'');assert(fs.existsSync(target),'Missing '+target);}}
for(const path of ['/blog/','/blog/'+posts[0].slug+'/','/sitemap.xml','/robots.txt','/blog.css']){let calls=0;const r=await worker.fetch(new Request(origin+path),{ASSETS:{fetch:()=>{calls++;return new Response('asset')}}});assert.equal(r.status,200);assert.equal(calls,1);}
assert.equal((await worker.fetch(new Request(origin+'/blog'),{})).status,308);
assert.equal((await worker.fetch(new Request(origin+'/blog/not-a-real-article/'),{})).status,404);
assert.equal((await worker.fetch(new Request(origin+'/server/index.js'),{})).status,404);
console.log('Blog: 25 articles, 6 topic pages, canonical metadata, schema, sitemap, internal links and Worker routes pass.');
