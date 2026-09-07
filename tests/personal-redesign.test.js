import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { loadIndexHtml } from './harness.js';

test('Creative lab: original layered scene, motion control and graduate workflow', () => {
  const { document } = loadIndexHtml();
  assert.ok(document.querySelector('#motion-toggle[aria-pressed][type="button"]'));
  assert.equal(document.querySelector('#particle-field')?.getAttribute('aria-hidden'), 'true');
  assert.ok(document.querySelectorAll('#hero [data-parallax] .float-art').length >= 4);
  assert.match(document.querySelector('#about').textContent, /AI-assisted/);
  assert.doesNotMatch(document.body.textContent, /final.year/i);
});

async function setup(reduced = false) {
  const dom = new JSDOM(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test' });
  const { window: w } = dom;
  const frames = new Map(); let id = 0; const media = new Map();
  w.matchMedia = query => {
    if (!media.has(query)) {
      const m = new w.EventTarget(); m.matches = query.includes('reduce') ? reduced : true;
      media.set(query, m);
    }
    return media.get(query);
  };
  w.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
  w.cancelAnimationFrame = id => frames.delete(id);
  const ctx = { setTransform() {}, clearRect() {}, beginPath() {}, arc() {}, fill() {} };
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  w.eval(readFileSync(new URL('../parallax.js', import.meta.url), 'utf8'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { dom, w, frames, media, tick() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(16)); } };
}

test('Motion: toggle cancels frames, resets parallax, resumes exactly one loop', async () => {
  const s = await setup(); const { w, frames } = s;
  const button = w.document.querySelector('#motion-toggle');
  assert.ok(button, 'motion control must exist');
  assert.equal(frames.size, 1);
  w.scrollY = 9000; w.dispatchEvent(new w.Event('scroll')); s.tick();
  const layer = w.document.querySelector('[data-parallax]');
  assert.ok(Math.abs(parseFloat(layer.style.getPropertyValue('--parallax-y'))) <= 48);
  button.click();
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(frames.size, 0);
  assert.equal(layer.style.getPropertyValue('--parallax-y'), '0px');
  button.click(); assert.equal(frames.size, 1);
  w.dispatchEvent(new w.Event('scroll')); w.dispatchEvent(new w.Event('resize'));
  assert.equal(frames.size, 1);
  s.dom.window.close();
});

test('Motion: runtime reduced motion and document visibility stop and resume safely', async () => {
  const s = await setup(true); const { w, frames, media } = s;
  assert.equal(frames.size, 0);
  assert.equal(w.document.documentElement.dataset.motion, 'paused');
  const preference = media.get('(prefers-reduced-motion: reduce)');
  preference.matches = false; preference.dispatchEvent(new w.Event('change'));
  assert.equal(frames.size, 1);
  Object.defineProperty(w.document, 'hidden', { configurable: true, value: true });
  w.document.dispatchEvent(new w.Event('visibilitychange')); assert.equal(frames.size, 0);
  Object.defineProperty(w.document, 'hidden', { configurable: true, value: false });
  w.document.dispatchEvent(new w.Event('visibilitychange')); assert.equal(frames.size, 1);
  preference.matches = true; preference.dispatchEvent(new w.Event('change'));
  assert.equal(frames.size, 0);
  assert.ok([...w.document.querySelectorAll('.reveal')].every(el => el.classList.contains('is-visible')));
  s.dom.window.close();
});
