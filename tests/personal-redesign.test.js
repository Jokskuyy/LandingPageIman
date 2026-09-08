import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { html, loadStyles } from './harness.js';

async function setup(writeText) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test/portfolio/' });
  const w = dom.window;
  Object.defineProperty(w, 'isSecureContext', { value: true });
  if (writeText) Object.defineProperty(w.navigator, 'clipboard', { value: { writeText }, configurable: true });
  w.eval(readFileSync(new URL('../parallax.js', import.meta.url), 'utf8'));
  if (w.document.readyState === 'loading') {
    await new Promise(resolve => w.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  return dom;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('Without page JavaScript the headline and every project remain visible', () => {
  const dom = new JSDOM(html);
  const style = dom.window.document.createElement('style');
  style.textContent = loadStyles(dom.window.document);
  dom.window.document.head.append(style);
  for (const el of dom.window.document.querySelectorAll('#hero, #hero h1, #projects article')) {
    const css = dom.window.getComputedStyle(el);
    assert.notEqual(css.opacity, '0');
    assert.notEqual(css.display, 'none');
    assert.notEqual(css.visibility, 'hidden');
  }
  dom.window.close();
});

test('Mobile navigation closes when choosing a section and on Escape', async () => {
  const dom = await setup();
  const { document } = dom.window;
  const menu = document.querySelector('header details');
  menu.open = true;
  menu.querySelector('a[href="#projects"]').click();
  assert.equal(menu.open, false);
  menu.open = true;
  menu.querySelector('summary').focus();
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(menu.open, false);
  assert.equal(document.activeElement, menu.querySelector('summary'));
  dom.window.close();
});

test('Copy email writes the address and announces success', async () => {
  const writes = [];
  const dom = await setup(async text => { writes.push(text); });
  const { document } = dom.window;
  document.querySelector('#copy-email').click();
  await flush();
  assert.deepEqual(writes, ['imannnnugraha@gmail.com']);
  assert.match(document.querySelector('#copy-status').textContent, /copied/i);
  dom.window.close();
});

test('Clipboard rejection gives a useful fallback without hiding the address', async () => {
  const dom = await setup(async () => { throw new Error('Clipboard permission denied'); });
  const { document } = dom.window;
  document.querySelector('#copy-email').click();
  await flush();
  assert.match(document.querySelector('#copy-status').textContent, /select|manually/i);
  assert.match(document.querySelector('#contact').textContent, /imannnnugraha@gmail\.com/);
  assert.equal(document.querySelector('#copy-email').disabled, false);
  dom.window.close();
});
