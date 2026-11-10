import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {storeCatalog,storeSession,storeReceipt,storeDownload,storeZiinaWebhook,StoreOrder} from '../server/store.js';
const slug='otp-v6',account=randomUUID(),payments=new Map(),states=new Map(),objects=new Map(),alarms=new Map(),files=new Map([['designs/otp-v6/1.0.0.zip','PRIVATE ZIP']]);
let emails=0,failEmail=false,created=[];
const env={STORE_PAYMENT_PROVIDER:'ziina',ZIINA_ACCESS_TOKEN:'secret',ZIINA_ACCOUNT_ID:account,ZIINA_WEBHOOK_SECRET:'hook',STORE_DOWNLOAD_SECRET:'private',RESEND_API_KEY:'resend',STORE_FROM_EMAIL:'store@example.com',STORE_CHECKOUT_ENABLED:'true',STORE_TEST_KEY:'test-access',STORE_FILES:{head:async k=>files.has(k)?{}:null,get:async k=>files.has(k)?{body:files.get(k)}:null}};
env.STORE_ORDERS={idFromName:n=>n,get:n=>{if(!objects.has(n)){const data=new Map();states.set(n,data);objects.set(n,new StoreOrder({storage:{get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),setAlarm:async time=>alarms.set(n,time)},blockConcurrencyWhile:f=>f()},env))}return {fetch:(url,opts)=>objects.get(n).fetch(new Request(url,opts))}}};
globalThis.fetch=async(url,opts)=>{
 if(url==='https://api-v2.ziina.com/api/payment_intent'){
  const data=JSON.parse(opts.body);created.push(data);assert.equal(data.amount,200);assert.equal(data.currency_code,'USD');assert.equal(data.allow_tips,false);assert.ok(!('email' in data));
  const id=randomUUID(),p={...data,id,account_id:account,status:'requires_payment_instrument',redirect_url:'https://pay.ziina.com/payment/'+id,tip_amount:0};payments.set(id,p);return Response.json(p);
 }
 if(url.startsWith('https://api-v2.ziina.com/api/payment_intent/'))return Response.json(payments.get(url.split('/').at(-1)));
 assert.equal(url,'https://api.resend.com/emails');const data=JSON.parse(opts.body);assert.deepEqual(data.to,['buyer@example.com']);if(failEmail)return Response.json({}, {status:500});emails++;return Response.json({id:'mail'});
};
let requestNumber=0;
const post=(path,data,extra={})=>new Request('https://www.dev-mania.com/api/store/'+path,{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'test-'+(++requestNumber),...extra},body:JSON.stringify(data)});
const session=async(extra={},requestExtra={})=>storeSession(post('session',{slug,email:'buyer@example.com',...extra},requestExtra),env);
const cat=await storeCatalog(env).json();assert.equal(cat.provider,'ziina');assert.equal(cat.token,null);assert.equal(cat.products.filter(p=>p.available).length,18);
assert.equal((await session({email:'invalid'})).status,400);
const s=await(await session({amount:1,currency:'AED',test:true})).json();assert.equal(created.at(-1).test,false);const id=s.transactionId.slice(6);
assert.equal((await storeReceipt(post('receipt',{transactionId:s.transactionId,claim:s.claim}),env)).status,202);
assert.ok(alarms.has(s.transactionId));assert.equal(emails,0);
const other=await(await session()).json();assert.equal((await storeReceipt(post('receipt',{transactionId:s.transactionId,claim:other.claim}),env)).status,403);
// A signed notification is not sufficient: the payment must independently match the registered order.
function hook(id,{sig=true,ip='3.29.184.186'}={}){const body=JSON.stringify({event:'payment_intent.status.updated',data:{id,status:'completed'}});return new Request('https://www.dev-mania.com/api/store/ziina',{method:'POST',body,headers:{'CF-Connecting-IP':ip,'X-Hmac-Signature':sig?createHmac('sha256','hook').update(body).digest('hex'):'0'.repeat(64)}})}
assert.equal((await storeZiinaWebhook(hook(id,{sig:false}),env)).status,401);assert.equal((await storeZiinaWebhook(hook(id,{ip:'1.2.3.4'}),env)).status,401);
assert.equal((await storeZiinaWebhook(hook(id),env)).status,202);assert.equal(emails,0);
const payment=payments.get(id);payment.status='completed';
for(const patch of [{amount:100},{currency_code:'AED'},{account_id:randomUUID()},{tip_amount:100}]){const before={...payment};Object.assign(payment,patch);assert.equal((await storeZiinaWebhook(hook(id),env)).status,422);Object.assign(payment,before)}
assert.equal(states.get(s.transactionId).get('paid'),undefined);
// Background reconciliation fulfills even with no webhook and no buyer browser.
await objects.get(s.transactionId).alarm();assert.equal(emails,1);await objects.get(s.transactionId).alarm();assert.equal(emails,1);
const receipt=await(await storeReceipt(post('receipt',{transactionId:s.transactionId,claim:s.claim}),env)).json();assert.equal(receipt.paid,true);assert.equal(await(await storeDownload(new Request(receipt.downloads[0].url),env)).text(),'PRIVATE ZIP');
assert.equal((await storeZiinaWebhook(hook(id),env)).status,200);assert.equal(emails,1);
const unknown=randomUUID();payments.set(unknown,{...payment,id:unknown});assert.deepEqual(await(await storeZiinaWebhook(hook(unknown),env)).json(),{ignored:true});
const secondId=other.transactionId.slice(6);payments.get(secondId).status='completed';failEmail=true;await objects.get(other.transactionId).alarm();assert.ok(states.get(other.transactionId).get('paid'));assert.ok(!states.get(other.transactionId).get('sent'));failEmail=false;await objects.get(other.transactionId).alarm();assert.equal(emails,2);
const failed=await(await session()).json();payments.get(failed.transactionId.slice(6)).status='failed';await objects.get(failed.transactionId).alarm();assert.equal(states.get(failed.transactionId).get('terminal'),'failed');assert.equal(states.get(failed.transactionId).get('paid'),undefined);
env.STORE_CHECKOUT_ENABLED='false';assert.equal((await session()).status,503);assert.equal((await session({}, {'X-Store-Test-Key':'wrong'})).status,503);
const test=await(await session({}, {'X-Store-Test-Key':'test-access'})).json();assert.equal(test.test,true);assert.equal(created.at(-1).test,true);assert.equal((await storeCatalog(env).json()).enabled,false);
delete env.STORE_TEST_KEY;assert.equal((await session({}, {'X-Store-Test-Key':'test-access'})).status,503);
console.log('Ziina tests passed: exact $2 USD, merchant checks, unpaid isolation, private receipts, authenticated webhooks, background confirmation, idempotent delivery, failed payments, and protected test mode.');
