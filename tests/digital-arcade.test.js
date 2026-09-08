import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadIndexHtml, loadStyles, INDEX_HTML_PATH } from './harness.js';

const root = dirname(INDEX_HTML_PATH);

test('Identity keeps the comic avatar and monogram with no ambient animation', () => {
  const { document } = loadIndexHtml();
  const avatar = document.querySelector('#hero img[src="imgs/iman-avatar-comic-sage.webp"]');
  assert.ok(avatar);
  assert.equal(avatar.getAttribute('fetchpriority'), 'high');
  assert.equal(document.querySelector('link[rel="icon"]').getAttribute('href'), 'favicon.svg');
  assert.equal(document.querySelector('canvas, .ticker, .float-art, [data-scroll-companion], #motion-toggle'), null);
});

test('Accessibility preserves skip navigation, focus and reduced motion', () => {
  const { document } = loadIndexHtml();
  const css = loadStyles(document);
  assert.ok(document.querySelector('a[href="#main-content"]'));
  assert.equal(document.querySelector('meta[name="theme-color"]').content.toLowerCase(), '#161a22');
  assert.match(css, /color-scheme\s*:\s*dark/);
  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /transition\s*:\s*all/);
});

test('Content has a single h1, hierarchical headings and dimensioned images', () => {
  const { document } = loadIndexHtml();
  assert.equal(document.querySelectorAll('h1').length, 1);
  const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(el => Number(el.tagName[1]));
  assert.equal(levels[0], 1);
  levels.slice(1).forEach((level, index) => assert.ok(level <= levels[index] + 1));
  for (const img of document.querySelectorAll('img')) {
    assert.notEqual(img.getAttribute('alt'), null);
    assert.match(img.getAttribute('width') || '', /^\d+$/);
    assert.match(img.getAttribute('height') || '', /^\d+$/);
    assert.ok(existsSync(join(root, img.getAttribute('src'))));
    if (!img.closest('#hero')) assert.equal(img.getAttribute('loading'), 'lazy');
  }
});

test('Links and controls retain semantic external navigation and status', () => {
  const { document } = loadIndexHtml();
  for (const link of document.querySelectorAll('a[href^="https://"]')) {
    assert.equal(link.target, '_blank');
    assert.match(link.rel, /noopener/);
    assert.match(link.rel, /noreferrer/);
  }
  for (const button of document.querySelectorAll('button')) assert.equal(button.type, 'button');
  assert.equal(document.querySelector('#copy-email').dataset.email, 'imannnnugraha@gmail.com');
  assert.equal(document.querySelector('#copy-status').getAttribute('aria-live'), 'polite');
});

test('Projects follow the hero and every internal link resolves to one target', () => {
  const { document } = loadIndexHtml();
  assert.deepEqual([...document.querySelectorAll('main > section')].map(el => el.id),
    ['hero', 'projects', 'experience', 'skills', 'about', 'contact']);
  assert.equal(document.querySelector('#hero').nextElementSibling.id, 'projects');
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    const id = link.getAttribute('href').slice(1);
    assert.ok(id && document.getElementById(id), 'broken anchor: ' + link.outerHTML);
  }
});

test('Fullstack case studies expose constraints and repository evidence', () => {
  const { document } = loadIndexHtml();
  for (const id of ['project-dashboard', 'project-smarthome']) {
    const card = document.getElementById(id);
    assert.ok(card.querySelector('details[data-case-study] > summary'));
    assert.ok(card.querySelector('[data-project-summary]'));
    assert.ok(card.querySelector('a[href^="https://github.com/"]'));
  }
  assert.match(document.querySelector('#project-dashboard').textContent, /admin.*(?:login|sign.in)|(?:login|sign.in).*admin/is);
  assert.match(document.querySelector('#project-smarthome').textContent, /architecture/i);
});

test('Both primary hero actions exist and the CV asset is present', () => {
  const { document } = loadIndexHtml();
  assert.match(document.querySelector('#hero a[href="#projects"]').textContent, /View Projects/);
  const cv = document.querySelector('#hero [data-cv-link]');
  assert.match(cv.textContent, /Download CV/);
  assert.equal(cv.getAttribute('href'), 'output/pdf/muhammad-iman-nugraha-cv.pdf');
  assert.ok(existsSync(join(root, cv.getAttribute('href'))));
});
