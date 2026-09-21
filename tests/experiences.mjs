import assert from 'node:assert/strict';
import fs from 'node:fs';
import {restoreState,recordExperience,experienceState,pickSurprise} from '../src/experience-state.js';
import {parseTerminal} from '../src/terminal.js';
import {validConcept,fallbackConcept} from '../src/builder.js';
import worker from '../.cloudflare/index.js';
const projects=JSON.parse(fs.readFileSync('src/projects.json'));
assert.equal(projects.filter(p=>p.experience.playground.enabled).length,3);
for(const p of projects){const e=p.experience;assert.equal(e.projectId,p.id);const ids=e.publicArchitecture.nodes.map(n=>n.id);for(const edge of e.publicArchitecture.edges)assert(ids.includes(edge.from)&&ids.includes(edge.to));for(const tag of e.universeTags)assert([...p.categories,...p.capabilities].includes(tag));assert(!e.verifiedDate);}
assert.deepEqual(restoreState({getItem(){throw Error()}}).viewedProjects,[]);
assert.deepEqual(restoreState({getItem(){return '{"viewedProjects":["a","a",{},5],"terminalDiscovered":"yes"}'}}).viewedProjects,['a']);
const seen=[];for(let i=0;i<projects.length;i++){const p=pickSurprise(projects,seen,()=>0);assert(!seen.includes(p.id));seen.push(p.id)}
for(const p of projects.slice(0,5))recordExperience('project',p.id);
assert(experienceState.unlockedAchievements.includes('CURIOUS HUMAN'));
assert.deepEqual(recordExperience('project',projects[0].id),[]);
assert.deepEqual(recordExperience('terminal'),['NERD DETECTED']);assert.deepEqual(recordExperience('terminal'),[]);
for(const cmd of ['git status','env','ls','cat secret','npm install','ssh host','curl url','eval alert(1)','help;env','rm -rf /'])assert.equal(parseTerminal(cmd,projects).lines[0],'ACCESS DENIED — Private development environment.');
const concept=fallbackConcept('Website','A business workflow proposal',projects);
for(const change of [{coreSystems:[]},{nextStep:'x'.repeat(501)},{suggestedPhases:[null]},{matchingProjectIds:['private-repository']},{complexity:{score:3,level:'low',explanation:{}}}])assert(!validConcept({...concept,...change},projects));
const originalFetch=globalThis.fetch;let sent;
globalThis.fetch=async(url,opts)=>{sent=JSON.parse(opts.body);return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(concept)}]}]}))};
const env={OPENAI_API_KEY:'test',OPENAI_MODEL:'test'};
const req=body=>new Request('https://www.dev-mania.com/api/challenge',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'challenge-test'},body:JSON.stringify(body)});
try{assert.equal((await worker.fetch(req(null),env)).status,400);const r=await worker.fetch(req({productType:'Website',idea:'We lose reservations through WhatsApp',secret:'do not pass through'}),env);assert.equal(r.status,200);assert(sent.instructions.includes('business problem'));assert(!sent.input.includes('do not pass through'));assert.equal(sent.store,false);assert(validConcept(await r.json(),projects));}finally{globalThis.fetch=originalFetch}
const names=['experiences.js','experience-state.js','universe.js','playground.js','experiences.css'];for(const name of names){assert(fs.existsSync('dist/'+name));assert(!/github\.com|sk-proj-|ghp_[a-zA-Z0-9]{20}/.test(fs.readFileSync('dist/'+name,'utf8')))}
console.log('PASS experience metadata, demo count, session privacy, achievements, surprise uniqueness, terminal denylist, structured validation, challenge routing and public asset checks');
