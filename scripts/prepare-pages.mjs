import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Build the reviewed current model and the historical model separately. Never
// merge their rendering source or replace one model's assets with the other's.
const astraRef = '8f55172b4a81ebc157fab409ae1d8c9ac5e31212';
const astraPath = 'studies/astra-8f55172';
const site = 'https://charlesmish.github.io/nocturne40/';
const source = resolve(process.argv[2] ?? '.review/astra-source');
const output = resolve('dist');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('-C', source, 'rev-parse', 'HEAD'), astraRef, 'Unexpected Astra source pin');
git('-C', source, 'diff', '--exit-code', 'HEAD');

// These are the verified September 7 public bytes, reproduced with its lockfile.
const historicalHashes = {
  'index.html': '32351e58cd6a92182d7bb38eebcb7f4d8b7bfafdfce81ca30074b050ee1346cc',
  'viewer.html': 'ddc54dc72ef344c1beeef27deb9f143cbb7ab167ed6e4fcea5f911debe4408e8',
  'assets/presentation-CrM3bTn7.js': '2921313d07ce8d617acdafd22238ad4f85b14ccaa0bc14b30e05f68fb70ce03c',
  'assets/viewer-BqNn1SkP.js': '261fe6d3ae73c1737f9ef5bead2616dd48136310b199ecd16c04f09b5e74cab5',
  'assets/going-train-core-C-HMDpPG.glb': 'e8c950e5d89df308aa30fe978254320952dea10f8bf2bec72f22f65e88437b6b',
};
for (const [file, hash] of Object.entries(historicalHashes)) {
  assert.equal(sha256(await readFile(join(source, 'dist-pages', file))), hash, `Historical asset changed: ${file}`);
}
await mkdir(join(output, astraPath), { recursive: true });
await cp(join(source, 'dist-pages'), join(output, astraPath), { recursive: true });

// Only archival HTML labels/navigation change. Its JS, CSS, model and camera
// behavior remain exactly the previously published study.
for (const name of ['index.html', 'watch.html']) {
  const file = join(output, astraPath, name);
  let html = await readFile(file, 'utf8');
  assert.ok(html.includes('<title>Nocturne 40</title>'));
  assert.ok(html.includes('A watch design study'));
  html = html.replace('<title>Nocturne 40</title>', `<title>Nocturne 40 — Arc / Flow (Astra study)</title>\n  <link rel="canonical" href="${site}${astraPath}/">`)
    .replace('A watch design study', 'Arc / Flow · Astra study')
    .replace('Charles Mish · Nocturne 40</span>', `Charles Mish · <a href="https://github.com/CharlesMish/nocturne40/tree/${astraRef}">Astra 8f55172</a></span>`)
    .replace('<footer>', '<footer><a href="../../watch.html">Precise Dress ↗</a>');
  await writeFile(file, html);
}

// Preserve old public Astra technical links, including every query parameter.
await writeFile(join(output, 'viewer.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nocturne 40 — Arc / Flow technical viewer</title>
<link rel="canonical" href="${site}${astraPath}/viewer.html"></head>
<body><a href="./${astraPath}/viewer.html">Open the preserved Arc / Flow technical viewer</a>
<script>location.replace('./${astraPath}/viewer.html'+location.search+location.hash);</script></body></html>\n`);
await writeFile(join(output, '.nojekyll'), '');

const presentation = await readFile(join(output, 'watch.html'), 'utf8');
assert.ok(presentation.includes(`href="./${astraPath}/"`), 'Presentation must link the preserved alternate');
assert.ok(presentation.includes(`${site}watch.html`), 'Precise Dress canonical must stay distinct');
for (const file of ['index.html', 'compare.html', `${astraPath}/viewer.html`]) await readFile(join(output, file));
const hashes = {};
async function recordFiles(directory = '') {
  for (const entry of await readdir(join(output, directory), { withFileTypes: true })) {
    const path = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await recordFiles(path);
    else if (path !== 'deployment-manifest.json') hashes[path] = sha256(await readFile(join(output, path)));
  }
}
await recordFiles();
await writeFile(join(output, 'deployment-manifest.json'), JSON.stringify({
  presentationRef: git('rev-parse', 'HEAD'), astraRef, astraPath,
  reviewedPresentationRef: 'd72cda86d927277ccf6ce812117d05801f89efbe',
  historicalHashes, hashes,
}, null, 2) + '\n');
console.log(`Pages ready: Precise Dress at root, Arc / Flow at ${astraPath}/; historical asset hashes verified.`);
