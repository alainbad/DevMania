export const companyPaths=['/projects/','/scope/','/about/','/contact/','/support/','/pricing/','/terms/','/privacy/','/refunds/','/store/'];
const links=[['Home','/','home'],['Our Projects','/projects/','projects'],['Instant Digital Store','/store/','store'],['Our Scope','/scope/','scope'],['Blogs','/blog/','blog'],['About Us','/about/','about'],['Contact Us','/contact/','contact'],['Support','/support/','support']];
const paths={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 projects:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0M10 12h4"/>',
 store:'<path d="m5 7-2 4v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-9l-2-4zM3 11h18M8 7V6a4 4 0 0 1 8 0v1M8 14a4 4 0 0 0 8 0"/>',
 scope:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 blog:'<path d="M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zM12 5v16M6 8h3M15 8h3"/>',
 about:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-4-6"/>',
 contact:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',
 support:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M21 17v1a4 4 0 0 1-4 4h-3"/><rect x="2" y="11" width="5" height="8" rx="2"/><rect x="17" y="11" width="5" height="8" rx="2"/>'
};
const icon=(name,active=false)=>`<svg class="icon${active?' active-icon':''}" aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
export function navigation(path='/'){
 const items=links.map(([label,url,name])=>{const active=url==='/'?path==='/':path.startsWith(url);return `<a href="${url}" class="nav-item${active?' active':''}" aria-label="${label}" title="${label}"${active?' aria-current="page"':''}>${active?'<span class="active-indicator"></span><span class="spotlight"></span>':''}${icon(name,active)}</a>`}).join('');
 return `<nav class="desktop-nav" data-original-nav aria-label="Main navigation">${items}</nav>`;
}
