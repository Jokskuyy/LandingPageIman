import test from 'node:test';
import assert from 'node:assert/strict';
import { loadIndexHtml, loadStyles } from './harness.js';

test('About preserves current education and explains the AI-assisted workflow', () => {
  const { document } = loadIndexHtml();
  assert.equal(document.querySelectorAll('#about').length, 1);
  const text = document.querySelector('#about').textContent;
  assert.match(text, /UPN\s+Veteran\s+Jakarta/i);
  assert.match(text, /3\.76/);
  assert.match(text, /2022\s*[–-]\s*2026/);
  assert.match(text, /AI-assisted/i);
  assert.doesNotMatch(document.body.textContent, /final.year|3\.75/);
});

test('Delivery includes compiled local CSS and no runtime styling dependency', () => {
  const { document } = loadIndexHtml();
  assert.ok(loadStyles(document).length > 1000, 'actual linked CSS must exist');
  assert.equal(document.querySelector('script[src*="tailwindcss.com"]'), null);
  assert.equal(document.querySelector('#tailwind-config'), null);
  const scripts = [...document.querySelectorAll('script[src]')];
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].getAttribute('src'), 'parallax.js');
  assert.ok(scripts[0].hasAttribute('defer'));
});
