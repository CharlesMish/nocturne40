import { copyFile, rename, writeFile } from 'node:fs/promises';

// Only the Pages build changes its entry points. Local viewer/comparison URLs
// keep their existing meanings; the public root opens the presentation itself.
const output = new URL('../dist-pages/', import.meta.url);
await rename(new URL('index.html', output), new URL('viewer.html', output));
await copyFile(new URL('watch.html', output), new URL('index.html', output));
await writeFile(new URL('.nojekyll', output), '');
console.log('Pages ready: dist-pages/index.html (presentation), viewer.html (Three.js).');
