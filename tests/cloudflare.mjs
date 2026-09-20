import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../.cloudflare/index.js';
let assetCalls = 0;
const env = {ASSETS: {fetch: async request => {
  assetCalls++;
  return new Response(request.method === 'HEAD' ? null : 'asset', {headers: {'Content-Type': 'text/plain'}});
}}};
for (const path of ['/', '/os.js', '/assets/parently.png']) {
  assert.equal(await (await worker.fetch(new Request('https://www.dev-mania.com' + path), env)).text(), 'asset');
}
assert.equal(await (await worker.fetch(new Request('https://www.dev-mania.com/', {method: 'HEAD'}), env)).text(), '');
const before = assetCalls;
for (const path of ['/server/index.js', '/server/assets.js', '/.openai/hosting.json', '/src/projects.json', '/api/unknown']) {
  assert.equal((await worker.fetch(new Request('https://www.dev-mania.com' + path), env)).status, 404);
}
assert.equal(assetCalls, before);
const response = await worker.fetch(new Request('https://www.dev-mania.com/api/idea', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({productType: 'Website', idea: 'A portfolio for my business'})
}), env);
assert.equal(response.status, 503);
assert.match(response.headers.get('Content-Type'), /application\/json/);
assert.equal(assetCalls, before);
assert.equal((await worker.fetch(new Request('https://www.dev-mania.com/api/idea'), env)).status, 405);
assert(fs.statSync('.cloudflare/assets.js').size < 10000);
console.log('Cloudflare checks passed: asset delegation, HEAD, private paths, API routing, missing-key fallback, compact bundle.');
