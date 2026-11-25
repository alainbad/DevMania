import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function boot(reduced=false){
 const events={},timers=new Map();let id=0;
 const node=()=>({textContent:'',src:'',alt:'',attrs:{},listeners:{},classList:{values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)},toggle(v,on){on?this.add(v):this.remove(v)}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},append(){},addEventListener(k,fn){this.listeners[k]=fn},contains(){return false}});
 const nodes=Object.fromEntries(['.flip-stage','#hero-image','#slide-label','#pause','#next','#prev'].map(k=>[k,node()]));
 const dots=Array.from({length:3},(_,i)=>Object.assign(node(),{dataset:{slide:String(i)}}));
 const carousel=Object.assign(node(),{querySelector:s=>nodes[s],querySelectorAll:()=>dots});
 const motion={matches:reduced,addEventListener(k,fn){events.motion=fn}};
 const document={hidden:false,querySelector:s=>s==='.carousel'?carousel:null,addEventListener(k,fn){events[k]=fn}};
 const context={document,matchMedia:()=>motion,Image:class{setAttribute(){}decode(){return Promise.resolve()}},setTimeout(fn,ms){const n=++id;timers.set(n,{fn,ms});return n},clearTimeout(n){timers.delete(n)},FormData:class{},window:{}};
 vm.runInNewContext(fs.readFileSync('src/app.js','utf8'),context);
 const flush=async()=>{await new Promise(setImmediate);const fade=[...timers].find(([,t])=>t.ms===650);if(fade){timers.delete(fade[0]);fade[1].fn();await new Promise(setImmediate)}};
 const auto=()=>[...timers.values()].find(t=>t.ms===6500);
 return {nodes,dots,carousel,events,motion,document,flush,auto};
}
const normal=boot();assert(normal.auto(),'Auto rotation starts for normal motion');
normal.auto().fn();await normal.flush();assert.match(normal.nodes['#hero-image'].src,/hero-studio/);assert.equal(normal.dots[1].attrs['aria-current'],'true');
normal.nodes['#pause'].onclick();assert(!normal.auto());assert.equal(normal.nodes['#pause'].attrs['aria-label'],'Play carousel');
normal.nodes['#next'].onclick();await normal.flush();assert.match(normal.nodes['#hero-image'].src,/hero-world/);assert(!normal.auto(),'Manual movement respects explicit pause');
normal.nodes['#next'].onclick();await normal.flush();assert.match(normal.nodes['#hero-image'].src,/hero-build/,'Wrap to first slide');
normal.nodes['#prev'].onclick();await normal.flush();assert.match(normal.nodes['#hero-image'].src,/hero-world/,'Previous wraps to last slide');
normal.nodes['#pause'].onclick();normal.carousel.listeners.mouseenter();assert(!normal.auto());normal.carousel.listeners.mouseleave();assert(normal.auto());
normal.document.hidden=true;normal.events.visibilitychange();assert(!normal.auto());normal.document.hidden=false;normal.events.visibilitychange();assert(normal.auto());
normal.carousel.listeners.focusin();assert(!normal.auto());normal.carousel.listeners.focusout({relatedTarget:null});assert(normal.auto());
normal.nodes['.flip-stage'].listeners.touchstart({changedTouches:[{clientX:200}]});normal.nodes['.flip-stage'].listeners.touchend({changedTouches:[{clientX:100}]});await normal.flush();assert.match(normal.nodes['#hero-image'].src,/hero-build/);
const reduced=boot(true);assert(!reduced.auto(),'Reduced motion starts paused');reduced.nodes['#next'].onclick();await reduced.flush();assert.match(reduced.nodes['#hero-image'].src,/hero-studio/);assert.equal(reduced.nodes['#slide-label'].attrs['aria-live'],'polite');
console.log('Carousel passed: automatic advance, explicit pause, wrapping, hover, focus, visibility, swipe and reduced motion.');
