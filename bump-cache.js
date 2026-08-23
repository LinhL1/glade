'use strict';
// Recomputes sw.js's CACHE name from the contents of the files it precaches,
// so the service worker automatically invalidates old caches whenever any
// precached file changes — no more manually remembering to bump a version.
// Run by .github/workflows/bump-cache.yml on every push to main.
const fs = require('fs');
const crypto = require('crypto');

const swPath = 'sw.js';
const sw = fs.readFileSync(swPath, 'utf8');

const shellMatch = sw.match(/const SHELL = \[([\s\S]*?)\];/);
if (!shellMatch) {
  console.error('Could not find SHELL array in sw.js');
  process.exit(1);
}

const files = [...shellMatch[1].matchAll(/'([^']+)'/g)]
  .map(m => m[1])
  .filter(f => f !== './'); // './' has no file on disk; 'index.html' already covers that content

const hash = crypto.createHash('sha256');
for (const f of files) {
  hash.update(f); // include the filename so renames/additions also change the hash
  hash.update(fs.readFileSync(f));
}
const newCache = `glade-${hash.digest('hex').slice(0, 12)}`;

const cacheMatch = sw.match(/const CACHE = '([^']+)';/);
const currentCache = cacheMatch && cacheMatch[1];

if (currentCache === newCache) {
  console.log('Cache already up to date:', currentCache);
  process.exit(0);
}

fs.writeFileSync(swPath, sw.replace(/const CACHE = '[^']+';/, `const CACHE = '${newCache}';`));
console.log('Bumped CACHE:', currentCache, '->', newCache);
