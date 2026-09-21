import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mountBuilder,fallbackConcept} from '../src/builder.js';
class Element {
 constructor(tag,text=''){this.tag=tag;this.textContent=text;this.children=[];this.listeners={};this.value=''}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=nodes}
 addEventListener(event,fn){(this.listeners[event]??=[]).push(fn)}
 setAttribute(){} focus(){}
}
const all=node=>[node,...node.children.flatMap(all)];
const content=new Element('div'),dialog=new Element('dialog');
const projects=JSON.parse(fs.readFileSync('src/projects.json'));
const originalFetch=globalThis.fetch,originalTimeout=globalThis.setTimeout;
let calls=0;const signals=[];const durations=[];
try{
 globalThis.setTimeout=(fn,ms,...args)=>{durations.push(ms);return originalTimeout(fn,ms===60000?5:ms,...args)};
 globalThis.fetch=async(url,options)=>{signals.push(options.signal);calls++;if(calls===1)return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('cancelled','AbortError'))));return new Response(JSON.stringify(fallbackConcept('Website','A job fair platform for recruiters',projects)))};
 mountBuilder({dialog,content},{projects,initial:'Job fair platform for recruiters and job seekers',el:(...args)=>new Element(...args),contact(){},focusProject(){},track(){}});
 all(content).find(n=>n.tag==='button'&&n.textContent==='Website').onclick();
 all(content).find(n=>n.tag==='input').value='Recruiters and job seekers';
 await all(content).find(n=>n.tag==='form').onsubmit({preventDefault(){}});
 assert(all(content).some(n=>n.textContent.includes('took too long')));
 all(content).find(n=>n.textContent==='Edit my idea').onclick();
 assert.equal(all(content).find(n=>n.tag==='input').value,'Recruiters and job seekers');
 assert(all(content).find(n=>n.tag==='textarea').value.includes('Job fair'));
 await all(content).find(n=>n.tag==='form').onsubmit({preventDefault(){}});
 assert(all(content).some(n=>n.textContent==='PROJECT CONCEPT'));
 assert.notEqual(signals[0],signals[1]);assert.equal(signals[1].aborted,false);assert(durations.every(d=>d===60000));
 console.log('PASS builder: timeout, preserved idea/audience, fresh request and successful retry');
}finally{globalThis.fetch=originalFetch;globalThis.setTimeout=originalTimeout}
