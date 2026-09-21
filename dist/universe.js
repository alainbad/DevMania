export function mountUniverse({content:c,dialog},{el,projects,button,tag,track,record,contact,onProject}) {
  const tags=[...new Set(projects.flatMap(p=>p.experience.universeTags))].sort();
  c.replaceChildren(el('p','EXPLORE THE UNIVERSE','exp-kicker'),el('h3','Ideas are connected.','exp-title'),el('p','Choose a capability to reveal its projects. Drag to pan, use + / − to zoom, or explore the accessible list.'));
  let selected=tag,x=0,y=0,scale=1;
  const label=el('label','Capability or category');const select=el('select');for(const t of ['',...tags]){const o=el('option',t||'All connections');o.value=t;select.append(o)}select.value=tag;label.append(select);
  const controls=el('div',undefined,'exp-actions');const viewport=el('div',undefined,'exp-universe-viewport');viewport.setAttribute('aria-label','Interactive project map. Use the project list below for keyboard navigation.');
  const world=el('div',undefined,'exp-universe-world');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1000 700');svg.setAttribute('aria-hidden','true');world.append(svg);
  const positions=projects.map((p,i)=>{const a=(i/projects.length)*Math.PI*2-Math.PI/2;return {p,x:500+350*Math.cos(a),y:350+260*Math.sin(a)}});
  const center=el('div','DEV//MANIA','exp-universe-center');world.append(center);const nodes=[];
  for(const {p,x:nx,y:ny} of positions){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',500);line.setAttribute('y1',350);line.setAttribute('x2',nx);line.setAttribute('y2',ny);svg.append(line);const b=button('',()=>{if(dragged)return;track('universe_node_selected',{projectId:p.id});onProject(p)},'exp-universe-node');b.style.left=nx+'px';b.style.top=ny+'px';b.append(el('strong',p.name),el('small',p.categories[0]+' · '+p.capabilities.slice(0,2).join(' / ')));world.append(b);nodes.push({p,b,line})}
  viewport.append(world);const status=el('p');status.setAttribute('role','status');const list=el('div',undefined,'exp-project-list');
  function apply(){const matching=projects.filter(p=>!selected||p.experience.universeTags.includes(selected));nodes.forEach(({p,b,line})=>{const match=matching.includes(p);b.classList.toggle('dimmed',!match);line.classList.toggle('dimmed',!match);b.disabled=!match});center.textContent=selected||'DEV//MANIA';status.textContent=matching.length+' connected projects';list.replaceChildren();matching.forEach(p=>{const b=button(p.name+' · '+p.categories[0],()=>{track('universe_node_selected',{projectId:p.id});onProject(p)},'exp-project-item');list.append(b)})}
  const transform=()=>world.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  function fit(){scale=Math.max(.85,Math.min(viewport.clientWidth/1000,viewport.clientHeight/700));x=(viewport.clientWidth-1000*scale)/2;y=(viewport.clientHeight-700*scale)/2;transform()}
  function zoom(factor){const next=Math.max(.25,Math.min(2,scale*factor)),cx=viewport.clientWidth/2,cy=viewport.clientHeight/2;x=cx-(cx-x)*next/scale;y=cy-(cy-y)*next/scale;scale=next;transform()}
  controls.append(button('− Zoom out',()=>zoom(.8)),button('+ Zoom in',()=>zoom(1.25)),button('Reset',()=>{selected='';select.value='';apply();fit()}),button('Exit',()=>dialog.close()));
  select.onchange=()=>{selected=select.value;if(selected)record('category',selected);apply()};
  let pointer=null,startX=0,startY=0,dragged=false;
  viewport.onpointerdown=e=>{if(e.button&&e.button!==0)return;pointer=e.pointerId;startX=e.clientX;startY=e.clientY;dragged=false};
  viewport.onpointermove=e=>{if(pointer!==e.pointerId)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>4||dragged){dragged=true;viewport.setPointerCapture(e.pointerId);x+=dx;y+=dy;startX=e.clientX;startY=e.clientY;transform()}};
  viewport.onpointerup=viewport.onpointercancel=()=>{pointer=null};
  c.append(label,controls,viewport,status,el('h3','Accessible project list'),list,button('Start a project',()=>contact(),'button'));
  const resize=new ResizeObserver(fit);resize.observe(viewport);dialog.addEventListener('close',()=>resize.disconnect(),{once:true});apply();requestAnimationFrame(fit);
}
