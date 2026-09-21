// Only public IDs and exploration flags are stored; never ideas or contact details.
const key = 'devmaniaExperienceV1';
const empty = () => ({viewedProjects:[], exploredCategories:[], unlockedAchievements:[], terminalDiscovered:false, maniaModeUnlocked:false, ideaBuilderStarted:false});
export function restoreState(storage) {
  const state=empty();
  try {const raw=JSON.parse(storage?.getItem(key)||'{}');
    for(const k of ['viewedProjects','exploredCategories','unlockedAchievements']) if(Array.isArray(raw[k])) state[k]=[...new Set(raw[k].filter(v=>typeof v==='string'&&v.length<100))].slice(0,100);
    for(const k of ['terminalDiscovered','maniaModeUnlocked','ideaBuilderStarted']) state[k]=raw[k]===true;
  } catch {} return state;
}
let storage;try{storage=globalThis.sessionStorage}catch{}
export const experienceState=restoreState(storage);
export function recordExperience(event,value) {
  const s=experienceState;const unlocked=[];
  const add=(key,v)=>{if(!s[key].includes(v))s[key].push(v)};
  const unlock=id=>{if(!s.unlockedAchievements.includes(id)){add('unlockedAchievements',id);unlocked.push(id)}};
  if(event==='project'&&typeof value==='string'){add('viewedProjects',value);if(s.viewedProjects.length>=5)unlock('CURIOUS HUMAN')}
  if(event==='category'&&typeof value==='string')add('exploredCategories',value);
  if(event==='terminal'){s.terminalDiscovered=true;unlock('NERD DETECTED')}
  if(event==='mania'){s.maniaModeUnlocked=true;unlock('MANIAC')}
  if(event==='idea-start')s.ideaBuilderStarted=true;
  if(event==='idea-complete')unlock('FOUNDER MODE');
  try{storage?.setItem(key,JSON.stringify(s))}catch{}
  return unlocked;
}
export function pickSurprise(projects,viewed=experienceState.viewedProjects,random=Math.random) {
  const eligible=projects.filter(p=>p.featured);const pool=eligible.filter(p=>!viewed.includes(p.id));
  const choices=pool.length?pool:eligible.filter(p=>p.id!==viewed.at(-1));
  return (choices.length?choices:eligible)[Math.floor(random()*(choices.length||eligible.length))];
}
