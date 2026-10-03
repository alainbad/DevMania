export const companyPaths=['/projects/','/scope/','/about/','/contact/','/support/'];
const links=[['Home','/'],['Our Projects','/projects/'],['Our Scope','/scope/'],['Blogs','/blog/'],['About Us','/about/'],['Contact Us','/contact/'],['Support','/support/']];
export function navigation(path='/'){
 const items=links.map(([label,url])=>`<a href="${url}"${(url==='/'?path==='/':path.startsWith(url))?' aria-current="page"':''}>${label}</a>`).join('');
 return `<nav class="desktop-nav" aria-label="Main navigation">${items}</nav><details class="mobile-menu"><summary>Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation">${items}</nav></details>`;
}
