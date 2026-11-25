const slides=[{src:'/assets/hero-build.webp',label:'01 / ALWAYS BUILDING',alt:'DevMania app and website artwork with an illustrated loading bar'},{src:'/assets/hero-studio.webp',label:'02 / THE STUDIO',alt:'Orange-lit DevMania studio with laptop and Dubai skyline'},{src:'/assets/hero-world.webp',label:'03 / IDEAS WITHOUT BORDERS',alt:'DevMania global digital network with a glowing orange globe'}];
const carousel=document.querySelector('.carousel');
if(carousel){
 const stage=carousel.querySelector('.flip-stage'),hero=carousel.querySelector('#hero-image'),label=carousel.querySelector('#slide-label'),dots=[...carousel.querySelectorAll('[data-slide]')],pause=carousel.querySelector('#pause');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,paused=motion.matches,busy=false,timer,hover=false,focused=false;
 const buffer=new Image();buffer.className='carousel-buffer';buffer.alt='';buffer.setAttribute('aria-hidden','true');stage.append(buffer);
 // Preload the other two full-size artworks, keeping the first as the LCP image.
 slides.slice(1).forEach(s=>{const image=new Image();image.src=s.src});
 function schedule(){clearTimeout(timer);if(!paused&&!document.hidden&&!hover&&!focused)timer=setTimeout(()=>show(current+1),6500)}
 function updatePause(){pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-label',paused?'Play carousel':'Pause carousel');pause.setAttribute('aria-pressed',String(paused));carousel.classList.toggle('is-paused',paused)}
 async function show(index,manual=false){
  const target=(index+slides.length)%slides.length;if(busy||target===current){schedule();return}
  busy=true;clearTimeout(timer);buffer.src=slides[target].src;
  try{await buffer.decode()}catch{busy=false;schedule();return}
  if(!motion.matches){stage.classList.add('is-changing');await new Promise(resolve=>setTimeout(resolve,650))}
  current=target;hero.src=slides[current].src;hero.alt=slides[current].alt;stage.classList.remove('is-changing');
  label.setAttribute('aria-live',manual?'polite':'off');label.textContent=slides[current].label;
  dots.forEach((d,i)=>{d.classList.toggle('active',i===current);if(i===current)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')});
  busy=false;schedule();
 }
 carousel.querySelector('#next').onclick=()=>show(current+1,true);carousel.querySelector('#prev').onclick=()=>show(current-1,true);
 dots.forEach(d=>d.onclick=()=>show(Number(d.dataset.slide),true));pause.onclick=()=>{paused=!paused;updatePause();schedule()};
 carousel.addEventListener('mouseenter',()=>{hover=true;schedule()});carousel.addEventListener('mouseleave',()=>{hover=false;schedule()});
 carousel.addEventListener('focusin',()=>{focused=true;schedule()});carousel.addEventListener('focusout',e=>{focused=carousel.contains(e.relatedTarget);schedule()});
 carousel.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1),true)}});
 let touchX;stage.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX},{passive:true});stage.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>50)show(current+(delta<0?1:-1),true)},{passive:true});
 motion.addEventListener('change',()=>{if(motion.matches)paused=true;updatePause();schedule()});document.addEventListener('visibilitychange',schedule);updatePause();schedule();
}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
document.querySelector('#brief-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const message=`Hello DevMania! I would like to discuss a project.\n\nName: ${f.get('name')}\nEmail: ${f.get('email')}\nProject type: ${f.get('type')}\n\nProject outline:\n${f.get('idea')}`;window.open('https://wa.me/971566407476?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');document.querySelector('#form-status').textContent='Your enquiry is ready in WhatsApp. Tap Send there to send it to DevMania.'});
