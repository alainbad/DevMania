import assert from 'node:assert/strict';
import {ideaEndpoint} from '../dist/server/index.js';
const originalFetch=globalThis.fetch;
const req=(ip)=>new Request('https://www.dev-mania.com/api/idea',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':ip},body:JSON.stringify({productType:'Website',idea:'Job fair for recruiters and job seekers'})});
const env={OPENAI_API_KEY:'test-not-a-real-key',OPENAI_MODEL:'test'};
try{
 for(const [status,expected,code] of [[401,503,'configuration'],[429,429,'rate_limit'],[500,503,'provider_error']]){
  globalThis.fetch=async()=>new Response('{}',{status});
  const r=await ideaEndpoint(req(String(status)),env);assert.equal(r.status,expected);assert.equal((await r.json()).code,code);
 }
 globalThis.fetch=async()=>{throw new DOMException('expired','TimeoutError')};
 const timeout=await ideaEndpoint(req('timeout'),env);assert.equal(timeout.status,504);assert.equal((await timeout.json()).code,'timeout');
 globalThis.fetch=async()=>new Response('{broken JSON');
 const invalid=await ideaEndpoint(req('invalid-json'),env);assert.equal(invalid.status,502);assert.equal((await invalid.json()).code,'invalid_response');
 console.log('PASS safe provider, configuration, rate-limit, timeout and invalid-response errors');
}finally{globalThis.fetch=originalFetch}
