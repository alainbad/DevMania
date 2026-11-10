import assert from 'node:assert/strict';
import {bridge} from '../integrations/ziina-bridge/handler.js';
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const pub=Buffer.from(await crypto.subtle.exportKey('spki',pair.publicKey)).toString('base64');
const id=crypto.randomUUID(),account=crypto.randomUUID(),message='DevMania '+crypto.randomUUID()+' / otp-v6';let calls=0,upstreamMessage=message;
const handler=bridge({publicKey:pub,apiKey:'NEVER-RETURN-THIS',slugs:['otp-v6'],fetchImpl:async(url,opts)=>{calls++;assert.ok(url.startsWith('https://api-v2.ziina.com/api/payment_intent'));if(opts.body){const b=JSON.parse(opts.body);assert.equal(b.amount,200);assert.equal(b.success_url,'https://www.dev-mania.com/store/?payment={PAYMENT_INTENT_ID}');assert.equal(b.test,true)}return Response.json({id,account_id:account,amount:200,currency_code:'USD',status:'completed',message:upstreamMessage,card_details:{private:'omit'},access_token:'omit'})}});
async function req(data,time=Date.now(),change=false){const raw=JSON.stringify(data),ts=String(time);const sig=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode('devmania-ziina-v1\n'+ts+'\n'+raw))).toString('base64');return new Request('https://example.com',{method:'POST',headers:{'X-DevMania-Time':ts,'X-DevMania-Signature':sig},body:change?raw+' ':raw})}
const data={path:'/payment_intent',body:{amount:200,currency_code:'USD',message,test:true,allow_tips:false,success_url:'https://attacker.invalid'}};
assert.equal((await handler(new Request('https://example.com',{method:'POST',body:'{}'}))).status,401);
assert.equal((await handler(await req(data,Date.now()-90000))).status,401);assert.equal((await handler(await req(data,Date.now(),true))).status,401);assert.equal(calls,0);
assert.equal((await handler(await req({...data,body:{...data.body,amount:1}}))).status,400);assert.equal(calls,0);
const created=await(await handler(await req(data))).json();assert.equal(created.id,id);assert.equal(created.card_details,undefined);assert.equal(created.access_token,undefined);
assert.equal((await handler(await req({path:'/payment_intent/'+id,message}))).status,200);
upstreamMessage='Fixenator private order';assert.equal((await handler(await req({path:'/payment_intent/'+id,message}))).status,422);
assert.equal((await handler(await req({path:'/refund',message}))).status,400);
assert.equal((await handler(await req({path:'/payment_intent/../../account',message}))).status,400);
assert.equal((await handler(await req({...data,body:{...data.body,message:'DevMania '+crypto.randomUUID()+' / unknown'}}))).status,400);
console.log('Ziina bridge tests passed: signed requests, tamper/expiry rejection, $2-only creation, fixed return URLs, operation restrictions, cross-project isolation and response redaction.');
