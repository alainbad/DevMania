// Gallery-inspired reflections stay decorative; navigation remains native links.
const coarse=matchMedia('(pointer: coarse)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let pending;
document.addEventListener('pointermove',event=>{
 if(coarse.matches||reduced.matches)return;
 const surface=event.target.closest('[data-glass],.os-dialog');if(!surface)return;
 cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{const rect=surface.getBoundingClientRect();surface.style.setProperty('--glass-x',`${event.clientX-rect.left}px`);surface.style.setProperty('--glass-y',`${event.clientY-rect.top}px`)});
},{passive:true});
const menu=document.querySelector('.mobile-menu');
if(menu){
 const summary=menu.querySelector('summary');summary.setAttribute('aria-expanded','false');
 menu.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(menu.open)));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;summary.focus()}});
 document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false});
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.open=false));
}

// The original uploaded React + Framer Motion navbar; native links are the fallback.
if(document.querySelector('[data-original-nav]'))import('./original-nav.js').then(m=>m.mountOriginalNavigation()).catch(()=>{});
