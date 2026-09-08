import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { html, loadStyles } from './harness.js';

async function setup(writeText, hash = '') {
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: `https://example.test/portfolio/${hash}` });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function () { w.lastScrolledId = this.id; };
  Object.defineProperty(w, 'isSecureContext', { value: true });
  if (writeText) Object.defineProperty(w.navigator, 'clipboard', { value: { writeText }, configurable: true });
  w.eval(readFileSync(new URL('../parallax.js', import.meta.url), 'utf8'));
  if (w.document.readyState === 'loading') {
    await new Promise(resolve => w.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  return dom;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('Project gallery shows one selection and keeps implementation details available', async () => {
  const dom = await setup();
  const { document } = dom.window;
  assert.deepEqual([...document.querySelectorAll('#projects article:not([hidden])')].map(p => p.id), ['project-dashboard']);
  document.querySelector('#tab-albion').click();
  assert.deepEqual([...document.querySelectorAll('#projects article:not([hidden])')].map(p => p.id), ['project-albion']);
  assert.equal(dom.window.location.hash, '#project-albion');
  assert.equal(document.querySelector('#tab-albion').getAttribute('aria-selected'), 'true');
  const details = document.querySelector('#project-albion details');
  details.open = true;
  document.querySelector('#tab-dashboard').click();
  document.querySelector('#tab-albion').click();
  assert.equal(details.open, true);
  dom.window.close();
});

test('Project tabs support keyboard selection, wrapping, and focus', async () => {
  const dom = await setup();
  const { document, KeyboardEvent } = dom.window;
  const press = (id, key) => document.getElementById(id).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  press('tab-dashboard', 'ArrowLeft');
  assert.equal(document.activeElement.id, 'tab-recehin');
  assert.equal(document.querySelector('#project-recehin').hidden, false);
  press('tab-recehin', 'Home');
  press('tab-dashboard', 'ArrowRight');
  assert.equal(document.activeElement.id, 'tab-smarthome');
  assert.equal(document.querySelectorAll('.project-nav a[tabindex="0"]').length, 1);
  dom.window.close();
});

test('Project deep links and links from Skills reveal the requested project', async () => {
  const dom = await setup(undefined, '#project-smarthome');
  assert.equal(dom.window.document.querySelector('#project-smarthome').hidden, false);
  dom.window.location.hash = '#project-recehin';
  await flush();
  assert.equal(dom.window.document.querySelector('#project-recehin').hidden, false);
  assert.equal(dom.window.lastScrolledId, 'project-recehin');
  dom.window.close();
});

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
