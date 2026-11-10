const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const encode=new TextEncoder();
const priceId=/^pri_[a-z0-9]{26}$/;
const transactionId=/^txn_[a-z0-9]{26}$/;

function catalog(env){
 let items;
 try{items=JSON.parse(env.STORE_PRODUCTS||'[]')}catch{return []}
 if(!Array.isArray(items)||items.length>100)return [];
 const valid=items.map(p=>{
  if(!p||typeof p!=='object'||!Array.isArray(p.contentKeys))return p;
  const keys=p.contentKeys;
  const content=keys.length>0&&keys.length<=64&&keys.every(k=>typeof k==='string'&&/^STORE_CODE_[A-Z0-9_]{1,80}$/.test(k)&&typeof env[k]==='string')?keys.map(k=>env[k]).join(''):'';
  return {...p,content};
 }).filter(p=>p&&priceId.test(p.priceId)&&/^[a-z0-9-]{1,80}$/.test(p.slug)&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=100&&typeof p.description==='string'&&p.description.length<=500&&/^[a-zA-Z0-9_-]+\.(zip|html|txt)$/.test(p.filename)&&typeof p.content==='string'&&p.content.length<=256000&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(p.content)&&p.content.length>0);
 return new Set(valid.map(p=>p.priceId)).size===valid.length&&new Set(valid.map(p=>p.slug)).size===valid.length?valid:[];
}
const configured=env=>Boolean(env.PADDLE_WEBHOOK_SECRET&&env.PADDLE_API_KEY&&env.RESEND_API_KEY&&env.STORE_FROM_EMAIL&&env.STORE_ORDERS&&/^((live|test)_[a-zA-Z0-9]+)$/.test(env.PADDLE_CLIENT_TOKEN||''));
export function storeCatalog(env){
 const products=catalog(env).map(({slug,name,description,priceId})=>({slug,name,description,priceId}));
 const enabled=configured(env)&&env.STORE_CHECKOUT_ENABLED==='true'&&products.length>0;
 return json({products,enabled,token:enabled?env.PADDLE_CLIENT_TOKEN:null});
}
async function authenticated(header,body,secret){
 const parts=(header||'').split(';').map(part=>part.trim().split('='));
 const ts=parts.find(([key])=>key==='ts')?.[1];
 if(!/^\d{10}$/.test(ts||'')||Math.abs(Date.now()/1000-Number(ts))>5)return false;
 const key=await crypto.subtle.importKey('raw',encode.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const [type,value] of parts){
  if(type!=='h1'||!/^[a-f\d]{64}$/i.test(value||''))continue;
  const sig=Uint8Array.from(value.match(/../g),x=>parseInt(x,16));
  if(await crypto.subtle.verify('HMAC',key,sig,encode.encode(ts+':'+body)))return true;
 }
 return false;
}
export async function storeWebhook(request,env){
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!configured(env))return json({error:'Store is not configured'},503);
 if(Number(request.headers.get('content-length'))>262144)return json({error:'Body too large'},413);
 const reader=request.body?.getReader();if(!reader)return json({error:'Missing body'},400);
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>262144){await reader.cancel();return json({error:'Body too large'},413)}chunks.push(value)}
 const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length}
 const body=new TextDecoder().decode(raw);
 if(!await authenticated(request.headers.get('Paddle-Signature'),body,env.PADDLE_WEBHOOK_SECRET))return json({error:'Invalid signature'},401);
 let event;try{event=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}
 const data=event?.data;
 if(event?.event_type!=='transaction.completed'||data?.status!=='completed')return json({ignored:true});
 if(!transactionId.test(data.id)||!/^ctm_[a-z0-9]{26}$/.test(data.customer_id)||!Array.isArray(data.items))return json({error:'Invalid transaction'},400);
 const byPrice=new Map(catalog(env).map(p=>[p.priceId,p]));
 const items=data.items.filter(item=>byPrice.has(item?.price?.id));
 if(!items.length)return json({ignored:true});
 if(data.currency_code!=='USD'||items.some(({price})=>price.unit_price?.currency_code!=='USD'||price.unit_price?.amount!=='100'||price.billing_cycle))return json({error:'Unexpected store price'},422);
 return env.STORE_ORDERS.get(env.STORE_ORDERS.idFromName(data.id)).fetch('https://store.internal/fulfill',{
  method:'POST',body:JSON.stringify({id:data.id,customer:data.customer_id,priceIds:[...new Set(items.map(x=>x.price.id))]})
 });
}

// One durable record per paid transaction. Paddle retries failed deliveries;
// Resend's idempotency key also covers an accepted send whose response was lost.
export class StoreOrder{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async fetch(request){
  const order=await request.json();
  return this.ctx.blockConcurrencyWhile(async()=>{
   if(await this.ctx.storage.get('sent'))return json({delivered:true});
   const env=this.env, items=order.priceIds.map(id=>catalog(env).find(p=>p.priceId===id));
   if(items.some(p=>!p))return json({error:'Product unavailable for delivery'},503);
   const base=env.PADDLE_CLIENT_TOKEN.startsWith('test_')?'https://sandbox-api.paddle.com':'https://api.paddle.com';
   try{
    const buyer=await fetch(base+'/customers/'+order.customer,{headers:{Authorization:'Bearer '+env.PADDLE_API_KEY},signal:AbortSignal.timeout(1700)});
    if(!buyer.ok)throw Error('customer lookup failed');
    const {data}=await buyer.json();
    if(typeof data?.email!=='string'||!data.email.includes('@'))throw Error('customer email missing');
    const first=await this.ctx.storage.get('sendStarted');
    if(first&&Date.now()-first>23*3600000)return json({error:'Delivery needs manual review'},503);
    if(!first)await this.ctx.storage.put('sendStarted',Date.now());
    const delivery=await fetch('https://api.resend.com/emails',{
     method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'devmania-store/'+order.id},
     body:JSON.stringify({from:env.STORE_FROM_EMAIL,to:[data.email],subject:'Your DevMania design code'+(items.length>1?'s':''),text:'Thanks for shopping at the Instant Digital Store. Your design code is attached.\n\n'+items.map(p=>p.name).join('\n')+'\n\nOrder: '+order.id+'\nQuestions? Reply or contact support@dev-mania.com.',reply_to:'support@dev-mania.com',attachments:items.map(p=>({filename:p.filename,content:p.content}))}),
     signal:AbortSignal.timeout(2000)
    });
    if(!delivery.ok)throw Error('email submission failed');
    await this.ctx.storage.put('sent',true);
    return json({delivered:true});
   }catch{return json({error:'Delivery will be retried'},503)}
  });
 }
}
