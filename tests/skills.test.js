import test from 'node:test';
import assert from 'node:assert/strict';
import { loadIndexHtml } from './harness.js';

test('Core skills link frontend, backend and databases to project evidence', () => {
  const { document } = loadIndexHtml();
  const skills = document.querySelector('#skills');
  const labels = [...skills.querySelectorAll('h3')].map(el => el.textContent.trim());
  assert.ok(labels.some(label => /Frontend/.test(label)));
  assert.ok(labels.some(label => /Backend/.test(label)));
  for (const card of skills.querySelectorAll('.capability-card')) {
    assert.ok(card.querySelector('a.skill-token[href^="#project-"]'), 'each core group needs evidence');
  }
  const tokens = [...skills.querySelectorAll('a.skill-token')];
  assert.ok(tokens.length >= 6);
  for (const token of tokens) {
    assert.ok(token.textContent.trim());
    assert.ok(document.getElementById(token.getAttribute('href').slice(1)));
  }
  for (const expected of ['React', 'TypeScript', 'Express', 'MySQL', 'Supabase']) {
    assert.ok(tokens.some(token => token.textContent.includes(expected)), expected + ' needs evidence');
  }
});
