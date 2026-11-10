import fs from 'node:fs';
import products from '../src/store-products.js';
const mode=process.argv[2];if(!['--sandbox','--live'].includes(mode))throw Error('Specify --sandbox or --live. Set PADDLE_API_KEY locally; never paste it into chat.');
const key=process.env.PADDLE_API_KEY;if(!key)throw Error('PADDLE_API_KEY is not available in this process.');
const base=mode==='--sandbox'?'https://sandbox-api.paddle.com':'https://api.paddle.com';
async function call(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Paddle request failed: '+r.status+' '+path);return r.json()}
async function all(path){const result=[];let next=path;while(next){const r=await call(next);result.push(...r.data);const nextURL=r.meta?.pagination?.has_more?r.meta.pagination.next:null;if(nextURL){const u=new URL(nextURL,base);if(u.origin!==base)throw Error('Unexpected pagination host');next=u.pathname+u.search}else next=null}return result}
const existing=await all('/products?per_page=200&status=active');const mapping={};
for(const p of products){
 const matches=existing.filter(x=>x.custom_data?.devmania_slug===p.slug);if(matches.length>1)throw Error('Ambiguous existing product: '+p.slug);
 let product=matches[0];if(!product){product=(await call('/products',{name:'DevMania — '+p.name,description:p.description,tax_category:'standard',custom_data:{devmania_slug:p.slug,store:'devmania'}})).data;existing.push(product)}
 const prices=await all('/prices?per_page=200&status=active&product_id='+product.id);
 let price=prices.find(x=>x.unit_price?.currency_code==='USD'&&x.unit_price.amount==='200'&&!x.billing_cycle&&!(x.unit_price_overrides?.length)&&x.quantity?.minimum===1&&x.quantity?.maximum===1);
 if(!price)price=(await call('/prices',{product_id:product.id,description:'DevMania individual source code — one-time $2 USD',name:'Design source code',billing_cycle:null,tax_mode:'external',unit_price:{amount:'200',currency_code:'USD'},quantity:{minimum:1,maximum:1}})).data;
 mapping[p.slug]=price.id;console.log(p.slug,price.id);
}
const file='store-price-ids'+(mode==='--sandbox'?'-sandbox':'-live')+'.json';fs.writeFileSync(file,JSON.stringify(mapping,null,2)+'\n');console.log('Saved price IDs to '+file+'. Checkout remains disabled.');
