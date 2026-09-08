import test from 'node:test';
import assert from 'node:assert/strict';
import { loadIndexHtml } from './harness.js';

test('Experience preserves the actual role, company and internship period', () => {
  const { document } = loadIndexHtml();
  const experience = document.querySelector('#experience');
  assert.match(experience.textContent, /Mantra\s*\(Teman Transisi\)/);
  assert.match(experience.querySelector('h3').textContent, /Front-End Intern/);
  assert.deepEqual([...experience.querySelectorAll('time')].map(el => el.dateTime), ['2025-03', '2025-10']);
});

test('Experience describes responsive UI, validation and Laravel API collaboration', () => {
  const { document } = loadIndexHtml();
  const text = document.querySelector('#experience').textContent;
  assert.match(text, /responsive/i);
  assert.match(text, /admin dashboard/i);
  assert.match(text, /validation/i);
  assert.match(text, /CRUD|create.*update/i);
  assert.match(text, /API/i);
  assert.match(text, /Laravel/i);
  const items = [...document.querySelectorAll('#experience li')];
  assert.ok(items.length >= 3);
  assert.ok(items.every(item => item.textContent.trim().length > 0));
});
