import products from '../src/store-products.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const enc=new TextEncoder(),pricePattern=/^pri_[a-z0-9]{26}$/,transactionPattern=/^(?:txn_[a-z0-9]{26}|ziina_[a-f0-9-]{36})$/;
const origin='https://www.dev-mania.com';
const paddleConfigured=env=>Boolean(env.PADDLE_WEBHOOK_SECRET&&env.PADDLE_API_KEY&&env.RESEND_API_KEY&&env.STORE_FROM_EMAIL&&env.STORE_DOWNLOAD_SECRET&&env.STORE_FILES&&env.STORE_ORDERS&&/^(live|test)_[a-zA-Z0-9]+$/.test(env.PADDLE_CLIENT_TOKEN||''));
const ziinaBase='https://api-v2.ziina.com/api';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ziinaConfigured=env=>Boolean((env.ZIINA_ACCESS_TOKEN||(env.ZIINA_BRIDGE_PRIVATE_KEY&&env.ZIINA_BRIDGE_URL))&&env.RESEND_API_KEY&&env.STORE_FROM_EMAIL&&env.STORE_DOWNLOAD_SECRET&&env.STORE_FILES&&env.STORE_ORDERS);
const provider=env=>env.STORE_PAYMENT_PROVIDER==='ziina'?'ziina':'paddle';
const configured=env=>provider(env)==='ziina'?ziinaConfigured(env):paddleConfigured(env);
const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
const sessionAttempts=new Map();
async function ziinaAPI(env,path,body,message){
 if(env.ZIINA_BRIDGE_PRIVATE_KEY&&env.ZIINA_BRIDGE_URL){
  const raw=JSON.stringify({path,body,message}),ts=String(Date.now());
  const privateKey=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(env.ZIINA_BRIDGE_PRIVATE_KEY),c=>c.charCodeAt(0)),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},privateKey,enc.encode('devmania-ziina-v1\n'+ts+'\n'+raw)));
  const result=await fetch(env.ZIINA_BRIDGE_URL,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','X-DevMania-Time':ts,'X-DevMania-Signature':btoa(String.fromCharCode(...sig))},body:raw,signal:AbortSignal.timeout(20000)});
  if(!result.ok)throw Error('Payment service unavailable');return result.json();
 }
 const response=await fetch(ziinaBase+path,{method:body?'POST':'GET',redirect:'error',headers:{Authorization:'Bearer '+env.ZIINA_ACCESS_TOKEN,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Payment service unavailable');return response.json();
}
function storeObject(env,id){return env.STORE_ORDERS.get(env.STORE_ORDERS.idFromName(id))}
function catalog(env){
 let ids;try{ids=JSON.parse(env.STORE_PRICE_IDS||'{}')}catch{ids={}}
 if(!ids||typeof ids!=='object'||Array.isArray(ids))ids={};
 const values=Object.values(ids);if(new Set(values).size!==values.length)ids={};
 return products.map(p=>({...p,priceId:pricePattern.test(ids[p.slug]||'')?ids[p.slug]:null,key:'designs/'+p.slug+'/'+p.version+'.zip'}));
}
export function storeCatalog(env){const list=catalog(env),paymentProvider=provider(env);const ready=configured(env)&&env.STORE_CHECKOUT_ENABLED==='true'&&(paymentProvider==='ziina'||list.some(p=>p.priceId));return json({products:list.map(({key,...p})=>({...p,available:ready&&(paymentProvider==='ziina'||Boolean(p.priceId))})),enabled:ready,provider:paymentProvider,token:ready&&paymentProvider==='paddle'?env.PADDLE_CLIENT_TOKEN:null})}

async function bodyJSON(request,max=8192){const raw=await limitedBody(request,max);if(raw===null)return null;try{return JSON.parse(raw)}catch{return null}}
async function limitedBody(request,max){if(Number(request.headers.get('content-length'))>max)return null;const reader=request.body?.getReader();if(!reader)return null;const chunks=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();return null}chunks.push(value)}const all=new Uint8Array(length);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}return new TextDecoder().decode(all)}
const b64=data=>btoa(String.fromCharCode(...data)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function unb64(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('invalid token');return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
async function key(secret,usage){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,[usage])}
async function token(payload,secret){const data=b64(enc.encode(JSON.stringify(payload)));return data+'.'+b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret,'sign'),enc.encode('devmania-store:'+data))))}
async function verifyToken(value,secret,kind){try{if(!secret||typeof value!=='string'||value.length>2048)return null;const parts=value.split('.');if(parts.length!==2)return null;const [data,sig]=parts;if(!await crypto.subtle.verify('HMAC',await key(secret,'verify'),unb64(sig),enc.encode('devmania-store:'+data)))return null;const p=JSON.parse(new TextDecoder().decode(unb64(data)));return p.kind===kind&&Number.isInteger(p.exp)&&p.exp>Date.now()/1000?p:null}catch{return null}}
function sameOrigin(request){const value=request.headers.get('Origin');return !value||value===new URL(request.url).origin}
export async function storeSession(request,env){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!sameOrigin(request))return json({error:'Origin not allowed'},403);
 if(provider(env)==='ziina')return ziinaSession(request,env);
 if(!configured(env)||env.STORE_CHECKOUT_ENABLED!=='true')return json({error:'Checkout is not open yet'},503);
 const data=await bodyJSON(request),product=catalog(env).find(p=>p.slug===data?.slug&&p.priceId);if(!product)return json({error:'Design unavailable'},404);
 if(!await env.STORE_FILES.head(product.key))return json({error:'Design download is temporarily unavailable'},503);
 const claim=await token({kind:'claim',slug:product.slug,nonce:crypto.randomUUID(),exp:Math.floor(Date.now()/1000)+86400},env.STORE_DOWNLOAD_SECRET);
 return json({claim,priceId:product.priceId});
}
async function ziinaSession(request,env){
 const testing=Boolean(env.STORE_TEST_KEY&&request.headers.get('X-Store-Test-Key')===env.STORE_TEST_KEY);
 if(!ziinaConfigured(env)||(!testing&&env.STORE_CHECKOUT_ENABLED!=='true'))return json({error:'Checkout is not open yet'},503);
 const ip=request.headers.get('CF-Connecting-IP')||'local',now=Date.now();
 for(const [k,v] of sessionAttempts)if(v.until<now)sessionAttempts.delete(k);
 const count=sessionAttempts.get(ip)||{n:0,until:now+60000};if(++count.n>10||sessionAttempts.size>5000)return json({error:'Please wait a minute before trying again'},429);sessionAttempts.set(ip,count);
 const data=await bodyJSON(request),product=catalog(env).find(p=>p.slug===data?.slug);
 if(!product)return json({error:'Design unavailable'},404);
 const email=typeof data.email==='string'?data.email.trim():'';
 if(!validEmail(email))return json({error:'Enter a valid email for your download link'},400);
 if(!await env.STORE_FILES.head(product.key))return json({error:'Design download is temporarily unavailable'},503);
 const claimData={kind:'claim',slug:product.slug,nonce:crypto.randomUUID(),exp:Math.floor(now/1000)+86400};
 try{
  const payment=await ziinaAPI(env,'/payment_intent',{amount:200,currency_code:'USD',message:'DevMania '+claimData.nonce+' / '+product.slug,success_url:origin+'/store/?payment={PAYMENT_INTENT_ID}',cancel_url:origin+'/store/?payment={PAYMENT_INTENT_ID}&checkout=canceled',failure_url:origin+'/store/?payment={PAYMENT_INTENT_ID}&checkout=failed',test:testing,allow_tips:false,expiry:String(now+30*60000)});
  if(!uuid.test(payment.id||'')||!uuid.test(payment.account_id||'')||(env.ZIINA_ACCOUNT_ID&&payment.account_id!==env.ZIINA_ACCOUNT_ID)||payment.amount!==200||payment.currency_code!=='USD')throw Error('Unexpected payment');
  const redirect=new URL(payment.redirect_url);if(redirect.origin!=='https://pay.ziina.com'||redirect.username||redirect.password)throw Error('Invalid checkout URL');
  const id='ziina_'+payment.id;
  const saved=await storeObject(env,id).fetch('https://store.internal/register',{method:'POST',body:JSON.stringify({id,paymentId:payment.id,provider:'ziina',accountId:payment.account_id,message:'DevMania '+claimData.nonce+' / '+product.slug,email,claimNonce:claimData.nonce,test:testing,createdAt:now,items:[{slug:product.slug,name:product.name,key:product.key,filename:product.filename}]})});
  if(!saved.ok)throw Error('Order registration failed');
  return json({claim:await token(claimData,env.STORE_DOWNLOAD_SECRET),transactionId:id,redirectUrl:redirect.href,provider:'ziina',test:testing});
 }catch{return json({error:'Checkout could not be opened. Please try again.'},502)}
}
export async function storeZiinaWebhook(request,env){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!ziinaConfigured(env)||!env.ZIINA_WEBHOOK_SECRET)return json({error:'Store not configured'},503);
 const allowed=['3.29.184.186','3.29.190.95','20.233.47.127','13.202.161.181'];
 if(!allowed.includes(request.headers.get('CF-Connecting-IP')))return json({error:'Invalid sender'},401);
 const body=await limitedBody(request,65536);if(body===null)return json({error:'Invalid body'},413);
 const sig=request.headers.get('X-Hmac-Signature')||'';
 if(!/^[a-f0-9]{64}$/i.test(sig)||!await crypto.subtle.verify('HMAC',await key(env.ZIINA_WEBHOOK_SECRET,'verify'),Uint8Array.from(sig.match(/../g),v=>parseInt(v,16)),enc.encode(body)))return json({error:'Invalid signature'},401);
 let event;try{event=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}
 if(event.event!=='payment_intent.status.updated'||!uuid.test(event.data?.id||''))return json({ignored:true});
 return storeObject(env,'ziina_'+event.data.id).fetch('https://store.internal/confirm',{method:'POST',body:'{}'});
}
export async function storeReceipt(request,env){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!sameOrigin(request))return json({error:'Origin not allowed'},403);
 const data=await bodyJSON(request),claim=await verifyToken(data?.claim,env.STORE_DOWNLOAD_SECRET,'claim');
 if(!claim||!transactionPattern.test(data?.transactionId||'')||!env.STORE_ORDERS)return json({error:'Receipt unavailable'},403);
 return env.STORE_ORDERS.get(env.STORE_ORDERS.idFromName(data.transactionId)).fetch('https://store.internal/receipt',{method:'POST',body:JSON.stringify({id:data.transactionId,claim})});
}
export async function storeDownload(request,env){
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 const p=await verifyToken(new URL(request.url).searchParams.get('token'),env.STORE_DOWNLOAD_SECRET,'download');
 if(!p||!transactionPattern.test(p.transactionId||'')||!env.STORE_ORDERS)return json({error:'This download link is invalid or expired. Contact support@dev-mania.com with your receipt.'},403);
 return env.STORE_ORDERS.get(env.STORE_ORDERS.idFromName(p.transactionId)).fetch('https://store.internal/download',{method:'POST',body:JSON.stringify({slug:p.slug,id:p.transactionId})});
}
async function authenticated(header,body,secret){
 const parts=(header||'').split(';').map(p=>p.trim().split('=')),ts=parts.find(([k])=>k==='ts')?.[1];
 if(!/^\d{10}$/.test(ts||'')||Math.abs(Date.now()/1000-Number(ts))>5)return false;
 for(const [kind,value] of parts){if(kind!=='h1'||!/^[a-f\d]{64}$/i.test(value||''))continue;const signature=Uint8Array.from(value.match(/../g),x=>parseInt(x,16));if(await crypto.subtle.verify('HMAC',await key(secret,'verify'),signature,enc.encode(ts+':'+body)))return true}return false;
}
export async function storeWebhook(request,env){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!paddleConfigured(env))return json({error:'Store is not configured'},503);
 const body=await limitedBody(request,262144);if(body===null)return json({error:'Invalid or oversized body'},413);
 if(!await authenticated(request.headers.get('Paddle-Signature'),body,env.PADDLE_WEBHOOK_SECRET))return json({error:'Invalid signature'},401);
 let event;try{event=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}const data=event?.data;
 if(event.event_type!=='transaction.completed'||data?.status!=='completed')return json({ignored:true});
 if(!transactionPattern.test(data.id)||!/^ctm_[a-z0-9]{26}$/.test(data.customer_id)||!Array.isArray(data.items))return json({error:'Invalid transaction'},400);
 const byPrice=new Map(catalog(env).filter(p=>p.priceId).map(p=>[p.priceId,p])),items=data.items.filter(i=>byPrice.has(i?.price?.id));if(!items.length)return json({ignored:true});
 if(data.currency_code!=='USD'||items.some(i=>i.price.unit_price?.currency_code!=='USD'||i.price.unit_price?.amount!=='200'||i.price.billing_cycle||!Number.isInteger(i.quantity)||i.quantity<1))return json({error:'Unexpected store price'},422);
 const purchased=[...new Set(items.map(i=>i.price.id))].map(id=>byPrice.get(id));
 const claim=await verifyToken(data.custom_data?.devmania_claim,env.STORE_DOWNLOAD_SECRET,'claim');
 const claimNonce=claim&&purchased.some(p=>p.slug===claim.slug)?claim.nonce:null;
 return env.STORE_ORDERS.get(env.STORE_ORDERS.idFromName(data.id)).fetch('https://store.internal/fulfill',{method:'POST',body:JSON.stringify({id:data.id,customer:data.customer_id,claimNonce,items:purchased.map(({slug,name,key,filename})=>({slug,name,key,filename}))})});
}
async function links(order,env){return Promise.all(order.items.map(async p=>({name:p.name,filename:p.filename,url:origin+'/api/store/download?token='+await token({kind:'download',transactionId:order.id,slug:p.slug,exp:Math.floor(Date.now()/1000)+7*86400},env.STORE_DOWNLOAD_SECRET)})))}
export class StoreOrder{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async alarm(){
  await this.confirmZiina();
  const pending=await this.ctx.storage.get('pending');if(!pending)return;
  if(await this.ctx.storage.get('sent')||await this.ctx.storage.get('terminal'))return;
  const age=Date.now()-pending.createdAt;
  if(age<48*3600000)await this.ctx.storage.setAlarm(Date.now()+(age<120000?15000:age<3600000?60000:3600000));
 }
 async confirmZiina(){
  const env=this.env,pending=await this.ctx.storage.get('pending');if(!pending)return json({ignored:true});
  let paid=await this.ctx.storage.get('paid');
  if(!paid){
   try{
    const payment=await ziinaAPI(env,'/payment_intent/'+pending.paymentId,undefined,pending.message);
    if(payment.id!==pending.paymentId||payment.account_id!==pending.accountId||(env.ZIINA_ACCOUNT_ID&&payment.account_id!==env.ZIINA_ACCOUNT_ID)||payment.message!==pending.message||(!pending.test&&payment.test===true)||payment.amount!==200||payment.currency_code!=='USD'||payment.tip_amount!==0||Number(payment.vat_amount||0)!==0)return json({error:'Payment details do not match this order'},422);
    if(payment.status==='failed'||payment.status==='canceled'){await this.ctx.storage.put('terminal',payment.status);return json({paid:false,status:payment.status})}
    if(payment.status!=='completed')return json({pending:true},202);
    paid=pending;
   }catch{return json({error:'Payment confirmation temporarily unavailable'},503)}
  }
  return this.fetch(new Request('https://store.internal/fulfill',{method:'POST',body:JSON.stringify(paid)}));
 }
 async fetch(request){
  const path=new URL(request.url).pathname,data=await request.json(),env=this.env;
  if(path==='/register')return this.ctx.blockConcurrencyWhile(async()=>{
   if(await this.ctx.storage.get('pending'))return json({error:'Order already exists'},409);
   if(data.provider!=='ziina'||!uuid.test(data.paymentId||'')||data.id!=='ziina_'+data.paymentId||!validEmail(data.email))return json({error:'Invalid order'},400);
   await this.ctx.storage.put('pending',data);await this.ctx.storage.setAlarm(Date.now()+15000);return json({registered:true});
  });
  if(path==='/confirm')return this.confirmZiina();
  if(path==='/receipt'&&data.id?.startsWith('ziina_')){
   const pending=await this.ctx.storage.get('pending');
   if(!pending||pending.claimNonce!==data.claim?.nonce||!pending.items.some(p=>p.slug===data.claim?.slug))return json({error:'Receipt unavailable'},403);
   if(!await this.ctx.storage.get('paid')){
    const last=await this.ctx.storage.get('lastCheck')||0;
    if(Date.now()-last>=3000){await this.ctx.storage.put('lastCheck',Date.now());const result=await this.confirmZiina();if(result.status===422)return result}
    const terminal=await this.ctx.storage.get('terminal');if(terminal)return json({paid:false,status:terminal});
   }
  }
  if(path==='/receipt'||path==='/download'){
   const paid=await this.ctx.storage.get('paid');if(!paid)return json({pending:true},202);
   if(paid.id!==data.id)return json({error:'Order unavailable'},403);
   if(path==='/receipt'){if(!paid.claimNonce||paid.claimNonce!==data.claim?.nonce||!paid.items.some(p=>p.slug===data.claim?.slug))return json({error:'Receipt unavailable'},403);return json({paid:true,downloads:await links(paid,env)})}
   const product=paid.items.find(p=>p.slug===data.slug);if(!product)return json({error:'Download unavailable'},404);
   const file=await env.STORE_FILES.get(product.key);if(!file)return json({error:'Download temporarily unavailable. Contact support@dev-mania.com.'},503);
   return new Response(file.body,{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="'+product.filename+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  }
  if(path!=='/fulfill')return json({error:'Not found'},404);
  return this.ctx.blockConcurrencyWhile(async()=>{
   const previous=await this.ctx.storage.get('paid');if(previous&&(previous.id!==data.id||previous.customer!==data.customer))return json({error:'Order conflict'},409);
   const order=previous||data;if(!previous)await this.ctx.storage.put('paid',order);
   if(await this.ctx.storage.get('sent'))return json({delivered:true});
   try{
    for(const p of order.items)if(!await env.STORE_FILES.head(p.key))return json({error:'Download unavailable for delivery'},503);
    let buyer={email:order.email};
    if(order.provider!=='ziina'){const base=env.PADDLE_CLIENT_TOKEN.startsWith('test_')?'https://sandbox-api.paddle.com':'https://api.paddle.com';
    const response=await fetch(base+'/customers/'+order.customer,{headers:{Authorization:'Bearer '+env.PADDLE_API_KEY},signal:AbortSignal.timeout(1700)});if(!response.ok)throw Error('Customer unavailable');buyer=(await response.json()).data;}if(!validEmail(buyer?.email))throw Error('Email unavailable');
    const first=await this.ctx.storage.get('sendStarted');if(first&&Date.now()-first>23*3600000)return json({error:'Delivery needs manual review'},503);if(!first)await this.ctx.storage.put('sendStarted',Date.now());
    let downloads=await this.ctx.storage.get('emailLinks');if(!downloads){downloads=await links(order,env);await this.ctx.storage.put('emailLinks',downloads)}
    const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'devmania-store/'+order.id},body:JSON.stringify({from:env.STORE_FROM_EMAIL,to:[buyer.email],subject:'Your DevMania design code',text:'Thank you for your purchase. Download your design source below:\n\n'+downloads.map(p=>p.name+'\n'+p.url).join('\n\n')+'\n\nThese private links expire in 7 days. Save your ZIP files after downloading.\nOrder: '+order.id+'\nNeed a new download link or help? Contact support@dev-mania.com.',reply_to:'support@dev-mania.com'}),signal:AbortSignal.timeout(2000)});
    if(!sent.ok)throw Error('Email submission failed');await this.ctx.storage.put('sent',true);return json({delivered:true});
   }catch{return json({error:'Delivery will be retried'},503)}
  });
 }
}
