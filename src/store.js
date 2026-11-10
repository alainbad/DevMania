const status=document.querySelector('#store-status'),downloads=document.querySelector('#store-downloads');
const tell=text=>{status.textContent=text};
let active=null,ready=false;
try{active=JSON.parse(sessionStorage.getItem('devmania-store-checkout')||'null')}catch{}
const remember=()=>{try{sessionStorage.setItem('devmania-store-checkout',JSON.stringify(active))}catch{}};
async function post(path,data){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'Please try again');return result}
function deliveryEmail(product){
 const dialog=document.querySelector('#store-email-dialog'),form=dialog.querySelector('form'),input=form.elements.email;
 dialog.querySelector('[data-checkout-design]').textContent=product.name+' — $2 USD';input.value='';
 return new Promise(resolve=>{
  const cleanup=()=>{form.removeEventListener('submit',submit);dialog.removeEventListener('close',close)};
  const close=()=>{cleanup();resolve(null)};
  const submit=event=>{event.preventDefault();if(!form.reportValidity())return;const email=input.value.trim();cleanup();dialog.close();resolve(email)};
  form.addEventListener('submit',submit);dialog.addEventListener('close',close);dialog.showModal();input.focus();
 });
}
async function receipt(transactionId){
 if(!active?.claim)return tell('If you completed payment, your download link will arrive at the email entered before checkout.');
 active.transactionId=transactionId;remember();tell('Checking secure payment confirmation…');
 for(let i=0;i<30;i++){
  try{const result=await post('/api/store/receipt',{transactionId,claim:active.claim});if(result.paid){downloads.replaceChildren();for(const file of result.downloads){const a=document.createElement('a');a.href=file.url;a.textContent='Download '+file.name+' (.zip)';a.rel='noreferrer';downloads.append(a)}tell('Payment confirmed. Your source code is ready below; we’re also sending your download link by email.');downloads.scrollIntoView({behavior:'smooth',block:'center'});return}if(['failed','canceled'].includes(result.status)){tell('Payment was not completed. You can choose the design and try again.');return}}catch{}
  await new Promise(resolve=>setTimeout(resolve,3000));
 }
 tell('We’re still checking your payment. Your download link will arrive by email once confirmed, even if you close this page. You can also refresh this page.');
}
async function load(){
 const response=await fetch('/api/store/catalog');if(!response.ok)throw Error('Catalog unavailable');const {products,enabled,token,provider}=await response.json();
 if(enabled&&provider==='ziina')ready=true;
 else if(enabled&&window.Paddle){
  if(token.startsWith('test_'))window.Paddle.Environment.set('sandbox');
  window.Paddle.Initialize({token,eventCallback:event=>{if(event.name==='checkout.completed')receipt(event.data?.transaction_id);if(event.name==='checkout.error')tell('Checkout could not be completed. Please try again.')}});ready=true;
 }
 tell(ready?'Choose a design. Pay $2 once, then download your code.':'Browse the designs below. Checkout is being prepared and is not open yet.');
 const bySlug=new Map(products.map(p=>[p.slug,p]));
 for(const button of document.querySelectorAll('[data-buy]')){
  const p=bySlug.get(button.dataset.buy);button.disabled=!(ready&&p?.available);button.textContent=button.disabled?'Checkout coming soon':'Buy for $2';
  button.addEventListener('click',async()=>{
   button.disabled=true;
   try{
    const email=provider==='ziina'?await deliveryEmail(p):undefined;if(provider==='ziina'&&!email)return;
    button.textContent='Opening secure checkout…';
    const data=await post('/api/store/session',{slug:p.slug,email});active={slug:p.slug,claim:data.claim,transactionId:data.transactionId,provider};remember();
    if(provider==='ziina')location.assign(data.redirectUrl);
    else window.Paddle.Checkout.open({items:[{priceId:data.priceId,quantity:1}],customData:{devmania_claim:data.claim},settings:{allowLogout:true}});
   }catch(error){tell(error.message);status.scrollIntoView({behavior:'smooth',block:'center'})}finally{button.disabled=false;button.textContent='Buy for $2'}
  });
 }
 const params=new URLSearchParams(location.search);
 if(['canceled','failed'].includes(params.get('checkout')))tell('Checkout was not completed. Choose your design to try again.');
 else if(active?.transactionId&&active?.claim)receipt(active.transactionId);
 else if(params.has('payment'))tell('If you completed payment, your download link will arrive at the email entered before checkout.');
}
load().catch(()=>tell('Checkout is temporarily unavailable. Please try again later.'));
