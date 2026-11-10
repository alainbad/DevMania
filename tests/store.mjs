import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {storeCatalog,storeWebhook,StoreOrder} from '../server/store.js';
const priceId='pri_'+'a'.repeat(26), id='txn_'+'b'.repeat(26), customer='ctm_'+'c'.repeat(26);
const product={priceId,slug:'demo',name:'Demo',description:'Code',filename:'demo.txt',contentKeys:['STORE_CODE_DEMO']};
const data=new Map();
const ctx={storage:{get:k=>data.get(k),put:(k,v)=>data.set(k,v)},blockConcurrencyWhile:f=>f()};
const env={PADDLE_CLIENT_TOKEN:'test_demo',PADDLE_API_KEY:'test',PADDLE_WEBHOOK_SECRET:'test',RESEND_API_KEY:'test',STORE_FROM_EMAIL:'store@example.com',STORE_CHECKOUT_ENABLED:'true',STORE_PRODUCTS:JSON.stringify([product]),STORE_CODE_DEMO:'SGVsbG8='};
const order=new StoreOrder(ctx,env);
env.STORE_ORDERS={idFromName:n=>n,get:()=>({fetch:(url,opts)=>order.fetch(new Request(url,opts))})};
let sent=0;
globalThis.fetch=async(url,opts)=>{
 if(url.startsWith('https://sandbox-api.paddle.com/'))return Response.json({data:{email:'buyer@example.com'}});
 assert.equal(url,'https://api.resend.com/emails');
 assert.equal(opts.headers['Idempotency-Key'],'devmania-store/'+id);
 const payload=JSON.parse(opts.body);
 assert.deepEqual(payload.to,['buyer@example.com']);
 assert.deepEqual(payload.attachments,[{filename:'demo.txt',content:'SGVsbG8='}]);
 sent++;return Response.json({id:'test'});
};
const catalog=await storeCatalog(env).json();
assert.equal(catalog.enabled,true);
assert.equal(catalog.products[0].content,undefined);
assert.equal(catalog.products[0].contentKeys,undefined);
assert.equal((await storeCatalog({...env,RESEND_API_KEY:''}).json()).enabled,false);
const event={event_type:'transaction.completed',data:{id,customer_id:customer,status:'completed',currency_code:'USD',items:[{price:{id:priceId,unit_price:{currency_code:'USD',amount:'100'},billing_cycle:null}}]}};
function request(event,valid=true){
 const body=JSON.stringify(event),ts=Math.floor(Date.now()/1000);
 const sig=createHmac('sha256',env.PADDLE_WEBHOOK_SECRET).update(ts+':'+body).digest('hex');
 return new Request('https://example.com/api/store/paddle',{method:'POST',body,headers:{'Paddle-Signature':'ts='+ts+';h1='+(valid?sig:'0'.repeat(64))}});
}
assert.equal((await storeWebhook(request(event,false),env)).status,401);
assert.equal((await storeWebhook(request({...event,event_type:'transaction.paid'}),env)).status,200);
assert.equal((await storeWebhook(request({...event,data:{...event.data,currency_code:'EUR'}}),env)).status,422);
assert.equal(sent,0);
assert.equal((await storeWebhook(request(event),env)).status,200);
assert.equal((await storeWebhook(request(event),env)).status,200);
assert.equal(sent,1);
console.log('Store checks passed: safe catalog, signed completed payment, currency validation, email attachment and duplicate protection.');
