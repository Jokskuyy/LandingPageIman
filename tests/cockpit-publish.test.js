import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('published cockpit resolves its assets, module graph and portfolio links under the Pages project path', async () => {
  const root = new URL('../', import.meta.url);
  const base = new URL('https://jokskuyy.github.io/LandingPageIman/cockpit/');
  const local = url => {
    assert(url.pathname.startsWith('/LandingPageIman/'), `Escapes project path: ${url}`);
    return new URL(url.pathname.slice('/LandingPageIman/'.length), root);
  };
  const html = await readFile(new URL('cockpit/index.html', root), 'utf8');
  const document = new JSDOM(html).window.document;
  for (const node of document.querySelectorAll('[src], link[href], noscript a[href]')) {
    const url = new URL(node.getAttribute('src') || node.getAttribute('href'), base);
    if (url.origin === base.origin) await access(local(url));
  }
  for (const file of ['prototype.js', 'orbital-intro.js', 'flight-path.js', 'project-moons.js', 'vendor/three/three.module.js', 'vendor/three/three.core.js']) {
    const contents = await readFile(new URL(`cockpit/${file}`, root), 'utf8');
    assert(!contents.includes('node_modules/'), `${file} imports an unpublished dependency`);
    for (const [, specifier] of contents.matchAll(/\b(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)) {
      if (specifier.startsWith('.')) await access(local(new URL(specifier, new URL(file, base))));
    }
  }
  const runtime = await readFile(new URL('cockpit/prototype.js', root), 'utf8');
  assert(runtime.includes("new URL('../index.html', location.href)"));
  assert(runtime.includes('href="../output/pdf/muhammad-iman-nugraha-cv.pdf"'));
  await access(local(new URL('../index.html', base)));
  await access(local(new URL('../output/pdf/muhammad-iman-nugraha-cv.pdf', base)));
  assert((await readFile(new URL('cockpit/vendor/three/LICENSE.txt', root), 'utf8')).includes('MIT License'));
});

test('the cockpit omits Mini Me and no longer publishes its sprite', async () => {
  for (const path of ['../.scratch/space-cockpit/index.html','../cockpit/index.html']) {
    const html = await readFile(new URL(path,import.meta.url),'utf8');
    const document = new JSDOM(html).window.document;
    assert.equal(document.querySelector('.guide,.officer,.holo-beam,.holo-projector,#guide-dialogue'),null);
    assert.equal(document.querySelector('img[src*="officer-sheet"]'),null);
    assert.equal(document.querySelector('#orbital-skip'),null);
    assert(document.querySelector('.destination-nav'));
    assert(document.querySelector('#destination-announcement'));
  }
  await assert.rejects(access(new URL('../cockpit/assets/officer-sheet-v1.png',import.meta.url)),{code:'ENOENT'});
});
