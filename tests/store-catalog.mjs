import assert from 'node:assert/strict';
import fs from 'node:fs';
import products from '../src/store-products.js';
import categories from '../src/store-categories.js';
import {storeSession} from '../server/store.js';
assert.equal(products.length,65);assert.equal(Object.keys(categories).length,11);assert.equal(new Set(products.map(p=>p.slug)).size,65);
const bridgeSource=fs.readFileSync('integrations/ziina-bridge/index.ts','utf8');const allowlist=JSON.parse(bridgeSource.match(/slugs:(\[[^\]]*\])/)[1]);assert.deepEqual(allowlist,products.map(p=>p.slug));
const account=crypto.randomUUID();let body,registered,expectedKey;
const env={STORE_PAYMENT_PROVIDER:'ziina',ZIINA_ACCESS_TOKEN:'test',ZIINA_ACCOUNT_ID:account,STORE_DOWNLOAD_SECRET:'test-only',RESEND_API_KEY:'test',STORE_FROM_EMAIL:'store@example.com',STORE_CHECKOUT_ENABLED:'true',STORE_FILES:{head:async k=>{assert.equal(k,expectedKey);return {}}},STORE_ORDERS:{idFromName:n=>n,get:n=>({fetch:async(url,opts)=>{registered=JSON.parse(opts.body);return Response.json({ok:true})}})}};
globalThis.fetch=async(url,opts)=>{assert.equal(url,'https://api-v2.ziina.com/api/payment_intent');body=JSON.parse(opts.body);const id=crypto.randomUUID();return Response.json({...body,id,account_id:account,status:'requires_payment_instrument',redirect_url:'https://pay.ziina.com/payment_intent/'+id})};
for(const p of products){
 assert.equal(p.price,200);assert.equal(p.currency,'USD');assert.ok(p.categories.length&&p.categories.every(c=>categories[c]));expectedKey='designs/'+p.slug+'/'+p.version+'.zip';
 const req=new Request('https://www.dev-mania.com/api/store/session',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'catalog-'+p.slug},body:JSON.stringify({slug:p.slug,email:'buyer@example.com',amount:1,currency:'AED',test:true})});const response=await storeSession(req,env);assert.equal(response.status,200,p.slug);assert.equal(body.amount,200);assert.equal(body.currency_code,'USD');assert.equal(body.test,false);assert.equal(registered.items[0].slug,p.slug);assert.equal(registered.items[0].key,expectedKey);
}
console.log('All 65 products: unique slugs, 11 valid categories, matching bridge allowlist, exact $2 USD checkout, correct private ZIP binding, and client-price/test tampering rejected.');
