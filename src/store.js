const status=document.querySelector('#store-status'),downloads=document.querySelector('#store-downloads');
const tell=text=>{status.textContent=text};
let active=null,ready=false;
try{active=JSON.parse(sessionStorage.getItem('devmania-store-checkout')||'null')}catch{}
const remember=()=>{try{sessionStorage.setItem('devmania-store-checkout',JSON.stringify(active))}catch{}};
async function post(path,data){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'Please try again');return result}
async function receipt(transactionId){
 if(!active?.claim)return tell('Payment received. Your private download link will arrive at your checkout email.');
 active.transactionId=transactionId;remember();tell('Payment received. Waiting for secure payment confirmation…');
 for(let i=0;i<20;i++){
  try{const result=await post('/api/store/receipt',{transactionId,claim:active.claim});if(result.paid){downloads.replaceChildren();for(const file of result.downloads){const a=document.createElement('a');a.href=file.url;a.textContent='Download '+file.name+' (.zip)';a.rel='noreferrer';downloads.append(a)}tell('Your source code is ready. We’re also sending the download links to your checkout email.');downloads.scrollIntoView({behavior:'smooth',block:'center'});return}}catch{}
  await new Promise(resolve=>setTimeout(resolve,2000));
 }
 tell('Payment confirmation is taking a little longer. Your private download link will arrive by email once confirmed. You can also refresh this page.');
}
async function load(){
 const response=await fetch('/api/store/catalog');if(!response.ok)throw Error('Catalog unavailable');const {products,enabled,token}=await response.json();
 if(enabled&&window.Paddle){
  if(token.startsWith('test_'))window.Paddle.Environment.set('sandbox');
  window.Paddle.Initialize({token,eventCallback:event=>{
   if(event.name==='checkout.completed')receipt(event.data?.transaction_id);
   if(event.name==='checkout.error')tell('Checkout could not be completed. Please try again.');
  }});ready=true;
 }
 tell(ready?(token.startsWith('test_')?'Test mode — no real payment will be collected.':'Choose a design. Pay once with Paddle, then download your code.'):'Browse the designs below. Checkout is being prepared and is not open yet.');
 const bySlug=new Map(products.map(p=>[p.slug,p]));
 for(const button of document.querySelectorAll('[data-buy]')){
  const p=bySlug.get(button.dataset.buy);button.disabled=!(ready&&p?.available);button.textContent=button.disabled?'Checkout coming soon':'Buy for $2';
  button.addEventListener('click',async()=>{
   button.disabled=true;button.textContent='Opening checkout…';
   try{const data=await post('/api/store/session',{slug:p.slug});active={slug:p.slug,claim:data.claim};remember();window.Paddle.Checkout.open({items:[{priceId:data.priceId,quantity:1}],customData:{devmania_claim:data.claim},settings:{allowLogout:true}})}catch(error){tell(error.message)}finally{button.disabled=false;button.textContent='Buy for $2'}
  });
 }
 if(active?.transactionId&&active?.claim)receipt(active.transactionId);
}
load().catch(()=>tell('Checkout is temporarily unavailable. Please try again later.'));
