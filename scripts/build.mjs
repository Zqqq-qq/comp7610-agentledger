import fs from 'node:fs/promises';
await fs.rm('dist',{recursive:true,force:true});await fs.cp('web','dist',{recursive:true});console.log('Static site built in dist/');
