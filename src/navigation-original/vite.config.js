import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
export default defineConfig({define:{'process.env.NODE_ENV':'"production"'},plugins:[react()],publicDir:false,build:{outDir:'..',emptyOutDir:false,lib:{entry:fileURLToPath(new URL('./src/DevManiaNavigation.jsx',import.meta.url)),formats:['es'],fileName:()=> 'original-nav.js'},minify:true}})
