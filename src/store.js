const status=document.querySelector('#store-status');
const list=document.querySelector('#store-products');
const tell=text=>{status.textContent=text};
async function load(){
 const response=await fetch('/api/store/catalog');
 if(!response.ok)throw Error('Catalog unavailable');
 const {products,enabled,token}=await response.json();
 if(!products.length){tell('No designs are listed yet. Check back for the next DevMania reel.');return}
 tell(enabled?'Choose a design to open Paddle Checkout.':'Checkout is not open yet.');
 let ready=false;
 if(enabled&&window.Paddle){
  try{
   if(token.startsWith('test_'))window.Paddle.Environment.set('sandbox');
   window.Paddle.Initialize({token,eventCallback:event=>{
    if(event.name==='checkout.completed')tell('Payment received. Your code will be emailed to the address you used at checkout.');
    if(event.name==='checkout.error')tell('Checkout could not be opened. Please try again.');
   }});
   ready=true;
   if(token.startsWith('test_'))tell('Test checkout only. No real payment will be collected.');
  }catch{tell('Checkout is temporarily unavailable.')}
 }else if(enabled){tell('Checkout is temporarily unavailable.')}
 for(const product of products){
  const card=document.createElement('article');card.className='policy-block';
  const title=document.createElement('h2');title.textContent=product.name;
  const description=document.createElement('p');description.textContent=product.description;
  const price=document.createElement('p');price.textContent='$1 USD';
  const button=document.createElement('button');button.type='button';button.className='button';
  button.textContent=ready?'Buy design code':'Checkout unavailable';button.disabled=!ready;
  button.addEventListener('click',()=>{
   try{window.Paddle.Checkout.open({items:[{priceId:product.priceId,quantity:1}],settings:{allowLogout:true}})}
   catch{tell('Checkout is temporarily unavailable. Please try again.')}
  });
  card.append(title,description,price,button);list.append(card);
 }
}
load().catch(()=>tell('The store is temporarily unavailable. Please try again later.'));
