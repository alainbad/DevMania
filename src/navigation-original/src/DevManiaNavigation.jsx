// Adapted from the supplied Navigation Bars V2 / src/App.jsx dark navbar.
// Original motion: shared active-indicator and spotlight, spring 300 / 30.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Home, BriefcaseBusiness, ShoppingBag, LayoutGrid, BookOpen, Users, Mail, Headphones } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
const icons=[Home,BriefcaseBusiness,ShoppingBag,LayoutGrid,BookOpen,Users,Mail,Headphones]
export function OriginalNavigation({tabs,initialActive}){
 const [hoveredTab,setHoveredTab]=useState(null),[focusedTab,setFocusedTab]=useState(null)
 const reduce=useReducedMotion(),highlightedTab=hoveredTab??focusedTab??initialActive
 const spring=reduce?{duration:0}:{type:'spring',stiffness:300,damping:30}
 return <>{tabs.map((tab,index)=>{const Icon=icons[index],isActive=initialActive===index,isHighlighted=highlightedTab===index;return <a key={tab.href} href={tab.href} title={tab.label} aria-label={tab.label} aria-current={isActive?'page':undefined} className={`nav-item ${isActive?'active':''}`} onPointerEnter={event=>{if(event.pointerType!=='touch')setHoveredTab(index)}} onPointerLeave={()=>setHoveredTab(null)} onFocus={()=>setFocusedTab(index)} onBlur={()=>setFocusedTab(null)}>
  {isHighlighted&&<><motion.div layoutId="active-indicator" className="active-indicator" transition={spring}/><motion.div layoutId="spotlight" className="spotlight" transition={spring}/></>}
  <Icon className={`icon ${isHighlighted?'active-icon':''}`} size={26} strokeWidth={2} aria-hidden="true"/>
 </a>})}</>
}
export function mountOriginalNavigation(){
 for(const host of document.querySelectorAll('[data-original-nav]')){
  if(host.dataset.mounted)continue
  const links=[...host.querySelectorAll('a')];const tabs=links.map(a=>({href:a.getAttribute('href'),label:a.getAttribute('aria-label')}));if(tabs.length!==8)continue
  const active=links.findIndex(a=>a.getAttribute('aria-current')==='page');host.dataset.mounted='true'
  createRoot(host).render(<OriginalNavigation tabs={tabs} initialActive={active}/>);
 }
}
