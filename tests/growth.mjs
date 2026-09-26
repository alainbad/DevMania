import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import worker from '../.cloudflare/index.js';
const origin='https://www.dev-mania.com';
for(const path of ['/tools/','/tools/website-brief-builder/','/tools/website-launch-checklist/']){
 const html=fs.readFileSync('dist'+path+'index.html','utf8');assert(html.includes('href="'+origin+path+'"'));assert(fs.readFileSync('dist/sitemap.xml','utf8').includes('<loc>'+origin+path+'</loc>'));assert.equal((html.match(/<h1>/g)||[]).length,1);
 for(const [,href] of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){if(href==='/')continue;assert(fs.existsSync('dist'+href+(href.endsWith('/')?'index.html':'')),href);}
 const r=await worker.fetch(new Request(origin+path),{ASSETS:{fetch:()=>new Response('ok')}});assert.equal(r.status,200);
}
for(const path of ['/tools.js','/engagement.js','/feed.xml'])assert.equal((await worker.fetch(new Request(origin+path),{ASSETS:{fetch:()=>new Response('ok')}})).status,200);
assert.equal((await worker.fetch(new Request(origin+'/tools/not-real/'),{})).status,404);
function element(){return {value:'',disabled:true,textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}};}
const form=element(),output=element(),status=element(),copy=element(),download=element();copy.dataset={copy:'brief-output'};
const els={'#website-brief':form,'#brief-output':output,'#tool-status':status,'[data-copy]':copy,'[data-download]':download};
const events=[],downloads=[];const dangerous='<img src=x onerror=alert(1)>';
const sandbox={document:{querySelector:s=>els[s],querySelectorAll:s=>s==='[data-launch-check]'?[]:[copy,download],getElementById:()=>output,createElement:()=>({click(){downloads.push(this.download)}})},window:{gtag:(...args)=>events.push(args)},location:{pathname:'/tools/website-brief-builder/'},navigator:{clipboard:{writeText:async()=>{}}},FormData:class{get(key){return {business:dangerous,goal:'Receive enquiries',audience:'Local customers',type:'Business website'}[key]}},Blob,URL,setTimeout:fn=>fn()};
vm.runInNewContext(fs.readFileSync('src/tools/tools.js','utf8'),sandbox);
form.listeners.submit({preventDefault(){}});assert(output.value.includes(dangerous));assert(output.value.includes('To be confirmed'));assert.equal(copy.disabled,false);assert(!JSON.stringify(events).includes(dangerous));download.listeners.click();assert.deepEqual(downloads,['website-project-brief.txt']);
const checks=Array.from({length:20},(_,i)=>Object.assign(element(),{checked:false,value:'Check '+i}));const progress=element(),bar=element(),button=element();
const checklistEls={'#tool-status':status,'#check-progress':progress,'#launch-progress':bar,'#download-checklist':button};
sandbox.document.querySelector=s=>checklistEls[s];sandbox.document.querySelectorAll=()=>checks;
vm.runInNewContext(fs.readFileSync('src/tools/tools.js','utf8'),{...sandbox});checks[0].checked=true;checks[0].listeners.change();assert.equal(bar.value,1);assert.equal(progress.textContent,'1 of 20 checks completed');button.listeners.click();assert.equal(downloads.at(-1),'website-launch-checklist.txt');
console.log('Growth tools: routes, metadata, internal links, safe brief output, downloads, checklist progress and no form text in analytics pass.');
