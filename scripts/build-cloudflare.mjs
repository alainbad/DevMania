import './build.mjs';
import fs from 'node:fs';

// Reuse the existing endpoint, but serve images through Cloudflare's asset binding.
// The embedded asset bundle is for the existing Sites build only.
fs.mkdirSync('.cloudflare', {recursive: true});
for (const file of ['index.js', 'projects.js', 'validation.js']) {
  fs.copyFileSync('dist/server/' + file, '.cloudflare/' + file);
}
const blogFiles = fs.readdirSync('dist/blog', {recursive:true}).filter(name=>name.endsWith('.html')).map(name=>'blog/'+name);
const serviceFiles = fs.readdirSync('dist/services', {recursive:true}).filter(name=>name.endsWith('.html')).map(name=>'services/'+name);
const publicFiles = [...blogFiles,...serviceFiles,'blog.css','sitemap.xml','robots.txt','index.html', 'style.css', 'app.js', 'os.css', 'os.js',
  'matcher.js', 'builder.js', 'terminal.js', 'projects.json',
  'experience-state.js','experiences.js','experiences.css','playground.js','universe.js',
  ...fs.readdirSync('dist/assets').map(name => 'assets/' + name)];
const allowlist = Object.fromEntries(publicFiles.map(name => ['/' + name, true]));
fs.writeFileSync('.cloudflare/assets.js', 'export default ' + JSON.stringify(allowlist) + ';\n');
console.log('Cloudflare runtime built without embedded images.');
