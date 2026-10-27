// Publish only the browser files; keep the design workspace outside Pages.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const source = new URL('../.scratch/space-cockpit/', import.meta.url);
const output = new URL('../cockpit/', import.meta.url);
await mkdir(new URL('assets/', output), { recursive: true });
await mkdir(new URL('vendor/three/', output), { recursive: true });

for (const name of ['index.html', 'prototype.css', 'prototype.js', 'orbital-intro.css', 'orbital-intro.js', 'flight-path.js', 'project-moons.js']) {
  const contents = await readFile(new URL(name, source), 'utf8');
  await writeFile(new URL(name, output), contents
    .replaceAll('../../', '../')
    .replaceAll('./node_modules/three/build/', './vendor/three/'));
}
// Retire the generated sprite even when building over an older cockpit package.
await rm(new URL('assets/officer-sheet-v1.png', output), { force:true });
for (const name of ['cockpit-interior-v1.png', 'cockpit-favicon-v1.svg']) {
  await copyFile(new URL(`assets/${name}`, source), new URL(`assets/${name}`, output));
}
for (const name of ['three.module.js', 'three.core.js']) {
  await copyFile(new URL(`node_modules/three/build/${name}`, source), new URL(`vendor/three/${name}`, output));
}
await copyFile(new URL('node_modules/three/LICENSE', source), new URL('vendor/three/LICENSE.txt', output));
console.log('Built /cockpit/ with local Three.js modules and project assets.');
