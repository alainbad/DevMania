const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const enc=new TextEncoder(),origin='https://www.dev-mania.com';
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
// Only a server holding DevMania's private signing key can use this adapter.
// The Ziina credential never leaves this runtime. No database/service-role access.
export function bridge({publicKey,apiKey,slugs,fetchImpl=fetch}){
 const verificationKey=crypto.subtle.importKey('spki',bytes(publicKey),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 return async request=>{
  if(request.method!=='POST')return response({error:'Method not allowed'},405);
  const ts=request.headers.get('X-DevMania-Time')||'',sig=request.headers.get('X-DevMania-Signature')||'';
  if(!/^\d{13}$/.test(ts)||Math.abs(Date.now()-Number(ts))>60000||sig.length!==88)return response({error:'Unauthorized'},401);
  if(Number(request.headers.get('content-length'))>4096)return response({error:'Too large'},413);
  let raw='';const reader=request.body?.getReader();if(!reader)return response({error:'Invalid body'},400);
  const chunks=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4096){await reader.cancel();return response({error:'Too large'},413)}chunks.push(value)}const combined=new Uint8Array(length);let offset=0;for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.length}raw=new TextDecoder().decode(combined);
  try{if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await verificationKey,bytes(sig),enc.encode('devmania-ziina-v1\n'+ts+'\n'+raw)))return response({error:'Unauthorized'},401)}catch{return response({error:'Unauthorized'},401)}
  let input;try{input=JSON.parse(raw)}catch{return response({error:'Invalid JSON'},400)}
  if(input.path==='/health')return response({configured:Boolean(apiKey)});
  const expected=input.body?.message||input.message||'',parts=expected.split(' / '),nonce=parts[0]?.replace(/^DevMania /,'');
  if(!expected.startsWith('DevMania ')||parts.length!==2||!uuid.test(nonce)||!slugs.includes(parts[1]))return response({error:'Invalid DevMania order'},400);
  let path,body;
  if(input.path==='/payment_intent'&&input.body){
   const b=input.body;if(b.amount!==200||b.currency_code!=='USD'||b.allow_tips!==false||typeof b.test!=='boolean')return response({error:'Invalid design price'},400);
   path='/payment_intent';body={amount:200,currency_code:'USD',message:expected,test:b.test,allow_tips:false,expiry:String(Date.now()+30*60000),success_url:origin+'/store/?payment={PAYMENT_INTENT_ID}',cancel_url:origin+'/store/?payment={PAYMENT_INTENT_ID}&checkout=canceled',failure_url:origin+'/store/?payment={PAYMENT_INTENT_ID}&checkout=failed'};
  }else if(typeof input.path==='string'&&input.path.startsWith('/payment_intent/')&&uuid.test(input.path.slice(16))&&!input.body)path=input.path;
  else return response({error:'Operation not allowed'},400);
  if(!apiKey)return response({error:'Payment service unavailable'},503);
  try{
   const result=await fetchImpl('https://api-v2.ziina.com/api'+path,{method:body?'POST':'GET',redirect:'error',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
   if(!result.ok)return response({error:'Payment provider unavailable',providerStatus:result.status},502);
   const p=await result.json();if(p.message!==expected||p.amount!==200||p.currency_code!=='USD'||!uuid.test(p.id||'')||!uuid.test(p.account_id||''))return response({error:'Payment binding mismatch'},422);
   const safe={};for(const k of ['id','account_id','amount','currency_code','status','tip_amount','vat_amount','message','redirect_url','test'])if(p[k]!==undefined)safe[k]=p[k];
   return response(safe);
  }catch{return response({error:'Payment provider unavailable'},502)}
 };
}
